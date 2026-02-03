import { PrismaClient } from '@prisma/client'
import path from 'path'
import 'dotenv/config'

// 使用与应用相同的数据库路径逻辑
const baseUrl = process.env.DATABASE_URL || 'file:./dev.db'
const absoluteDbPath = baseUrl.startsWith('file:') 
  ? `file:${path.resolve(process.cwd(), baseUrl.replace('file:', ''))}`
  : baseUrl

process.env.DATABASE_URL = absoluteDbPath
console.log('数据库路径:', absoluteDbPath)

const prisma = new PrismaClient({})

async function checkData() {
  try {
    const productCount = await prisma.product.count()
    const supplierCount = await prisma.supplier.count()
    const purchaseCount = await prisma.purchase.count()
    const purchaseItemCount = await prisma.purchaseItem.count()
    const userCount = await prisma.user.count()
    
    console.log('\n当前数据库统计:')
    console.log(`- 产品: ${productCount}`)
    console.log(`- 供应商: ${supplierCount}`)
    console.log(`- 进货单: ${purchaseCount}`)
    console.log(`- 进货明细: ${purchaseItemCount}`)
    console.log(`- 用户: ${userCount}`)
  } catch (error) {
    console.error('查询数据时出错:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()
