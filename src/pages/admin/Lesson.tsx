import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface Course {
  id: string;
  title: string;
  description: string;
}

interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  content: string;
  type: string;
  order: number;
  duration: number;
  videoUrl?: string;
}

export default function AdminLessonPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLessonData();
  }, [courseId, lessonId]);

  const loadLessonData = async () => {
    try {
      setLoading(true);
      
      const [courseRes, lessonsRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.COURSES}?id=${courseId}`, { headers: getAuthHeaders() }),
        fetch(`${API_ENDPOINTS.LESSONS}?courseId=${courseId}`, { headers: getAuthHeaders() }),
      ]);

      let courseData = null;
      if (courseRes.ok) {
        const data = await courseRes.json();
        courseData = data.course || data;
        setCourse(courseData);
      }

      if (lessonsRes.ok) {
        const data = await lessonsRes.json();
        const lessonsData = data.lessons || [];
        setCourseLessons(lessonsData);
        
        const lessonOrder = parseInt(lessonId || '0') - 1;
        const foundLesson = lessonsData.find((l: Lesson) => l.order === lessonOrder) || null;
        setLesson(foundLesson);
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentIndex = courseLessons.findIndex(l => l.id === lesson?.id);
  const prevLesson = currentIndex > 0 ? courseLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < courseLessons.length - 1 ? courseLessons[currentIndex + 1] : null;

  const handleNavigation = (targetLesson: Lesson | null) => {
    if (targetLesson) {
      navigate(`/admin/lesson/${courseId}/${targetLesson.order + 1}`);
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

  if (!course || !lesson) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <Icon name="AlertCircle" size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Урок не найден</h2>
          <Button onClick={() => navigate(`/admin/courses/view/${courseId}`)}>
            Вернуться к курсу
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
          onClick={() => navigate(`/admin/courses/view/${courseId}`)}
        >
          <Icon name="ArrowLeft" className="mr-2" size={16} />
          Назад к курсу
        </Button>
        
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm text-gray-500 mb-1">{course.title}</div>
            <h1 className="text-3xl font-bold text-gray-900">{lesson.title}</h1>
          </div>
          <Badge className="bg-blue-500">
            <Icon name="Eye" size={14} className="mr-1" />
            Просмотр
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {currentIndex + 1}
                  </div>
                  {lesson.description && (
                    <div className="text-sm text-gray-500 font-normal">{lesson.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Icon name="Clock" size={16} />
                  <span>{lesson.duration} мин</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {lesson.type === 'video' && lesson.videoUrl && (
                <div className="mb-6 rounded-lg overflow-hidden bg-black aspect-video">
                  <video 
                    controls 
                    className="w-full h-full"
                    src={lesson.videoUrl}
                  >
                    Ваш браузер не поддерживает воспроизведение видео.
                  </video>
                </div>
              )}
              
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown>{lesson.content}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleNavigation(prevLesson)}
                  disabled={!prevLesson}
                  className="flex-1"
                >
                  <Icon name="ChevronLeft" size={16} className="mr-2" />
                  Предыдущий урок
                </Button>
                <Button
                  onClick={() => handleNavigation(nextLesson)}
                  disabled={!nextLesson}
                  className="flex-1"
                >
                  Следующий урок
                  <Icon name="ChevronRight" size={16} className="ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="border-0 shadow-md sticky top-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Icon name="List" size={18} />
                Содержание курса
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {courseLessons.map((l, index) => {
                  const isCurrent = l.id === lesson.id;
                  
                  return (
                    <button
                      key={l.id}
                      onClick={() => handleNavigation(l)}
                      className={`w-full text-left px-4 py-3 border-b transition-colors ${
                        isCurrent
                          ? 'bg-primary/10 border-l-4 border-l-primary'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                          isCurrent ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 line-clamp-2">{l.title}</div>
                          <div className="text-xs text-gray-500 mt-1">{l.duration} мин</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}