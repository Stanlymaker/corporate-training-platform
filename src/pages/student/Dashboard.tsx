import StudentLayout from '@/components/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { mockCourses, mockProgress, mockRewards } from '@/data/mockData';
import { getCategoryIcon, getCategoryGradient } from '@/utils/categoryIcons';
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Привет, Иван! 👋</h1>
        <p className="text-gray-600">Продолжайте обучение и развивайте новые навыки</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <Card className="border-0 shadow-md bg-gradient-to-br from-orange-500 to-amber-500 text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <Icon name="Trophy" size={32} />
                <div className="text-4xl font-bold">{completedCount}</div>
              </div>
              <div className="text-sm opacity-90">Курсов завершено</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <Icon name="BookOpen" size={32} />
                <div className="text-4xl font-bold">{inProgressCount}</div>
              </div>
              <div className="text-sm opacity-90">Курсов в процессе</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-green-500 to-emerald-500 text-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <Icon name="Award" size={32} />
                <div className="text-4xl font-bold">{earnedRewards.length}</div>
              </div>
              <div className="text-sm opacity-90">Наград получено</div>
            </CardContent>
          </Card>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
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
                      <div key={course.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => navigate(`/student/courses/${course.id}`)}>
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${getCategoryGradient(course.category)} flex items-center justify-center shadow-md flex-shrink-0`}>
                            <Icon name={getCategoryIcon(course.category) as any} size={32} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base text-gray-900 mb-1">{course.title}</h4>
                            <p className="text-xs text-gray-600 mb-2">{course.category} • {course.duration} мин</p>
                            <div className="flex items-center gap-3">
                              <Progress value={progressPercent} className="flex-1" />
                              <span className="text-xs font-medium text-gray-700">{Math.round(progressPercent)}%</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {mockCourses.slice(2, 4).map((course) => (
                    <div key={course.id} className="group p-3 bg-muted rounded-lg hover:shadow-md transition-all cursor-pointer" onClick={() => navigate(`/student/courses/${course.id}`)}>
                      <div className="relative w-full h-28 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-2 overflow-hidden">
                        <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryGradient(course.category)} opacity-10`} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getCategoryGradient(course.category)} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                            <Icon name={getCategoryIcon(course.category) as any} size={32} className="text-white" />
                          </div>
                        </div>
                      </div>
                      <h4 className="font-semibold text-sm text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">{course.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                        <span className="flex items-center gap-1">
                          <Icon name="BookOpen" size={12} />
                          {course.lessonsCount} ур.
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="Clock" size={12} />
                          {course.duration} мин
                        </span>
                      </div>
                      <Button className="w-full" variant="outline" size="sm">
                        Начать
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

        <div className="space-y-5">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Award" size={20} />
                  Мои награды
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {mockRewards.map((reward) => {
                    const earned = earnedRewards.includes(reward.id);
                    return (
                      <div
                        key={reward.id}
                        className={`p-3 rounded-lg text-center transition-all ${
                          earned
                            ? 'bg-primary/10 border-2 border-primary/20'
                            : 'bg-gray-100 opacity-50'
                        }`}
                      >
                        <div className="text-3xl mb-1">{reward.icon}</div>
                        <div className="text-xs font-medium text-gray-700">{reward.name}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              <CardContent className="p-5">
                <Icon name="Target" size={28} className="mb-3" />
                <h3 className="font-bold text-base mb-2">Цель недели</h3>
                <p className="text-xs opacity-90 mb-3">Завершите еще 2 курса, чтобы получить специальную награду!</p>
                <Progress value={33} className="bg-white/20" />
                <p className="text-xs mt-2 opacity-75">1 из 3 курсов завершено</p>
              </CardContent>
            </Card>
        </div>
      </div>
    </StudentLayout>
  );
}