import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import Icon from '@/components/ui/icon';
import CourseInfoForm from '@/components/admin/CourseInfoForm';
import CourseSummary from '@/components/admin/CourseSummary';
import CourseLessonsList from '@/components/admin/CourseLessonsList';
import LessonDialog from '@/components/admin/LessonDialog';
import CourseEditorHeader from '@/components/admin/course-editor/CourseEditorHeader';
import ProgressResetDialog from '@/components/admin/course-editor/ProgressResetDialog';
import DeleteCourseDialog from '@/components/admin/course-editor/DeleteCourseDialog';
import DraftTestsDialog from '@/components/admin/course-editor/DraftTestsDialog';
import { useCourseEditorActions } from '@/components/admin/course-editor/useCourseEditorActions';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

interface Lesson {
  id: number;
  title: string;
  type: 'video' | 'text' | 'test';
  duration: number;
  content?: string;
  videoUrl?: string;
  testId?: number;
  isFinalTest?: boolean;
  finalTestRequiresAllLessons?: boolean;
  finalTestRequiresAllTests?: boolean;
  order: number;
  description?: string;
  materials?: { id: number; title: string; type: 'pdf' | 'doc' | 'link' | 'video'; url: string }[];
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
  const { courseId } = useParams();
  const isEditMode = !!courseId;

  const [formData, setFormData] = useState<CourseFormData>(initialFormData);
  const [savedStatus, setSavedStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [wasEverPublished, setWasEverPublished] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [showProgressResetDialog, setShowProgressResetDialog] = useState(false);
  const [progressResetOption, setProgressResetOption] = useState<'keep' | 'reset_tests' | 'reset_all'>('reset_tests');
  const [studentsCount, setStudentsCount] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDraftTestsDialog, setShowDraftTestsDialog] = useState(false);
  const [draftTestsNames, setDraftTestsNames] = useState<string[]>([]);
  const [allTests, setAllTests] = useState<any[]>([]);

  const {
    loading,
    loadingCourse,
    saveSuccess,
    loadCourse,
    handleSaveCourse,
    handleDeleteCourse,
    checkStudentsProgress,
  } = useCourseEditorActions(
    courseId,
    isEditMode,
    formData,
    setFormData,
    savedStatus,
    setSavedStatus,
    setWasEverPublished
  );

  useEffect(() => {
    if (isEditMode && courseId) {
      loadCourse(courseId).then(() => {
        setHasUnsavedChanges(false);
      });
    }
    loadAllTests();
  }, [courseId, isEditMode]);

  const loadAllTests = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.TESTS, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setAllTests(data.tests || []);
      }
    } catch (error) {
      console.error('Error loading tests:', error);
    }
  };

  const handleInputChange = (field: keyof CourseFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (isEditMode && savedStatus === 'published') {
      setHasUnsavedChanges(true);
    }
  };

  const handleAddLesson = () => {
    setEditingLesson({
      id: Date.now(),
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

    if (isEditMode && savedStatus === 'published') {
      setHasUnsavedChanges(true);
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

  const handleDeleteLesson = (lessonId: number) => {
    setFormData({
      ...formData,
      lessons: formData.lessons.filter(l => l.id !== lessonId),
    });
    if (isEditMode && savedStatus === 'published') {
      setHasUnsavedChanges(true);
    }
  };

  const handleReorderLesson = (lessonId: number, direction: 'up' | 'down') => {
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
    if (isEditMode && savedStatus === 'published') {
      setHasUnsavedChanges(true);
    }
  };

  const handleSaveWithCheck = async () => {
    console.log('CourseEditor handleSaveWithCheck:', { isEditMode, wasEverPublished, formDataStatus: formData.status, savedStatus, hasUnsavedChanges });
    
    if (formData.status === 'published') {
      const testLessons = formData.lessons.filter(l => l.type === 'test' && l.testId);
      if (testLessons.length > 0) {
        const testsRes = await fetch(`${API_ENDPOINTS.TESTS}`, { headers: getAuthHeaders() });
        if (testsRes.ok) {
          const testsData = await testsRes.json();
          const allTests = testsData.tests || [];
          
          const draftTests = testLessons.filter(lesson => {
            const test = allTests.find((t: any) => t.id === lesson.testId);
            return test && test.status === 'draft';
          });
          
          if (draftTests.length > 0) {
            const testNames = draftTests.map(lesson => {
              const test = allTests.find((t: any) => t.id === lesson.testId);
              return test ? test.title : lesson.title;
            });
            setDraftTestsNames(testNames);
            setShowDraftTestsDialog(true);
            return;
          }
        }
      }
    }
    
    // Если курс публикуется и был ранее опубликован - показываем модалку умного сброса
    // (независимо от hasUnsavedChanges, т.к. переключение статуса тоже изменение)
    if (formData.status === 'published' && wasEverPublished) {
      const count = await checkStudentsProgress();
      console.log('Students with progress:', count);
      if (count > 0) {
        setStudentsCount(count);
        setShowProgressResetDialog(true);
        return;
      }
    }
    await handleSaveCourse();
    setHasUnsavedChanges(false);
  };

  const confirmProgressReset = async () => {
    setShowProgressResetDialog(false);
    await handleSaveCourse(progressResetOption);
    setHasUnsavedChanges(false);
  };

  const onDeleteConfirm = async () => {
    await handleDeleteCourse();
    setShowDeleteDialog(false);
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
      <CourseEditorHeader
        isEditMode={isEditMode}
        courseTitle={formData.title}
        hasLessons={formData.lessons.length > 0}
        loading={loading}
        saveSuccess={saveSuccess}
        onSave={handleSaveWithCheck}
        onDelete={() => setShowDeleteDialog(true)}
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CourseInfoForm
              formData={formData}
              onInputChange={handleInputChange}
              isEditMode={isEditMode}
              savedStatus={savedStatus}
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
            isDisabled={isEditMode && savedStatus === 'published'}
            allTests={allTests}
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

      <ProgressResetDialog
        isOpen={showProgressResetDialog}
        studentsCount={studentsCount}
        progressResetOption={progressResetOption}
        loading={loading}
        onOptionChange={setProgressResetOption}
        onConfirm={confirmProgressReset}
        onCancel={() => setShowProgressResetDialog(false)}
      />

      <DeleteCourseDialog
        isOpen={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        courseTitle={formData.title}
        lessonsCount={formData.lessons.length}
        loading={loading}
        onConfirm={onDeleteConfirm}
      />

      <DraftTestsDialog
        open={showDraftTestsDialog}
        onClose={() => setShowDraftTestsDialog(false)}
        testNames={draftTestsNames}
      />
    </AdminLayout>
  );
}