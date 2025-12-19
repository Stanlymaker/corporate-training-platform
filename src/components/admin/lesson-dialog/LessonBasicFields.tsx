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

interface LessonBasicFieldsProps {
  lesson: Lesson;
  onLessonChange: (field: keyof Lesson, value: any) => void;
}

export default function LessonBasicFields({ lesson, onLessonChange }: LessonBasicFieldsProps) {
  const handleTypeChange = (newType: 'video' | 'text' | 'test') => {
    onLessonChange('type', newType);
    
    // Очищаем поля, которые не относятся к выбранному типу
    if (newType === 'video') {
      onLessonChange('testId', undefined);
      onLessonChange('isFinalTest', false);
      onLessonChange('finalTestRequiresAllLessons', false);
      onLessonChange('finalTestRequiresAllTests', false);
      onLessonChange('content', undefined);
    } else if (newType === 'text') {
      onLessonChange('testId', undefined);
      onLessonChange('isFinalTest', false);
      onLessonChange('finalTestRequiresAllLessons', false);
      onLessonChange('finalTestRequiresAllTests', false);
      onLessonChange('videoUrl', undefined);
    } else if (newType === 'test') {
      onLessonChange('videoUrl', undefined);
      onLessonChange('content', undefined);
    }
  };

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Название урока *
        </label>
        <input
          type="text"
          value={lesson.title}
          onChange={(e) => onLessonChange('title', e.target.value)}
          placeholder="Введение в React"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Краткое описание
        </label>
        <textarea
          value={lesson.description || ''}
          onChange={(e) => onLessonChange('description', e.target.value)}
          placeholder="О чем этот урок..."
          rows={2}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Тип урока
          </label>
          <select
            value={lesson.type}
            onChange={(e) => handleTypeChange(e.target.value as 'video' | 'text' | 'test')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={lesson.requiresPrevious || false}
            onChange={(e) => onLessonChange('requiresPrevious', e.target.checked)}
            className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
          />
          <span className="text-sm text-gray-700">
            Урок обязателен к прохождению для открытия следующих уроков
          </span>
        </label>
      </div>
    </>
  );
}
