import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface Test {
  id: number;
  title: string;
  description: string;
  courseId: number;
  lessonId?: number;
  status: 'draft' | 'published';
  passScore: number;
  timeLimit: number;
  attempts: number;
  questionsCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function Tests() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState<number | 'all' | 'unused'>('all');
  const [questionCountFilter, setQuestionCountFilter] = useState<'all' | '0' | '1-5' | '6-10' | '10+'>('all');
  const [tests, setTests] = useState<Test[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingTest, setDeletingTest] = useState<Test | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [testsRes, coursesRes] = await Promise.all([
        fetch(API_ENDPOINTS.TESTS, { headers: getAuthHeaders() }),
        fetch(API_ENDPOINTS.COURSES, { headers: getAuthHeaders() })
      ]);
      
      if (testsRes.ok) {
        const testsData = await testsRes.json();
        setTests(testsData.tests || []);
      }
      
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        const courseSummaries = coursesData.courses || [];
        
        // Load full course details with lessons for each course
        const fullCoursesPromises = courseSummaries.map(async (summary: any) => {
          try {
            const detailRes = await fetch(`${API_ENDPOINTS.COURSES}?id=${summary.id}`, { 
              headers: getAuthHeaders() 
            });
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              const course = detailData.course;
              
              // Load lessons for this course
              const lessonsRes = await fetch(`${API_ENDPOINTS.LESSONS}?courseId=${course.id}`, {
                headers: getAuthHeaders()
              });
              if (lessonsRes.ok) {
                const lessonsData = await lessonsRes.json();
                course.lessons = lessonsData.lessons || [];
                console.log(`[Tests] Course ${course.id} (${course.title}) has ${course.lessons.length} lessons`);
              } else {
                course.lessons = [];
              }
              
              return course;
            }
          } catch (err) {
            console.error(`Error loading course ${summary.id}:`, err);
          }
          return { ...summary, lessons: [] };
        });
        
        const fullCourses = await Promise.all(fullCoursesPromises);
        setCourses(fullCourses);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async () => {
    if (!deletingTest) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.TESTS}?id=${deletingTest.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setDeletingTest(null);
        await loadData();
      } else {
        throw new Error('Failed to delete test');
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('Ошибка при удалении теста');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyTest = async (test: Test) => {
    setActionLoading(true);
    try {
      const [testRes, questionsRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.TESTS}?id=${test.id}`, { headers: getAuthHeaders() }),
        fetch(`${API_ENDPOINTS.TESTS}?testId=${test.id}&action=questions`, { headers: getAuthHeaders() }),
      ]);

      if (testRes.ok && questionsRes.ok) {
        const testData = await testRes.json();
        const questionsData = await questionsRes.json();

        const newTestPayload = {
          title: `${testData.test.title} (копия)`,
          description: testData.test.description,
          passScore: testData.test.passScore,
          timeLimit: testData.test.timeLimit,
          attempts: testData.test.attempts,
          status: 'draft',
        };

        const createRes = await fetch(API_ENDPOINTS.TESTS, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(newTestPayload),
        });

        if (createRes.ok) {
          const newTestData = await createRes.json();
          const newTestId = newTestData.test.id;

          for (let i = 0; i < questionsData.questions.length; i++) {
            const question = questionsData.questions[i];
            const questionPayload = {
              testId: newTestId,
              type: question.type,
              text: question.text,
              options: question.options,
              correctAnswer: question.correctAnswer,
              points: question.points,
              order: i,
              matchingPairs: question.matchingPairs,
              textCheckType: question.textCheckType,
            };

            await fetch(`${API_ENDPOINTS.TESTS}?action=question`, {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify(questionPayload),
            });
          }

          await loadData();
          navigate(`/admin/tests/edit/${newTestId}`);
        }
      }
    } catch (error) {
      console.error('Error copying test:', error);
      alert('Ошибка при копировании теста');
    } finally {
      setActionLoading(false);
    }
  };

  const getTestCourses = (testId: number) => {
    return courses.filter(course => 
      course.lessons?.some((lesson: any) => lesson.testId === testId)
    );
  };

  const filteredTests = tests.filter(test => {
    // Status filter
    if (filter === 'published' && test.status !== 'published') return false;
    if (filter === 'draft' && test.status !== 'draft') return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = test.title.toLowerCase().includes(query);
      const matchesDescription = test.description?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesDescription) return false;
    }

    // Course filter
    if (courseFilter !== 'all') {
      const testCourses = getTestCourses(test.id);
      if (courseFilter === 'unused' && testCourses.length > 0) return false;
      if (typeof courseFilter === 'number' && !testCourses.some(c => c.id === courseFilter)) return false;
    }

    // Question count filter
    if (questionCountFilter !== 'all') {
      const count = test.questionsCount;
      if (questionCountFilter === '0' && count !== 0) return false;
      if (questionCountFilter === '1-5' && (count < 1 || count > 5)) return false;
      if (questionCountFilter === '6-10' && (count < 6 || count > 10)) return false;
      if (questionCountFilter === '10+' && count <= 10) return false;
    }

    return true;
  });

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Загрузка тестов...</p>
            </div>
          </div>
        ) : (
          <>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Управление тестами</h1>
          </div>
          <Button 
            onClick={() => navigate('/admin/tests/edit')}
          >
            <Icon name="Plus" className="mr-2" size={18} />
            Создать тест
          </Button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Поиск по названию или описанию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Все ({tests.length})</option>
              <option value="published">Опубликованные ({tests.filter(t => t.status === 'published').length})</option>
              <option value="draft">Черновики ({tests.filter(t => t.status === 'draft').length})</option>
            </select>

            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value === 'all' ? 'all' : e.target.value === 'unused' ? 'unused' : parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Все курсы</option>
              <option value="unused">Не используется</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>

            <select
              value={questionCountFilter}
              onChange={(e) => setQuestionCountFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Любое кол-во вопросов</option>
              <option value="0">Без вопросов</option>
              <option value="1-5">1-5 вопросов</option>
              <option value="6-10">6-10 вопросов</option>
              <option value="10+">Более 10 вопросов</option>
            </select>

            {(searchQuery || courseFilter !== 'all' || questionCountFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setCourseFilter('all');
                  setQuestionCountFilter('all');
                }}
              >
                <Icon name="X" size={16} className="mr-1" />
                Сбросить фильтры
              </Button>
            )}
          </div>
        </div>

        <Card className="border-0 shadow-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Используется в курсах</TableHead>
                <TableHead className="text-center">Вопросов</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTests.map((test) => {
                const usedInCourses = courses.filter(course => {
                  const hasTest = course.lessons?.some((lesson: any) => {
                    const matches = Number(lesson.testId) === Number(test.id);
                    if (matches) {
                      console.log(`[Tests] Test ${test.id} found in course ${course.id} (${course.title}), lesson testId:`, lesson.testId);
                    }
                    return matches;
                  });
                  return hasTest;
                });
                
                return (
                  <TableRow 
                    key={test.id} 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`/admin/tests/view/${test.id}`)}
                  >
                    <TableCell>
                      <div className="font-medium text-gray-900">{test.title}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={test.status === 'published' ? 'default' : 'secondary'}>
                        {test.status === 'published' ? 'Опубликован' : 'Черновик'}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {usedInCourses.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {usedInCourses.map(course => (
                            <Badge 
                              key={course.id} 
                              className="text-xs cursor-pointer bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all font-medium"
                              onClick={() => navigate(`/admin/courses/edit/${course.id}`)}
                            >
                              {course.title}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Не используется</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {test.questionsCount || 0}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/admin/tests/edit/${test.id}`)}
                        >
                          <Icon name="Edit" className="mr-2" size={16} />
                          Редактировать
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" disabled={actionLoading}>
                              <Icon name="MoreVertical" size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleCopyTest(test)}>
                              <Icon name="Copy" className="mr-2" size={16} />
                              Копировать
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeletingTest(test)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Icon name="Trash2" className="mr-2" size={16} />
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
        </>
        )}
      </div>

      <Dialog open={!!deletingTest} onOpenChange={(open) => !open && setDeletingTest(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Icon name="AlertTriangle" className="text-red-600" size={24} />
              </div>
              <DialogTitle>Удалить тест?</DialogTitle>
            </div>
            <DialogDescription className="text-base">
              Вы действительно хотите удалить тест <span className="font-semibold text-gray-900">"{deletingTest?.title}"</span>?
              <br /><br />
              Это действие нельзя отменить. Тест и все его вопросы будут удалены безвозвратно.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setDeletingTest(null)} disabled={actionLoading} className="flex-1">
              Отмена
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteTest}
              disabled={actionLoading}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <Icon name="Trash2" className="mr-2" size={16} />
              {actionLoading ? 'Удаление...' : 'Удалить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}