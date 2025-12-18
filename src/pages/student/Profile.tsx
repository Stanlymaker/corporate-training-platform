import StudentLayout from '@/components/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { getCategoryIcon, getCategoryGradient } from '@/utils/categoryIcons';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useState, useEffect } from 'react';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';
import { Course, CourseProgress } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentProfile() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userProgress, setUserProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  
  const userId = currentUser?.id || '';
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      const [coursesRes, progressRes] = await Promise.all([
        fetch(API_ENDPOINTS.COURSES, { headers: getAuthHeaders() }),
        fetch(`${API_ENDPOINTS.PROGRESS}?userId=${userId}`, { headers: getAuthHeaders() })
      ]);
      
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData.courses || []);
      }
      
      if (progressRes.ok) {
        const progressData = await progressRes.json();
        setUserProgress(progressData.progress || []);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const completedCount = userProgress.filter(p => p.completed).length;
  const inProgressCount = userProgress.filter(p => !p.completed && p.completedLessons > 0).length;
  
  const rewards = [
    { id: '1', name: 'Первый шаг', icon: '🎯', description: 'Завершите свой первый курс', condition: 'Завершить 1 курс', count: 1 },
    { id: '2', name: 'Опытный', icon: '⭐', description: 'Завершите 5 курсов', condition: 'Завершить 5 курсов', count: 5 },
    { id: '3', name: 'Мастер', icon: '🏆', description: 'Завершите 10 курсов', condition: 'Завершить 10 курсов', count: 10 },
    { id: '4', name: 'Отличник', icon: '💯', description: 'Сдайте тест на 100%', condition: 'Получить 100% на тесте', count: 0 },
    { id: '5', name: 'Стажер', icon: '📚', description: 'Начните изучение 3 курсов', condition: 'Начать 3 курса', count: 3 },
    { id: '6', name: 'Профессионал', icon: '🎓', description: 'Завершите все доступные курсы', condition: 'Завершить все курсы', count: courses.length },
  ];
  
  const earnedRewards = rewards.filter(r => {
    if (r.id === '4') return userProgress.some(p => p.testScore === 100);
    if (r.id === '5') return userProgress.length >= 3;
    if (r.id === '6') return completedCount === courses.length && courses.length > 0;
    return completedCount >= r.count;
  }).map(r => r.id);
  
  const selectedRewardData = selectedReward ? rewards.find(r => r.id === selectedReward) : null;

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <Icon name="Loader2" className="animate-spin" size={32} />
        </div>
      </StudentLayout>
    );
  }
  
  return (
    <StudentLayout>
      <Card className="mb-6 border-0 shadow-md bg-gradient-to-br from-white to-gray-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {currentUser?.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{currentUser?.name}</h1>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Icon name="Mail" size={16} className="text-gray-400" />
                  <span>{currentUser?.email}</span>
                </div>
                
                {currentUser?.position && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Icon name="Briefcase" size={16} className="text-gray-400" />
                    <span>{currentUser.position}</span>
                  </div>
                )}
                
                {currentUser?.department && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Icon name="Building" size={16} className="text-gray-400" />
                    <span>{currentUser.department}</span>
                  </div>
                )}
                
                {currentUser?.phone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Icon name="Phone" size={16} className="text-gray-400" />
                    <span>{currentUser.phone}</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pt-3 border-t border-gray-200">
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
                  {userProgress.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Icon name="BookOpen" size={48} className="mx-auto mb-3 opacity-30" />
                      <p>Вы еще не начали ни одного курса</p>
                      <Button 
                        onClick={() => navigate(ROUTES.STUDENT.COURSES)} 
                        className="mt-4"
                        variant="outline"
                      >
                        Перейти к курсам
                      </Button>
                    </div>
                  ) : (
                    userProgress.map((progress) => {
                      const course = courses.find(c => c.id === progress.courseId);
                      if (!course) return null;
                      
                      const progressPercent = (progress.completedLessons / progress.totalLessons) * 100;

                      return (
                        <div key={course.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => navigate(`/student/courses/${course.displayId}`)}>
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
                          {progress.completed && (
                            <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                              <Icon name="CheckCircle" size={16} />
                              Завершено {progress.testScore ? `• Результат теста: ${progress.testScore}%` : ''}
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
                    {earnedRewards.length} из {rewards.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {rewards.map((reward) => {
                    const earned = earnedRewards.includes(reward.id);
                    return (
                      <div
                        key={reward.id}
                        onClick={() => setSelectedReward(reward.id)}
                        className={`p-3 rounded-lg text-center transition-all cursor-pointer ${
                          earned
                            ? 'bg-primary/10 border-2 border-primary/20 hover:bg-primary/20'
                            : 'bg-gray-100 opacity-50 hover:opacity-70'
                        }`}
                      >
                        <div className="text-3xl mb-1">{reward.icon}</div>
                        <div className="text-xs font-medium text-gray-700">{reward.name}</div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 text-center mt-3">
                  Нажмите на награду, чтобы узнать подробности
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
          </div>
        </DialogContent>
      </Dialog>

    </StudentLayout>
  );
}