import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { SystemLog } from '@/types/logs';

interface LogDetailsModalProps {
  show: boolean;
  log: SystemLog | null;
  onClose: () => void;
}

export default function LogDetailsModal({ show, log, onClose }: LogDetailsModalProps) {
  if (!show || !log) return null;

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
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10 flex items-center justify-between">
          <h3 className="text-xl font-bold">Детали записи лога</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${getLevelColor(
                  log.level
                )}`}
              >
                <Icon name={getLevelIcon(log.level)} size={24} />
              </div>
              <div>
                <Badge className={getLevelColor(log.level)}>{log.level.toUpperCase()}</Badge>
                <div className="text-sm text-gray-500 mt-1">
                  {formatTimestamp(log.timestamp)}
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              {log.id}
            </Badge>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-500 mb-2">Действие</div>
              <div className="px-4 py-3 bg-gray-50 rounded-lg font-mono text-sm">
                {log.action}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-500 mb-2">Сообщение</div>
              <div className="px-4 py-3 bg-gray-50 rounded-lg">{log.message}</div>
            </div>

            {log.details && (
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">Детали</div>
                <div className="px-4 py-3 bg-red-50 rounded-lg text-red-900 font-mono text-sm">
                  {log.details}
                </div>
              </div>
            )}

            {log.userId && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2">ID пользователя</div>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg font-mono text-sm">
                    {log.userId}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2">Имя пользователя</div>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg">{log.userName || '—'}</div>
                </div>
              </div>
            )}

            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-500 mb-2">Метаданные</div>
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
    </div>
  );
}
