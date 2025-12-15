import StudentLayout from '@/components/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { mockCourses, mockProgress } from '@/data/mockData';

export default function StudentProgress() {
  const userId = '2';
  const userProgress = mockProgress.filter(p => p.userId === userId);
  
  const totalLessons = userProgress.reduce((sum, p) => sum + p.totalLessons, 0);
  const completedLessons = userProgress.reduce((sum, p) => sum + p.completedLessons, 0);
  const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const averageScore = userProgress
    .filter(p => p.testScore)
    .reduce((sum, p, _, arr) => sum + (p.testScore || 0) / arr.length, 0);

  return (
    <StudentLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Мой прогресс</h1>
          <p className="text-gray-600">Отслеживайте свои успехи в обучении</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Icon name="BookOpen" className="text-orange-600" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{userProgress.length}</div>
                  <div className="text-sm text-gray-600">Курсов начато</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Icon name="CheckCircle" className="text-green-600" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {userProgress.filter(p => p.completed).length}
                  </div>
                  <div className="text-sm text-gray-600">Завершено</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Icon name="Target" className="text-blue-600" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{Math.round(averageScore)}%</div>
                  <div className="text-sm text-gray-600">Средний балл</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Icon name="Clock" className="text-purple-600" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {mockCourses.filter(c => userProgress.some(p => p.courseId === c.id && p.completed)).reduce((sum, c) => sum + c.duration, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Минут обучения</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-md mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="TrendingUp" size={20} />
              Общий прогресс
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Завершено уроков</span>
                  <span className="text-sm font-bold text-gray-900">
                    {completedLessons} из {totalLessons}
                  </span>
                </div>
                <Progress value={overallProgress} className="h-3" />
                <p className="text-xs text-gray-500 mt-2">{Math.round(overallProgress)}% от всех уроков</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="BookOpen" size={20} />
              Детальный прогресс по курсам
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {userProgress.map((progress) => {
                const course = mockCourses.find(c => c.id === progress.courseId);
                if (!course) return null;

                const progressPercent = (progress.completedLessons / progress.totalLessons) * 100;

                return (
                  <div key={course.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={course.image}
                        alt={course.title}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1">{course.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{course.category}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Icon name="BookOpen" size={14} />
                            {progress.completedLessons}/{progress.totalLessons} уроков
                          </span>
                          {progress.testScore && (
                            <span className="flex items-center gap-1">
                              <Icon name="Target" size={14} />
                              Тест: {progress.testScore}%
                            </span>
                          )}
                        </div>
                      </div>
                      {progress.completed && (
                        <div className="flex items-center gap-2 text-green-600">
                          <Icon name="CheckCircle" size={20} />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Прогресс курса</span>
                        <span className="font-semibold text-gray-900">{Math.round(progressPercent)}%</span>
                      </div>
                      <Progress value={progressPercent} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
