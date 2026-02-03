import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/purchases/[id]
 * 获取特定进货单详情，包括所有明细行和关联的货品、供应商资料
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            product: {
              select: {
                code: true,
                name: true,
                category: true,
                spec: true
              }
            }
          }
        }
      }
    });

    if (!purchase) {
      return NextResponse.json({ success: false, message: '进货单不存在' }, { status: 404 });
    }

    // 解析照片字段 (存储为 JSON 字符串)
    const formattedPurchase = {
      ...purchase,
      photos: purchase.photos ? JSON.parse(purchase.photos) : []
    };

    return NextResponse.json({ success: true, data: formattedPurchase });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : '查询详情失败';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}

/**
 * DELETE /api/purchases/[id]
 * 删除进货单 (通常受限，此处暂时实现以备后续管理)
 * 注意：由于 Prisma Schema 设置了 Cascade，删除 Purchase 会同步删除 PurchaseItem
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // 首先获取要删除的单据，用于可能的日志记录或后续库存回滚（如果业务需要）
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!purchase) {
      return NextResponse.json({ success: false, message: '进货单未找到' }, { status: 404 });
    }

    // 执行事务：扣减库存并删除单据
    await prisma.$transaction(async (tx) => {
      // 1. 逐一扣减货品库存
      for (const item of purchase.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              decrement: item.quantity
            }
          }
        });
      }

      // 2. 执行删除
      await tx.purchase.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true, message: '单据已作废，关联库存已回滚' });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : '删除失败';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
