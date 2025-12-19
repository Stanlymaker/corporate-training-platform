import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import StudentLayout from '@/components/StudentLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface Course {
  id: string;
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

interface CourseProgress {
  id: string;
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  completed: boolean;
  completedLessonIds: string[];
  lastAccessedLesson: string | null;
}

export default function CourseDetails() {
  const { courseId: id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = JSON.parse(localStorage.getItem('currentUser') || '{}').id;

  useEffect(() => {
    loadCourseData();
  }, [id]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      const [courseRes, lessonsRes, progressRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.COURSES}?id=${id}`, { headers: getAuthHeaders() }),
        fetch(`${API_ENDPOINTS.LESSONS}?courseId=${id}`, { headers: getAuthHeaders() }),
        fetch(`${API_ENDPOINTS.PROGRESS}?userId=${userId}&courseId=${id}`, { headers: getAuthHeaders() }),
      ]);

      let courseUuid = null;
      if (courseRes.ok) {
        const data = await courseRes.json();
        const courseData = data.course || data;
        setCourse(courseData);
        courseUuid = courseData.id;
      }

      if (lessonsRes.ok) {
        const lessonsData = await lessonsRes.json();
        setLessons(lessonsData.lessons || []);
      }

      if (progressRes.ok) {
        const progressData = await progressRes.json();
        const courseProgress = progressData.progress?.find((p: CourseProgress) => p.courseId === Number(id));
        setProgress(courseProgress || null);
      }
    } catch (error) {
      console.error('Error loading course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = async (lessonOrder: number, lessonIndex: number) => {
    const previousLesson = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
    const isLocked = previousLesson?.requiresPrevious && !progress?.completedLessonIds.includes(String(previousLesson.id));
    
    if (!isLocked) {
      if (!progress && id) {
        try {
          await fetch(`${API_ENDPOINTS.PROGRESS}?action=start`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              courseId: parseInt(id),
              lessonId: String(lessons[lessonIndex].id)
            })
          });
          await loadCourseData();
        } catch (error) {
          console.error('Error starting course:', error);
        }
      }
      
      // Используем order+1 для читаемого URL
      navigate(ROUTES.STUDENT.LESSON(id!, String(lessonOrder + 1)));
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <Icon name="Loader2" className="animate-spin" size={32} />
        </div>
      </StudentLayout>
    );
  }

  if (!course) {
    return (
      <StudentLayout>
        <div className="text-center py-12">
          <Icon name="AlertCircle" size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Курс не найден</h2>
          <Button onClick={() => navigate(ROUTES.STUDENT.COURSES)}>
            Вернуться к курсам
          </Button>
        </div>
      </StudentLayout>
    );
  }

  const progressPercent = progress ? (progress.completedLessons / progress.totalLessons) * 100 : 0;

  return (
    <StudentLayout>
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate(ROUTES.STUDENT.COURSES)}
        >
          <Icon name="ArrowLeft" className="mr-2" size={16} />
          Назад к курсам
        </Button>
        
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-8 border border-primary/10 mb-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                {progress?.completed && (
                  <Badge className="bg-green-500">
                    <Icon name="CheckCircle" size={14} className="mr-1" />
                    Завершен
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
              <p className="text-gray-600 mb-4 text-lg">{course.description}</p>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                {course.instructor && (
                  <div className="flex items-center gap-2">
                    <Icon name="User" size={16} />
                    <span>{course.instructor}</span>
                  </div>
                )}
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
            <img 
              src={course.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'} 
              alt={course.title}
              className="w-48 h-32 object-cover rounded-xl shadow-lg"
            />
          </div>
          
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Прогресс прохождения</span>
              <span className="text-sm font-bold text-gray-900">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <p className="text-xs text-gray-500 mt-2">
              Завершено {progress?.completedLessons || 0} из {lessons.length} уроков
            </p>
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
                  const isCompleted = progress?.completedLessonIds.includes(String(lesson.id));
                  const previousLesson = index > 0 ? lessons[index - 1] : null;
                  const isLocked = lesson.requiresPrevious && previousLesson && !progress?.completedLessonIds.includes(String(previousLesson.id));
                  const isLastAccessed = progress?.lastAccessedLesson === lesson.id;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => handleLessonClick(lesson.order, index)}
                      disabled={isLocked}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        isLastAccessed
                          ? 'border-primary bg-primary/5'
                          : isLocked
                          ? 'border-gray-200 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCompleted 
                            ? 'bg-green-500 text-white' 
                            : isLocked
                            ? 'bg-gray-200 text-gray-400'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {isLocked ? (
                            <Icon name="Lock" size={18} />
                          ) : isCompleted ? (
                            <Icon name="Check" size={18} />
                          ) : (
                            <span className="font-bold text-sm">{lesson.order + 1}</span>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon 
                              name={
                                lesson.type === 'video' ? 'Video' :
                                lesson.type === 'text' ? 'FileText' :
                                lesson.type === 'quiz' ? 'ClipboardList' :
                                'Circle'
                              }
                              size={16} 
                              className="text-gray-400" 
                            />
                            <span className="font-semibold text-gray-900">
                              {lesson.title}
                            </span>
                            {isLastAccessed && !isCompleted && (
                              <Badge variant="outline" className="ml-2">В процессе</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-1">{lesson.description}</p>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Icon name="Clock" size={12} />
                              {lesson.duration} мин
                            </div>
                          </div>
                          <Icon 
                            name="ChevronRight" 
                            size={20} 
                            className={isLocked ? 'text-gray-300' : 'text-gray-400'} 
                          />
                        </div>
                      </div>

                      {isLocked && previousLesson && (
                        <div className="mt-2 pl-14 text-xs text-gray-500 flex items-center gap-1">
                          <Icon name="Info" size={12} />
                          Завершите урок "{previousLesson.title}" для разблокировки
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}