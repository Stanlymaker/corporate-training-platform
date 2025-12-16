import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
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
  order: number;
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
  startDate: string;
  endDate: string;
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
  startDate: '',
  endDate: '',
};

export default function CourseEditor() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const isEditMode = !!courseId;

  const [formData, setFormData] = useState<CourseFormData>(initialFormData);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showLessonDialog, setShowLessonDialog] = useState(false);

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

  const handleSaveCourse = () => {
    console.log('Saving course:', formData);
    navigate(ROUTES.ADMIN.COURSES);
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
            disabled={!formData.title || formData.lessons.length === 0}
          >
            <Icon name="Save" className="mr-2" size={16} />
            {isEditMode ? 'Сохранить изменения' : 'Создать курс'}
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

        <CourseLessonsList
          lessons={formData.lessons}
          onAddLesson={handleAddLesson}
          onEditLesson={handleEditLesson}
          onDeleteLesson={handleDeleteLesson}
          onReorderLesson={handleReorderLesson}
          getTypeIcon={getTypeIcon}
        />
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