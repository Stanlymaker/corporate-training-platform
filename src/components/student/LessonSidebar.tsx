import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Lesson, CourseProgress } from './types';

interface LessonSidebarProps {
  courseLessons: Lesson[];
  currentLessonId: string;
  progress: CourseProgress | null;
  onNavigate: (lessonOrder: number) => void;
}

export default function LessonSidebar({ courseLessons, currentLessonId, progress, onNavigate }: LessonSidebarProps) {
  // Проверка блокировки урока
  const isLessonLocked = (lesson: Lesson, index: number): boolean => {
    // 1. Обычный урок с требованием завершить предыдущий
    if (lesson.requiresPrevious && index > 0) {
      const prevLesson = courseLessons[index - 1];
      if (!progress?.completedLessonIds.includes(String(prevLesson.id))) {
        return true;
      }
    }

    // 2. Финальный тест с требованием завершить все уроки
    if (lesson.isFinalTest && lesson.finalTestRequiresAllLessons) {
      const nonTestLessons = courseLessons.filter(l => !l.isFinalTest);
      const completedNonTestLessons = nonTestLessons.filter(l => 
        progress?.completedLessonIds.includes(String(l.id))
      );
      if (completedNonTestLessons.length < nonTestLessons.length) {
        return true;
      }
    }

    // 3. Финальный тест с требованием завершить все промежуточные тесты
    if (lesson.isFinalTest && lesson.finalTestRequiresAllTests) {
      const testLessons = courseLessons.filter(l => l.type === 'test' && !l.isFinalTest);
      const completedTests = testLessons.filter(l => 
        progress?.completedLessonIds.includes(String(l.id))
      );
      if (completedTests.length < testLessons.length) {
        return true;
      }
    }

    return false;
  };

  return (
    <Card className="border-0 shadow-md sticky top-6 w-64">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon name="List" size={16} />
          Содержание
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-1">
          {courseLessons.map((l, index) => {
            const lessonCompleted = progress?.completedLessonIds.includes(String(l.id));
            const lessonLocked = isLessonLocked(l, index);
            const isActive = String(l.id) === currentLessonId;

            return (
              <button
                key={l.id}
                onClick={() => !lessonLocked && onNavigate(l.order)}
                disabled={lessonLocked}
                className={`w-full text-left p-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : lessonLocked
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  {lessonLocked ? (
                    <Icon name="Lock" size={14} className="text-gray-400 flex-shrink-0" />
                  ) : lessonCompleted ? (
                    <Icon name="CheckCircle" size={14} className="text-green-500 flex-shrink-0" />
                  ) : (
                    <Icon name="Circle" size={14} className="text-gray-300 flex-shrink-0" />
                  )}
                  <span className="text-xs font-medium truncate">
                    {l.isFinalTest ? 'Финальный' : `Урок ${l.order + 1}`}
                  </span>
                  {!l.isFinalTest && <span className="ml-auto text-xs flex-shrink-0">{l.duration}м</span>}
                </div>
                <div className="text-xs line-clamp-1 opacity-80">{l.title}</div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}