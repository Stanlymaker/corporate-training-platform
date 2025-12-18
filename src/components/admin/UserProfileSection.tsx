import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User } from '@/types';

interface UserProfileSectionProps {
  user: User;
  userProgress: { total: number; completed: number };
  onEditProfile: () => void;
}

export default function UserProfileSection({ 
  user, 
  userProgress, 
  onEditProfile 
}: UserProfileSectionProps) {
  return (
    <>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-3xl font-semibold">
          {user.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-2xl font-bold text-gray-900">{user.name}</h4>
              <p className="text-gray-600">{user.email}</p>
              {user.position && (
                <p className="text-sm text-gray-600 mt-1">Должность: {user.position}</p>
              )}
              {user.department && (
                <p className="text-sm text-gray-600">Отдел: {user.department}</p>
              )}
              {user.phone && (
                <p className="text-sm text-gray-600">Телефон: {user.phone}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                  {user.role === 'admin' ? 'Администратор' : 'Обучающийся'}
                </Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onEditProfile}>
              <Icon name="Edit" className="mr-2" size={14} />
              Редактировать
            </Button>
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

        {user.role === 'student' && (
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
        )}
      </div>
    </>
  );
}