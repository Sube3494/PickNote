import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { purchaseSchema } from '@/lib/validations';

/**
 * GET /api/purchases
 * 获取进货单列表
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get('supplierId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: Prisma.PurchaseWhereInput = {};
    if (supplierId) {
      where.supplierId = supplierId;
    }

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { purchaseDate: 'desc' },
        include: {
          supplier: {
            select: { name: true }
          },
          _count: {
            select: { items: true }
          }
        }
      }),
      prisma.purchase.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: purchases,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}

/**
 * POST /api/purchases
 * 创建进货单并同步更新库存
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // 1. 数据验证
    const validatedData = purchaseSchema.parse(body);

    // 2. 自动生成单号 PO + YYYYMMDD + 3位序列号
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `PO${dateStr}`;
    
    // 查找今日已有的单号，获取最大序列号
    const lastPurchase = await prisma.purchase.findFirst({
      where: { orderNo: { startsWith: prefix } },
      orderBy: { orderNo: 'desc' }
    });
    
    let sequence = 1;
    if (lastPurchase) {
      const lastSeq = parseInt(lastPurchase.orderNo.slice(-3));
      sequence = lastSeq + 1;
    }
    const orderNo = `${prefix}${sequence.toString().padStart(3, '0')}`;

    // 3. 执行事务：创建订单、明细、更新库存
    const result = await prisma.$transaction(async (tx) => {
      // a. 创建主订单
      const purchase = await tx.purchase.create({
        data: {
          orderNo,
          supplierId: validatedData.supplierId,
          purchaseDate: new Date(validatedData.purchaseDate),
          totalAmount: validatedData.totalAmount,
          shippingFee: validatedData.shippingFee,
          remark: validatedData.remark,
          photos: validatedData.photos ? JSON.stringify(validatedData.photos) : null,
          // 关联创建明细
          items: {
            create: validatedData.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.quantity * item.unitPrice
            }))
          }
        }
      });

      // b. 逐一更新货品库存
      for (const item of validatedData.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              increment: item.quantity
            }
          }
        });
      }
      return purchase;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    console.error('Create purchase error:', error);
    const errorMsg = error instanceof Error ? error.message : '创建失败';
    return NextResponse.json({ 
      success: false, 
      message: errorMsg
    }, { status: 400 });
  }
}
