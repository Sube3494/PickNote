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

async function clearAllData() {
  console.log('开始清理数据库...')
  
  try {
    // 按照依赖关系的顺序删除数据
    // 1. 先删除进货明细(依赖于进货单和产品)
    const deletedPurchaseItems = await prisma.purchaseItem.deleteMany({})
    console.log(`✓ 删除了 ${deletedPurchaseItems.count} 条进货明细`)
    
    // 2. 删除进货单(依赖于供应商)
    const deletedPurchases = await prisma.purchase.deleteMany({})
    console.log(`✓ 删除了 ${deletedPurchases.count} 条进货单`)
    
    // 3. 删除供应商
    const deletedSuppliers = await prisma.supplier.deleteMany({})
    console.log(`✓ 删除了 ${deletedSuppliers.count} 个供应商`)
    
    // 4. 删除产品
    const deletedProducts = await prisma.product.deleteMany({})
    console.log(`✓ 删除了 ${deletedProducts.count} 个产品`)
    
    // 5. 删除用户(可选,如果需要保留管理员账户可以注释掉)
    const deletedUsers = await prisma.user.deleteMany({})
    console.log(`✓ 删除了 ${deletedUsers.count} 个用户`)
    
    console.log('\n✅ 数据库清理完成!')
  } catch (error) {
    console.error('❌ 清理数据时出错:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearAllData()
