import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User } from '@/types';

interface UserDetailsModalProps {
  show: boolean;
  user: User | null;
  onClose: () => void;
  onEditRole: (userId: string, newRole: 'admin' | 'student') => void;
  userProgress: { total: number; completed: number };
}

export default function UserDetailsModal({
  show,
  user,
  onClose,
  onEditRole,
  userProgress,
}: UserDetailsModalProps) {
  if (!show || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10 flex items-center justify-between">
          <h3 className="text-xl font-bold">Детали пользователя</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-3xl font-semibold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h4 className="text-2xl font-bold text-gray-900">{user.name}</h4>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                  {user.role === 'admin' ? 'Администратор' : 'Обучающийся'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500 mb-1">Дата регистрации</div>
                <div className="flex items-center gap-2">
                  <Icon name="Calendar" size={16} className="text-gray-400" />
                  <span className="font-medium">{user.registrationDate}</span>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Последняя активность</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">{user.lastActive}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500 mb-1">Курсов в процессе</div>
                <div className="flex items-center gap-2">
                  <Icon name="BookOpen" size={16} className="text-gray-400" />
                  <span className="font-medium">{userProgress.total}</span>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Курсов завершено</div>
                <div className="flex items-center gap-2">
                  <Icon name="CheckCircle" size={16} className="text-green-500" />
                  <span className="font-medium">{userProgress.completed}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h5 className="font-bold mb-4">Управление ролями</h5>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">Роль пользователя</div>
                  <div className="text-sm text-gray-500">
                    Изменить права доступа в системе
                  </div>
                </div>
                <select
                  value={user.role}
                  onChange={(e) => onEditRole(user.id, e.target.value as 'admin' | 'student')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="student">Обучающийся</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h5 className="font-bold mb-4 flex items-center gap-2">
              <Icon name="Activity" size={18} />
              Активность пользователя
            </h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Курсов начато</span>
                <span className="font-medium">{userProgress.total}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Курсов завершено</span>
                <span className="font-medium">{userProgress.completed}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Процент завершения</span>
                <span className="font-medium">
                  {userProgress.total > 0
                    ? Math.round((userProgress.completed / userProgress.total) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
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
