import StudentLayout from '@/components/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { mockCourses, mockProgress, mockRewards, mockUsers } from '@/data/mockData';
import { getCategoryIcon, getCategoryGradient } from '@/utils/categoryIcons';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function StudentProfile() {
  const navigate = useNavigate();
  const userId = '2';
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  
  const currentUser = mockUsers.find(u => u.id === userId);
  const userProgress = mockProgress.filter(p => p.userId === userId);
  const completedCount = userProgress.filter(p => p.completed).length;
  const inProgressCount = userProgress.filter(p => !p.completed && p.completedLessons > 0).length;
  const earnedRewards = userProgress.flatMap(p => p.earnedRewards);
  
  const selectedRewardData = selectedReward ? mockRewards.find(r => r.id === selectedReward) : null;

  return (
    <StudentLayout>
      <Card className="mb-6 border-0 shadow-md bg-gradient-to-br from-white to-gray-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {currentUser?.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-gray-900">{currentUser?.name}</h1>
              </div>
              <p className="text-gray-600 mb-3">{currentUser?.email}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Icon name="Calendar" size={14} />
                  Регистрация: {new Date(currentUser?.registrationDate || '').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="Activity" size={14} />
                  Активность: {new Date(currentUser?.lastActive || '').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
          </div>

        <div className="space-y-5">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="Award" size={20} />
                    Мои награды
                  </div>
                  <span className="text-sm font-normal text-gray-500">
                    {earnedRewards.length} из {mockRewards.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {mockRewards.map((reward) => {
                    const earned = earnedRewards.includes(reward.id);
                    return (
                      <div
                        key={reward.id}
                        onClick={() => earned && setSelectedReward(reward.id)}
                        className={`p-3 rounded-lg text-center transition-all ${
                          earned
                            ? 'bg-primary/10 border-2 border-primary/20 cursor-pointer hover:bg-primary/20'
                            : 'bg-gray-100 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="text-3xl mb-1">{reward.icon}</div>
                        <div className="text-xs font-medium text-gray-700">{reward.name}</div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 text-center mt-3">
                  Нажмите на полученную награду, чтобы узнать подробности
                </p>
              </CardContent>
            </Card>
        </div>
      </div>

      <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-5xl">{selectedRewardData?.icon}</span>
              <span>{selectedRewardData?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">{selectedRewardData?.description}</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">Как получить эту награду:</p>
              <p className="text-sm text-blue-700">{selectedRewardData?.condition}</p>
            </div>
            {selectedRewardData?.bonuses && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-medium text-green-900 mb-2">Бонусы награды:</p>
                <ul className="text-sm text-green-700 space-y-1">
                  {selectedRewardData.bonuses.map((bonus, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Icon name="Check" size={16} className="mt-0.5" />
                      <span>{bonus}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </StudentLayout>
  );
}
