import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

export default function TestView() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<any>(null);
  const [testQuestions, setTestQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadTestData();
  }, [testId]);
  
  const loadTestData = async () => {
    setLoading(true);
    try {
      const testRes = await fetch(`${API_ENDPOINTS.TESTS}?id=${testId}`, { headers: getAuthHeaders() });
      
      if (!testRes.ok) {
        throw new Error('Failed to load test');
      }
      
      const testData = await testRes.json();
      setTest(testData.test);
      
      const loadedTestId = testData.test.id;
      const questionsRes = await fetch(`${API_ENDPOINTS.TESTS}?testId=${loadedTestId}&action=questions`, { 
        headers: getAuthHeaders() 
      });
      
      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        setTestQuestions(questionsData.questions || []);
      }
    } catch (error) {
      console.error('Error loading test:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Icon name="Loader2" className="animate-spin" size={32} />
        </div>
      </AdminLayout>
    );
  }
  
  if (!test) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <Icon name="AlertCircle" size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Тест не найден</h2>
          <Button onClick={() => navigate(ROUTES.ADMIN.TESTS)} className="mt-4">
            Вернуться к тестам
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const getStatusColor = (status: string) => {
    return status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'single': return 'Один вариант';
      case 'multiple': return 'Несколько вариантов';
      case 'text': return 'Текстовый ответ';
      case 'matching': return 'Сопоставление';
      default: return type;
    }
  };

  const totalPoints = testQuestions.reduce((sum, q) => sum + q.points, 0);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(ROUTES.ADMIN.TESTS)}
          >
            <Icon name="ArrowLeft" className="mr-2" size={16} />
            Назад к тестам
          </Button>
          <Button
            onClick={() => navigate(`/admin/tests/edit/${test.id}`)}
          >
            <Icon name="Edit" className="mr-2" size={16} />
            Редактировать
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className={getStatusColor(test.status)}>
                    {test.status === 'published' ? 'Опубликован' : 'Черновик'}
                  </Badge>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{test.title}</h1>
                <p className="text-gray-600 mb-6">{test.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">{testQuestions.length}</div>
                    <div className="text-sm text-gray-600">Вопросов</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">{test.timeLimit}</div>
                    <div className="text-sm text-gray-600">Минут</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">{test.passScore}%</div>
                    <div className="text-sm text-gray-600">Проходной</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">{test.attempts}</div>
                    <div className="text-sm text-gray-600">Попытки</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="HelpCircle" size={20} />
                  Вопросы теста
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testQuestions.map((question, index) => (
                    <div
                      key={question.id}
                      className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary font-semibold">
                          {index + 1}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h4 className="font-semibold text-gray-900">{question.text}</h4>
                            <Badge variant="outline" className="flex-shrink-0">
                              {getQuestionTypeLabel(question.type)}
                            </Badge>
                          </div>

                          {question.options && question.options.length > 0 && (
                            <div className="space-y-2 mt-3">
                              {question.options.map((option, optIndex) => {
                                const isCorrect = Array.isArray(question.correctAnswer)
                                  ? question.correctAnswer.includes(optIndex)
                                  : question.correctAnswer === optIndex;
                                
                                return (
                                  <div
                                    key={optIndex}
                                    className={`flex items-center gap-2 p-2 rounded-lg ${
                                      isCorrect ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-200'
                                    }`}
                                  >
                                    {isCorrect && (
                                      <Icon name="Check" size={16} className="text-green-600" />
                                    )}
                                    <span className={`text-sm ${isCorrect ? 'text-green-900 font-medium' : 'text-gray-700'}`}>
                                      {option}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {question.type === 'text' && question.correctAnswer && (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <Icon name="Check" size={16} className="text-green-600 mt-0.5" />
                                <div>
                                  <p className="text-xs text-green-700 font-medium mb-1">Правильный ответ:</p>
                                  <p className="text-sm text-green-900 font-medium">{question.correctAnswer}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {question.type === 'matching' && question.matchingPairs && question.matchingPairs.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs text-gray-600 font-medium mb-2">Правильные пары:</p>
                              {question.matchingPairs.map((pair: any, pairIndex: number) => (
                                <div key={pairIndex} className="flex items-center gap-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                                  <span className="text-sm text-green-900 font-medium">{pair.left}</span>
                                  <Icon name="ArrowRight" size={16} className="text-green-600" />
                                  <span className="text-sm text-green-900 font-medium">{pair.right}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                            <span>Баллов: {question.points}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Info" size={20} />
                  Детали теста
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Всего вопросов:</span>
                  <span className="font-semibold">{testQuestions.length}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Макс. баллов:</span>
                  <span className="font-semibold">{totalPoints}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Проходной балл:</span>
                  <span className="font-semibold">{test.passScore}%</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Время на тест:</span>
                  <span className="font-semibold">{test.timeLimit} мин</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Кол-во попыток:</span>
                  <span className="font-semibold">{test.attempts}</span>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Создан:</span>
                    <span className="font-semibold">
                      {new Date(test.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Обновлён:</span>
                    <span className="font-semibold">
                      {new Date(test.updatedAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="PieChart" size={20} />
                  Типы вопросов
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icon name="Circle" size={14} className="text-gray-500" />
                    <span className="text-gray-600">Один вариант</span>
                  </div>
                  <span className="font-semibold">
                    {testQuestions.filter(q => q.type === 'single').length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icon name="CheckSquare" size={14} className="text-gray-500" />
                    <span className="text-gray-600">Множественный</span>
                  </div>
                  <span className="font-semibold">
                    {testQuestions.filter(q => q.type === 'multiple').length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icon name="Type" size={14} className="text-gray-500" />
                    <span className="text-gray-600">Текстовый</span>
                  </div>
                  <span className="font-semibold">
                    {testQuestions.filter(q => q.type === 'text').length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    </AdminLayout>
  );
}