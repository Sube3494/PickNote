import { NextResponse } from 'next/server';
// Force reload after prisma fix
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET /api/products - 获取货品列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const skip = (page - 1) * limit;
    
    // 构建查询条件
    const where: Prisma.ProductWhereInput = {};
    
    if (category && category !== '全部') {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
      ];
    }
    
    // 1. 获取所有符合条件的 code 和 id，用于在内存中进行自然排序
    const allProducts = await prisma.product.findMany({
      where,
      select: { id: true, code: true },
    });

    // 2. 自然排序逻辑 (1, 2, ..., 10, 100)
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    allProducts.sort((a, b) => collator.compare(a.code, b.code));

    const total = allProducts.length;
    
    // 3. 内存分页: 截取当前页对应的 ID 列表
    const pagedIds = allProducts.slice(skip, skip + limit).map(p => p.id);

    // 4. 根据排序后的 ID 列表获取完整数据
    const products = pagedIds.length > 0 
      ? await prisma.product.findMany({
          where: { id: { in: pagedIds } },
        })
      : [];
    
    // 5. 由于 in 查询结果不一定保证顺序，需要根据 pagedIds 重新对 products 排序
    const sortedProducts = pagedIds.map(id => products.find(p => p.id === id)!);

    // 解析images字段
    const productsWithImages = sortedProducts.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
    }));
    
    return NextResponse.json({
      success: true,
      data: productsWithImages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('获取货品列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取货品列表失败' },
      { status: 500 }
    );
  }
}

// POST /api/products - 创建货品
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productSchema } = await import('@/lib/validations');
    
    // 验证数据
    const validatedData = productSchema.parse(body);
    
    // 检查编码是否已存在
    const existing = await prisma.product.findUnique({
      where: { code: validatedData.code },
    });
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: '货品编码已存在' },
        { status: 400 }
      );
    }
    
    // 创建货品
    const product = await prisma.product.create({
      data: {
        ...validatedData,
        images: validatedData.images ? JSON.stringify(validatedData.images) : null,
      },
    });
    
    return NextResponse.json({
      success: true,
      data: {
        ...product,
        images: product.images ? JSON.parse(product.images) : [],
      },
    });
  } catch (error: unknown) {
    console.error('创建货品失败:', error);
    const errorMsg = error instanceof Error ? error.message : '创建货品失败';
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 400 }
    );
  }
}
