import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useState, useEffect } from 'react';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface RecentActivity {
  type: 'course_completed' | 'reward_earned' | 'lesson_completed';
  studentName: string;
  itemName: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    totalStudents: 0,
    activeUsers: 0,
    totalLessons: 0,
    completedCourses: 0,
    totalRewards: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      const [usersRes, coursesRes, rewardsRes] = await Promise.all([
        fetch(API_ENDPOINTS.USERS, { headers: getAuthHeaders() }),
        fetch(API_ENDPOINTS.COURSES, { headers: getAuthHeaders() }),
        fetch(API_ENDPOINTS.REWARDS, { headers: getAuthHeaders() }),
      ]);

      if (usersRes.ok && coursesRes.ok) {
        const usersData = await usersRes.json();
        const coursesData = await coursesRes.json();
        const rewardsData = rewardsRes.ok ? await rewardsRes.json() : { rewards: [] };

        const users = usersData.users || [];
        const courses = coursesData.courses || [];
        const rewards = rewardsData.rewards || [];

        // Считаем уроки
        const lessonsRes = await fetch(API_ENDPOINTS.LESSONS, { headers: getAuthHeaders() });
        const lessonsData = lessonsRes.ok ? await lessonsRes.json() : { lessons: [] };
        const allLessons = lessonsData.lessons || [];

        // Загружаем прогресс студентов и создаем активности
        const activities: RecentActivity[] = [];
        const students = users.filter((u: any) => u.role === 'student');
        const completedCoursesCount = 0;
        
        for (const student of students.slice(0, 10)) {
          try {
            const progressRes = await fetch(`${API_ENDPOINTS.PROGRESS}?userId=${student.displayId}`, {
              headers: getAuthHeaders()
            });
            if (progressRes.ok) {
              const progressData = await progressRes.json();
              const progress = progressData.progress || [];

              // Завершенные курсы и награды
              for (const p of progress) {
                if (p.completedAt) {
                  completedCoursesCount++;
                  const course = courses.find((c: any) => c.displayId === p.courseId);
                  if (course) {
                    activities.push({
                      type: 'course_completed',
                      studentName: student.name,
                      itemName: course.title,
                      timestamp: p.completedAt
                    });
                  }
                }

                // Полученные награды
                if (p.earnedRewards && p.earnedRewards.length > 0) {
                  for (const rewardId of p.earnedRewards) {
                    const reward = rewards.find((r: any) => r.displayId === rewardId);
                    if (reward) {
                      activities.push({
                        type: 'reward_earned',
                        studentName: student.name,
                        itemName: reward.name,
                        timestamp: p.completedAt || new Date().toISOString()
                      });
                    }
                  }
                }
              }
            }
          } catch (err) {
            console.error('Error loading progress for student:', err);
          }
        }

        // Сортируем по дате и берем последние 5
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRecentActivities(activities.slice(0, 5));

        // Обновляем статистику
        setStats({
          totalCourses: courses.length,
          publishedCourses: courses.filter((c: any) => c.published).length,
          totalStudents: users.filter((u: any) => u.role === 'student').length,
          activeUsers: users.filter((u: any) => u.isActive).length,
          totalLessons: allLessons.length,
          completedCourses: completedCoursesCount,
          totalRewards: rewards.length,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Всего курсов',
      value: stats.totalCourses,
      icon: 'BookOpen',
      color: 'bg-orange-500',
      trend: `${stats.publishedCourses} опубликовано`,
    },
    {
      title: 'Обучающихся',
      value: stats.totalStudents,
      icon: 'Users',
      color: 'bg-amber-500',
      trend: `${stats.activeUsers} активных`,
    },
    {
      title: 'Активных пользователей',
      value: stats.activeUsers,
      icon: 'CheckCircle',
      color: 'bg-green-500',
      trend: 'Всего пользователей',
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Icon name="Loader2" className="animate-spin" size={32} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Панель управления</h1>
          <p className="text-gray-600">Добро пожаловать в систему управления обучением</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                    <Icon name={stat.icon as any} className="text-white" size={24} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600 mb-1">{stat.title}</div>
                <div className="text-xs text-gray-500">{stat.trend}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Activity" size={20} />
                Последняя активность
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Icon name="Inbox" size={48} className="mx-auto mb-2 opacity-20" />
                  <p>Пока нет активности студентов</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        activity.type === 'course_completed' ? 'bg-green-100' :
                        activity.type === 'reward_earned' ? 'bg-amber-100' :
                        'bg-blue-100'
                      }`}>
                        <Icon 
                          name={
                            activity.type === 'course_completed' ? 'GraduationCap' :
                            activity.type === 'reward_earned' ? 'Award' :
                            'BookCheck'
                          } 
                          size={20} 
                          className={
                            activity.type === 'course_completed' ? 'text-green-600' :
                            activity.type === 'reward_earned' ? 'text-amber-600' :
                            'text-blue-600'
                          }
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 font-medium">
                          {activity.studentName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {activity.type === 'course_completed' && `завершил курс "${activity.itemName}"`}
                          {activity.type === 'reward_earned' && `получил награду "${activity.itemName}"`}
                          {activity.type === 'lesson_completed' && `завершил урок "${activity.itemName}"`}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(activity.timestamp).toLocaleDateString('ru-RU', { 
                            day: 'numeric', 
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="TrendingUp" size={20} />
                Статистика платформы
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Icon name="FileText" size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Всего уроков</p>
                      <p className="text-sm text-gray-600">В {stats.totalCourses} курсах</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalLessons}</div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Icon name="GraduationCap" size={20} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Завершено курсов</p>
                      <p className="text-sm text-gray-600">Студентами всего</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.completedCourses}</div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Icon name="Award" size={20} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Всего наград</p>
                      <p className="text-sm text-gray-600">Доступно для получения</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalRewards}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}