import StudentLayout from '@/components/StudentLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { getCategoryIcon, getCategoryGradient } from '@/utils/categoryIcons';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  lessonsCount: number;
  duration: number;
  passScore: number;
  accessType: 'open' | 'closed';
  published: boolean;
}

interface CourseProgress {
  id: string;
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  completed: boolean;
  score: number | null;
}

export default function StudentCourses() {
  const [filter, setFilter] = useState<'all' | 'notStarted' | 'inProgress' | 'completed'>('all');
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = JSON.parse(localStorage.getItem('currentUser') || '{}').id;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [coursesRes, progressRes] = await Promise.all([
        fetch(API_ENDPOINTS.COURSES, { headers: getAuthHeaders() }),
        fetch(`${API_ENDPOINTS.PROGRESS}?userId=${userId}`, { headers: getAuthHeaders() }),
      ]);

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData.courses || []);
      }

      if (progressRes.ok) {
        const progressData = await progressRes.json();
        setProgress(progressData.progress || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const progressMap = new Map(progress.map(p => [p.courseId, p]));

  const notStartedCount = courses.filter(c => !progressMap.has(c.id)).length;
  const inProgressCount = courses.filter(c => {
    const p = progressMap.get(c.id);
    return p && !p.completed && p.completedLessons > 0;
  }).length;
  const completedCount = courses.filter(c => progressMap.get(c.id)?.completed).length;

  const filteredCourses = courses.filter(course => {
    const courseProgress = progressMap.get(course.id);
    if (filter === 'notStarted') return !courseProgress;
    if (filter === 'inProgress') return courseProgress && !courseProgress.completed && courseProgress.completedLessons > 0;
    if (filter === 'completed') return courseProgress?.completed;
    return true;
  });

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Мои курсы</h1>
        <p className="text-gray-600">Продолжайте обучение или начните новый курс</p>
      </div>

      <div className="flex gap-3 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          Все ({courses.length})
        </Button>
        <Button
          variant={filter === 'notStarted' ? 'default' : 'outline'}
          onClick={() => setFilter('notStarted')}
          size="sm"
        >
          Не начаты ({notStartedCount})
        </Button>
        <Button
          variant={filter === 'inProgress' ? 'default' : 'outline'}
          onClick={() => setFilter('inProgress')}
          size="sm"
        >
          В процессе ({inProgressCount})
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
          size="sm"
        >
          Завершены ({completedCount})
        </Button>
      </div>

      {filteredCourses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Icon name="BookOpen" size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Курсы не найдены</h3>
            <p className="text-gray-600">Курсы в этой категории отсутствуют</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCourses.map((course) => {
            const courseProgress = progressMap.get(course.id);
            const progressPercent = courseProgress
              ? (courseProgress.completedLessons / courseProgress.totalLessons) * 100
              : 0;

            return (
              <Card key={course.id} className="transition-shadow hover:shadow-md overflow-hidden">
                <div className="aspect-video w-full bg-gradient-to-br from-gray-100 to-gray-200 relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryGradient(course.category)} opacity-10`} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getCategoryGradient(course.category)} flex items-center justify-center shadow-lg`}>
                      <Icon name={getCategoryIcon(course.category) as any} size={40} className="text-white" />
                    </div>
                  </div>
                  {courseProgress?.completed && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-green-500">
                        <Icon name="CheckCircle" size={12} className="mr-1" />
                        Завершен
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-5">
                  <h3 className="font-bold text-base text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                  
                  {courseProgress && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                        <span>Прогресс</span>
                        <span>{courseProgress.completedLessons}/{courseProgress.totalLessons} уроков</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Icon name="BookOpen" size={14} />
                      {course.lessonsCount} ур.
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="Clock" size={14} />
                      {course.duration} мин
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="Target" size={14} />
                      {course.passScore}%
                    </span>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => navigate(ROUTES.STUDENT.COURSE_DETAIL(String(course.id)))}
                  >
                    {!courseProgress ? (
                      <>
                        <Icon name="Play" className="mr-2" size={16} />
                        Начать курс
                      </>
                    ) : courseProgress.completed ? (
                      <>
                        <Icon name="RotateCcw" className="mr-2" size={16} />
                        Пройти заново
                      </>
                    ) : (
                      <>
                        <Icon name="ArrowRight" className="mr-2" size={16} />
                        Продолжить
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </StudentLayout>
  );
}