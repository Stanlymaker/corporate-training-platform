import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  isDisabled?: boolean;
}

export default function CourseLessonsList({
  lessons,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onReorderLesson,
  getTypeIcon,
  isDisabled = false,
}: CourseLessonsListProps) {
  const getTypeName = (type: string) => {
    switch (type) {
      case 'video': return 'Видео';
      case 'text': return 'Текст';
      case 'test': return 'Тест';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'text': return 'bg-green-100 text-green-700 border-green-200';
      case 'test': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon name="List" size={20} />
            Программа курса
            {lessons.length > 0 && (
              <Badge variant="outline" className="ml-2">{lessons.length} уроков</Badge>
            )}
          </CardTitle>
          <Button onClick={onAddLesson} disabled={isDisabled}>
            <Icon name="Plus" className="mr-2" size={16} />
            Добавить урок
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {lessons.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="BookOpen" size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Уроков пока нет</h3>
            <p className="text-gray-600 mb-4">Создайте первый урок для вашего курса</p>
            <Button onClick={onAddLesson} variant="outline" disabled={isDisabled}>
              <Icon name="Plus" className="mr-2" size={16} />
              Добавить первый урок
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className="group relative flex items-center gap-4 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-primary hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className={`w-10 h-10 rounded-lg ${getTypeColor(lesson.type).split(' ')[0]} flex items-center justify-center flex-shrink-0`}>
                      <Icon name={getTypeIcon(lesson.type) as any} size={20} className={getTypeColor(lesson.type).split(' ')[1]} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1 truncate">
                      {lesson.title || 'Без названия'}
                    </h4>
                    <div className="flex items-center gap-3 text-sm">
                      <Badge variant="outline" className={`text-xs ${getTypeColor(lesson.type)}`}>
                        {getTypeName(lesson.type)}
                      </Badge>
                      <span className="text-gray-500 flex items-center gap-1">
                        <Icon name="Clock" size={14} />
                        {lesson.duration} мин
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReorderLesson(lesson.id, 'up')}
                    disabled={index === 0 || isDisabled}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icon name="ChevronUp" size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReorderLesson(lesson.id, 'down')}
                    disabled={index === lessons.length - 1 || isDisabled}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icon name="ChevronDown" size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditLesson(lesson)}
                    disabled={isDisabled}
                  >
                    <Icon name="Edit" size={18} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteLesson(lesson.id)}
                    disabled={isDisabled}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Icon name="Trash2" size={18} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}