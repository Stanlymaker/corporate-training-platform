import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { mockLogs } from '@/data/mockLogs';
import { SystemLog } from '@/types/logs';
import LogsFilters, { LogFiltersState } from '@/components/admin/LogsFilters';
import LogDetailsModal from '@/components/admin/LogDetailsModal';

export default function AdminLogs() {
  const [logs, setLogs] = useState<SystemLog[]>(mockLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<LogFiltersState>({
    level: 'all',
    action: 'all',
    dateFrom: '',
    dateTo: '',
    userId: '',
  });
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLevel = filters.level === 'all' || log.level === filters.level;
    const matchesAction = filters.action === 'all' || log.action === filters.action;
    const matchesUserId = !filters.userId || log.userId === filters.userId;

    return matchesSearch && matchesLevel && matchesAction && matchesUserId;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info':
        return 'bg-blue-100 text-blue-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'info':
        return 'Info';
      case 'success':
        return 'CheckCircle';
      case 'warning':
        return 'AlertTriangle';
      case 'error':
        return 'XCircle';
      default:
        return 'Circle';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 60) {
      return `${minutes} мин назад`;
    } else if (hours < 24) {
      return `${hours} ч назад`;
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const handleViewDetails = (log: SystemLog) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  const errorCount = logs.filter((l) => l.level === 'error').length;
  const warningCount = logs.filter((l) => l.level === 'warning').length;
  const todayCount = logs.filter((l) => {
    const logDate = new Date(l.timestamp);
    const today = new Date();
    return logDate.toDateString() === today.toDateString();
  }).length;

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Системные логи</h1>
            <p className="text-gray-600">
              Отслеживание действий пользователей и ошибок системы
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Icon name="RotateCw" className="mr-2" size={18} />
              Обновить
            </Button>
            <Button variant="outline">
              <Icon name="Trash2" className="mr-2" size={18} />
              Очистить старые
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Icon name="Activity" className="text-blue-600" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{todayCount}</div>
                  <div className="text-sm text-gray-600">Записей сегодня</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Icon name="XCircle" className="text-red-600" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{errorCount}</div>
                  <div className="text-sm text-gray-600">Ошибок</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Icon name="AlertTriangle" className="text-yellow-600" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{warningCount}</div>
                  <div className="text-sm text-gray-600">Предупреждений</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Icon name="Database" className="text-green-600" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{logs.length}</div>
                  <div className="text-sm text-gray-600">Всего записей</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <LogsFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onFilterApply={setFilters}
        />

        <Card className="border shadow-sm">
          <CardContent className="p-6">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Icon name="FileText" size={48} className="mx-auto mb-4 opacity-30" />
                <p>Записи логов не найдены</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(log)}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getLevelColor(
                        log.level
                      )}`}
                    >
                      <Icon name={getLevelIcon(log.level)} size={20} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getLevelColor(log.level)}>
                              {log.level.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="font-mono text-xs">
                              {log.action}
                            </Badge>
                          </div>
                          <div className="font-medium text-gray-900">{log.message}</div>
                        </div>
                        <div className="text-sm text-gray-500 whitespace-nowrap">
                          {formatTimestamp(log.timestamp)}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {log.userName && (
                          <div className="flex items-center gap-1">
                            <Icon name="User" size={14} />
                            <span>{log.userName}</span>
                          </div>
                        )}
                        {log.metadata?.ip && (
                          <div className="flex items-center gap-1">
                            <Icon name="Globe" size={14} />
                            <span className="font-mono text-xs">{log.metadata.ip}</span>
                          </div>
                        )}
                        {log.details && (
                          <div className="flex items-center gap-1 text-red-600">
                            <Icon name="AlertCircle" size={14} />
                            <span className="truncate max-w-xs">{log.details}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button variant="ghost" size="sm">
                      <Icon name="ChevronRight" size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <LogDetailsModal
        show={showDetailsModal}
        log={selectedLog}
        onClose={() => setShowDetailsModal(false)}
      />
    </AdminLayout>
  );
}
