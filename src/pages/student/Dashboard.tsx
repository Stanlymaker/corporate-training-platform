import StudentLayout from '@/components/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { mockCourses, mockProgress, mockRewards } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const userId = '2';
  
  const userProgress = mockProgress.filter(p => p.userId === userId);
  const completedCount = userProgress.filter(p => p.completed).length;
  const inProgressCount = userProgress.filter(p => !p.completed && p.completedLessons > 0).length;
  const earnedRewards = userProgress.flatMap(p => p.earnedRewards);

  return (
    <StudentLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Привет, Иван! 👋</h1>
          <p className="text-gray-600">Продолжайте обучение и развивайте новые навыки</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-md bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon name="Trophy" size={32} />
                <div className="text-4xl font-bold">{completedCount}</div>
              </div>
              <div className="text-sm opacity-90">Курсов завершено</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon name="BookOpen" size={32} />
                <div className="text-4xl font-bold">{inProgressCount}</div>
              </div>
              <div className="text-sm opacity-90">Курсов в процессе</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon name="Award" size={32} />
                <div className="text-4xl font-bold">{earnedRewards.length}</div>
              </div>
              <div className="text-sm opacity-90">Наград получено</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="BookOpen" size={20} />
                  Мои курсы
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userProgress.map((progress) => {
                    const course = mockCourses.find(c => c.id === progress.courseId);
                    if (!course) return null;
                    
                    const progressPercent = (progress.completedLessons / progress.totalLessons) * 100;

                    return (
                      <div key={course.id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-start gap-4 mb-3">
                          <img src={course.image} alt={course.title} className="w-20 h-20 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 mb-1">{course.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{course.category} • {course.duration} мин</p>
                            <div className="flex items-center gap-4">
                              <Progress value={progressPercent} className="flex-1" />
                              <span className="text-sm font-medium text-gray-700">{Math.round(progressPercent)}%</span>
                            </div>
                          </div>
                        </div>
                        {progress.completed && progress.testScore && (
                          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                            <Icon name="CheckCircle" size={16} />
                            Завершено • Результат теста: {progress.testScore}%
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Sparkles" size={20} />
                  Рекомендуемые курсы
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockCourses.slice(2, 4).map((course) => (
                    <div key={course.id} className="group p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl hover:shadow-lg transition-all cursor-pointer">
                      <img src={course.image} alt={course.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                      <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">{course.title}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Icon name="BookOpen" size={14} />
                          {course.lessonsCount} уроков
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="Clock" size={14} />
                          {course.duration} мин
                        </span>
                      </div>
                      <Button className="w-full mt-3" variant="outline" size="sm">
                        Начать курс
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Award" size={20} />
                  Мои награды
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {mockRewards.map((reward) => {
                    const earned = earnedRewards.includes(reward.id);
                    return (
                      <div
                        key={reward.id}
                        className={`p-4 rounded-xl text-center transition-all ${
                          earned
                            ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 hover-scale'
                            : 'bg-gray-100 opacity-50'
                        }`}
                      >
                        <div className="text-4xl mb-2">{reward.icon}</div>
                        <div className="text-xs font-medium text-gray-700">{reward.name}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-orange-600 to-amber-600 text-white">
              <CardContent className="p-6">
                <Icon name="Target" size={32} className="mb-4" />
                <h3 className="font-bold text-lg mb-2">Цель недели</h3>
                <p className="text-sm opacity-90 mb-4">Завершите еще 2 курса, чтобы получить специальную награду!</p>
                <Progress value={33} className="bg-white/20" />
                <p className="text-xs mt-2 opacity-75">1 из 3 курсов завершено</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}