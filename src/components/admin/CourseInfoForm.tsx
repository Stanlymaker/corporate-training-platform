import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface CourseFormData {
  title: string;
  description: string;
  category: string;
  level: 'Начальный' | 'Средний' | 'Продвинутый';
  instructor: string;
  image: string;
  status: 'draft' | 'published' | 'archived';
  accessType: 'open' | 'closed';
  sequenceType: 'linear' | 'free';
}

interface CourseInfoFormProps {
  formData: CourseFormData;
  onInputChange: (field: keyof CourseFormData, value: any) => void;
}

export default function CourseInfoForm({ formData, onInputChange }: CourseInfoFormProps) {
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    const fakeUrl = URL.createObjectURL(file);
    setTimeout(() => {
      onInputChange('image', fakeUrl);
      setUploadingImage(false);
    }, 500);
  };

  return (
    <Card className="col-span-2 p-6">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Icon name="BookOpen" size={20} />
        Основная информация
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Название курса *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => onInputChange('title', e.target.value)}
            placeholder="React для начинающих"
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
            placeholder="Полный курс по React с нуля до продвинутого уровня..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Категория
            </label>
            <select
              value={formData.category}
              onChange={(e) => onInputChange('category', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Выберите категорию</option>
              <option value="Программирование">Программирование</option>
              <option value="Дизайн">Дизайн</option>
              <option value="Маркетинг">Маркетинг</option>
              <option value="Бизнес">Бизнес</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Уровень сложности
            </label>
            <select
              value={formData.level}
              onChange={(e) => onInputChange('level', e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="Начальный">Начальный</option>
              <option value="Средний">Средний</option>
              <option value="Продвинутый">Продвинутый</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Преподаватель
          </label>
          <input
            type="text"
            value={formData.instructor}
            onChange={(e) => onInputChange('instructor', e.target.value)}
            placeholder="Анна Петрова"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Обложка курса
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            {formData.image ? (
              <div className="space-y-3">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="flex justify-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="hidden"
                    id="course-image-upload"
                  />
                  <label htmlFor="course-image-upload">
                    <Button type="button" variant="outline" size="sm" asChild disabled={uploadingImage}>
                      <span>
                        <Icon name="Upload" size={14} className="mr-2" />
                        Заменить изображение
                      </span>
                    </Button>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onInputChange('image', '')}
                  >
                    <Icon name="X" size={14} className="mr-2" />
                    Удалить
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Icon name="Image" size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-3">Загрузите обложку курса</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  className="hidden"
                  id="course-image-upload-new"
                />
                <label htmlFor="course-image-upload-new">
                  <Button type="button" variant="outline" size="sm" asChild disabled={uploadingImage}>
                    <span>
                      <Icon name="Upload" size={14} className="mr-2" />
                      {uploadingImage ? 'Загрузка...' : 'Загрузить файл'}
                    </span>
                  </Button>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Статус публикации
            </label>
            <select
              value={formData.status}
              onChange={(e) => onInputChange('status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="draft">Черновик</option>
              <option value="published">Опубликован</option>
              <option value="archived">Архив</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип доступа
            </label>
            <select
              value={formData.accessType}
              onChange={(e) => onInputChange('accessType', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="open">Открытый</option>
              <option value="closed">Закрытый</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {formData.accessType === 'open' 
                ? 'Доступен всем студентам' 
                : 'Требуется назначение администратором'}
            </p>
          </div>
        </div>

      </div>
    </Card>
  );
}