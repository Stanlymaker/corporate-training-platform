import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface AddUserModalProps {
  show: boolean;
  onClose: () => void;
  onAdd: (userData: NewUserData) => void;
}

export interface NewUserData {
  name: string;
  email: string;
  role: 'admin' | 'student';
  password: string;
}

export default function AddUserModal({ show, onClose, onAdd }: AddUserModalProps) {
  const [formData, setFormData] = useState<NewUserData>({
    name: '',
    email: '',
    role: 'student',
    password: '',
  });

  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData({ ...formData, password });
  };

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Введите ФИО';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Введите email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Некорректный email';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Введите или сгенерируйте пароль';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Пароль должен быть не менее 8 символов';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onAdd(formData);
      setFormData({ name: '', email: '', role: 'student', password: '' });
      setErrors({});
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', role: 'student', password: '' });
    setErrors({});
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-xl font-bold">Добавить пользователя</h3>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ФИО *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Иван Иванов"
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
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="ivan@example.com"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Роль *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'student' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="student">Обучающийся</option>
              <option value="admin">Администратор</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Пароль *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Введите или сгенерируйте пароль"
                className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <Button
                type="button"
                variant="outline"
                onClick={generatePassword}
                className="whitespace-nowrap"
              >
                <Icon name="RefreshCw" className="mr-2" size={16} />
                Сгенерировать
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600 mt-1">{errors.password}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Минимум 8 символов. Вы сможете изменить пароль позже.
            </p>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            Отмена
          </Button>
          <Button onClick={handleSubmit}>
            <Icon name="UserPlus" className="mr-2" size={16} />
            Добавить пользователя
          </Button>
        </div>
      </div>
    </div>
  );
}