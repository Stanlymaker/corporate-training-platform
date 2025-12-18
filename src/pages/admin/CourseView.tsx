import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

export default function CourseView() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [courseLessons, setCourseLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadCourseData();
  }, [courseId]);
  
  const loadCourseData = async () => {
    setLoading(true);
    try {
      const courseRes = await fetch(`${API_ENDPOINTS.COURSES}?id=${courseId}`, { headers: getAuthHeaders() });
      
      if (courseRes.ok) {
        const courseData = await courseRes.json();
        setCourse(courseData.course);
        
        const lessonsRes = await fetch(`${API_ENDPOINTS.LESSONS}?courseId=${courseData.course.id}`, { headers: getAuthHeaders() });
        if (lessonsRes.ok) {
          const lessonsData = await lessonsRes.json();
          setCourseLessons(lessonsData.lessons || []);
        }
      }
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoading(false);
    }
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
          <Icon name="AlertCircle" size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Курс не найден</h2>
          <Button onClick={() => navigate(ROUTES.ADMIN.COURSES)} className="mt-4">
            Вернуться к курсам
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'не указано';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(ROUTES.ADMIN.COURSES)}
          >
            <Icon name="ArrowLeft" className="mr-2" size={16} />
            Назад к курсам
          </Button>
          <Button
            onClick={() => navigate(ROUTES.ADMIN.COURSE_EDITOR.replace(':courseId?', course.displayId?.toString() || ''))}
          >
            <Icon name="Edit" className="mr-2" size={16} />
            Редактировать
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden">
              <img
                src={course.image}
                alt={course.title}
                className="w-full h-64 object-cover"
              />
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary">{course.category}</Badge>
                  <Badge className="bg-primary text-primary-foreground">
                    {course.level}
                  </Badge>
                  <Badge className={getStatusColor(course.status)}>
                    {course.status === 'published' ? 'Опубликован' : 
                     course.status === 'draft' ? 'Черновик' : 
                     course.status === 'archived' ? 'Архив' : 'Опубликован'}
                  </Badge>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
                <p className="text-gray-600 mb-6">{course.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">{courseLessons.length}</div>
                    <div className="text-sm text-gray-600">Уроков</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">{course.duration}</div>
                    <div className="text-sm text-gray-600">Минут</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">{course.students || 0}</div>
                    <div className="text-sm text-gray-600">Студентов</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">{course.rating || '—'}</div>
                    <div className="text-sm text-gray-600">Рейтинг</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {course.prerequisites && course.prerequisites.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="CheckCircle" size={20} />
                    Требования
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {course.prerequisites.map((prereq, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Icon name="Check" size={16} className="mt-1 text-green-600" />
                        <span className="text-gray-700">{prereq}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="BookOpen" size={20} />
                  Программа курса
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {courseLessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-300 text-gray-600">
                          <span className="font-semibold">{index + 1}</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h4 className="font-semibold text-gray-900">{lesson.title}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-500 flex-shrink-0">
                              <Icon name="Clock" size={14} />
                              {lesson.duration} мин
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{lesson.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="User" size={20} />
                  Преподаватель
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/60 to-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                    {course.instructor?.split(' ').map(n => n[0]).join('') || 'NN'}
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{course.instructor}</h4>
                  <p className="text-sm text-gray-600">Эксперт по {course.category}</p>
                </div>
              </CardContent>
            </Card>

            {course.tags && course.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Tag" size={20} />
                    Теги
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
    </AdminLayout>
  );
}