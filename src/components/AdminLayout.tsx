import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate(ROUTES.LOGIN);
    }
  }, [isAuthenticated, user, navigate]);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');

  useEffect(() => {
    const loadLogo = () => {
      const savedLogo = localStorage.getItem('platformLogo');
      if (savedLogo) {
        setLogoUrl(savedLogo);
      }
    };

    loadLogo();
    window.addEventListener('logoUpdated', loadLogo);
    return () => window.removeEventListener('logoUpdated', loadLogo);
  }, []);

  const menuItems = [
    { icon: 'LayoutDashboard', label: 'Панель', path: ROUTES.ADMIN.DASHBOARD },
    { icon: 'BookOpen', label: 'Курсы', path: ROUTES.ADMIN.COURSES },
    { icon: 'ClipboardCheck', label: 'Тесты', path: ROUTES.ADMIN.TESTS },
    { icon: 'Award', label: 'Награды', path: ROUTES.ADMIN.REWARDS },
    { icon: 'Users', label: 'Пользователи', path: ROUTES.ADMIN.USERS },
    { icon: 'FileText', label: 'Логи', path: ROUTES.ADMIN.LOGS },
  ];

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
        <div className="h-full max-w-screen-2xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-9 h-9 object-contain" />
              ) : (
                <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                  <Icon name="GraduationCap" className="text-white" size={18} />
                </div>
              )}
              <span className="font-bold text-gray-900">Админ</span>
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
                {user?.name.split(' ').map(n => n[0]).join('') || 'A'}
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
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAboutModal(true);
                      setShowUserMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Icon name="Info" size={16} />
                    О программном обеспечении
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

      <main className="pt-16 min-h-screen">
        <div className="max-w-screen-2xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>

      {showAboutModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowAboutModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">О программном обеспечении</h2>
                <button
                  onClick={() => setShowAboutModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Icon name="X" size={20} />
                </button>
              </div>

              <div className="px-6 py-6 space-y-6">
                <div>
                  <p className="text-gray-700 leading-relaxed">
                    Программный продукт «Корпоративная образовательная платформа» — веб-ориентированное приложение, 
                    предоставляющее организации инструменты для создания обучающих курсов, тестирования знаний и 
                    поощрения сотрудников цифровыми наградами.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Возможности платформы</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle2" size={20} className="text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">создание единого цифрового пространства для внутреннего обучения сотрудников;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle2" size={20} className="text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">обеспечение возможности создания, прохождения и оценки обучающих курсов различного формата;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle2" size={20} className="text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">мотивация пользователей через систему цифровых наград за успешное завершение обучения.</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Сопроводительная документация</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <Icon name="FileText" size={20} className="text-primary flex-shrink-0 mt-0.5" />
                      <button
                        onClick={() => {
                          setShowAboutModal(false);
                          navigate('/user-guide');
                        }}
                        className="text-primary hover:text-primary/80 hover:underline transition-colors text-left"
                      >
                        руководство пользователя платформы
                      </button>
                      <Icon name="ExternalLink" size={16} className="text-primary flex-shrink-0 mt-0.5" />
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="FileText" size={20} className="text-primary flex-shrink-0 mt-0.5" />
                      <button
                        onClick={() => {
                          setShowAboutModal(false);
                          navigate('/admin-guide');
                        }}
                        className="text-primary hover:text-primary/80 hover:underline transition-colors text-left"
                      >
                        руководство администратора платформы
                      </button>
                      <Icon name="ExternalLink" size={16} className="text-primary flex-shrink-0 mt-0.5" />
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Техническая поддержка</h3>
                  <p className="text-gray-700 leading-relaxed mb-2">
                    Техническая поддержка ПО обеспечивается в будние дни с понедельника по пятницу в рабочее время: с 8-30 до 17-30 по МСК.
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Контакты:</span> digital1212lab@yandex.ru
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Срок действия прав на ПО</h3>
                  <p className="text-gray-700">C 23.12.2025 по 28.12.2026</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}