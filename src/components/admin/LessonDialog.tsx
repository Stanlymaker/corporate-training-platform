import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'test';
  duration: number;
  content?: string;
  videoUrl?: string;
  testId?: string;
  order: number;
}

interface LessonDialogProps {
  show: boolean;
  lesson: Lesson | null;
  onSave: () => void;
  onCancel: () => void;
  onLessonChange: (field: keyof Lesson, value: any) => void;
}

export default function LessonDialog({
  show,
  lesson,
  onSave,
  onCancel,
  onLessonChange,
}: LessonDialogProps) {
  if (!show || !lesson) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold">
            {lesson.id ? 'Редактировать урок' : 'Новый урок'}
          </h3>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название урока *
            </label>
            <input
              type="text"
              value={lesson.title}
              onChange={(e) => onLessonChange('title', e.target.value)}
              placeholder="Введение в React"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип урока
              </label>
              <select
                value={lesson.type}
                onChange={(e) => onLessonChange('type', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="video">Видео</option>
                <option value="text">Текст</option>
                <option value="test">Тест</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Длительность (мин)
              </label>
              <input
                type="number"
                value={lesson.duration}
                onChange={(e) => onLessonChange('duration', parseInt(e.target.value) || 0)}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {lesson.type === 'video' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL видео
              </label>
              <input
                type="text"
                value={lesson.videoUrl || ''}
                onChange={(e) => onLessonChange('videoUrl', e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          {lesson.type === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Содержание урока
              </label>
              <textarea
                value={lesson.content || ''}
                onChange={(e) => onLessonChange('content', e.target.value)}
                placeholder="Введите текст урока..."
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none font-mono text-sm"
              />
            </div>
          )}

          {lesson.type === 'test' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID теста
              </label>
              <input
                type="text"
                value={lesson.testId || ''}
                onChange={(e) => onLessonChange('testId', e.target.value)}
                placeholder="test-123"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Укажите ID теста из раздела "Тесты"
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
          <Button variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button onClick={onSave} disabled={!lesson.title}>
            <Icon name="Save" className="mr-2" size={16} />
            Сохранить урок
          </Button>
        </div>
      </div>
    </div>
  );
}
