import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import SettingsDialog from '@/components/SettingsDialog';
import { ROUTES } from '@/constants/routes';

interface StudentLayoutProps {
  children: ReactNode;
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'student') {
      navigate(ROUTES.LOGIN);
    }
  }, [isAuthenticated, user, navigate]);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const menuItems = [
    { icon: 'Home', label: 'Главная', path: ROUTES.STUDENT.DASHBOARD },
    { icon: 'BookOpen', label: 'Мои курсы', path: ROUTES.STUDENT.COURSES },
  ];

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  if (!isAuthenticated || user?.role !== 'student') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 shadow-sm">
        <div className="h-full max-w-[1600px] mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="GraduationCap" className="text-white" size={18} />
              </div>
              <span className="font-bold text-gray-900">Обучение</span>
            </div>

            <nav className="flex items-center gap-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    variant="ghost"
                    size="sm"
                    className={`gap-2 ${isActive ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'text-gray-600'}`}
                  >
                    <Icon name={item.icon as any} size={16} />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                {user?.name.split(' ').map(n => n[0]).join('') || 'С'}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <Icon name="ChevronDown" size={16} className="text-gray-500" />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowSettings(true);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Icon name="Settings" size={16} />
                    Настройки
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Icon name="LogOut" size={16} />
                    Выйти
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-8 py-8">
          {children}
        </div>
      </main>

      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
}