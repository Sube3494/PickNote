/**
 * 智能品类映射逻辑
 * 根据商品名称中的关键词自动归类
 */

interface CategoryDefinition {
  name: string;
  keywords: { [keyword: string]: number }; // 关键词 -> 权重
}

const categories: CategoryDefinition[] = [
  {
    name: '玩具',
    keywords: {
      '盲盒': 10, '抽赏': 10, '手办': 10, '模型': 9, '公仔': 8, '玩偶': 8,
      '挂件': 5, '乐高': 10, '拼图': 7, '扭蛋': 10, '吧噗': 10, '徽章': 4,
      '立牌': 4, '亚克力': 3, '卡牌': 6, '毛绒': 7, '积木': 7, '周边': 5
    }
  },
  {
    name: '茶叶',
    keywords: {
      '茶叶': 10, '红茶': 8, '白茶': 8, '绿茶': 8, '普洱': 10, '龙井': 10,
      '乌龙': 10, '岩茶': 10, '茶礼': 7, '大红袍': 10, '铁观音': 10, '茶餅': 9
    }
  },
  {
    name: '燕窝',
    keywords: {
      '燕窝': 15, '即食燕窝': 12, '干燕窝': 12, '鲜炖燕窝': 12, '极盏': 5, '盏身': 5
    }
  },
  {
    name: '酒烟',
    keywords: {
      '白酒': 10, '红酒': 10, '洋酒': 10, '葡萄酒': 9, '茅台': 10, '五粮液': 10,
      '威士忌': 10, '香槟': 9, '啤酒': 8, '香烟': 10, '雪茄': 10, '烟弹': 9
    }
  },
  {
    name: '滋补品',
    keywords: {
      '陈皮': 8, '海参': 10, '冬虫夏草': 10, '花胶': 10, '人参': 10, '灵芝': 10,
      '阿胶': 10, '石斛': 9, '鹿茸': 10, '补品': 10, '养生': 5
    }
  },
  {
    name: '食品',
    keywords: {
      '巧克力': 10, '饼干': 8, '零食': 7, '特产': 5, '糕点': 7, '月饼': 9,
      '糖果': 7, '坚果': 7, '饮料': 6, '咖啡': 8
    }
  },
  {
    name: '文具',
    keywords: {
      '文具': 10, '笔记本': 8, '钢笔': 10, '签字笔': 9, '墨水': 8, '画具': 9,
      '手帐': 9, '胶带': 5, '便签': 5
    }
  }
];

/**
 * 根据商品名称猜测品类
 * 使用权重评分机制处理冲突（例如“陈皮燕窝”应归为燕窝，因为燕窝权重更高）
 */
export function guessCategory(name: string): string {
  if (!name) return '其他';
  
  let bestCategory = '其他';
  let maxScore = 0;

  for (const cat of categories) {
    let currentCatScore = 0;
    let matchCount = 0;

    for (const [keyword, weight] of Object.entries(cat.keywords)) {
      if (name.includes(keyword)) {
        currentCatScore += weight;
        matchCount++;
      }
    }

    // 如果匹配到多个关键词，给予额外奖励权重
    if (matchCount > 1) {
      currentCatScore *= (1 + (matchCount - 1) * 0.2);
    }

    if (currentCatScore > maxScore) {
      maxScore = currentCatScore;
      bestCategory = cat.name;
    }
  }
  
  return bestCategory;
}


/**
 * 标准化店内码
 * 处理 B3 -> B03, C1 -> C01 等情况
 */
export function normalizeProductCode(code: string): string {
  if (!code) return '';
  
  // 转换为大写并去除两端空格
  const cleanCode = code.trim().toUpperCase();
  
  // 匹配字母 + 数字 的格式
  const match = cleanCode.match(/^([A-Z]+)(\d+)$/);
  
  if (match) {
    const prefix = match[1];
    const num = match[2];
    
    // 如果数字只有一位，前面补0
    if (num.length === 1) {
      return `${prefix}0${num}`;
    }
  }
  
  return cleanCode;
}
