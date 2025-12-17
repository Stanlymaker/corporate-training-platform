import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';
import CourseInfoForm from '@/components/admin/CourseInfoForm';
import CourseSummary from '@/components/admin/CourseSummary';
import CourseLessonsList from '@/components/admin/CourseLessonsList';
import LessonDialog from '@/components/admin/LessonDialog';

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'test';
  duration: number;
  content?: string;
  videoUrl?: string;
  testId?: string;
  isFinalTest?: boolean;
  finalTestRequiresAllLessons?: boolean;
  finalTestRequiresAllTests?: boolean;
  order: number;
  description?: string;
  materials?: { id: string; title: string; type: 'pdf' | 'doc' | 'link' | 'video'; url: string }[];
  requiresPrevious?: boolean;
  imageUrl?: string;
}

interface CourseFormData {
  title: string;
  description: string;
  category: string;
  level: 'Начальный' | 'Средний' | 'Продвинутый';
  instructor: string;
  image: string;
  lessons: Lesson[];
  status: 'draft' | 'published' | 'archived';
  accessType: 'open' | 'closed';
  sequenceType: 'linear' | 'free';
}

const initialFormData: CourseFormData = {
  title: '',
  description: '',
  category: '',
  level: 'Начальный',
  instructor: '',
  image: '',
  lessons: [],
  status: 'draft',
  accessType: 'open',
  sequenceType: 'linear',
};

