import { PrismaClient } from '@prisma/client'
import path from 'path'
import 'dotenv/config'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 动态构建绝对路径，兼容 Next.js 开发与生产环境
const baseUrl = process.env.DATABASE_URL || 'file:./dev.db'
const absoluteDbPath = baseUrl.startsWith('file:') 
  ? `file:${path.resolve(process.cwd(), baseUrl.replace('file:', ''))}`
  : baseUrl

// 关键：在实例化之前覆盖环境变量
process.env.DATABASE_URL = absoluteDbPath

export const prisma = globalForPrisma.prisma ?? new PrismaClient({})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
