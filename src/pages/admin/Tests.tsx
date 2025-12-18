import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  id: string;
  displayId: number;
  title: string;
  description: string;
  courseId: string;
  lessonId?: string;
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
  const [loading, setLoading] = useState(true);
  const [deletingTest, setDeletingTest] = useState<Test | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const testsRes = await fetch(API_ENDPOINTS.TESTS, { headers: getAuthHeaders() });
      if (testsRes.ok) {
        const testsData = await testsRes.json();
        setTests(testsData.tests || []);
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Управление тестами</h1>
            <p className="text-gray-600">Создавайте и редактируйте тесты для проверки знаний студентов</p>
          </div>
          <Button 
            onClick={() => navigate('/admin/tests/edit')}
          >
            <Icon name="Plus" className="mr-2" size={18} />
            Создать тест
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Icon name="FileQuestion" className="text-blue-600" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{tests.length}</div>
                  <div className="text-sm text-gray-600">Всего тестов</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Icon name="CheckCircle" className="text-green-600" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {tests.filter(t => t.status === 'published').length}
                  </div>
                  <div className="text-sm text-gray-600">Опубликовано</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Icon name="FileEdit" className="text-yellow-600" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {tests.filter(t => t.status === 'draft').length}
                  </div>
                  <div className="text-sm text-gray-600">Черновики</div>
                </div>
              </div>
            </CardContent>
          </Card>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTests.map((test) => (
            <Card key={test.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg text-gray-900">{test.title}</h3>
                      <Badge variant={test.status === 'published' ? 'default' : 'secondary'}>
                        {test.status === 'published' ? 'Опубликован' : 'Черновик'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{test.questionsCount || 0}</div>
                    <div className="text-xs text-gray-600">Вопросов</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{test.timeLimit}</div>
                    <div className="text-xs text-gray-600">Минут</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{test.passScore}%</div>
                    <div className="text-xs text-gray-600">Проходной</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{test.attempts}</div>
                    <div className="text-xs text-gray-600">Попытки</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>Создан: {new Date(test.createdAt).toLocaleDateString('ru-RU')}</span>
                  <span>Обновлён: {new Date(test.updatedAt).toLocaleDateString('ru-RU')}</span>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate(`/admin/tests/edit/${test.displayId}`)}
                  >
                    <Icon name="Edit" className="mr-2" size={16} />
                    Редактировать
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate(`/admin/tests/view/${test.displayId}`)}
                  >
                    <Icon name="Eye" className="mr-2" size={16} />
                    Просмотр
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" disabled={actionLoading}>
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
              </CardContent>
            </Card>
          ))}
        </div>
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