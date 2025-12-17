import StudentLayout from '@/components/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';
import { toast } from 'sonner';

export default function StudentSettings() {
  const { user: authUser } = useAuth();
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (authUser) {
      setEditedUser(authUser);
    }
  }, [authUser]);

  const validateProfileForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!editedUser.name?.trim()) {
      newErrors.name = 'Введите ФИО';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Введите текущий пароль';
    }

    if (!newPassword) {
      newErrors.newPassword = 'Введите новый пароль';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Минимум 8 символов';
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfileForm() || !authUser) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.USERS}?id=${authUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editedUser.name,
          position: editedUser.position || null,
          department: editedUser.department || null,
          phone: editedUser.phone || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка сохранения');
      }

      const data = await response.json();
      const updatedUser = data.user || data;
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      toast.success('Профиль успешно обновлен');
      
      // Обновим данные в AuthContext через перезагрузку
      setTimeout(() => window.location.reload(), 500);
    } catch (error: any) {
      console.error('Ошибка сохранения профиля:', error);
      toast.error(error.message || 'Не удалось сохранить профиль');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm() || !authUser) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.USERS}?id=${authUser.id}&action=password`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          password: newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка смены пароля');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
      toast.success('Пароль успешно изменен');
    } catch (error: any) {
      console.error('Ошибка смены пароля:', error);
      toast.error(error.message || 'Не удалось изменить пароль');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Настройки</h1>
          <p className="text-gray-600">Управление личной информацией и безопасностью</p>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="User" size={20} />
                Личная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ФИО *
                  </label>
                  <input
                    type="text"
                    value={editedUser.name || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={editedUser.email || ''}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email нельзя изменить</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Должность
                  </label>
                  <input
                    type="text"
                    value={editedUser.position || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, position: e.target.value })}
                    placeholder="Например: Менеджер по продажам"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Отдел
                  </label>
                  <input
                    type="text"
                    value={editedUser.department || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, department: e.target.value })}
                    placeholder="Например: Отдел продаж"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    value={editedUser.phone || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                    placeholder="+7 (999) 123-45-67"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSaveProfile} disabled={isLoading}>
                  <Icon name="Check" className="mr-2" size={16} />
                  {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Lock" size={20} />
                Безопасность
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Текущий пароль *
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Введите текущий пароль"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.currentPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.currentPassword && (
                  <p className="text-sm text-red-600 mt-1">{errors.currentPassword}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Новый пароль *
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Минимум 8 символов"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.newPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.newPassword && (
                    <p className="text-sm text-red-600 mt-1">{errors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Подтвердите пароль *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Повторите новый пароль"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleChangePassword} variant="outline" disabled={isLoading}>
                  <Icon name="Key" className="mr-2" size={16} />
                  {isLoading ? 'Изменение...' : 'Изменить пароль'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  );
}