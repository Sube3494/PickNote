import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/categories - 获取分类列表（支持树形结构）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format'); // 'tree' 或 'flat'
    
    // 获取所有分类
    const categories = await prisma.category.findMany({
      orderBy: [
        { level: 'asc' },
        { order: 'asc' },
      ],
    });
    
    // 统计每个分类的货品数量
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const count = await prisma.product.count({
          where: { categoryId: category.id },
        });
        return { ...category, count };
      })
    );
    
    // 根据格式返回不同结构
    if (format === 'flat') {
      // 扁平化列表（用于下拉框）
      return NextResponse.json({
        success: true,
        data: categoriesWithCount,
      });
    }
    
    // 默认返回树形结构
    const tree = buildCategoryTree(categoriesWithCount);
    
    return NextResponse.json({
      success: true,
      data: tree,
    });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取分类列表失败' },
      { status: 500 }
    );
  }
}

// POST /api/categories - 创建新分类
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, level, parentId } = body;
    
    // 验证必填字段
    if (!name || !level) {
      return NextResponse.json(
        { success: false, error: '分类名称和层级为必填项' },
        { status: 400 }
      );
    }
    
    // 验证层级限制
    if (level < 1 || level > 3) {
      return NextResponse.json(
        { success: false, error: '层级必须在 1-3 之间' },
        { status: 400 }
      );
    }
    
    // 如果是二级或三级分类，必须指定父分类
    if (level > 1 && !parentId) {
      return NextResponse.json(
        { success: false, error: `${level}级分类必须指定父分类` },
        { status: 400 }
      );
    }
    
    // 验证父分类层级
    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parentId },
      });
      
      if (!parent) {
        return NextResponse.json(
          { success: false, error: '父分类不存在' },
          { status: 400 }
        );
      }
      
      if (parent.level !== level - 1) {
        return NextResponse.json(
          { success: false, error: `父分类层级不匹配（应为 ${level - 1} 级）` },
          { status: 400 }
        );
      }
    }
    
    // 检查同级是否有重名
    const existing = await prisma.category.findFirst({
      where: {
        name,
        level,
        parentId: parentId || null,
      },
    });
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: '同级分类中已存在相同名称' },
        { status: 400 }
      );
    }
    
    // 计算排序序号（同级最后）
    const maxOrder = await prisma.category.aggregate({
      where: {
        level,
        parentId: parentId || null,
      },
      _max: { order: true },
    });
    
    const order = (maxOrder._max.order || 0) + 1;
    
    // 创建分类
    const category = await prisma.category.create({
      data: {
        name,
        level,
        parentId: parentId || null,
        order,
      },
    });
    
    return NextResponse.json({
      success: true,
      data: category,
      message: '分类创建成功',
    });
  } catch (error) {
    console.error('创建分类失败:', error);
    return NextResponse.json(
      { success: false, error: '创建分类失败' },
      { status: 500 }
    );
  }
}

// 构建树形结构的辅助函数
function buildCategoryTree(categories: any[]): any[] {
  const map = new Map();
  const roots: any[] = [];
  
  // 初始化映射
  categories.forEach(cat => {
    map.set(cat.id, { ...cat, children: [] });
  });
  
  // 构建树形结构
  categories.forEach(cat => {
    const node = map.get(cat.id);
    if (cat.parentId) {
      const parent = map.get(cat.parentId);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  });
  
  return roots;
}
