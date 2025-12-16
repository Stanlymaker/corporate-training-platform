import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useState } from 'react';

interface UserFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterApply: (filters: FilterState) => void;
}

export interface FilterState {
  role: string;
  registrationDateFrom: string;
  registrationDateTo: string;
  activityStatus: string;
}

export default function UserFilters({ searchQuery, onSearchChange, onFilterApply }: UserFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    role: 'all',
    registrationDateFrom: '',
    registrationDateTo: '',
    activityStatus: 'all',
  });

  const handleApplyFilters = () => {
    onFilterApply(filters);
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      role: 'all',
      registrationDateFrom: '',
      registrationDateTo: '',
      activityStatus: 'all',
    };
    setFilters(resetFilters);
    onFilterApply(resetFilters);
  };

  return (
    <Card className="border shadow-sm mb-6">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Icon name="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Поиск по ФИО или email..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Icon name="Filter" className="mr-2" size={16} />
            Фильтры
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Роль
                </label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Все</option>
                  <option value="student">Обучающийся</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Регистрация с
                </label>
                <input
                  type="date"
                  value={filters.registrationDateFrom}
                  onChange={(e) => setFilters({ ...filters, registrationDateFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Регистрация по
                </label>
                <input
                  type="date"
                  value={filters.registrationDateTo}
                  onChange={(e) => setFilters({ ...filters, registrationDateTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Активность
                </label>
                <select
                  value={filters.activityStatus}
                  onChange={(e) => setFilters({ ...filters, activityStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Все</option>
                  <option value="active">Активные (7 дней)</option>
                  <option value="inactive">Неактивные (30+ дней)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleResetFilters}>
                Сбросить
              </Button>
              <Button onClick={handleApplyFilters}>
                Применить фильтры
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
