import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const [productCount, supplierCount, purchaseCount, recentProducts, recentPurchases] = await Promise.all([
      prisma.product.count(),
      prisma.supplier.count(),
      prisma.purchase.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.product.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          code: true,
          category: true,
          currentStock: true,
          images: true
        }
      }),
      prisma.purchase.findMany({
        take: 3,
        orderBy: { purchaseDate: 'desc' },
        include: {
          supplier: {
            select: { name: true }
          }
        }
      })
    ]);

    // 计算总货值: 每个货品的当前库存 * 该货品在进货明细中的最新单价
    const products = await prisma.product.findMany({
      select: {
        id: true,
        currentStock: true,
        purchaseItems: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { unitPrice: true }
        }
      }
    });

    const totalStockValue = products.reduce((acc, p) => {
      const latestPrice = p.purchaseItems[0]?.unitPrice || 0;
      return acc + (p.currentStock * latestPrice);
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        productCount,
        supplierCount,
        purchaseCount,
        totalStockValue,
        recentProducts,
        recentPurchases
      }
    });
  } catch (error) {
    console.error('获取系统统计失败:', error);
    return NextResponse.json(
      { success: false, error: '获取统计失败' }, 
      { status: 500 }
    );
  }
}
