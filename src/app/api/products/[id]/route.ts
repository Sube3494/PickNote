import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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
    const { code, name, category, spec, remark, channel, minOrderQty, images } = body;

    // 检查编码是否与其他产品冲突
    if (code) {
      const existing = await prisma.product.findUnique({
        where: { code },
      });
      
      // 如果找到了产品,且不是当前正在编辑的产品,则说明编码冲突
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { success: false, message: '货品编码已被其他产品使用,请使用不同的编码' },
          { status: 400 }
        );
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        code,
        name,
        category,
        spec,
        remark,
        channel,
        minOrderQty: parseInt(minOrderQty || '0'),
        images: JSON.stringify(images || []),
      },
    });

    // 解析图片 JSON 字符串以便前端一致处理
    const data = {
      ...updatedProduct,
      images: updatedProduct.images ? JSON.parse(updatedProduct.images) : []
    };

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
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
