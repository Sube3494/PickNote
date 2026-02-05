import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { productSchema } from '@/lib/validations';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        purchaseItems: {
          include: {
            purchase: {
              include: {
                supplier: {
                  select: { name: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!product) {
      return NextResponse.json({ success: false, message: '货品未找到' }, { status: 404 });
    }

    // 解析图片 JSON 字符串
    const parsedProduct = {
      ...product,
      images: product.images ? JSON.parse(product.images) : []
    };

    return NextResponse.json({ success: true, data: parsedProduct });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    // 使用 Zod 验证并强制转换类型 (price, minOrderQty 等)
    // 此时 validatedData 中的可选字段若没传则为 undefined
    const validatedData = productSchema.parse(body);

    // 检查编码是否与其他产品冲突
    if (validatedData.code) {
      const existing = await prisma.product.findUnique({
        where: { code: validatedData.code },
      });
      
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { success: false, message: '货品编码已被其他产品使用,请使用不同的编码' },
          { status: 400 }
        );
      }
    }

    // 过滤掉未定义的字段，确保不覆盖数据库中的现有值（如 currentStock）
    const updateData: any = {};
    Object.keys(validatedData).forEach(key => {
      const value = (validatedData as any)[key];
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    // 特殊处理图片字段，将其从数组转为 JSON 字符串
    if (updateData.images !== undefined) {
      updateData.images = updateData.images ? JSON.stringify(updateData.images) : null;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    // 解析图片 JSON 字符串以便前端一致处理
    const data = {
      ...updatedProduct,
      images: updatedProduct.images ? JSON.parse(updatedProduct.images) : []
    };

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('更新货品失败:', error);
    const errorMsg = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.product.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
