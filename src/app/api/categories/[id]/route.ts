import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PUT /api/categories/[id] - 更新分类
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, parentId, order } = body;
    
    // 检查分类是否存在
    const category = await prisma.category.findUnique({
      where: { id },
    });
    
    if (!category) {
      return NextResponse.json(
        { success: false, error: '分类不存在' },
        { status: 404 }
      );
    }
    
    // 如果修改父分类，需要验证
    if (parentId !== undefined && parentId !== category.parentId) {
      if (parentId) {
        // 验证新父分类
        const newParent = await prisma.category.findUnique({
          where: { id: parentId },
        });
        
        if (!newParent) {
          return NextResponse.json(
            { success: false, error: '父分类不存在' },
            { status: 400 }
          );
        }
        
        // 验证层级关系
        if (newParent.level !== category.level - 1) {
          return NextResponse.json(
            { success: false, error: '父分类层级不匹配' },
            { status: 400 }
          );
        }
        
        // 防止循环引用
        if (await isDescendant(id, parentId)) {
          return NextResponse.json(
            { success: false, error: '不能将分类移动到其子分类下' },
            { status: 400 }
          );
        }
      }
    }
    
    // 更新分类
    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(order !== undefined && { order }),
      },
    });
    
    return NextResponse.json({
      success: true,
      data: updated,
      message: '分类更新成功',
    });
  } catch (error) {
    console.error('更新分类失败:', error);
    return NextResponse.json(
      { success: false, error: '更新分类失败' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - 删除分类
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 检查分类是否存在
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        products: true,
      },
    });
    
    if (!category) {
      return NextResponse.json(
        { success: false, error: '分类不存在' },
        { status: 404 }
      );
    }
    
    // 如果有子分类，级联删除
    if (category.children.length > 0) {
      // 可选：也可以阻止删除，或将子分类提升到上一级
      console.log(`删除分类 "${category.name}" 及其 ${category.children.length} 个子分类`);
    }
    
    // 处理关联的货品
    if (category.products.length > 0) {
      // 将关联货品的 categoryId 设为 null
      await prisma.product.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      });
      
      console.log(`已解除 ${category.products.length} 个货品的分类关联`);
    }
    
    // 删除分类（级联删除子分类）
    await prisma.category.delete({
      where: { id },
    });
    
    return NextResponse.json({
      success: true,
      message: `分类 "${category.name}" 已删除`,
    });
  } catch (error) {
    console.error('删除分类失败:', error);
    return NextResponse.json(
      { success: false, error: '删除分类失败' },
      { status: 500 }
    );
  }
}

// 辅助函数：检查 targetId 是否是 ancestorId 的后代
async function isDescendant(targetId: string, ancestorId: string): Promise<boolean> {
  const target = await prisma.category.findUnique({
    where: { id: targetId },
    include: { children: true },
  });
  
  if (!target) return false;
  
  for (const child of target.children) {
    if (child.id === ancestorId) return true;
    if (await isDescendant(child.id, ancestorId)) return true;
  }
  
  return false;
}
