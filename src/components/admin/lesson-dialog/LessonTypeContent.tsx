import Icon from '@/components/ui/icon';
import RichTextEditor from '../RichTextEditor';

interface Lesson {
  id: number;
  title: string;
  type: 'video' | 'text' | 'test';
  duration: number;
  content?: string;
  videoUrl?: string;
  testId?: number;
  isFinalTest?: boolean;
  finalTestRequiresAllLessons?: boolean;
  finalTestRequiresAllTests?: boolean;
  order: number;
  description?: string;
  materials?: any[];
  requiresPrevious?: boolean;
  imageUrl?: string;
}

interface LessonTypeContentProps {
  lesson: Lesson;
  tests: any[];
  onLessonChange: (field: keyof Lesson, value: any) => void;
}

export default function LessonTypeContent({ lesson, tests, onLessonChange }: LessonTypeContentProps) {
  if (lesson.type === 'video') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ссылка на видео *
          </label>
          <input
            type="url"
            value={lesson.videoUrl || ''}
            onChange={(e) => onLessonChange('videoUrl', e.target.value)}
            placeholder="https://vk.com/video... или https://rutube.ru/video/..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Поддерживаются ссылки VK Видео и Rutube
          </p>
        </div>
      </div>
    );
  }

  if (lesson.type === 'text') {
    return (
      <>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Содержание урока
          </label>
          <RichTextEditor
            value={lesson.content || ''}
            onChange={(value) => onLessonChange('content', value)}
          />
          <p className="text-sm text-gray-500 mt-2">
            Используйте Markdown для форматирования текста
          </p>
        </div>
      </>
    );
  }

  if (lesson.type === 'test') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Выберите тест
          </label>
          <select
            value={lesson.testId || ''}
            onChange={(e) => onLessonChange('testId', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">-- Выберите тест --</option>
            {tests.map(test => (
              <option key={test.id} value={test.id}>
                {test.title} {test.status === 'draft' ? '(Черновик)' : '(Опубликован)'} - {test.questionsCount} вопросов, {test.timeLimit} мин
              </option>
            ))}
          </select>
          {lesson.testId && tests.find(t => t.id === lesson.testId)?.status === 'draft' && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800 flex items-center gap-2">
                <Icon name="AlertTriangle" size={16} />
                Выбранный тест находится в статусе "Черновик". Опубликуйте тест перед публикацией курса.
              </p>
            </div>
          )}
        </div>

        {lesson.testId && (
          <div className="border-t pt-4 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lesson.isFinalTest || false}
                onChange={(e) => onLessonChange('isFinalTest', e.target.checked)}
                className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Итоговый тест курса
              </span>
            </label>

            {lesson.isFinalTest && (
              <div className="ml-6 space-y-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Условия доступа к итоговому тесту:</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lesson.finalTestRequiresAllLessons || false}
                    onChange={(e) => onLessonChange('finalTestRequiresAllLessons', e.target.checked)}
                    className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">
                    Требуется пройти все уроки курса
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lesson.finalTestRequiresAllTests || false}
                    onChange={(e) => onLessonChange('finalTestRequiresAllTests', e.target.checked)}
                    className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">
                    Требуется пройти все тесты к урокам
                  </span>
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}
