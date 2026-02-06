import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: suppliers });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, contactName, phone, address, type, remark } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: '供应商名称是必填项' }, { status: 400 });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactName,
        phone,
        address,
        type: type || '其他',
        remark,
      },
    });

    return NextResponse.json({ success: true, data: supplier });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
