import StudentLayout from '@/components/StudentLayout';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useEffect } from 'react';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';
import { useLessonData } from './hooks/useLessonData';
import { useLessonTest } from './hooks/useLessonTest';
import { useLessonLock } from './hooks/useLessonLock';
import LessonPageContent from './components/LessonPageContent';

export default function LessonPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const userId = JSON.parse(localStorage.getItem('currentUser') || '{}').id;

  const {
    course,
    lesson,
    courseLessons,
    progress,
    loading,
    isCompleted,
    setIsCompleted,
    test,
    attemptsInfo,
    setAttemptsInfo,
    testResult,
    loadLessonData
  } = useLessonData({ courseId, lessonId, userId });

  const currentIndex = lesson ? courseLessons.findIndex(l => l.id === lesson.id) : -1;
  const previousLesson = currentIndex > 0 ? courseLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < courseLessons.length - 1 ? courseLessons[currentIndex + 1] : null;

  const handleNavigateToLesson = (lessonOrder: number) => {
    navigate(ROUTES.STUDENT.LESSON(courseId!, String(lessonOrder + 1)));
  };

  const {
    testStarted,
    testAnswers,
    testSubmitted,
    testScore,
    earnedPoints,
    totalPoints,
    timeRemaining,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    handleStartTest,
    handleAnswerChange,
    handleSubmitTest,
    showAttemptsWarning,
    handleConfirmStart,
    handleCancelStart
  } = useLessonTest({
    lesson,
    test,
    course,
    nextLesson,
    attemptsInfo,
    setAttemptsInfo,
    setIsCompleted,
    loadLessonData,
    onNavigateToLesson: handleNavigateToLesson
  });

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (testStarted && !testSubmitted) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [testStarted, testSubmitted]);

  const handleCompleteLesson = async () => {
    if (!course || !lesson) return;
    
    try {
      const response = await fetch(`${API_ENDPOINTS.PROGRESS}?action=complete`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          courseId: course.id,
          lessonId: String(lesson.id)
        })
      });
      
      if (response.ok) {
        setIsCompleted(true);
        
        if (nextLesson) {
          handleNavigateToLesson(nextLesson.order);
        }
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <Icon name="Loader2" className="animate-spin" size={32} />
        </div>
      </StudentLayout>
    );
  }

  if (!course || !lesson) {
    return (
      <StudentLayout>
        <div className="text-center py-12">
          <Icon name="AlertCircle" size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Урок не найден</h2>
          <Button onClick={() => navigate(ROUTES.STUDENT.COURSES)}>
            Вернуться к курсам
          </Button>
        </div>
      </StudentLayout>
    );
  }

  const { getLockStatus, getCompletedCount, getTotalCount } = useLessonLock({
    lesson,
    courseLessons,
    previousLesson,
    progress
  });

  const lockStatus = getLockStatus();
  const completedLessons = progress?.completedLessonIds.length || 0;
  const totalLessons = courseLessons.length;
  const progressPercent = Math.round((completedLessons / totalLessons) * 100);

  return (
    <StudentLayout>
      <LessonPageContent
        course={course}
        lesson={lesson}
        courseLessons={courseLessons}
        progress={progress}
        isCompleted={isCompleted}
        test={test}
        testStarted={testStarted}
        testAnswers={testAnswers}
        testSubmitted={testSubmitted}
        testScore={testScore}
        earnedPoints={earnedPoints}
        totalPoints={totalPoints}
        timeRemaining={timeRemaining}
        currentQuestionIndex={currentQuestionIndex}
        attemptsInfo={attemptsInfo}
        testResult={testResult}
        lockStatus={lockStatus}
        previousLesson={previousLesson}
        nextLesson={nextLesson}
        progressPercent={progressPercent}
        courseId={courseId!}
        getCompletedCount={() => getCompletedCount(lockStatus)}
        getTotalCount={() => getTotalCount(lockStatus)}
        handleNavigateToLesson={handleNavigateToLesson}
        handleCompleteLesson={handleCompleteLesson}
        handleStartTest={handleStartTest}
        handleAnswerChange={handleAnswerChange}
        handleSubmitTest={handleSubmitTest}
        setCurrentQuestionIndex={setCurrentQuestionIndex}
        showAttemptsWarning={showAttemptsWarning}
        handleConfirmStart={handleConfirmStart}
        handleCancelStart={handleCancelStart}
      />
    </StudentLayout>
  );
}