import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';
import { ROUTES } from '@/constants/routes';

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

export function useCourseEditorActions(
  courseId: string | undefined,
  isEditMode: boolean,
  formData: CourseFormData,
  setFormData: (data: CourseFormData) => void,
  savedStatus: 'draft' | 'published' | 'archived',
  setSavedStatus: (status: 'draft' | 'published' | 'archived') => void,
  setWasEverPublished: (value: boolean) => void
) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(isEditMode);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadCourse = async (id: string) => {
    setLoadingCourse(true);
    try {
      const courseRes = await fetch(`${API_ENDPOINTS.COURSES}?id=${id}`, { headers: getAuthHeaders() });

      if (courseRes.ok) {
        const courseData = await courseRes.json();
        
        const lessonsRes = await fetch(`${API_ENDPOINTS.LESSONS}?courseId=${courseData.course.id}`, { headers: getAuthHeaders() });
        const lessonsData = lessonsRes.ok ? await lessonsRes.json() : { lessons: [] };
        
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
        setSavedStatus(courseData.course.status || 'draft');
        setWasEverPublished(courseData.course.status === 'published');
      }
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoadingCourse(false);
    }
  };

  const checkStudentsProgress = async () => {
    try {
      const progressRes = await fetch(`${API_ENDPOINTS.PROGRESS}?courseId=${courseId}`, {
        headers: getAuthHeaders(),
      });
      if (progressRes.ok) {
        const progressData = await progressRes.json();
        const uniqueStudents = new Set((progressData.progress || []).map((p: any) => p.userId));
        return uniqueStudents.size;
      }
      return 0;
    } catch (error) {
      console.error('Error checking students progress:', error);
      return 0;
    }
  };

  const applyProgressReset = async (option: 'keep' | 'reset_tests' | 'reset_all') => {
    if (option === 'keep') {
      // Не нужно сбрасывать прогресс
      return;
    }
    
    try {
      const response = await fetch(`${API_ENDPOINTS.PROGRESS}?action=reset`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          courseId: parseInt(courseId || '0'),
          resetType: option,
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to reset progress:', await response.text());
      }
    } catch (error) {
      console.error('Error resetting progress:', error);
    }
  };

  const handleSaveCourse = async (resetOption?: 'keep' | 'reset_tests' | 'reset_all') => {
    setLoading(true);
    setSaveSuccess(false);
    try {
      const totalDuration = formData.lessons.reduce((sum, lesson) => sum + lesson.duration, 0);
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
        const currentLessonIds = new Set(formData.lessons.filter(l => l.id <= 100000).map(l => l.id));

        // Delete lessons that were removed
        for (const existingLesson of existingLessons) {
          if (!currentLessonIds.has(existingLesson.id)) {
            console.log('[useCourseEditorActions] Deleting lesson:', existingLesson.id);
            await fetch(`${API_ENDPOINTS.LESSONS}?id=${existingLesson.id}`, {
              method: 'DELETE',
              headers: getAuthHeaders(),
            });
          }
        }

        // Update or create lessons
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
            imageUrl: lesson.imageUrl,
          };

          console.log(`[useCourseEditorActions] Saving lesson ${lesson.id}:`, lessonPayload);

          // ID > 100000 означает временный ID (Date.now()), это новый урок
          const isNewLesson = lesson.id > 100000;
          
          let savedLessonId = lesson.id;
          
          if (!isNewLesson && existingLessonIds.has(lesson.id)) {
            console.log(`[useCourseEditorActions] Updating existing lesson ${lesson.id}`);
            const updateRes = await fetch(`${API_ENDPOINTS.LESSONS}?id=${lesson.id}`, {
              method: 'PUT',
              headers: getAuthHeaders(),
              body: JSON.stringify(lessonPayload),
            });
            if (updateRes.ok) {
              const updateData = await updateRes.json();
              savedLessonId = updateData.lesson.id;
            }
          } else {
            const createRes = await fetch(API_ENDPOINTS.LESSONS, {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify(lessonPayload),
            });
            if (createRes.ok) {
              const createData = await createRes.json();
              savedLessonId = createData.lesson.id;
            }
          }
          
          // Save materials separately
          if (lesson.materials && lesson.materials.length > 0) {
            // Delete existing materials
            const existingMaterialsRes = await fetch(`${API_ENDPOINTS.LESSONS}?id=${savedLessonId}`, {
              headers: getAuthHeaders(),
            });
            if (existingMaterialsRes.ok) {
              const existingData = await existingMaterialsRes.json();
              const existingMaterials = existingData.lesson.materials || [];
              
              for (const material of existingMaterials) {
                await fetch(`${API_ENDPOINTS.LESSONS}?action=material&materialId=${material.id}`, {
                  method: 'DELETE',
                  headers: getAuthHeaders(),
                });
              }
            }
            
            // Create new materials
            for (const material of lesson.materials) {
              await fetch(`${API_ENDPOINTS.LESSONS}?action=material&lessonId=${savedLessonId}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                  title: material.title,
                  type: material.type,
                  url: material.url,
                }),
              });
            }
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
            imageUrl: lesson.imageUrl,
          };

          const createRes = await fetch(API_ENDPOINTS.LESSONS, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(lessonPayload),
          });
          
          if (createRes.ok) {
            const createData = await createRes.json();
            const savedLessonId = createData.lesson.id;
            
            // Save materials
            if (lesson.materials && lesson.materials.length > 0) {
              for (const material of lesson.materials) {
                await fetch(`${API_ENDPOINTS.LESSONS}?action=material&lessonId=${savedLessonId}`, {
                  method: 'POST',
                  headers: getAuthHeaders(),
                  body: JSON.stringify({
                    title: material.title,
                    type: material.type,
                    url: material.url,
                  }),
                });
              }
            }
          }
        }
      }

      setSavedStatus(formData.status);
      if (formData.status === 'published') {
        setWasEverPublished(true);
      }
      if (resetOption) {
        await applyProgressReset(resetOption);
      }
      
      // Показываем индикатор успешного сохранения
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Don't navigate - stay on the page after save
      // navigate(ROUTES.ADMIN.COURSES);
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Ошибка при сохранении курса');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    setLoading(true);
    try {
      // Используем courseId (display_id) напрямую
      const deleteRes = await fetch(`${API_ENDPOINTS.COURSES}?id=${courseId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!deleteRes.ok) {
        throw new Error('Failed to delete course');
      }

      navigate(ROUTES.ADMIN.COURSES);
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Ошибка при удалении курса');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    loadingCourse,
    saveSuccess,
    loadCourse,
    handleSaveCourse,
    handleDeleteCourse,
    checkStudentsProgress,
  };
}