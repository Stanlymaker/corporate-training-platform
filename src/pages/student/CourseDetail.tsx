import { useParams, useNavigate } from 'react-router-dom';
import StudentLayout from '@/components/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { mockCourses, mockLessons, mockProgress } from '@/data/mockData';
import { ROUTES } from '@/constants/routes';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const course = mockCourses.find(c => c.id === id);
  const userId = '2';
  
  if (!course) {
    return (
      <StudentLayout>
        <div className="text-center py-12">
          <Icon name="AlertCircle" size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Курс не найден</h2>
          <Button onClick={() => navigate(ROUTES.STUDENT.COURSES)} className="mt-4">
            Вернуться к курсам
          </Button>
        </div>
      </StudentLayout>
    );
  }

  const courseLessons = mockLessons.filter(l => l.courseId === course.id);
  const userProgress = mockProgress.find(p => p.courseId === course.id && p.userId === userId);
  const completedLessons = userProgress?.completedLessons || 0;
  const totalLessons = courseLessons.length;
  const progressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <StudentLayout>
      <div className="animate-fade-in">
        <Button
          variant="ghost"
          onClick={() => navigate(ROUTES.STUDENT.COURSES)}
          className="mb-6"
        >
          <Icon name="ArrowLeft" className="mr-2" size={16} />
          Назад к курсам
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-md overflow-hidden">
              <img
                src={course.image}
                alt={course.title}
                className="w-full h-64 object-cover"
              />
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary">{course.category}</Badge>
                  <Badge className="bg-gradient-to-r from-orange-500 to-amber-500">
                    {course.level}
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
                <p className="text-gray-600 mb-6">{course.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-1">{totalLessons}</div>
                    <div className="text-sm text-gray-600">Уроков</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-1">{course.duration}</div>
                    <div className="text-sm text-gray-600">Минут</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-1">{course.students}</div>
                    <div className="text-sm text-gray-600">Студентов</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-1">{course.rating}</div>
                    <div className="text-sm text-gray-600">Рейтинг</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="BookOpen" size={20} />
                  Программа курса
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {courseLessons.map((lesson, index) => {
                    const isCompleted = index < completedLessons;
                    const isCurrent = index === completedLessons;
                    
                    return (
                      <div
                        key={lesson.id}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isCompleted
                            ? 'bg-green-50 border-green-200'
                            : isCurrent
                            ? 'bg-orange-50 border-orange-300'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isCompleted
                                ? 'bg-green-500 text-white'
                                : isCurrent
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-300 text-gray-600'
                            }`}
                          >
                            {isCompleted ? (
                              <Icon name="Check" size={20} />
                            ) : (
                              <span className="font-semibold">{index + 1}</span>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <h4 className="font-semibold text-gray-900">{lesson.title}</h4>
                              <div className="flex items-center gap-2 text-sm text-gray-500 flex-shrink-0">
                                <Icon name="Clock" size={14} />
                                {lesson.duration} мин
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{lesson.description}</p>
                            
                            {lesson.videoUrl && (
                              <Button
                                size="sm"
                                variant={isCurrent ? "default" : "outline"}
                                className={
                                  isCurrent
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'
                                    : ''
                                }
                                disabled={!isCurrent && !isCompleted}
                              >
                                <Icon
                                  name={isCompleted ? 'RotateCcw' : 'Play'}
                                  className="mr-2"
                                  size={14}
                                />
                                {isCompleted ? 'Повторить урок' : isCurrent ? 'Начать урок' : 'Недоступно'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="TrendingUp" size={20} />
                  Ваш прогресс
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl">
                    <div className="text-5xl font-bold text-orange-600 mb-2">
                      {Math.round(progressPercent)}%
                    </div>
                    <div className="text-sm text-gray-600">Завершено</div>
                  </div>
                  
                  <Progress value={progressPercent} className="h-3" />
                  
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Завершено уроков:</span>
                      <span className="font-semibold text-gray-900">
                        {completedLessons} / {totalLessons}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Осталось уроков:</span>
                      <span className="font-semibold text-gray-900">
                        {totalLessons - completedLessons}
                      </span>
                    </div>
                    {userProgress?.testScore && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Результат теста:</span>
                        <span className="font-semibold text-green-600">
                          {userProgress.testScore}%
                        </span>
                      </div>
                    )}
                  </div>

                  {userProgress?.completed ? (
                    <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl text-center">
                      <Icon name="Trophy" size={32} className="mx-auto mb-2 text-green-600" />
                      <div className="font-semibold text-green-800 mb-1">
                        Курс пройден!
                      </div>
                      <div className="text-sm text-green-600">
                        Поздравляем с завершением
                      </div>
                    </div>
                  ) : completedLessons === totalLessons ? (
                    <Button
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                      size="lg"
                      onClick={() => navigate(ROUTES.STUDENT.TEST.replace(':id', course.id))}
                    >
                      <Icon name="FileCheck" className="mr-2" size={18} />
                      Пройти тест
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                      size="lg"
                    >
                      <Icon name="Play" className="mr-2" size={18} />
                      Продолжить обучение
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="User" size={20} />
                  Автор курса
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                    {course.instructor.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{course.instructor}</h4>
                  <p className="text-sm text-gray-600">Эксперт по {course.category}</p>
                </div>
              </CardContent>
            </Card>

            {userProgress?.earnedRewards && userProgress.earnedRewards.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Award" size={20} />
                    Полученные награды
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {userProgress.earnedRewards.slice(0, 3).map((rewardId) => (
                      <div
                        key={rewardId}
                        className="aspect-square bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg flex items-center justify-center text-3xl border-2 border-orange-200"
                      >
                        🏆
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}