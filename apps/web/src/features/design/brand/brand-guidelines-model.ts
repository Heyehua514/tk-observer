/**
 * 品牌规范数据结构与默认规则数据
 */
export interface BrandColorRule {
  name: string
  hex: string
  role: 'primary' | 'secondary' | 'accent' | 'background' | 'neutral'
  usage: string
}

export interface BrandTypographyRule {
  level: string
  fontSize: string
  lineHeight: string
  fontWeight: string
  usage: string
}

export interface BrandProhibitionRule {
  rule: string
  severity: 'forbidden' | 'warning'
  description: string
}

export interface BrandGuidelinesData {
  colors: BrandColorRule[]
  typography: BrandTypographyRule[]
  prohibitions: BrandProhibitionRule[]
}

export const DEFAULT_BRAND_GUIDELINES: BrandGuidelinesData = {
  colors: [
    { name: '品牌主色 (Tech Cyan)', hex: '#06B6D4', role: 'primary', usage: '主操作按钮、重要高亮、核心数据' },
    { name: '品牌辅助色 (Deep Indigo)', hex: '#4F46E5', role: 'secondary', usage: '渐变辅色、标签分类、次要强调' },
    { name: '成功状态 (Emerald)', hex: '#10B981', role: 'accent', usage: 'GMV增长、审核通过、成功提示' },
    { name: '警告风险 (Amber)', hex: '#F59E0B', role: 'accent', usage: '逾期风险、预警提醒' },
    { name: '暗色背景 (Slate 950)', hex: '#020617', role: 'background', usage: '页面全局背景' },
    { name: '卡片背景 (Slate 900)', hex: '#0F172A', role: 'background', usage: '卡片面板背景' },
    { name: '主要文字 (Slate 50)', hex: '#F8FAFC', role: 'neutral', usage: '标题与高强调文字' },
  ],
  typography: [
    { level: 'Display 大标题', fontSize: '24px', lineHeight: '32px', fontWeight: '700', usage: '工作台核心大屏与首屏重点标题' },
    { level: 'Heading 1 一级标题', fontSize: '20px', lineHeight: '28px', fontWeight: '600', usage: '模块主卡片标题' },
    { level: 'Heading 2 二级标题', fontSize: '16px', lineHeight: '24px', fontWeight: '600', usage: '分组标题与弹窗标题' },
    { level: 'Body 正文文本', fontSize: '14px', lineHeight: '20px', fontWeight: '400', usage: '标准数据列表、描述文本' },
    { level: 'Caption 辅助微字', fontSize: '12px', lineHeight: '16px', fontWeight: '400', usage: '时间戳、提示、副标签' },
  ],
  prohibitions: [
    { rule: '禁止低对比度文本', severity: 'forbidden', description: '深色背景上禁止使用低于 WCAG AA 4.5:1 的灰色文本。' },
    { rule: '禁止任意修改品牌主色透明度', severity: 'warning', description: '主按钮与品牌 Logo 背景需使用纯色，严禁任意调整主色 alpha 值导致脏色。' },
    { rule: '禁止使用非标准圆角', severity: 'forbidden', description: '设计稿中卡片圆角必须保持统一的 rounded-lg (8px) 或 rounded-xl (12px)。' },
  ],
};

export function filterBrandColors(colors: BrandColorRule[], role?: string): BrandColorRule[] {
  if (!role || role === 'all') return colors;
  return colors.filter(c => c.role === role);
}