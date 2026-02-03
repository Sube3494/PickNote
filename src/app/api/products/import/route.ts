import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs/promises';
import { guessCategory, normalizeProductCode } from '@/lib/smart-category';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, message: '请选择文件' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return NextResponse.json({ success: false, message: '无效的 Excel 文件' }, { status: 400 });
    }

    // 提取所有媒体文件 (图片)
    // exceljs 的 workbook.model.media 存储了原始二进制数据
    const model = workbook.model as unknown as Record<string, unknown>;
    const mediaItems = (model.media as Record<string, unknown>[]) || [];
    
    // 获取工作表中的图片索引和单元格映射
    const sheetImages = worksheet.getImages();
    const imageMap: { [key: string]: number } = {}; // cell address -> media index (0-based)

    sheetImages.forEach((img) => {
      // img 包含 range (单元格位置) 和 imageId (对应 workbook.model.media 的索引)
      const row = img.range.tl.row; // 0-based
      const col = img.range.tl.col; // 0-based
      // 我们只记录第2列 (B列, index 1) 的图片
      if (col === 1) {
        imageMap[`${row + 1}`] = (img.imageId as unknown as number);
      }
    });

    const products = [];
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    
    // 确保目录存在
    await fs.mkdir(uploadDir, { recursive: true });

    // 从第3行开始 (row 1, 2 是标题)
    for (let i = 3; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      
      // 只映射需要的列
      const name = row.getCell(1).text?.toString().trim() || ''; // 商品名称 (A列)
      const codeRaw = row.getCell(3).text?.toString().trim() || ''; // 店内码 (C列)

      // 跳过完全空的行
      if (!name && !codeRaw) continue;

      // 如果没有编码,使用名称的前几个字符或生成一个
      const code = codeRaw ? normalizeProductCode(codeRaw) : `AUTO_${Date.now()}_${i}`;
      // 如果没有名称,使用编码作为名称
      const productName = name || code;
      const category = guessCategory(productName);

      const images: string[] = [];

      // 处理图片 (B列)
      const imageId = imageMap[`${i}`];
      if (imageId !== undefined) {
        const media = mediaItems[imageId];
        if (media) {
          const ext = media.extension as string;
          // 使用安全的文件名:时间戳 + 随机字符串,避免特殊字符
          const safeCode = code.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
          const fileName = `${safeCode}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
          const filePath = path.join(uploadDir, fileName);
          await fs.writeFile(filePath, media.buffer as Buffer);
          images.push(`/uploads/products/${fileName}`);
        }
      }

      // 准备数据库记录 - 只保存必需字段
      const productData = {
        code,
        name: productName,
        category,
        spec: null,
        remark: null,
        minOrderQty: 1, // 默认起订量为1
        channel: null,
        images: JSON.stringify(images),
        currentStock: 0, // 初始库存
      };

      // 使用 upsert 根据 code 更新或创建
      const product = await prisma.product.upsert({
        where: { code },
        update: productData,
        create: productData,
      });

      products.push(product);
    }

    return NextResponse.json({
      success: true,
      message: `导入完成，共处理 ${products.length} 个货品`,
      count: products.length
    });

  } catch (error: unknown) {
    console.error('Import error:', error);
    const errorMsg = error instanceof Error ? error.message : '未知导入错误';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
