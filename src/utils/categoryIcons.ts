export const categoryConfig: Record<string, { icon: string; gradient: string; color: string }> = {
  'Маркетинг': {
    icon: 'Megaphone',
    gradient: 'from-blue-500 to-cyan-500',
    color: 'text-blue-600'
  },
  'Стратегия': {
    icon: 'Target',
    gradient: 'from-purple-500 to-pink-500',
    color: 'text-purple-600'
  },
  'Аналитика': {
    icon: 'BarChart3',
    gradient: 'from-orange-500 to-red-500',
    color: 'text-orange-600'
  },
  'Финансы': {
    icon: 'DollarSign',
    gradient: 'from-green-500 to-emerald-500',
    color: 'text-green-600'
  },
  'Продукт': {
    icon: 'Package',
    gradient: 'from-indigo-500 to-blue-500',
    color: 'text-indigo-600'
  },
  'Программирование': {
    icon: 'Code',
    gradient: 'from-violet-500 to-purple-500',
    color: 'text-violet-600'
  },
  'Дизайн': {
    icon: 'Palette',
    gradient: 'from-pink-500 to-rose-500',
    color: 'text-pink-600'
  },
  'Менеджмент': {
    icon: 'Briefcase',
    gradient: 'from-amber-500 to-yellow-500',
    color: 'text-amber-600'
  },
  'default': {
    icon: 'BookOpen',
    gradient: 'from-gray-500 to-slate-500',
    color: 'text-gray-600'
  }
};

export function getCategoryIcon(category: string): string {
  return categoryConfig[category]?.icon || categoryConfig.default.icon;
}

export function getCategoryGradient(category: string): string {
  return categoryConfig[category]?.gradient || categoryConfig.default.gradient;
}

export function getCategoryColor(category: string): string {
  return categoryConfig[category]?.color || categoryConfig.default.color;
}
