import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/categories - 获取品类列表
export async function GET() {
  try {
    // 从货品表中获取所有不重复的品类
    const products = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    
    const categories = products.map(p => p.category);
    
    // 统计每个品类的货品数量
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const count = await prisma.product.count({
          where: { category },
        });
        return { name: category, count };
      })
    );
    
    // 按数量排序
    categoriesWithCount.sort((a, b) => b.count - a.count);
    
    return NextResponse.json({
      success: true,
      data: categoriesWithCount,
    });
  } catch (error) {
    console.error('获取品类列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取品类列表失败' },
      { status: 500 }
    );
  }
}
