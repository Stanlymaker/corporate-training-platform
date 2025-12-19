import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Lesson, CourseProgress } from './types';

interface LessonSidebarProps {
  courseLessons: Lesson[];
  currentLesson: Lesson;
  progress: CourseProgress | null;
  onNavigateLesson: (lesson: Lesson) => void;
}

export default function LessonSidebar({ courseLessons, currentLesson, progress, onNavigateLesson }: LessonSidebarProps) {
  return (
    <Card className="border-0 shadow-md sticky top-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon name="List" size={18} />
          Содержание курса
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-1">
          {courseLessons.map((l, index) => {
            const lessonCompleted = progress?.completedLessonIds.includes(l.id);
            const lessonLocked = l.requiresPrevious && index > 0 && !progress?.completedLessonIds.includes(courseLessons[index - 1].id);
            const isActive = l.id === currentLesson.id;

            return (
              <button
                key={l.id}
                onClick={() => !lessonLocked && onNavigateLesson(l)}
                disabled={lessonLocked}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : lessonLocked
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {lessonLocked ? (
                    <Icon name="Lock" size={16} className="text-gray-400" />
                  ) : lessonCompleted ? (
                    <Icon name="CheckCircle" size={16} className="text-green-500" />
                  ) : (
                    <Icon name="Circle" size={16} className="text-gray-300" />
                  )}
                  <span className="text-xs font-medium">Урок {l.order + 1}</span>
                  <span className="ml-auto text-xs">{l.duration} мин</span>
                </div>
                <div className="text-sm font-medium line-clamp-2">{l.title}</div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
