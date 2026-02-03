import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/stats/products
 * 获取销量排行（按进货数量或进货总金额）
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'quantity'; // 'quantity' | 'amount'

    // 聚合进货明细行
    const productStats = await prisma.purchaseItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
        subtotal: true
      },
      orderBy: {
        _sum: {
          [sortBy === 'quantity' ? 'quantity' : 'subtotal']: 'desc'
        }
      },
      take: limit
    });

    // 关联货品基础资料
    const detailedStats = await Promise.all(
      productStats.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { code: true, name: true, category: true }
        });
        return {
          id: item.productId,
          code: product?.code || '未知',
          name: product?.name || '未知货品',
          category: product?.category || '未分类',
          totalQuantity: item._sum.quantity || 0,
          totalAmount: Number(item._sum.subtotal || 0)
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: detailedStats
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : '货品统计失败';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
