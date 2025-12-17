import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface Test {
  id: string;
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

interface Course {
  id: string;
  title: string;
}

export default function Tests() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [tests, setTests] = useState<Test[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const coursesRes = await fetch(API_ENDPOINTS.COURSES, { headers: getAuthHeaders() });
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData.courses || []);
        
        const allTests: Test[] = [];
        for (const course of (coursesData.courses || [])) {
          const testsRes = await fetch(`${API_ENDPOINTS.TESTS}?courseId=${course.id}`, { headers: getAuthHeaders() });
          if (testsRes.ok) {
            const testsData = await testsRes.json();
            allTests.push(...(testsData.tests || []));
          }
        }
        setTests(allTests);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTests = tests.filter(test => {
    if (filter === 'published') return test.status === 'published';
    if (filter === 'draft') return test.status === 'draft';
    return true;
  });

  const getCourseTitle = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course?.title || 'Неизвестный курс';
  };

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
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Icon name="BookOpen" size={14} />
                      <span>{getCourseTitle(test.courseId)}</span>
                    </div>
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
                    onClick={() => navigate(`/admin/tests/edit/${test.id}`)}
                  >
                    <Icon name="Edit" className="mr-2" size={16} />
                    Редактировать
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate(`/admin/tests/view/${test.id}`)}
                  >
                    <Icon name="Eye" className="mr-2" size={16} />
                    Просмотр
                  </Button>
                  <Button variant="outline" size="icon">
                    <Icon name="MoreVertical" size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        </>
        )}
      </div>
    </AdminLayout>
  );
}