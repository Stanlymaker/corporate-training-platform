import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';
import { ROUTES } from '@/constants/routes';

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

export function useCourseEditorActions(
  courseId: string | undefined,
  isEditMode: boolean,
  formData: CourseFormData,
  setFormData: (data: CourseFormData) => void,
  savedStatus: 'draft' | 'published' | 'archived',
  setSavedStatus: (status: 'draft' | 'published' | 'archived') => void,
  setWasEverPublished: (value: boolean) => void,
  setActualCourseId: (id: string) => void
) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(isEditMode);

  const loadCourse = async (id: string) => {
    setLoadingCourse(true);
    try {
      const courseRes = await fetch(`${API_ENDPOINTS.COURSES}?id=${id}`, { headers: getAuthHeaders() });

      if (courseRes.ok) {
        const courseData = await courseRes.json();
        setActualCourseId(courseData.course.id);
        
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

  const checkStudentsProgress = async (actualCourseId: string) => {
    try {
      const progressRes = await fetch(`${API_ENDPOINTS.PROGRESS}?courseId=${actualCourseId || courseId}`, {
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

  const applyProgressReset = async (option: 'keep' | 'reset_tests' | 'reset_all', actualCourseId: string) => {
    try {
      await fetch(`${API_ENDPOINTS.PROGRESS}/reset`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          courseId: actualCourseId || courseId,
          resetType: option,
        }),
      });
    } catch (error) {
      console.error('Error resetting progress:', error);
    }
  };

  const handleSaveCourse = async (resetOption?: 'keep' | 'reset_tests' | 'reset_all', actualCourseId?: string) => {
    setLoading(true);
    try {
      const totalDuration = formData.lessons.reduce((sum, lesson) => sum + lesson.duration, 0);
      const method = isEditMode ? 'PUT' : 'POST';
      const url = isEditMode ? `${API_ENDPOINTS.COURSES}?id=${actualCourseId || courseId}` : API_ENDPOINTS.COURSES;

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

      setSavedStatus(formData.status);
      if (formData.status === 'published') {
        setWasEverPublished(true);
      }
      if (resetOption && actualCourseId) {
        await applyProgressReset(resetOption, actualCourseId);
      }
      navigate(ROUTES.ADMIN.COURSES);
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Ошибка при сохранении курса');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    loadingCourse,
    loadCourse,
    handleSaveCourse,
    checkStudentsProgress,
  };
}
