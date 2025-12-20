import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { Course, Lesson, Test, CourseProgress } from '@/components/student/types';
import LessonContent from '@/components/student/LessonContent';
import TestInterface from '@/components/student/TestInterface';
import LessonSidebar from '@/components/student/LessonSidebar';
import LessonHeader from '@/components/student/LessonHeader';
import LessonNavigation from '@/components/student/LessonNavigation';
import LessonLockScreen from '@/components/student/LessonLockScreen';

interface LockStatus {
  isLocked: boolean;
  reason: 'none' | 'previous' | 'allLessons' | 'allTests';
  message: string;
}

interface LessonPageContentProps {
  course: Course;
  lesson: Lesson;
  courseLessons: Lesson[];
  progress: CourseProgress | null;
  isCompleted: boolean;
  test: Test | null;
  testStarted: boolean;
  testAnswers: Record<number, any>;
  testSubmitted: boolean;
  testScore: number;
  earnedPoints: number;
  totalPoints: number;
  timeRemaining: number;
  currentQuestionIndex: number;
  attemptsInfo: {
    attemptsUsed: number;
    remainingAttempts: number;
    maxAttempts: number | null;
    hasUnlimitedAttempts: boolean;
  } | null;
  lockStatus: LockStatus;
  previousLesson: Lesson | null;
  nextLesson: Lesson | null;
  progressPercent: number;
  courseId: string;
  getCompletedCount: () => number;
  getTotalCount: () => number;
  handleNavigateToLesson: (order: number) => void;
  handleCompleteLesson: () => Promise<void>;
  handleStartTest: () => Promise<void>;
  handleAnswerChange: (questionId: number, answerValue: any, isMultiple?: boolean) => void;
  handleSubmitTest: () => Promise<void>;
  setCurrentQuestionIndex: (fn: (prev: number) => number) => void;
  showAttemptsWarning: boolean;
  handleConfirmStart: () => void;
  handleCancelStart: () => void;
}

export default function LessonPageContent({
  course,
  lesson,
  courseLessons,
  progress,
  isCompleted,
  test,
  testStarted,
  testAnswers,
  testSubmitted,
  testScore,
  earnedPoints,
  totalPoints,
  timeRemaining,
  currentQuestionIndex,
  attemptsInfo,
  lockStatus,
  previousLesson,
  nextLesson,
  progressPercent,
  courseId,
  getCompletedCount,
  getTotalCount,
  handleNavigateToLesson,
  handleCompleteLesson,
  handleStartTest,
  handleAnswerChange,
  handleSubmitTest,
  setCurrentQuestionIndex,
  showAttemptsWarning,
  handleConfirmStart,
  handleCancelStart
}: LessonPageContentProps) {
  const navigate = useNavigate();

  return (
    <>
      {showAttemptsWarning && attemptsInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Icon name="AlertTriangle" size={24} className="text-yellow-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Подтвердите начало тестирования
                </h3>
                <div className="text-gray-600 space-y-2">
                  <p className="font-medium">
                    У вас осталось попыток: {attemptsInfo.remainingAttempts}
                  </p>
                  <p className="text-sm">
                    Если вы начнёте тест и покинете эту страницу до завершения, попытка будет потеряна.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleCancelStart}
                    className="flex-1"
                  >
                    Отмена
                  </Button>
                  <Button
                    onClick={handleConfirmStart}
                    className="flex-1"
                  >
                    Начать тест
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      <div className="flex gap-6">
        <div className="flex-1">
          <LessonHeader
            course={course}
            lesson={lesson}
            isCompleted={isCompleted}
            progressPercent={progressPercent}
          />

          <LessonLockScreen
            lockStatus={lockStatus}
            previousLesson={previousLesson}
            completedCount={getCompletedCount()}
            totalCount={getTotalCount()}
            onNavigateToPrevious={() => previousLesson && handleNavigateToLesson(previousLesson.order)}
            onNavigateToCourse={() => navigate(ROUTES.STUDENT.COURSE_DETAIL(courseId!))}
          />

          {!lockStatus.isLocked && (
            <>
              <Card>
                <CardContent className="pt-6">
                  {lesson.type === 'test' && test ? (
                    <TestInterface
                      test={test}
                      testStarted={testStarted}
                      testAnswers={testAnswers}
                      testSubmitted={testSubmitted}
                      testScore={testScore}
                      earnedPoints={earnedPoints}
                      totalPoints={totalPoints}
                      timeRemaining={timeRemaining}
                      currentQuestionIndex={currentQuestionIndex}
                      onStartTest={handleStartTest}
                      onAnswerChange={handleAnswerChange}
                      onSubmitTest={handleSubmitTest}
                      onRetry={handleStartTest}
                      onNextQuestion={() => setCurrentQuestionIndex(prev => prev + 1)}
                      onPreviousQuestion={() => setCurrentQuestionIndex(prev => prev - 1)}
                      onNavigateToPreviousLesson={() => previousLesson && handleNavigateToLesson(previousLesson.order)}
                      hasPreviousLesson={!!previousLesson}
                      attemptsInfo={attemptsInfo}
                    />
                  ) : (
                    <LessonContent lesson={lesson} />
                  )}
                </CardContent>
              </Card>

              {lesson.type !== 'test' && (
                <LessonNavigation
                  courseId={courseId!}
                  previousLesson={previousLesson}
                  nextLesson={nextLesson}
                  isCompleted={isCompleted}
                  isTestPassed={false}
                  onNavigate={handleNavigateToLesson}
                  onComplete={handleCompleteLesson}
                />
              )}
            </>
          )}
        </div>

        <LessonSidebar
          courseLessons={courseLessons}
          currentLessonId={String(lesson.id)}
          progress={progress}
          onNavigate={handleNavigateToLesson}
          isTestInProgress={testStarted && !testSubmitted}
        />
      </div>
    </>
  );
}