import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Lesson } from '@/components/student/types';

interface LockStatus {
  isLocked: boolean;
  reason?: string;
  message?: string;
}

interface LessonLockScreenProps {
  lockStatus: LockStatus;
  previousLesson: Lesson | null;
  completedCount: number;
  totalCount: number;
  onNavigateToPrevious: () => void;
  onNavigateToCourse: () => void;
}

export default function LessonLockScreen({
  lockStatus,
  previousLesson,
  completedCount,
  totalCount,
  onNavigateToPrevious,
  onNavigateToCourse
}: LessonLockScreenProps) {
  if (!lockStatus.isLocked) return null;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="pt-6">
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="Lock" size={40} className="text-orange-500" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">Урок заблокирован</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">{lockStatus.message}</p>
          
          {lockStatus.reason === 'previous' && previousLesson && (
            <Button onClick={onNavigateToPrevious} size="lg">
              <Icon name="ArrowLeft" className="mr-2" size={16} />
              Перейти к уроку: {previousLesson.title}
            </Button>
          )}
          
          {(lockStatus.reason === 'allLessons' || lockStatus.reason === 'allTests') && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 inline-block">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-orange-500">{completedCount}</div>
                  <div className="text-gray-400 text-2xl">/</div>
                  <div className="text-3xl font-bold text-gray-400">{totalCount}</div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {lockStatus.reason === 'allLessons' ? 'завершено уроков' : 'пройдено тестов'}
                </p>
              </div>
              
              <div>
                <Button onClick={onNavigateToCourse} size="lg">
                  <Icon name="List" className="mr-2" size={16} />
                  Перейти к списку уроков
                </Button>
              </div>
            </div>
          )}
          
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Icon name="Info" size={16} />
              <span>Уроки открываются по мере прохождения курса</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
