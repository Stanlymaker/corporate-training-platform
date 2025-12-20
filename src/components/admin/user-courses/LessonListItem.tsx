import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Lesson, TestResult, CourseProgress } from '@/types';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface LessonListItemProps {
  lesson: Lesson;
  isCompleted: boolean;
  testResult?: TestResult;
  progress: CourseProgress | undefined;
  userId: number;
  onViewTestResults: (lessonId: string, testId: number) => void;
  onReloadProgress: () => Promise<void>;
}

export default function LessonListItem({
  lesson,
  isCompleted,
  testResult,
  progress,
  userId,
  onViewTestResults,
  onReloadProgress
}: LessonListItemProps) {
  const handleResetAttempts = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Сбросить попытки теста "${lesson.title}" для пользователя?`)) {
      try {
        const response = await fetch(
          `${API_ENDPOINTS.TEST_ATTEMPTS}?userId=${userId}&lessonId=${lesson.id}`,
          {
            method: 'DELETE',
            headers: getAuthHeaders()
          }
        );
        if (response.ok) {
          alert('Попытки успешно сброшены');
          await onReloadProgress();
        } else {
          alert('Ошибка при сбросе попыток');
        }
      } catch (error) {
        console.error('Error resetting attempts:', error);
        alert('Ошибка при сбросе попыток');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
          isCompleted ? 'bg-green-500' : 'bg-gray-200'
        }`}>
          {isCompleted ? (
            <Icon name="Check" size={14} className="text-white" />
          ) : (
            <span className="text-xs text-gray-500">{lesson.order + 1}</span>
          )}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">{lesson.title}</div>
          <div className="text-xs text-gray-500">{lesson.duration} мин</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {lesson.type === 'test' && testResult && (
          <>
            <Badge className={testResult.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
              {testResult.score}%
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onViewTestResults(String(lesson.id), lesson.testId!);
              }}
            >
              <Icon name="Eye" size={14} className="mr-1" />
              Результаты
            </Button>
          </>
        )}
        {lesson.type === 'test' && progress && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetAttempts}
          >
            <Icon name="RotateCcw" size={14} className="mr-1" />
            Сбросить попытки
          </Button>
        )}
        {isCompleted ? (
          <Badge className="bg-green-100 text-green-700">Пройден</Badge>
        ) : (
          <Badge className="bg-gray-100 text-gray-600">Не начат</Badge>
        )}
      </div>
    </div>
  );
}
