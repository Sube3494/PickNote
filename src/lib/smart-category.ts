/**
 * 智能品类映射逻辑
 * 根据商品名称中的关键词自动归类
 */

const categoryMap: { [key: string]: string } = {
  // 玩具类
  '盲盒': '玩具',
  '抽赏': '玩具',
  '挂件': '玩具',
  '玩偶': '玩具',
  '手办': '玩具',
  '模型': '玩具',
  '公仔': '玩具',
  '乐高': '玩具',
  '拼图': '玩具',
  '扭蛋': '玩具',
  '吧噗': '玩具',
  '徽章': '玩具',
  '立牌': '玩具',
  '亚克力': '玩具',

  // 茶叶类
  '茶叶': '茶叶',
  '红茶': '茶叶',
  '白茶': '茶叶',
  '普洱': '茶叶',
  '龙井': '茶叶',
  '乌龙': '茶叶',
  '岩茶': '茶叶',
  '茶礼': '茶叶',

  // 燕窝类
  '燕窝': '燕窝',
  '即食燕窝': '燕窝',
  '干燕窝': '燕窝',
  '鲜炖燕窝': '燕窝',

  // 烟酒类
  '烟': '酒烟',
  '酒': '酒烟',
  '白酒': '酒烟',
  '红酒': '酒烟',
  '香烟': '酒烟',

  // 食品/补品
  '陈皮': '补品',
  '海参': '补品',
  '冬虫夏草': '补品',
  '饼干': '食品',
  '零食': '食品',
  '特产': '食品',
};

/**
 * 根据商品名称猜测品类
 */
export function guessCategory(name: string): string {
  if (!name) return '其他';
  
  for (const [keyword, category] of Object.entries(categoryMap)) {
    if (name.includes(keyword)) {
      return category;
    }
  }
  
  return '其他';
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
