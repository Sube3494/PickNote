import { z } from 'zod';

// 货品验证Schema
export const productSchema = z.object({
  code: z.string().min(1, '货品编码不能为空'),
  name: z.string().min(1, '货品名称不能为空'),
  category: z.string().default('其他'),
  spec: z.string().optional(),
  images: z.array(z.string()).optional(),
  remark: z.string().optional(),
  currentStock: z.coerce.number().int().min(0).optional(),
  minOrderQty: z.coerce.number().int().min(0).optional(),
  price: z.coerce.number().min(0).optional(),
  categoryId: z.string().nullable().optional(),
  channel: z.string().optional(),
  unit: z.string().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;

// 供应商验证Schema
export const supplierSchema = z.object({
  name: z.string().min(1, '供应商名称不能为空'),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  type: z.string().min(1, '渠道类型不能为空').default('其他'),
  remark: z.string().optional(),
});

export type SupplierInput = z.infer<typeof supplierSchema>;

// 进货单验证Schema
export const purchaseSchema = z.object({
  supplierId: z.string().min(1, '供应商不能为空'),
  purchaseDate: z.string().or(z.date()),
  totalAmount: z.number().min(0, '总金额不能为负数'),
  shippingFee: z.number().min(0).default(0),
  remark: z.string().optional(),
  photos: z.array(z.string()).optional(),
  items: z.array(z.object({
    productId: z.string().min(1, '货品不能为空'),
    quantity: z.number().int().min(1, '数量必须大于0'),
    unitPrice: z.number().min(0, '单价不能为负数'),
  })).min(1, '至少需要一个货品'),
});

export type PurchaseInput = z.infer<typeof purchaseSchema>;
