import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Course, Lesson, CourseProgress, TestResult } from '@/types';
import LessonListItem from './LessonListItem';

interface CourseListItemProps {
  course: Course;
  isExpanded: boolean;
  isAssigned: boolean;
  progressStatus: string;
  progressLabel: string;
  progressColor: string;
  assignmentStatus: string | null;
  assignmentLabel: string;
  assignmentColor: string;
  progress: CourseProgress | undefined;
  lessons: Lesson[];
  testResults: TestResult[];
  userId: number;
  onToggle: () => void;
  onAssign?: () => void;
  onRevoke?: () => void;
  onViewTestResults: (lessonId: string, testId: number) => void;
  onReloadProgress: () => Promise<void>;
}

export default function CourseListItem({
  course,
  isExpanded,
  isAssigned,
  progressStatus,
  progressLabel,
  progressColor,
  assignmentStatus,
  assignmentLabel,
  assignmentColor,
  progress,
  lessons,
  testResults,
  userId,
  onToggle,
  onAssign,
  onRevoke,
  onViewTestResults,
  onReloadProgress
}: CourseListItemProps) {
  return (
    <div key={course.id} className="bg-gray-50 border rounded-lg overflow-hidden">
      <div className="p-4 flex items-center justify-between hover:bg-gray-100 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <Icon name={isExpanded ? 'ChevronDown' : 'ChevronRight'} size={20} className="text-gray-400" />
          <div className="flex items-center gap-2">
            <Icon name="BookOpen" size={20} className="text-primary" />
            <span className="font-medium">{course.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={progressColor}>{progressLabel}</Badge>
          {assignmentStatus && (
            <Badge className={assignmentColor}>{assignmentLabel}</Badge>
          )}
        </div>
      </div>
      {isExpanded && (
        <div className="px-4 pb-4 bg-white">
          {course.accessType === 'closed' && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="Lock" size={16} className="text-blue-600" />
                <span className="text-sm text-blue-900">
                  {isAssigned ? 'Доступ предоставлен' : 'Доступ не предоставлен'}
                </span>
              </div>
              {isAssigned ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRevoke?.();
                  }}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <Icon name="X" size={14} className="mr-1" />
                  Отозвать доступ
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssign?.();
                  }}
                >
                  <Icon name="UserPlus" size={14} className="mr-1" />
                  Назначить курс
                </Button>
              )}
            </div>
          )}
          <div className="space-y-2">
            {lessons.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">Загрузка уроков...</div>
            ) : (
              lessons.map((lesson) => {
                const isCompleted = progress?.completedLessonIds?.includes(String(lesson.id)) || false;
                const testResult = testResults.find(tr => tr.testId === lesson.testId);
                
                return (
                  <LessonListItem
                    key={lesson.id}
                    lesson={lesson}
                    isCompleted={isCompleted}
                    testResult={testResult}
                    progress={progress}
                    userId={userId}
                    onViewTestResults={onViewTestResults}
                    onReloadProgress={onReloadProgress}
                  />
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