export default function CourseEditor() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const isEditMode = !!courseId;

  const [formData, setFormData] = useState<CourseFormData>(initialFormData);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode && courseId) {
      loadCourse(courseId);
    }
  }, [courseId, isEditMode]);

  const loadCourse = async (id: string) => {
    setLoadingCourse(true);
    try {
      const [courseRes, lessonsRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.COURSES}?id=${id}`, { headers: getAuthHeaders() }),
        fetch(`${API_ENDPOINTS.LESSONS}?courseId=${id}`, { headers: getAuthHeaders() }),
      ]);

      if (courseRes.ok && lessonsRes.ok) {
        const courseData = await courseRes.json();
        const lessonsData = await lessonsRes.json();
        
        setFormData({
          title: courseData.course.title || '',
          description: courseData.course.description || '',
          category: courseData.course.category || '',
          level: courseData.course.level || 'Начальный',
          instructor: courseData.course.instructor || '',
          image: courseData.course.image || '',
          lessons: (lessonsData.lessons || []).map((l: any) => ({
            id: l.id,
            title: l.title,
            type: l.type,
            duration: l.duration || 0,
            content: l.content,
            videoUrl: l.videoUrl,
            testId: l.testId,
            isFinalTest: l.isFinalTest,
            finalTestRequiresAllLessons: l.finalTestRequiresAllLessons,
            finalTestRequiresAllTests: l.finalTestRequiresAllTests,
            order: l.order,
            description: l.description,
            materials: l.materials || [],
            requiresPrevious: l.requiresPrevious,
          })),
          status: courseData.course.status || 'draft',
          accessType: courseData.course.accessType || 'open',
          sequenceType: 'linear',
        });
      }
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoadingCourse(false);
    }
  };

  const handleInputChange = (field: keyof CourseFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAddLesson = () => {
    setEditingLesson({
      id: Date.now().toString(),
      title: '',
      type: 'video',
      duration: 10,
      order: formData.lessons.length,
    });
    setShowLessonDialog(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setShowLessonDialog(true);
  };

  const handleSaveLesson = () => {
    if (!editingLesson) return;

    const existingIndex = formData.lessons.findIndex(l => l.id === editingLesson.id);
    if (existingIndex >= 0) {
      const updated = [...formData.lessons];
      updated[existingIndex] = editingLesson;
      setFormData({ ...formData, lessons: updated });
    } else {
      setFormData({ ...formData, lessons: [...formData.lessons, editingLesson] });
    }

    setShowLessonDialog(false);
    setEditingLesson(null);
  };

  const handleCancelLesson = () => {
    setShowLessonDialog(false);
    setEditingLesson(null);
  };

  const handleLessonChange = (field: keyof Lesson, value: any) => {
    if (!editingLesson) return;
    setEditingLesson({ ...editingLesson, [field]: value });
  };

  const handleDeleteLesson = (lessonId: string) => {
    setFormData({
      ...formData,
      lessons: formData.lessons.filter(l => l.id !== lessonId),
    });
  };

  const handleReorderLesson = (lessonId: string, direction: 'up' | 'down') => {
    const index = formData.lessons.findIndex(l => l.id === lessonId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === formData.lessons.length - 1)
    ) {
      return;
    }

    const newLessons = [...formData.lessons];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newLessons[index], newLessons[targetIndex]] = [newLessons[targetIndex], newLessons[index]];

    newLessons.forEach((lesson, idx) => {
      lesson.order = idx;
    });

    setFormData({ ...formData, lessons: newLessons });
  };

  const handleSaveCourse = async () => {
    setLoading(true);
    try {
      const method = isEditMode ? 'PUT' : 'POST';
      const url = isEditMode ? `${API_ENDPOINTS.COURSES}?id=${courseId}` : API_ENDPOINTS.COURSES;

      const coursePayload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        level: formData.level,
        instructor: formData.instructor,
        image: formData.image,
        status: formData.status,
        accessType: formData.accessType,
        duration: totalDuration,
        passScore: 70,
        published: formData.status === 'published',
      };

      const courseRes = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(coursePayload),
      });

      if (!courseRes.ok) {
        throw new Error('Failed to save course');
      }

      const courseData = await courseRes.json();
      const savedCourseId = courseData.course.id;

      if (isEditMode) {
        const existingLessonsRes = await fetch(`${API_ENDPOINTS.LESSONS}?courseId=${savedCourseId}`, {
          headers: getAuthHeaders(),
        });
        const existingLessons = existingLessonsRes.ok ? (await existingLessonsRes.json()).lessons : [];
        const existingLessonIds = new Set(existingLessons.map((l: any) => l.id));

        for (const lesson of formData.lessons) {
          const lessonPayload = {
            courseId: savedCourseId,
            title: lesson.title,
            content: lesson.content,
            type: lesson.type,
            order: lesson.order,
            duration: lesson.duration,
            videoUrl: lesson.videoUrl,
            description: lesson.description,
            requiresPrevious: lesson.requiresPrevious || false,
            testId: lesson.testId,
            isFinalTest: lesson.isFinalTest || false,
            finalTestRequiresAllLessons: lesson.finalTestRequiresAllLessons || false,
            finalTestRequiresAllTests: lesson.finalTestRequiresAllTests || false,
          };

          if (existingLessonIds.has(lesson.id)) {
            await fetch(`${API_ENDPOINTS.LESSONS}?id=${lesson.id}`, {
              method: 'PUT',
              headers: getAuthHeaders(),
              body: JSON.stringify(lessonPayload),
            });
          } else {
            await fetch(API_ENDPOINTS.LESSONS, {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify(lessonPayload),
            });
          }
        }
      } else {
        for (const lesson of formData.lessons) {
          const lessonPayload = {
            courseId: savedCourseId,
            title: lesson.title,
            content: lesson.content,
            type: lesson.type,
            order: lesson.order,
            duration: lesson.duration,
            videoUrl: lesson.videoUrl,
            description: lesson.description,
            requiresPrevious: lesson.requiresPrevious || false,
            testId: lesson.testId,
            isFinalTest: lesson.isFinalTest || false,
            finalTestRequiresAllLessons: lesson.finalTestRequiresAllLessons || false,
            finalTestRequiresAllTests: lesson.finalTestRequiresAllTests || false,
          };

          await fetch(API_ENDPOINTS.LESSONS, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(lessonPayload),
          });
        }
      }

      navigate(ROUTES.ADMIN.COURSES);
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Ошибка при сохранении курса');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return 'Video';
      case 'text': return 'FileText';
      case 'test': return 'ClipboardList';
      default: return 'Circle';
    }
  };

  const totalDuration = formData.lessons.reduce((sum, lesson) => sum + lesson.duration, 0);

  if (loadingCourse) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка курса...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
          <div>
            <Button
              variant="ghost"
              className="mb-2"
              onClick={() => navigate(ROUTES.ADMIN.COURSES)}
            >
              <Icon name="ArrowLeft" className="mr-2" size={16} />
              Назад к курсам
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? 'Редактировать курс' : 'Создать новый курс'}
            </h1>
          </div>
          <Button
            onClick={handleSaveCourse}
            disabled={!formData.title || formData.lessons.length === 0 || loading}
          >
            <Icon name="Save" className="mr-2" size={16} />
            {loading ? 'Сохранение...' : isEditMode ? 'Сохранить изменения' : 'Создать курс'}
          </Button>
        </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CourseInfoForm
              formData={formData}
              onInputChange={handleInputChange}
            />
          </div>

          <CourseSummary
            lessons={formData.lessons}
            totalDuration={totalDuration}
            formData={formData}
          />
        </div>

        <div className="pt-4">
          <CourseLessonsList
            lessons={formData.lessons}
            onAddLesson={handleAddLesson}
            onEditLesson={handleEditLesson}
            onDeleteLesson={handleDeleteLesson}
            onReorderLesson={handleReorderLesson}
            getTypeIcon={getTypeIcon}
          />
        </div>
      </div>

      <LessonDialog
        show={showLessonDialog}
        lesson={editingLesson}
        onSave={handleSaveLesson}
        onCancel={handleCancelLesson}
        onLessonChange={handleLessonChange}
      />
    </AdminLayout>
  );
}