import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      return NextResponse.json({ success: false, message: '供应商未找到' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: supplier });
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
    const { name, contactName, phone, address, type, remark } = body;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        contactName,
        phone,
        address,
        type,
        remark,
      },
    });

    return NextResponse.json({ success: true, data: supplier });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.supplier.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
