import StudentLayout from '@/components/StudentLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { mockRewards, mockProgress, mockCourses } from '@/data/mockData';

export default function StudentRewards() {
  const userId = '2';
  const userProgress = mockProgress.filter(p => p.userId === userId);
  const earnedRewards = userProgress.flatMap(p => p.earnedRewards);

  return (
    <StudentLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Мои награды</h1>
          <p className="text-gray-600">Коллекция достижений за пройденные курсы</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-md bg-gradient-to-br from-orange-500 to-amber-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon name="Award" size={32} />
                <div className="text-4xl font-bold">{earnedRewards.length}</div>
              </div>
              <div className="text-sm opacity-90">Наград получено</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-green-500 to-emerald-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon name="Trophy" size={32} />
                <div className="text-4xl font-bold">{userProgress.filter(p => p.completed).length}</div>
              </div>
              <div className="text-sm opacity-90">Курсов завершено</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon name="Star" size={32} />
                <div className="text-4xl font-bold">{mockRewards.length - earnedRewards.length}</div>
              </div>
              <div className="text-sm opacity-90">Осталось получить</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Полученные награды</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockRewards.filter(reward => earnedRewards.includes(reward.id)).map((reward) => {
              const course = mockCourses.find(c => c.id === reward.courseId);
              const progress = userProgress.find(p => p.courseId === reward.courseId);
              
              return (
                <Card
                  key={reward.id}
                  className="border-0 shadow-md hover:shadow-xl transition-all hover-scale overflow-hidden"
                  style={{ borderTop: `4px solid ${reward.color}` }}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-6xl mb-4">{reward.icon}</div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{reward.name}</h3>
                    <Badge variant="outline" className="mb-3">{course?.title}</Badge>
                    {progress?.testScore && (
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                        <Icon name="Target" size={14} />
                        <span>Результат теста: {progress.testScore}%</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Доступные награды</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockRewards.filter(reward => !earnedRewards.includes(reward.id)).map((reward) => {
              const course = mockCourses.find(c => c.id === reward.courseId);
              
              return (
                <Card
                  key={reward.id}
                  className="border-0 shadow-md opacity-60 hover:opacity-80 transition-opacity"
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-6xl mb-4 grayscale">{reward.icon}</div>
                    <h3 className="font-bold text-lg text-gray-700 mb-2">{reward.name}</h3>
                    <Badge variant="secondary" className="mb-3">{course?.title}</Badge>
                    <p className="text-xs text-gray-500">Завершите курс, чтобы получить награду</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
