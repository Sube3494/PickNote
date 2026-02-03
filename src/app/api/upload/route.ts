import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, message: '请选择文件' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    await fs.mkdir(uploadDir, { recursive: true });

    const urls = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name) || '.png';
      const fileName = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 7)}${ext}`;
      const filePath = path.join(uploadDir, fileName);
      
      await fs.writeFile(filePath, buffer);
      urls.push(`/uploads/products/${fileName}`);
    }

    return NextResponse.json({
      success: true,
      data: urls
    });

  } catch (error: unknown) {
    console.error('Upload error:', error);
    const errorMsg = error instanceof Error ? error.message : '上传失败';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
