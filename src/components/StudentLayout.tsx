import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';

interface StudentLayoutProps {
  children: ReactNode;
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: 'Home', label: 'Главная', path: ROUTES.STUDENT.DASHBOARD },
    { icon: 'BookOpen', label: 'Мои курсы', path: ROUTES.STUDENT.COURSES },
    { icon: 'TrendingUp', label: 'Прогресс', path: ROUTES.STUDENT.PROGRESS },
    { icon: 'Award', label: 'Награды', path: ROUTES.STUDENT.REWARDS },
    { icon: 'User', label: 'Профиль', path: ROUTES.STUDENT.PROFILE },
  ];

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
              <Icon name="GraduationCap" className="text-white" size={20} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Обучение</h2>
              <p className="text-xs text-gray-500">Личный кабинет</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                onClick={() => navigate(item.path)}
                variant={isActive ? 'secondary' : 'ghost'}
                className={`w-full justify-start ${isActive ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : ''}`}
              >
                <Icon name={item.icon as any} className="mr-3" size={18} />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
            <Icon name="LogOut" className="mr-3" size={18} />
            Выйти
          </Button>
        </div>
      </aside>

      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}