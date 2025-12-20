import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User, CourseAssignment, Course, Lesson, CourseProgress, TestResult } from '@/types';
import { useState, useEffect } from 'react';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UserCoursesManagementProps {
  user: User;
  assignments: CourseAssignment[];
  onAssignCourse?: (userId: number, courseId: number) => void;
  onRemoveAssignment?: (assignmentId: number) => void;
}

export default function UserCoursesManagement({ 
  user, 
  assignments, 
  onAssignCourse, 
  onRemoveAssignment 
}: UserCoursesManagementProps) {
  const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [lessonsData, setLessonsData] = useState<Record<number, Lesson[]>>({});
  const [progressData, setProgressData] = useState<CourseProgress[]>([]);
  const [testResults, setTestResults] = useState<Record<number, TestResult[]>>({});
  const [statusFilter, setStatusFilter] = useState<'published' | 'draft' | 'archived'>('published');
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revokeAssignmentId, setRevokeAssignmentId] = useState<number | null>(null);
  const [revokeCourseTitle, setRevokeCourseTitle] = useState<string>('');
  const [revokeHasProgress, setRevokeHasProgress] = useState(false);
  const [showTestResultsDialog, setShowTestResultsDialog] = useState(false);
  const [selectedTestResult, setSelectedTestResult] = useState<any>(null);
  const [selectedTest, setSelectedTest] = useState<any>(null);

  useEffect(() => {
    loadCourses();
    loadProgress();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.COURSES, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.PROGRESS}?userId=${user.id}`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setProgressData(data.progress || []);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const loadCourseLessons = async (courseId: number) => {
    if (lessonsData[courseId]) return;
    
    try {
      const response = await fetch(`${API_ENDPOINTS.LESSONS}?courseId=${courseId}`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setLessonsData(prev => ({ ...prev, [courseId]: data.lessons || [] }));
      }
    } catch (error) {
      console.error('Error loading lessons:', error);
    }
  };

  const loadTestResults = async (courseId: number) => {
    if (testResults[courseId]) return;
    
    try {
      const response = await fetch(`${API_ENDPOINTS.TESTS}?action=results&courseId=${courseId}&userId=${user.id}`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setTestResults(prev => ({ ...prev, [courseId]: data.results || [] }));
      }
    } catch (error) {
      console.error('Error loading test results:', error);
    }
  };

  const viewTestResults = async (lessonId: string, testId: number) => {
    try {
      // Загружаем тест с вопросами
      const testResponse = await fetch(`${API_ENDPOINTS.TESTS}?id=${testId}`, { headers: getAuthHeaders() });
      if (!testResponse.ok) {
        alert('Не удалось загрузить тест');
        return;
      }
      const testData = await testResponse.json();
      setSelectedTest(testData.test);

      // Загружаем результат теста для этого урока
      const resultResponse = await fetch(`${API_ENDPOINTS.TESTS}?action=results&lessonId=${lessonId}`, { 
        headers: {
          ...getAuthHeaders(),
          'X-User-Id-Override': String(user.id) // Передаем ID пользователя для просмотра админом
        }
      });
      
      if (!resultResponse.ok) {
        alert('Результаты теста не найдены');
        return;
      }
      
      const resultData = await resultResponse.json();
      setSelectedTestResult(resultData.result);
      setShowTestResultsDialog(true);
    } catch (error) {
      console.error('Error loading test results:', error);
      alert('Ошибка при загрузке результатов теста');
    }
  };

  const toggleCourse = async (courseId: number) => {
    if (expandedCourseId === courseId) {
      setExpandedCourseId(null);
    } else {
      setExpandedCourseId(courseId);
      await loadCourseLessons(courseId);
      await loadTestResults(courseId);
    }
  };

  const userAssignments = assignments;
  const assignedCourseIds = userAssignments.map(a => a.courseId);

  const getCourseStatus = (course: Course) => {
    const progress = progressData.find(p => p.courseId === course.id);
    const assignment = userAssignments.find(a => a.courseId === course.id);
    const isAssigned = assignedCourseIds.includes(course.id);
    
    // Статус прогресса
    let progressStatus = 'not_started';
    let progressLabel = 'Не начат';
    let progressColor = 'bg-gray-100 text-gray-700';
    
    if (progress?.completed || (progress && progress.completedLessons >= progress.totalLessons && progress.totalLessons > 0)) {
      progressStatus = 'completed';
      progressLabel = 'Завершен';
      progressColor = 'bg-green-100 text-green-700';
    } else if (progress && progress.completedLessons > 0) {
      progressStatus = 'in_progress';
      progressLabel = 'Начат';
      progressColor = 'bg-yellow-100 text-yellow-700';
    } else if (progress) {
      progressStatus = 'started';
      progressLabel = 'Начат';
      progressColor = 'bg-blue-100 text-blue-700';
    }
    
    // Статус назначения (только для закрытых курсов)
    let assignmentStatus = null;
    let assignmentLabel = '';
    let assignmentColor = '';
    
    if (course.accessType === 'closed') {
      if (isAssigned) {
        assignmentStatus = 'assigned';
        assignmentLabel = 'Назначен';
        assignmentColor = 'bg-blue-100 text-blue-700';
      } else {
        assignmentStatus = 'not_assigned';
        assignmentLabel = 'Не назначен';
        assignmentColor = 'bg-gray-50 text-gray-500 border border-gray-300';
      }
    }
    
    return {
      progressStatus,
      progressLabel,
      progressColor,
      assignmentStatus,
      assignmentLabel,
      assignmentColor,
      isAssigned
    };
  };

  if (user.role !== 'student') return null;

  if (loading) {
    return (
      <div className="border-t pt-6">
        <div className="flex justify-center py-4">
          <Icon name="Loader2" className="animate-spin" size={24} />
        </div>
      </div>
    );
  }

  // Разделяем курсы по статусам публикации
  const publishedCourses = courses.filter(c => c.status === 'published');
  const draftCourses = courses.filter(c => c.status === 'draft');
  const archivedCourses = courses.filter(c => c.status === 'archived');

  const getCoursesToShow = () => {
    switch (statusFilter) {
      case 'published': return publishedCourses;
      case 'draft': return draftCourses;
      case 'archived': return archivedCourses;
      default: return publishedCourses;
    }
  };

  const coursesToShow = getCoursesToShow();

  return (
    <div className="border-t pt-6">
      <h5 className="font-bold mb-4 flex items-center gap-2">
        <Icon name="BookOpen" size={18} />
        Все курсы и прогресс
      </h5>
      
      <div className="flex gap-2 mb-4">
        <Button
          variant={statusFilter === 'published' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('published')}
        >
          Опубликованные ({publishedCourses.length})
        </Button>
        <Button
          variant={statusFilter === 'draft' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('draft')}
        >
          Черновики ({draftCourses.length})
        </Button>
        <Button
          variant={statusFilter === 'archived' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('archived')}
        >
          Архив ({archivedCourses.length})
        </Button>
      </div>
      
      <div className="space-y-2">
        {coursesToShow.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
            Нет курсов в этом разделе
          </div>
        ) : (
          coursesToShow.map((course) => {
              const courseStatus = getCourseStatus(course);
              
            const isExpanded = expandedCourseId === course.id;
            const lessons = lessonsData[course.id] || [];
            const progress = progressData.find(p => p.courseId === course.id);
            const courseTestResults = testResults[course.id] || [];
            
            return (
              <div key={course.id} className="bg-gray-50 rounded-lg">
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleCourse(course.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Icon name={isExpanded ? "ChevronDown" : "ChevronRight"} size={18} className="text-gray-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{course.title}</span>
                        {course.accessType === 'closed' && (
                          <Badge variant="outline" className="text-xs">
                            <Icon name="Lock" size={10} className="mr-1" />
                            Закрытый
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {course.lessonsCount} уроков • {course.duration} мин
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={courseStatus.progressColor}>
                      {courseStatus.progressLabel}
                    </Badge>
                    {course.accessType === 'closed' && courseStatus.assignmentStatus && (
                      <Badge className={courseStatus.assignmentColor}>
                        {courseStatus.assignmentLabel}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    {course.accessType === 'closed' && (
                      <div className="flex items-center gap-2 p-3 bg-white rounded border border-gray-200">
                        <Icon name="Lock" size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-600 flex-1">Закрытый курс — требуется назначение</span>
                        {courseStatus.isAssigned ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              const assignment = userAssignments.find(a => a.courseId === course.id);
                              const hasProgress = progress && (progress.completedLessons > 0 || progress.completed);
                              if (assignment) {
                                setRevokeAssignmentId(assignment.id);
                                setRevokeCourseTitle(course.title);
                                setRevokeHasProgress(!!hasProgress);
                                setShowRevokeDialog(true);
                              }
                            }}
                          >
                            <Icon name="UserMinus" size={14} className="mr-1" />
                            Отозвать доступ
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onAssignCourse) {
                                onAssignCourse(user.id, course.id);
                              }
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
                          const testResult = courseTestResults.find(tr => tr.testId === lesson.testId);
                          
                          return (
                            <div key={lesson.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
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
                                        viewTestResults(String(lesson.id), lesson.testId!);
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
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (confirm(`Сбросить попытки теста "${lesson.title}" для пользователя ${user.name}?`)) {
                                        try {
                                          const response = await fetch(
                                            `${API_ENDPOINTS.TEST_ATTEMPTS}?userId=${user.id}&lessonId=${lesson.id}`,
                                            {
                                              method: 'DELETE',
                                              headers: getAuthHeaders()
                                            }
                                          );
                                          if (response.ok) {
                                            alert('Попытки успешно сброшены');
                                            await loadProgress();
                                          } else {
                                            alert('Ошибка при сбросе попыток');
                                          }
                                        } catch (error) {
                                          console.error('Error resetting attempts:', error);
                                          alert('Ошибка при сбросе попыток');
                                        }
                                      }
                                    }}
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
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Icon name="AlertTriangle" size={24} className="text-orange-500" />
              Отзыв доступа к курсу
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>
                Вы собираетесь отозвать доступ пользователя <strong>{user.name}</strong> к курсу <strong>"{revokeCourseTitle}"</strong>.
              </p>
              {revokeHasProgress && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Icon name="AlertCircle" size={20} className="text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="font-semibold text-orange-900">
                        ⚠️ Будет сброшен весь прогресс!
                      </p>
                      <p className="text-sm text-orange-800">
                        У пользователя есть прогресс по этому курсу. При отзыве доступа:
                      </p>
                      <ul className="text-sm text-orange-800 list-disc list-inside space-y-1 ml-2">
                        <li>Все пройденные уроки будут сброшены</li>
                        <li>Результаты тестов будут удалены</li>
                        <li>Статус курса станет "Не начат"</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-600">
                Это действие нельзя отменить. Продолжить?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowRevokeDialog(false);
              setRevokeAssignmentId(null);
              setRevokeCourseTitle('');
              setRevokeHasProgress(false);
            }}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (revokeAssignmentId) {
                  // Удаляем назначение
                  if (onRemoveAssignment) {
                    onRemoveAssignment(revokeAssignmentId);
                  }
                  
                  // Сбрасываем прогресс пользователя по курсу
                  const assignment = userAssignments.find(a => a.id === revokeAssignmentId);
                  if (assignment) {
                    try {
                      await fetch(`${API_ENDPOINTS.PROGRESS}?userId=${user.id}&courseId=${assignment.courseId}`, {
                        method: 'DELETE',
                        headers: getAuthHeaders(),
                      });
                      
                      // Перезагружаем прогресс после удаления
                      await loadProgress();
                    } catch (error) {
                      console.error('Error resetting progress:', error);
                    }
                  }
                }
                
                setShowRevokeDialog(false);
                setRevokeAssignmentId(null);
                setRevokeCourseTitle('');
                setRevokeHasProgress(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              <Icon name="Trash2" size={14} className="mr-2" />
              Отозвать и сбросить прогресс
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showTestResultsDialog} onOpenChange={setShowTestResultsDialog}>
        <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Icon name="FileText" size={24} className="text-blue-500" />
              Результаты тестирования — {user.name}
            </AlertDialogTitle>
          </AlertDialogHeader>
          {selectedTest && selectedTestResult && (
            <div className="space-y-6 py-4">
              <div className={`p-6 rounded-lg border-2 ${
                selectedTestResult.passed ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
              }`}>
                <div className="text-center mb-4">
                  <Icon 
                    name={selectedTestResult.passed ? 'CheckCircle' : 'XCircle'} 
                    size={48} 
                    className={`mx-auto mb-3 ${selectedTestResult.passed ? 'text-green-500' : 'text-red-500'}`}
                  />
                  <h3 className="text-xl font-bold mb-2">
                    {selectedTestResult.passed ? 'Тест пройден!' : 'Тест не пройден'}
                  </h3>
                  <p className="text-lg mb-1">
                    Результат: <span className="font-bold">{selectedTestResult.score}%</span>
                  </p>
                  <p className="text-gray-600 mb-1">
                    Баллы: <span className="font-semibold">{selectedTestResult.earnedPoints} из {selectedTestResult.totalPoints}</span>
                  </p>
                  <p className="text-gray-600 mb-2">
                    Проходной балл: <span className="font-semibold">{selectedTest.passScore}%</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Завершено: {new Date(selectedTestResult.completedAt).toLocaleString('ru-RU')}
                  </p>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Icon name="List" size={20} />
                  Детальные результаты
                </h4>
                
                <div className="space-y-4">
                  {selectedTest.questions?.map((question: any, idx: number) => {
                    const questionResult = selectedTestResult.results.find((r: any) => r.questionId === String(question.id));
                    const userAnswer = selectedTestResult.answers[String(question.id)];
                    
                    return (
                      <div 
                        key={question.id} 
                        className={`p-4 rounded-lg border-2 ${
                          questionResult?.isCorrect 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon 
                            name={questionResult?.isCorrect ? 'CheckCircle' : 'XCircle'} 
                            size={20} 
                            className={questionResult?.isCorrect ? 'text-green-600 mt-1' : 'text-red-600 mt-1'} 
                          />
                          <div className="flex-1">
                            <div className="font-semibold mb-2">
                              Вопрос {idx + 1}: {question.question}
                            </div>
                            
                            {question.imageUrl && (
                              <img 
                                src={question.imageUrl} 
                                alt="Вопрос" 
                                className="w-full max-h-48 object-contain rounded-lg mb-3"
                              />
                            )}
                            
                            <div className="text-sm space-y-2">
                              {question.type === 'single' && (
                                <>
                                  <div>
                                    <span className="font-medium">Ответ: </span>
                                    <span className={questionResult?.isCorrect ? 'text-green-700' : 'text-red-700'}>
                                      {question.options?.[userAnswer as number]}
                                    </span>
                                  </div>
                                  {!questionResult?.isCorrect && question.correctAnswer !== undefined && (
                                    <div>
                                      <span className="font-medium">Правильный: </span>
                                      <span className="text-green-700">
                                        {question.options?.[question.correctAnswer as number]}
                                      </span>
                                    </div>
                                  )}
                                </>
                              )}
                              
                              {question.type === 'multiple' && (
                                <>
                                  <div>
                                    <span className="font-medium">Ответы: </span>
                                    <span className={questionResult?.isCorrect ? 'text-green-700' : 'text-red-700'}>
                                      {Array.isArray(userAnswer) 
                                        ? userAnswer.map((idx: number) => question.options?.[idx]).join(', ')
                                        : 'Не отвечено'
                                      }
                                    </span>
                                  </div>
                                  {!questionResult?.isCorrect && Array.isArray(question.correctAnswer) && (
                                    <div>
                                      <span className="font-medium">Правильные: </span>
                                      <span className="text-green-700">
                                        {question.correctAnswer.map((idx: number) => question.options?.[idx]).join(', ')}
                                      </span>
                                    </div>
                                  )}
                                </>
                              )}
                              
                              {question.type === 'text' && (
                                <>
                                  <div>
                                    <span className="font-medium">Ответ: </span>
                                    <span className={questionResult?.isCorrect ? 'text-green-700' : 'text-red-700'}>
                                      {userAnswer as string || 'Не отвечено'}
                                    </span>
                                  </div>
                                  {!questionResult?.isCorrect && question.correctAnswer && (
                                    <div>
                                      <span className="font-medium">Правильный: </span>
                                      <span className="text-green-700">{question.correctAnswer as string}</span>
                                    </div>
                                  )}
                                </>
                              )}
                              
                              {question.type === 'matching' && (
                                <>
                                  <div>
                                    <span className="font-medium">Порядок: </span>
                                    <div className={`mt-1 ${questionResult?.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                      {Array.isArray(userAnswer) 
                                        ? userAnswer.map((item: any, i: number) => (
                                            <div key={i}>
                                              {question.matchingPairs?.[i]?.left} → {item}
                                            </div>
                                          ))
                                        : 'Не отвечено'
                                      }
                                    </div>
                                  </div>
                                  {!questionResult?.isCorrect && question.matchingPairs && (
                                    <div>
                                      <span className="font-medium">Правильный: </span>
                                      <div className="text-green-700 mt-1">
                                        {question.matchingPairs.map((pair: any, i: number) => (
                                          <div key={i}>
                                            {pair.left} → {pair.right}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                            
                            <div className="mt-2 text-sm font-medium">
                              Баллы: {questionResult?.points || 0} / {question.points}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowTestResultsDialog(false);
              setSelectedTest(null);
              setSelectedTestResult(null);
            }}>
              Закрыть
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}