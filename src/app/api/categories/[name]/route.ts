import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PUT /api/categories/:name - 更新分类名称 (全局同步)
export async function PUT(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const oldName = decodeURIComponent(params.name);
    const { newName } = await request.json();

    if (!newName || !newName.trim()) {
      return NextResponse.json(
        { success: false, error: '新名称不能为空' },
        { status: 400 }
      );
    }

    // 更新所有属于该分类的货品
    const result = await prisma.product.updateMany({
      where: { category: oldName },
      data: { category: newName.trim() },
    });

    return NextResponse.json({
      success: true,
      data: { count: result.count },
      message: `已成功同步更新 ${result.count} 项货品的分类`,
    });
  } catch (error) {
    console.error('更新品类失败:', error);
    return NextResponse.json(
      { success: false, error: '更新品类失败' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/:name - 删除分类 (将货品设为'其他')
export async function DELETE(
  _request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const name = decodeURIComponent(params.name);

    // 将所有属于该分类的货品更改为默认分类 "其他"
    const result = await prisma.product.updateMany({
      where: { category: name },
      data: { category: '其他' },
    });

    return NextResponse.json({
      success: true,
      message: `已删除分类，${result.count} 项货品已归类至 "其他"`,
    });
  } catch (error) {
    console.error('删除品类失败:', error);
    return NextResponse.json(
      { success: false, error: '删除品类失败' },
      { status: 500 }
    );
  }
}
