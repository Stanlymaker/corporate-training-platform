import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useState } from 'react';
import { LogLevel, LogAction } from '@/types/logs';

interface LogsFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterApply: (filters: LogFiltersState) => void;
}

export interface LogFiltersState {
  level: LogLevel | 'all';
  action: LogAction | 'all';
  dateFrom: string;
  dateTo: string;
  userId: string;
}

export default function LogsFilters({
  searchQuery,
  onSearchChange,
  onFilterApply,
}: LogsFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<LogFiltersState>({
    level: 'all',
    action: 'all',
    dateFrom: '',
    dateTo: '',
    userId: '',
  });

  const handleApplyFilters = () => {
    onFilterApply(filters);
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    const resetFilters: LogFiltersState = {
      level: 'all',
      action: 'all',
      dateFrom: '',
      dateTo: '',
      userId: '',
    };
    setFilters(resetFilters);
    onFilterApply(resetFilters);
  };

  return (
    <Card className="border shadow-sm mb-6">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Icon
              name="Search"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <Input
              placeholder="Поиск в логах..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Icon name="Filter" className="mr-2" size={16} />
            Фильтры
          </Button>
          <Button variant="outline">
            <Icon name="Download" className="mr-2" size={16} />
            Экспорт
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Уровень
                </label>
                <select
                  value={filters.level}
                  onChange={(e) =>
                    setFilters({ ...filters, level: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Все</option>
                  <option value="info">Инфо</option>
                  <option value="success">Успех</option>
                  <option value="warning">Предупреждение</option>
                  <option value="error">Ошибка</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Действие
                </label>
                <select
                  value={filters.action}
                  onChange={(e) =>
                    setFilters({ ...filters, action: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Все действия</option>
                  <option value="user.login">Вход пользователя</option>
                  <option value="user.logout">Выход пользователя</option>
                  <option value="course.create">Создание курса</option>
                  <option value="test.submit">Отправка теста</option>
                  <option value="system.error">Системная ошибка</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дата с
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters({ ...filters, dateFrom: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дата по
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters({ ...filters, dateTo: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID пользователя
                </label>
                <input
                  type="text"
                  value={filters.userId}
                  onChange={(e) =>
                    setFilters({ ...filters, userId: e.target.value })
                  }
                  placeholder="user-123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleResetFilters}>
                Сбросить
              </Button>
              <Button onClick={handleApplyFilters}>Применить фильтры</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
