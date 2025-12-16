import StudentLayout from '@/components/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { mockLessons, mockProgress, mockCourses } from '@/data/mockData';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function LessonPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const userId = '2';

  const course = mockCourses.find(c => c.id === courseId);
  const lesson = mockLessons.find(l => l.id === lessonId && l.courseId === courseId);
  const courseLessons = mockLessons.filter(l => l.courseId === courseId).sort((a, b) => a.order - b.order);
  const progress = mockProgress.find(p => p.courseId === courseId && p.userId === userId);

  const [isCompleted, setIsCompleted] = useState(
    progress?.completedLessonIds.includes(lessonId || '') || false
  );

  if (!course || !lesson) {
    return (
      <StudentLayout>
        <div className="text-center py-12">
          <Icon name="AlertCircle" size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Урок не найден</h2>
          <Button onClick={() => navigate(ROUTES.STUDENT.COURSES)}>
            Вернуться к курсам
          </Button>
        </div>
      </StudentLayout>
    );
  }

  const currentIndex = courseLessons.findIndex(l => l.id === lessonId);
  const previousLesson = currentIndex > 0 ? courseLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < courseLessons.length - 1 ? courseLessons[currentIndex + 1] : null;

  const isLocked = lesson.requiresPrevious && previousLesson && !progress?.completedLessonIds.includes(previousLesson.id);

  const handleComplete = () => {
    setIsCompleted(true);
  };

  const handleNavigateLesson = (targetLessonId: string) => {
    navigate(ROUTES.STUDENT.LESSON.replace(':courseId', courseId!).replace(':lessonId', targetLessonId));
  };

  const progressPercent = progress ? (progress.completedLessons / progress.totalLessons) * 100 : 0;

  if (isLocked) {
    return (
      <StudentLayout>
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(ROUTES.STUDENT.COURSE_DETAIL.replace(':id', courseId!))}
            className="mb-4"
          >
            <Icon name="ArrowLeft" size={16} className="mr-2" />
            Назад к курсу
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
          <p className="text-gray-600">{course.title}</p>
        </div>

        <Card className="border-0 shadow-md text-center py-12">
          <CardContent>
            <div className="max-w-md mx-auto">
              <Icon name="Lock" size={64} className="mx-auto text-gray-400 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Урок заблокирован</h2>
              <p className="text-gray-600 mb-6">
                Чтобы открыть этот урок, необходимо завершить предыдущий урок:
              </p>
              <Badge variant="outline" className="text-base px-4 py-2 mb-6">
                {previousLesson?.title}
              </Badge>
              <Button onClick={() => handleNavigateLesson(previousLesson!.id)}>
                Перейти к предыдущему уроку
              </Button>
            </div>
          </CardContent>
        </Card>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(ROUTES.STUDENT.COURSE_DETAIL.replace(':id', courseId!))}
          className="mb-4"
        >
          <Icon name="ArrowLeft" size={16} className="mr-2" />
          Назад к курсу
        </Button>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">Урок {lesson.order}</Badge>
              {isCompleted && (
                <Badge className="bg-green-500">
                  <Icon name="CheckCircle" size={14} className="mr-1" />
                  Завершен
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
            <p className="text-gray-600">{course.title}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Icon name="Clock" size={16} />
            {lesson.duration} мин
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={progressPercent} className="flex-1" />
          <span className="text-sm text-gray-600 whitespace-nowrap">
            {progress?.completedLessons || 0} / {progress?.totalLessons || courseLessons.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-8">
              <div className="prose prose-lg max-w-none">
                {lesson.type === 'text' && (
                  <ReactMarkdown>{lesson.content}</ReactMarkdown>
                )}
                {lesson.type === 'video' && (
                  <>
                    <div className="aspect-video bg-gray-900 rounded-lg mb-6 flex items-center justify-center">
                      <Icon name="Play" size={64} className="text-white opacity-50" />
                    </div>
                    <ReactMarkdown>{lesson.content}</ReactMarkdown>
                  </>
                )}
              </div>

              {lesson.materials && lesson.materials.length > 0 && (
                <div className="mt-8 pt-8 border-t">
                  <h3 className="text-xl font-bold mb-4">Материалы урока</h3>
                  <div className="space-y-2">
                    {lesson.materials.map(material => (
                      <a
                        key={material.id}
                        href={material.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors"
                      >
                        <Icon
                          name={material.type === 'pdf' ? 'FileText' : material.type === 'video' ? 'Video' : 'Link'}
                          size={20}
                          className="text-primary"
                        />
                        <span className="font-medium">{material.title}</span>
                        <Icon name="ExternalLink" size={16} className="ml-auto text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="lg"
              disabled={!previousLesson}
              onClick={() => previousLesson && handleNavigateLesson(previousLesson.id)}
            >
              <Icon name="ChevronLeft" size={20} className="mr-2" />
              Предыдущий урок
            </Button>

            {!isCompleted && (
              <Button size="lg" onClick={handleComplete} className="flex-1 max-w-xs">
                <Icon name="CheckCircle" size={20} className="mr-2" />
                Отметить как завершенный
              </Button>
            )}

            <Button
              size="lg"
              disabled={!nextLesson}
              onClick={() => nextLesson && handleNavigateLesson(nextLesson.id)}
            >
              Следующий урок
              <Icon name="ChevronRight" size={20} className="ml-2" />
            </Button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="border-0 shadow-md sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon name="List" size={18} />
                Содержание курса
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-1">
                {courseLessons.map((l, index) => {
                  const lessonCompleted = progress?.completedLessonIds.includes(l.id);
                  const lessonLocked = l.requiresPrevious && index > 0 && !progress?.completedLessonIds.includes(courseLessons[index - 1].id);
                  const isActive = l.id === lessonId;

                  return (
                    <button
                      key={l.id}
                      onClick={() => !lessonLocked && handleNavigateLesson(l.id)}
                      disabled={lessonLocked}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : lessonLocked
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {lessonLocked ? (
                          <Icon name="Lock" size={16} className="text-gray-400" />
                        ) : lessonCompleted ? (
                          <Icon name="CheckCircle" size={16} className="text-green-500" />
                        ) : (
                          <Icon name="Circle" size={16} className="text-gray-300" />
                        )}
                        <span className="text-xs font-medium">Урок {l.order}</span>
                        <span className="ml-auto text-xs">{l.duration} мин</span>
                      </div>
                      <div className="text-sm font-medium line-clamp-2">{l.title}</div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  );
}
