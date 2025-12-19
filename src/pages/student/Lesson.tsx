import StudentLayout from '@/components/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface Course {
  id: number;
  title: string;
  description: string;
}

interface Lesson {
  id: string;
  courseId: number;
  title: string;
  description: string;
  content: string;
  type: string;
  order: number;
  duration: number;
  videoUrl?: string;
  requiresPrevious?: boolean;
  testId?: number;
  materials?: Array<{
    id: number;
    title: string;
    type: string;
    url: string;
  }>;
}

interface Test {
  id: number;
  title: string;
  description: string;
  passingScore: number;
  timeLimit: number;
  questionsCount: number;
  questions: TestQuestion[];
}

interface TestQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface CourseProgress {
  courseId: number;
  userId: number;
  completedLessons: number;
  totalLessons: number;
  completedLessonIds: string[];
  lastAccessedLesson: string | null;
}

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
  const [testAnswers, setTestAnswers] = useState<Record<number, number>>({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testScore, setTestScore] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    loadLessonData();
  }, [courseId, lessonId]);

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

  const isLocked = lesson.requiresPrevious && previousLesson && !progress?.completedLessonIds.includes(previousLesson.id);

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
  };

  const handleAnswerChange = (questionId: number, answerIndex: number) => {
    setTestAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleSubmitTest = () => {
    if (!test) return;
    
    // Подсчитываем баллы
    let correctCount = 0;
    test.questions.forEach(q => {
      if (testAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });
    
    const score = Math.round((correctCount / test.questions.length) * 100);
    setTestScore(score);
    setTestSubmitted(true);
    
    // Если тест пройден, отмечаем урок как завершённый
    if (score >= test.passingScore) {
      handleComplete();
    }
  };

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

  const progressPercent = progress ? (progress.completedLessons / progress.totalLessons) * 100 : 0;

  if (isLocked) {
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Урок заблокирован</h2>
              <p className="text-gray-600 mb-6">
                Чтобы открыть этот урок, необходимо завершить предыдущий урок:
              </p>
              <Badge variant="outline" className="text-base px-4 py-2 mb-6">
                {previousLesson?.title}
              </Badge>
              <Button onClick={() => handleNavigateLesson(previousLesson!)}>
                Перейти к предыдущему уроку
              </Button>
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
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {currentIndex + 1}
                  </div>
                  <div>
                    <div className="text-lg">{lesson.title}</div>
                    {lesson.description && (
                      <div className="text-sm text-gray-500 font-normal">{lesson.description}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Icon name="Clock" size={16} />
                  <span>{lesson.duration} мин</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {lesson.type === 'video' && lesson.videoUrl && (
                <div className="mb-6 rounded-lg overflow-hidden bg-black relative w-full" style={{ paddingTop: '56.25%' }}>
                  <div 
                    className="absolute inset-0"
                    dangerouslySetInnerHTML={{ 
                      __html: lesson.videoUrl.replace(/width="\d+"/, 'width="100%"').replace(/height="\d+"/, 'height="100%"')
                    }}
                  />
                </div>
              )}

              {lesson.type === 'test' && test && (
                <div className="space-y-6">
                  {!testStarted ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="text-xl font-bold mb-2">{test.title}</h3>
                      <p className="text-gray-600 mb-6">{test.description}</p>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="flex items-center gap-2">
                          <Icon name="HelpCircle" size={20} className="text-primary" />
                          <div>
                            <div className="text-sm text-gray-500">Вопросов</div>
                            <div className="font-bold">{test.questionsCount}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon name="Clock" size={20} className="text-primary" />
                          <div>
                            <div className="text-sm text-gray-500">Время</div>
                            <div className="font-bold">{test.timeLimit} мин</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon name="Target" size={20} className="text-primary" />
                          <div>
                            <div className="text-sm text-gray-500">Проходной балл</div>
                            <div className="font-bold">{test.passingScore}%</div>
                          </div>
                        </div>
                      </div>
                      <Button onClick={handleStartTest} className="w-full" size="lg">
                        <Icon name="PlayCircle" size={20} className="mr-2" />
                        Начать тестирование
                      </Button>
                    </div>
                  ) : !testSubmitted ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Icon name="Clock" size={20} className="text-yellow-600" />
                          <span className="font-medium">Осталось времени:</span>
                        </div>
                        <span className="text-xl font-bold text-yellow-600">
                          {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      
                      {test.questions.map((question, index) => (
                        <div key={question.id} className="p-6 border rounded-lg">
                          <h4 className="font-bold mb-4">
                            {index + 1}. {question.question}
                          </h4>
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <label
                                key={optionIndex}
                                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                                  testAnswers[question.id] === optionIndex
                                    ? 'border-primary bg-primary/5'
                                    : 'border-gray-200 hover:border-primary/50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${question.id}`}
                                  checked={testAnswers[question.id] === optionIndex}
                                  onChange={() => handleAnswerChange(question.id, optionIndex)}
                                  className="w-4 h-4"
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      <Button 
                        onClick={handleSubmitTest} 
                        className="w-full" 
                        size="lg"
                        disabled={Object.keys(testAnswers).length < test.questions.length}
                      >
                        <Icon name="CheckCircle" size={20} className="mr-2" />
                        Завершить тестирование
                      </Button>
                    </div>
                  ) : (
                    <div className={`p-6 rounded-lg border-2 ${
                      testScore >= test.passingScore ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                    }`}>
                      <div className="text-center">
                        <Icon 
                          name={testScore >= test.passingScore ? 'CheckCircle' : 'XCircle'} 
                          size={64} 
                          className={`mx-auto mb-4 ${testScore >= test.passingScore ? 'text-green-500' : 'text-red-500'}`}
                        />
                        <h3 className="text-2xl font-bold mb-2">
                          {testScore >= test.passingScore ? 'Тест пройден!' : 'Тест не пройден'}
                        </h3>
                        <p className="text-xl mb-4">
                          Ваш результат: <span className="font-bold">{testScore}%</span>
                        </p>
                        <p className="text-gray-600 mb-6">
                          Проходной балл: {test.passingScore}%
                        </p>
                        {testScore < test.passingScore && (
                          <Button onClick={() => {
                            setTestStarted(false);
                            setTestSubmitted(false);
                            setTestAnswers({});
                          }}>
                            <Icon name="RotateCcw" size={16} className="mr-2" />
                            Попробовать снова
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="prose prose-lg max-w-none">
                {lesson.type === 'text' && (
                  <ReactMarkdown>{lesson.content}</ReactMarkdown>
                )}
                {lesson.type === 'video' && lesson.content && (
                  <ReactMarkdown>{lesson.content}</ReactMarkdown>
                )}
              </div>

              {lesson.materials && lesson.materials.length > 0 && (
                <div className="mt-8 pt-8 border-t">
                  <h3 className="text-xl font-bold mb-4">Материалы урока</h3>
                  <div className="space-y-2">
                    {Array.from(new Map(lesson.materials.map(m => [m.id, m])).values()).map(material => (
                      <button
                        key={material.id}
                        onClick={() => handleDownload(material.url, material.title)}
                        className="w-full flex items-center gap-3 p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors text-left"
                      >
                        <Icon
                          name={material.type === 'pdf' ? 'FileText' : material.type === 'video' ? 'Video' : 'File'}
                          size={20}
                          className="text-primary"
                        />
                        <span className="font-medium">{material.title}</span>
                        <Icon name="Download" size={16} className="ml-auto text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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
                  const isActive = l.id === lesson.id;

                  return (
                    <button
                      key={l.id}
                      onClick={() => !lessonLocked && handleNavigateLesson(l)}
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
        </div>
      </div>
    </StudentLayout>
  );
}