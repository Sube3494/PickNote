import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import ExcelJS from 'exceljs';

/**
 * GET /api/purchases/export
 * 将进货明细导出为 Excel 文件
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 1. 获取数据
    const purchases = await prisma.purchase.findMany({
      where: {
        ...(startDate && endDate ? {
          purchaseDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        } : {})
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { purchaseDate: 'desc' }
    });

    // 2. 创建 Workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('进货明细汇总');

    // 设定表头
    worksheet.columns = [
      { header: '单号', key: 'orderNo', width: 20 },
      { header: '进货日期', key: 'date', width: 15 },
      { header: '供应商/渠道', key: 'supplier', width: 20 },
      { header: '货品编码', key: 'productCode', width: 15 },
      { header: '货品名称', key: 'productName', width: 30 },
      { header: '品类', key: 'category', width: 12 },
      { header: '单位进价', key: 'unitPrice', width: 12 },
      { header: '数量', key: 'quantity', width: 10 },
      { header: '金额小计', key: 'subtotal', width: 15 },
      { header: '整单运费', key: 'shippingFee', width: 12 },
      { header: '备注', key: 'remark', width: 30 },
    ];

    // 填充数据 (展开明细行)
    purchases.forEach(p => {
      p.items.forEach((item, index) => {
        worksheet.addRow({
          orderNo: p.orderNo,
          date: p.purchaseDate.toISOString().slice(0, 10),
          supplier: p.supplier.name,
          productCode: item.product.code,
          productName: item.product.name,
          category: item.product.category,
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
          subtotal: Number(item.subtotal),
          // 运费只在每个订单的第一行显示
          shippingFee: index === 0 ? Number(p.shippingFee) : '',
          remark: p.remark || ''
        });
      });
    });

    // 美化表头
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE9ECEF' }
    };

    // 3. 生成 Buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // 4. 返回文件流
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="PickNote_Purchases_${new Date().toISOString().slice(0,10)}.xlsx"`
      }
    });

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : '导出 Excel 失败';
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
