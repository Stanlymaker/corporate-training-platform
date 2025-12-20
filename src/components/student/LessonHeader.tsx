import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Course, Lesson } from '@/components/student/types';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

interface LessonHeaderProps {
  course: Course;
  lesson: Lesson;
  isCompleted: boolean;
  progressPercent: number;
}

export default function LessonHeader({ course, lesson, isCompleted, progressPercent }: LessonHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Icon name="BookOpen" size={16} />
          <span>{course.title}</span>
          <Icon name="ChevronRight" size={16} />
          <span>Урок {lesson.order + 1}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(ROUTES.STUDENT.COURSES)}
          className="gap-2"
        >
          <Icon name="ArrowLeft" size={16} />
          Назад к курсам
        </Button>
      </div>
      
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
          <p className="text-gray-600">{lesson.description}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={lesson.type === 'video' ? 'default' : 'secondary'}>
            <Icon
              name={lesson.type === 'video' ? 'Video' : lesson.type === 'test' ? 'FileQuestion' : 'FileText'}
              size={14}
              className="mr-1"
            />
            {lesson.type === 'video' ? 'Видео' : lesson.type === 'test' ? 'Тест' : 'Материалы'}
          </Badge>
          {isCompleted && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Icon name="Check" size={14} className="mr-1" />
              Пройдено
            </Badge>
          )}
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Прогресс курса</span>
          <span className="text-sm font-semibold text-gray-900">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>
    </div>
  );
}