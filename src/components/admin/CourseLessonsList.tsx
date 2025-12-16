import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface CourseLessonsListProps {
  lessons: Lesson[];
  onAddLesson: () => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onReorderLesson: (lessonId: string, direction: 'up' | 'down') => void;
  getTypeIcon: (type: string) => string;
}

export default function CourseLessonsList({
  lessons,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onReorderLesson,
  getTypeIcon,
}: CourseLessonsListProps) {
  const getTypeName = (type: string) => {
    switch (type) {
      case 'video': return 'Видео';
      case 'text': return 'Текст';
      case 'test': return 'Тест';
      default: return type;
    }
  };

  return (
    <Card className="col-span-3 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Icon name="List" size={20} />
          Программа курса
        </h2>
        <Button onClick={onAddLesson}>
          <Icon name="Plus" className="mr-2" size={16} />
          Добавить урок
        </Button>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Icon name="BookOpen" size={48} className="mx-auto mb-4 opacity-30" />
          <p>Уроков пока нет. Добавьте первый урок.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="text-sm font-medium text-gray-500 w-6">
                  {index + 1}
                </span>
                <Icon name={getTypeIcon(lesson.type)} size={20} className="text-gray-600" />
                <div className="flex-1">
                  <div className="font-medium">{lesson.title || 'Без названия'}</div>
                  <div className="text-sm text-gray-500">
                    <Badge variant="secondary" className="text-xs">
                      {getTypeName(lesson.type)}
                    </Badge>
                    <span className="ml-2">{lesson.duration} мин</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReorderLesson(lesson.id, 'up')}
                  disabled={index === 0}
                >
                  <Icon name="ChevronUp" size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReorderLesson(lesson.id, 'down')}
                  disabled={index === lessons.length - 1}
                >
                  <Icon name="ChevronDown" size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditLesson(lesson)}
                >
                  <Icon name="Edit" size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteLesson(lesson.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Icon name="Trash2" size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
