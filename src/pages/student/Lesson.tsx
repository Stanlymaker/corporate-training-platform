import StudentLayout from '@/components/StudentLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useState, useEffect } from 'react';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';
import { Course, Lesson, Test, CourseProgress } from '@/components/student/types';
import LessonContent from '@/components/student/LessonContent';
import TestInterface from '@/components/student/TestInterface';
import LessonSidebar from '@/components/student/LessonSidebar';

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
  
  // Состояния для теста
  const [test, setTest] = useState<Test | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [testAnswers, setTestAnswers] = useState<Record<number, any>>({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testScore, setTestScore] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    loadLessonData();
  }, [courseId, lessonId]);

  // Таймер теста
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
      
      // Загружаем курс, уроки и прогресс
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
        
        // Находим урок по order (lessonId в URL - это order+1)
        const lessonOrder = parseInt(lessonId || '0') - 1;
        foundLesson = lessonsData.find(l => l.order === lessonOrder) || null;
        
        // Дебаг: проверяем materials
        if (foundLesson?.materials) {
          console.log('Lesson materials:', foundLesson.materials);
          console.log('Unique materials:', Array.from(new Map(foundLesson.materials.map(m => [m.id, m])).values()));
        }
        
        setLesson(foundLesson);
        
        // Если это тест, загружаем данные теста
        if (foundLesson?.type === 'test' && foundLesson.testId) {
          const testRes = await fetch(`${API_ENDPOINTS.TESTS}?id=${foundLesson.testId}`, { 
            headers: getAuthHeaders() 
          });
          if (testRes.ok) {
            const testData = await testRes.json();
            console.log('Test data from backend:', testData);
            setTest(testData.test || testData);
          }
        }
      }

      if (progressRes.ok && courseData && foundLesson) {
        const data = await progressRes.json();
        const courseProgress = data.progress?.find((p: CourseProgress) => p.courseId === courseData.id);
        setProgress(courseProgress || null);
        setIsCompleted(courseProgress?.completedLessonIds.includes(foundLesson.id) || false);
        
        // Автоматически отмечаем начало изучения урока (только если прогресса еще нет или это новый урок)
        if (foundLesson && courseData) {
          markLessonStarted(courseData.id, String(foundLesson.id), courseProgress);
        }
      } else if (!progressRes.ok && courseData && foundLesson) {
        // Если прогресса вообще нет (404), создаем его
        markLessonStarted(courseData.id, String(foundLesson.id), null);
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const markLessonStarted = async (courseId: number, lessonUuid: string, currentProgress: CourseProgress | null) => {
    // Не делаем запрос, если это уже последний открытый урок
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

  // Логика блокировки урока
  const getLockStatus = () => {
    // 1. Обычный урок с требованием завершить предыдущий
    if (lesson.requiresPrevious && previousLesson) {
      if (!progress?.completedLessonIds.includes(previousLesson.id)) {
        return {
          isLocked: true,
          reason: 'previous',
          message: `Чтобы открыть этот урок, необходимо завершить предыдущий урок: "${previousLesson.title}"`
        };
      }
    }

    // 2. Финальный тест с требованием завершить все уроки
    if (lesson.isFinalTest && lesson.finalTestRequiresAllLessons) {
      const nonTestLessons = courseLessons.filter(l => !l.isFinalTest);
      const completedNonTestLessons = nonTestLessons.filter(l => 
        progress?.completedLessonIds.includes(l.id)
      );
      
      if (completedNonTestLessons.length < nonTestLessons.length) {
        return {
          isLocked: true,
          reason: 'allLessons',
          message: `Финальный тест откроется после завершения всех уроков курса (${completedNonTestLessons.length}/${nonTestLessons.length})`
        };
      }
    }

    // 3. Финальный тест с требованием завершить все промежуточные тесты
    if (lesson.isFinalTest && lesson.finalTestRequiresAllTests) {
      const testLessons = courseLessons.filter(l => l.type === 'test' && !l.isFinalTest);
      const completedTests = testLessons.filter(l => 
        progress?.completedLessonIds.includes(l.id)
      );
      
      if (completedTests.length < testLessons.length) {
        return {
          isLocked: true,
          reason: 'allTests',
          message: `Финальный тест откроется после прохождения всех промежуточных тестов (${completedTests.length}/${testLessons.length})`
        };
      }
    }

    return { isLocked: false, reason: null, message: null };
  };

  const lockStatus = getLockStatus();

  const handleComplete = async () => {
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
        const data = await response.json();
        setIsCompleted(true);
        
        // Обновляем только прогресс без перезагрузки всей страницы
        const progressRes = await fetch(`${API_ENDPOINTS.PROGRESS}?userId=${userId}&courseId=${courseId}`, { 
          headers: getAuthHeaders() 
        });
        
        if (progressRes.ok) {
          const progressData = await progressRes.json();
          const courseProgress = progressData.progress?.find((p: CourseProgress) => p.courseId === course.id);
          setProgress(courseProgress || null);
        }
        
        // Показываем уведомление если курс завершен полностью
        if (data.completed) {
          alert('🎉 Поздравляем! Вы завершили весь курс!');
        }
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  };

  const handleNavigateLesson = (targetLesson: Lesson) => {
    // Используем order+1 для URL
    navigate(ROUTES.STUDENT.LESSON(courseId!, String(targetLesson.order + 1)));
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      // Проверяем доступность файла
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        alert('Файл недоступен или был удалён. Пожалуйста, обратитесь к администратору.');
        return;
      }
      // Открываем файл напрямую - браузер предложит скачать
      window.open(url, '_blank');
    } catch (error) {
      alert('Ошибка при загрузке файла. Пожалуйста, попробуйте позже.');
      console.error('Download error:', error);
    }
  };

  // Функции для теста
  const handleStartTest = () => {
    if (!test) return;
    setTestStarted(true);
    setTimeRemaining(test.timeLimit * 60); // конвертируем в секунды
    setTestAnswers({});
    setTestSubmitted(false);
    setCurrentQuestionIndex(0);
  };

  const handleAnswerChange = (questionId: number, answerValue: any, isMultiple: boolean = false) => {
    setTestAnswers(prev => {
      if (typeof answerValue === 'string') {
        // Текстовый ответ
        return { ...prev, [questionId]: answerValue };
      } else if (typeof answerValue === 'object' && !Array.isArray(answerValue)) {
        // Matching ответ (объект пар)
        return { ...prev, [questionId]: answerValue };
      } else if (isMultiple) {
        // Множественный выбор
        const currentAnswers = (prev[questionId] as number[]) || [];
        const newAnswers = currentAnswers.includes(answerValue)
          ? currentAnswers.filter(a => a !== answerValue)
          : [...currentAnswers, answerValue];
        return { ...prev, [questionId]: newAnswers };
      } else {
        // Одиночный выбор
        return { ...prev, [questionId]: answerValue };
      }
    });
  };

  const handleSubmitTest = () => {
    if (!test) return;
    
    // Подсчитываем баллы с учетом points
    let earnedPoints = 0;
    let maxPoints = 0;
    
    test.questions.forEach(q => {
      maxPoints += q.points;
      const userAnswer = testAnswers[q.id];
      const correctAnswer = q.correctAnswer;
      
      let isCorrect = false;
      
      if (q.type === 'multiple' && Array.isArray(correctAnswer) && Array.isArray(userAnswer)) {
        // Для множественного выбора: проверяем что массивы идентичны
        const sortedUser = [...userAnswer].sort();
        const sortedCorrect = [...correctAnswer].sort();
        isCorrect = JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
      } else if (q.type === 'matching' && q.matchingPairs) {
        // Для сопоставления: проверяем что порядок правильный
        const userOrder = userAnswer as string[];
        if (Array.isArray(userOrder) && userOrder.length === q.matchingPairs.length) {
          let allCorrect = true;
          q.matchingPairs.forEach((pair, index) => {
            if (userOrder[index] !== pair.right) {
              allCorrect = false;
            }
          });
          isCorrect = allCorrect;
        }
      } else if (q.type === 'text') {
        // Текстовые вопросы с ручной проверкой не учитываем автоматически
        isCorrect = false;
      } else {
        // Для одиночного выбора
        isCorrect = userAnswer === correctAnswer;
      }
      
      if (isCorrect) {
        earnedPoints += q.points;
      }
    });
    
    // Вычисляем процент от максимальных баллов
    const score = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;
    setTestScore(score);
    setTestSubmitted(true);
    
    // Если тест пройден, отмечаем урок как завершённый
    if (score >= test.passScore) {
      handleComplete();
    }
  };

  const handleRetryTest = () => {
    setTestStarted(false);
    setTestSubmitted(false);
    setTestAnswers({});
    setCurrentQuestionIndex(0);
  };

  const handleNextQuestion = () => {
    if (test && currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const progressPercent = progress ? (progress.completedLessons / progress.totalLessons) * 100 : 0;

  if (lockStatus.isLocked) {
    return (
      <StudentLayout>
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/student/courses/${courseId}`)}
            className="mb-4"
          >
            <Icon name="ArrowLeft" size={16} className="mr-2" />
            Назад к курсу
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
          <p className="text-gray-600">{course.title}</p>
        </div>

        <Card className="border-0 shadow-md text-center py-12">
          <CardContent>
            <div className="max-w-md mx-auto">
              <Icon name="Lock" size={64} className="mx-auto text-gray-400 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {lesson.isFinalTest ? 'Финальный тест заблокирован' : 'Урок заблокирован'}
              </h2>
              <p className="text-gray-600 mb-6">
                {lockStatus.message}
              </p>
              {lockStatus.reason === 'previous' && previousLesson && (
                <>
                  <Badge variant="outline" className="text-base px-4 py-2 mb-6">
                    {previousLesson.title}
                  </Badge>
                  <Button onClick={() => handleNavigateLesson(previousLesson)}>
                    Перейти к предыдущему уроку
                  </Button>
                </>
              )}
              {(lockStatus.reason === 'allLessons' || lockStatus.reason === 'allTests') && (
                <Button onClick={() => navigate(`/student/courses/${courseId}`)}>
                  Вернуться к курсу
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/student/courses/${courseId}`)}
          className="mb-4"
        >
          <Icon name="ArrowLeft" size={16} className="mr-2" />
          Назад к курсу
        </Button>
        <div className="flex items-center gap-3">
          <Progress value={progressPercent} className="flex-1" />
          <span className="text-sm text-gray-600 whitespace-nowrap">
            {progress?.completedLessons || 0} / {progress?.totalLessons || courseLessons.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <LessonContent 
            lesson={lesson} 
            currentIndex={currentIndex}
            onDownload={handleDownload}
          >
            {lesson.type === 'test' && test && (
              <TestInterface
                test={test}
                testStarted={testStarted}
                testSubmitted={testSubmitted}
                testAnswers={testAnswers}
                testScore={testScore}
                timeRemaining={timeRemaining}
                currentQuestionIndex={currentQuestionIndex}
                onStartTest={handleStartTest}
                onAnswerChange={handleAnswerChange}
                onSubmitTest={handleSubmitTest}
                onRetry={handleRetryTest}
                onNextQuestion={handleNextQuestion}
                onPreviousQuestion={handlePreviousQuestion}
              />
            )}
          </LessonContent>

          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="lg"
              disabled={!previousLesson}
              onClick={() => previousLesson && handleNavigateLesson(previousLesson)}
            >
              <Icon name="ChevronLeft" size={20} className="mr-2" />
              Предыдущий урок
            </Button>

            {!isCompleted && (
              <Button size="lg" onClick={handleComplete} className="flex-1 max-w-xs">
                <Icon name="CheckCircle" size={20} className="mr-2" />
                Отметить как завершенный
              </Button>
            )}

            <Button
              size="lg"
              disabled={!nextLesson}
              onClick={() => nextLesson && handleNavigateLesson(nextLesson)}
            >
              Следующий урок
              <Icon name="ChevronRight" size={20} className="ml-2" />
            </Button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <LessonSidebar
            courseLessons={courseLessons}
            currentLesson={lesson}
            progress={progress}
            onNavigateLesson={handleNavigateLesson}
          />
        </div>
      </div>
    </StudentLayout>
  );
}