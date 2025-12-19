import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  const filteredTests = tests.filter(test => {
    if (filter === 'published') return test.status === 'published';
    if (filter === 'draft') return test.status === 'draft';
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

        <div className="flex gap-3 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            Все тесты ({tests.length})
          </Button>
          <Button
            variant={filter === 'published' ? 'default' : 'outline'}
            onClick={() => setFilter('published')}
          >
            Опубликованные ({tests.filter(t => t.status === 'published').length})
          </Button>
          <Button
            variant={filter === 'draft' ? 'default' : 'outline'}
            onClick={() => setFilter('draft')}
          >
            Черновики ({tests.filter(t => t.status === 'draft').length})
          </Button>
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