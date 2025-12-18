import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface TestFormData {
  courseId: string;
  lessonId?: string;
  title: string;
  description: string;
  passScore: number;
  timeLimit: number;
  attempts: number;
  status: 'draft' | 'published';
}

interface TestInfoFormProps {
  formData: TestFormData;
  onInputChange: (field: keyof TestFormData, value: string | number) => void;
}

interface Course {
  id: string;
  title: string;
}

export default function TestInfoForm({ formData, onInputChange }: TestInfoFormProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.COURSES, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  return (
    <Card className="col-span-2 p-6 border-0 shadow-md">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Icon name="ClipboardList" size={20} />
        Основная информация
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Курс *
          </label>
          <select
            value={formData.courseId}
            onChange={(e) => onInputChange('courseId', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={loadingCourses}
          >
            <option value="">Выберите курс</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Название теста *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => onInputChange('title', e.target.value)}
            placeholder="Тест: Основы React"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Описание
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => onInputChange('description', e.target.value)}
            placeholder="Проверьте свои знания основ React"
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Проходной балл (%)
            </label>
            <input
              type="number"
              value={formData.passScore}
              onChange={(e) => onInputChange('passScore', parseInt(e.target.value) || 0)}
              min="0"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Время на тест (мин)
            </label>
            <input
              type="number"
              value={formData.timeLimit}
              onChange={(e) => onInputChange('timeLimit', parseInt(e.target.value) || 0)}
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Кол-во попыток
            </label>
            <input
              type="number"
              value={formData.attempts}
              onChange={(e) => onInputChange('attempts', parseInt(e.target.value) || 0)}
              min="1"
              max="10"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Статус
          </label>
          <select
            value={formData.status}
            onChange={(e) => onInputChange('status', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="draft">Черновик</option>
            <option value="published">Опубликован</option>
          </select>
        </div>
      </div>
    </Card>
  );
}
