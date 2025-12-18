import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface Course {
  id: string;
  displayId: number;
  title: string;
  description: string;
  category: string;
  duration: number;
  lessonsCount: number;
  passScore: number;
  level: string;
  instructor: string;
  image?: string;
}

interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  type: 'video' | 'text' | 'quiz' | 'interactive';
  order: number;
  duration: number;
  content: string;
  videoUrl?: string;
  requiresPrevious: boolean;
  published: boolean;
}

export default function AdminCourseView() {
  const { courseId: displayId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourseData();
  }, [displayId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      const [courseRes, lessonsRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.COURSES}?id=${displayId}`, { headers: getAuthHeaders() }),
        fetch(`${API_ENDPOINTS.LESSONS}?courseId=${displayId}`, { headers: getAuthHeaders() }),
      ]);

      if (courseRes.ok) {
        const data = await courseRes.json();
        const courseData = data.course || data;
        setCourse(courseData);
      }

      if (lessonsRes.ok) {
        const lessonsData = await lessonsRes.json();
        setLessons(lessonsData.lessons || []);
      }
    } catch (error) {
      console.error('Error loading course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = (lessonOrder: number) => {
    navigate(`/admin/lesson/${displayId}/${lessonOrder + 1}`);
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

  if (!course) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <Icon name="AlertCircle" size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Курс не найден</h2>
          <Button onClick={() => navigate(ROUTES.ADMIN.COURSES)}>
            Вернуться к курсам
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate(ROUTES.ADMIN.COURSES)}
        >
          <Icon name="ArrowLeft" className="mr-2" size={16} />
          Назад к курсам
        </Button>
        
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-8 border border-primary/10 mb-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">{course.category}</Badge>
                <Badge variant="outline">{course.level}</Badge>
                <Badge className="bg-blue-500">
                  <Icon name="Eye" size={14} className="mr-1" />
                  Просмотр
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
              <p className="text-gray-600 mb-4 text-lg">{course.description}</p>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Icon name="User" size={16} />
                  <span>{course.instructor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Clock" size={16} />
                  <span>{course.duration} мин</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="BookOpen" size={16} />
                  <span>{lessons.length} уроков</span>
                </div>
              </div>
            </div>
            {course.image && (
              <img 
                src={course.image} 
                alt={course.title}
                className="w-48 h-32 object-cover rounded-xl shadow-lg"
              />
            )}
          </div>
          
          <div className="mt-6">
            <Button
              onClick={() => navigate(`/admin/courses/edit/${course.displayId}`)}
              className="bg-primary"
            >
              <Icon name="Edit" className="mr-2" size={16} />
              Редактировать курс
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="List" size={20} />
              Программа курса
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lessons.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="BookOpen" size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Уроки еще не добавлены</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lessons.map((lesson, index) => {
                  const lessonTypeIcons = {
                    video: 'Play',
                    text: 'FileText',
                    quiz: 'HelpCircle',
                    interactive: 'Zap'
                  };

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => handleLessonClick(lesson.order)}
                      className="w-full text-left p-4 rounded-lg border transition-all hover:border-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              <Icon name={lessonTypeIcons[lesson.type] as any} size={12} className="mr-1" />
                              {lesson.type === 'video' ? 'Видео' : 
                               lesson.type === 'text' ? 'Текст' :
                               lesson.type === 'quiz' ? 'Тест' : 'Интерактив'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-1">{lesson.description}</p>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Icon name="Clock" size={14} />
                            <span>{lesson.duration} мин</span>
                          </div>
                          <Icon name="ChevronRight" size={20} className="text-gray-400" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}