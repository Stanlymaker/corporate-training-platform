import StudentLayout from '@/components/StudentLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useState, useEffect } from 'react';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';
import { Course, Lesson, Test, CourseProgress } from '@/components/student/types';
import LessonContent from '@/components/student/LessonContent';
import TestInterface from '@/components/student/TestInterface';
import LessonSidebar from '@/components/student/LessonSidebar';
import LessonHeader from '@/components/student/LessonHeader';
import LessonNavigation from '@/components/student/LessonNavigation';
import LessonLockScreen from '@/components/student/LessonLockScreen';

export default function LessonPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const userId = JSON.parse(localStorage.getItem('currentUser') || '{}').id;

  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const [test, setTest] = useState<Test | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [testAnswers, setTestAnswers] = useState<Record<number, any>>({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testScore, setTestScore] = useState<number>(0);
  const [earnedPoints, setEarnedPoints] = useState<number>(0);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [attemptsInfo, setAttemptsInfo] = useState<{
    attemptsUsed: number;
    remainingAttempts: number;
    maxAttempts: number | null;
    hasUnlimitedAttempts: boolean;
  } | null>(null);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      testStarted && !testSubmitted && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    loadLessonData();
  }, [courseId, lessonId]);

  useEffect(() => {
    if (!testStarted || testSubmitted || timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [testStarted, testSubmitted, timeRemaining]);

  const loadLessonData = async () => {
    try {
      setLoading(true);
      
      const [courseRes, lessonsRes, progressRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.COURSES}?id=${courseId}`, { headers: getAuthHeaders() }),
        fetch(`${API_ENDPOINTS.LESSONS}?courseId=${courseId}`, { headers: getAuthHeaders() }),
        fetch(`${API_ENDPOINTS.PROGRESS}?userId=${userId}&courseId=${courseId}`, { headers: getAuthHeaders() }),
      ]);

      let courseData = null;
      if (courseRes.ok) {
        const data = await courseRes.json();
        courseData = data.course || data;
        setCourse(courseData);
      }

      let lessonsData: Lesson[] = [];
      let foundLesson: Lesson | null = null;
      
      if (lessonsRes.ok) {
        const data = await lessonsRes.json();
        lessonsData = data.lessons || [];
        setCourseLessons(lessonsData);
        
        const lessonOrder = parseInt(lessonId || '0') - 1;
        foundLesson = lessonsData.find(l => l.order === lessonOrder) || null;
        
        if (foundLesson) {
          console.log('Found lesson:', {
            id: foundLesson.id,
            title: foundLesson.title,
            requiresPrevious: foundLesson.requiresPrevious,
            isFinalTest: foundLesson.isFinalTest,
            finalTestRequiresAllLessons: foundLesson.finalTestRequiresAllLessons,
            finalTestRequiresAllTests: foundLesson.finalTestRequiresAllTests
          });
        }
        
        setLesson(foundLesson);
        
        if (foundLesson?.type === 'test' && foundLesson.testId) {
          const testRes = await fetch(`${API_ENDPOINTS.TESTS}?id=${foundLesson.testId}`, { 
            headers: getAuthHeaders() 
          });
          if (testRes.ok) {
            const testData = await testRes.json();
            console.log('Test data from backend:', testData);
            setTest(testData.test || testData);
          }

          const attemptsRes = await fetch(`${API_ENDPOINTS.TEST_ATTEMPTS}?lessonId=${foundLesson.id}`, {
            headers: getAuthHeaders()
          });
          if (attemptsRes.ok) {
            const attemptsData = await attemptsRes.json();
            setAttemptsInfo(attemptsData);
          }
        }
      }

      if (progressRes.ok && courseData && foundLesson) {
        const data = await progressRes.json();
        const courseProgress = data.progress?.find((p: CourseProgress) => p.courseId === courseData.id);
        console.log('Course progress:', {
          courseId: courseData.id,
          completedLessonIds: courseProgress?.completedLessonIds,
          currentLessonId: foundLesson.id
        });
        setProgress(courseProgress || null);
        setIsCompleted(courseProgress?.completedLessonIds.includes(String(foundLesson.id)) || false);
        
        if (foundLesson && courseData) {
          markLessonStarted(courseData.id, String(foundLesson.id), courseProgress);
        }
      } else if (!progressRes.ok && courseData && foundLesson) {
        markLessonStarted(courseData.id, String(foundLesson.id), null);
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const markLessonStarted = async (courseId: number, lessonUuid: string, currentProgress: CourseProgress | null) => {
    if (currentProgress?.lastAccessedLesson === lessonUuid) {
      return;
    }
    
    try {
      await fetch(`${API_ENDPOINTS.PROGRESS}?action=start`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          courseId: courseId,
          lessonId: lessonUuid
        })
      });
    } catch (error) {
      console.error('Error marking lesson started:', error);
    }
  };

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

  const currentIndex = courseLessons.findIndex(l => l.id === lesson.id);
  const previousLesson = currentIndex > 0 ? courseLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < courseLessons.length - 1 ? courseLessons[currentIndex + 1] : null;

  const getLockStatus = () => {
    console.log('Checking lock status for lesson:', lesson.title, {
      requiresPrevious: lesson.requiresPrevious,
      isFinalTest: lesson.isFinalTest,
      finalTestRequiresAllLessons: lesson.finalTestRequiresAllLessons,
      finalTestRequiresAllTests: lesson.finalTestRequiresAllTests,
      completedLessonIds: progress?.completedLessonIds
    });

    if (lesson.requiresPrevious && previousLesson) {
      const isPrevCompleted = progress?.completedLessonIds.includes(String(previousLesson.id));
      console.log('Previous lesson check:', previousLesson.title, 'completed:', isPrevCompleted);
      if (!isPrevCompleted) {
        return {
          isLocked: true,
          reason: 'previous',
          message: `Чтобы открыть этот урок, необходимо завершить предыдущий урок: "${previousLesson.title}"`
        };
      }
    }

    if (lesson.isFinalTest && lesson.finalTestRequiresAllLessons) {
      const nonTestLessons = courseLessons.filter(l => !l.isFinalTest);
      const completedNonTestLessons = nonTestLessons.filter(l => 
        progress?.completedLessonIds.includes(String(l.id))
      );
      console.log('All lessons check:', completedNonTestLessons.length, '/', nonTestLessons.length);
      
      if (completedNonTestLessons.length < nonTestLessons.length) {
        return {
          isLocked: true,
          reason: 'allLessons',
          message: `Финальный тест откроется после завершения всех уроков курса (${completedNonTestLessons.length}/${nonTestLessons.length})`
        };
      }
    }

    if (lesson.isFinalTest && lesson.finalTestRequiresAllTests) {
      const testLessons = courseLessons.filter(l => l.type === 'test' && !l.isFinalTest);
      const completedTests = testLessons.filter(l => 
        progress?.completedLessonIds.includes(String(l.id))
      );
      console.log('All tests check:', completedTests.length, '/', testLessons.length);
      
      if (completedTests.length < testLessons.length) {
        return {
          isLocked: true,
          reason: 'allTests',
          message: `Финальный тест откроется после прохождения всех промежуточных тестов (${completedTests.length}/${testLessons.length})`
        };
      }
    }

    return { isLocked: false };
  };

  const lockStatus = getLockStatus();
  const completedLessons = progress?.completedLessonIds.length || 0;
  const totalLessons = courseLessons.length;
  const progressPercent = Math.round((completedLessons / totalLessons) * 100);

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

  const handleNavigateToLesson = (lessonOrder: number) => {
    navigate(ROUTES.STUDENT.LESSON(courseId!, String(lessonOrder + 1)));
  };

  const handleStartTest = async () => {
    if (!lesson || !attemptsInfo) return;

    if (!attemptsInfo.hasUnlimitedAttempts && attemptsInfo.remainingAttempts <= 0) {
      alert('У вас закончились попытки прохождения этого теста');
      return;
    }

    if (!attemptsInfo.hasUnlimitedAttempts) {
      const confirmStart = window.confirm(
        `У вас осталось попыток: ${attemptsInfo.remainingAttempts}.\n\n` +
        `Если вы начнёте тест и покинете эту страницу до завершения, попытка будет потеряна.\n\n` +
        `Начать тестирование?`
      );

      if (!confirmStart) return;
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.TEST_ATTEMPTS}?action=start`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ lessonId: lesson.id })
      });

      if (response.ok) {
        const data = await response.json();
        setAttemptsInfo(prev => prev ? {
          ...prev,
          attemptsUsed: data.attemptsUsed,
          remainingAttempts: data.remainingAttempts
        } : null);

        setTestStarted(true);
        setTimeRemaining(test?.timeLimit ? test.timeLimit * 60 : 0);
        setTestAnswers({});
        setTestSubmitted(false);
        setCurrentQuestionIndex(0);
      } else {
        const error = await response.json();
        alert(error.error || 'Не удалось начать тест');
      }
    } catch (error) {
      console.error('Error starting test:', error);
      alert('Произошла ошибка при начале тестирования');
    }
  };

  const handleAnswerChange = (questionId: number, answerValue: any, isMultiple?: boolean) => {
    if (isMultiple) {
      setTestAnswers(prev => {
        const currentAnswers = Array.isArray(prev[questionId]) ? prev[questionId] : [];
        const newAnswers = currentAnswers.includes(answerValue)
          ? currentAnswers.filter((a: any) => a !== answerValue)
          : [...currentAnswers, answerValue];
        return { ...prev, [questionId]: newAnswers };
      });
    } else {
      setTestAnswers(prev => ({ ...prev, [questionId]: answerValue }));
    }
  };

  const handleSubmitTest = async () => {
    if (!test || !course || !lesson) return;
    
    let earnedPoints = 0;
    let totalPoints = 0;
    
    console.log('=== Начало проверки теста ===');
    console.log('Всего вопросов:', test.questions.length);
    console.log('Ответы пользователя:', testAnswers);
    
    test.questions.forEach((question) => {
      const userAnswer = testAnswers[question.id];
      const questionPoints = question.points || 1;
      totalPoints += questionPoints;
      
      console.log(`Вопрос #${question.id} (${question.type}):`, {
        questionPoints,
        userAnswer,
        correctAnswer: question.correctAnswer,
        correctAnswers: question.correctAnswers
      });
      
      if (question.type === 'single') {
        const isCorrect = userAnswer === question.correctAnswer;
        if (isCorrect) earnedPoints += questionPoints;
        console.log(`  Single: ${isCorrect ? '✓' : '✗'} (${userAnswer} === ${question.correctAnswer})`);
      } else if (question.type === 'multiple') {
        const correctAnswers = question.correctAnswers || [];
        const userAnswers = userAnswer || [];
        const isCorrect = JSON.stringify(correctAnswers.sort()) === JSON.stringify(userAnswers.sort());
        if (isCorrect) earnedPoints += questionPoints;
        console.log(`  Multiple: ${isCorrect ? '✓' : '✗'}`, { correctAnswers, userAnswers });
      } else if (question.type === 'matching' && question.matchingPairs) {
        const userOrder = userAnswer || [];
        const correctOrder = question.matchingPairs.map((p: any) => p.right);
        const isCorrect = JSON.stringify(userOrder) === JSON.stringify(correctOrder);
        if (isCorrect) earnedPoints += questionPoints;
        console.log(`  Matching: ${isCorrect ? '✓' : '✗'}`, { correctOrder, userOrder });
      }
    });
    
    console.log('=== Итого ===');
    console.log('Набрано баллов:', earnedPoints, '/', totalPoints);
    
    const score = Math.round((earnedPoints / totalPoints) * 100);
    console.log('Процент:', score + '%');
    
    setTestScore(score);
    setEarnedPoints(earnedPoints);
    setTotalPoints(totalPoints);
    setTestSubmitted(true);
    
    const passingScore = test.passingScore || 70;
    if (score >= passingScore) {
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
          await loadLessonData();
          
          if (nextLesson) {
            setTimeout(() => {
              handleNavigateToLesson(nextLesson.order);
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Error completing test:', error);
      }
    }
  };

  const getCompletedCount = () => {
    if (lockStatus.reason === 'allLessons') {
      const nonTestLessons = courseLessons.filter(l => !l.isFinalTest);
      return nonTestLessons.filter(l => progress?.completedLessonIds.includes(l.id)).length;
    }
    if (lockStatus.reason === 'allTests') {
      const testLessons = courseLessons.filter(l => l.type === 'test' && !l.isFinalTest);
      return testLessons.filter(l => progress?.completedLessonIds.includes(l.id)).length;
    }
    return 0;
  };

  const getTotalCount = () => {
    if (lockStatus.reason === 'allLessons') {
      return courseLessons.filter(l => !l.isFinalTest).length;
    }
    if (lockStatus.reason === 'allTests') {
      return courseLessons.filter(l => l.type === 'test' && !l.isFinalTest).length;
    }
    return 0;
  };

  return (
    <StudentLayout>
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

      {blocker.state === "blocked" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-start gap-4">
              <Icon name="AlertTriangle" size={24} className="text-orange-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2">Покинуть тест?</h3>
                <p className="text-gray-700 mb-4">
                  Если вы покинете эту страницу сейчас, вы потеряете одну попытку прохождения теста. 
                  Ваш прогресс не сохранится.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => blocker.reset()}
                  >
                    Остаться
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => blocker.proceed()}
                  >
                    Покинуть тест
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}