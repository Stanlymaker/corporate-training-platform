import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Lesson } from '@/components/student/types';

interface LessonNavigationProps {
  courseId: string;
  previousLesson: Lesson | null;
  nextLesson: Lesson | null;
  isCompleted: boolean;
  isTestPassed: boolean;
  onNavigate: (lessonOrder: number) => void;
  onComplete: () => void;
}

export default function LessonNavigation({
  previousLesson,
  nextLesson,
  isCompleted,
  isTestPassed,
  onNavigate,
  onComplete
}: LessonNavigationProps) {
  return (
    <div className="flex items-center justify-between pt-6 border-t">
      <Button
        variant="outline"
        onClick={() => previousLesson && onNavigate(previousLesson.order)}
        disabled={!previousLesson}
      >
        <Icon name="ArrowLeft" className="mr-2" size={16} />
        Предыдущий урок
      </Button>

      {!isCompleted && !isTestPassed && (
        <Button
          onClick={onComplete}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        >
          <Icon name="Check" className="mr-2" size={16} />
          Завершить урок
        </Button>
      )}

      {(isCompleted || isTestPassed) && nextLesson && (
        <Button
          onClick={() => onNavigate(nextLesson.order)}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
        >
          Следующий урок
          <Icon name="ArrowRight" className="ml-2" size={16} />
        </Button>
      )}

      {(isCompleted || isTestPassed) && !nextLesson && (
        <div className="text-center py-4">
          <div className="text-2xl mb-2">🎉</div>
          <p className="text-lg font-semibold text-gray-900">Поздравляем!</p>
          <p className="text-gray-600">Вы завершили все уроки курса</p>
        </div>
      )}
    </div>
  );
}
