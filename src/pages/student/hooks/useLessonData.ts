import { useState, useEffect } from 'react';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';
import { Course, Lesson, Test, CourseProgress } from '@/components/student/types';

interface UseLessonDataProps {
  courseId: string | undefined;
  lessonId: string | undefined;
  userId: number;
}

export function useLessonData({ courseId, lessonId, userId }: UseLessonDataProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [test, setTest] = useState<Test | null>(null);
  const [attemptsInfo, setAttemptsInfo] = useState<{
    attemptsUsed: number;
    remainingAttempts: number;
    maxAttempts: number | null;
    hasUnlimitedAttempts: boolean;
  } | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  const loadLessonData = async () => {
    try {
      setLoading(true);
      
      const [courseRes, lessonsRes, progressRes] = await Promise.all([
        fetch(`${API_ENDPOINTS.COURSES}?id=${courseId}`, { headers: getAuthHeaders() }),
        fetch(`${API_ENDPOINTS.LESSONS}?courseId=${courseId}`, { headers: getAuthHeaders() }),
        fetch(`${API_ENDPOINTS.PROGRESS}?userId=${userId}&courseId=${courseId}`, { headers: getAuthHeaders() }),
      ]);

      let courseData = null;
      if (courseRes.ok) {
        const data = await courseRes.json();
        courseData = data.course || data;
        setCourse(courseData);
      }

      let lessonsData: Lesson[] = [];
      let foundLesson: Lesson | null = null;
      
      if (lessonsRes.ok) {
        const data = await lessonsRes.json();
        lessonsData = data.lessons || [];
        setCourseLessons(lessonsData);
        
        const lessonOrder = parseInt(lessonId || '0') - 1;
        foundLesson = lessonsData.find(l => l.order === lessonOrder) || null;
        
        if (foundLesson) {
          console.log('Found lesson:', {
            id: foundLesson.id,
            title: foundLesson.title,
            requiresPrevious: foundLesson.requiresPrevious,
            isFinalTest: foundLesson.isFinalTest,
            finalTestRequiresAllLessons: foundLesson.finalTestRequiresAllLessons,
            finalTestRequiresAllTests: foundLesson.finalTestRequiresAllTests
          });
        }
        
        setLesson(foundLesson);
        
        if (foundLesson?.type === 'test' && foundLesson.testId) {
          const testRes = await fetch(`${API_ENDPOINTS.TESTS}?id=${foundLesson.testId}`, { 
            headers: getAuthHeaders() 
          });
          if (testRes.ok) {
            const testData = await testRes.json();
            console.log('Test data from backend:', testData);
            setTest(testData.test || testData);
          }

          const attemptsRes = await fetch(`${API_ENDPOINTS.TEST_ATTEMPTS}?lessonId=${foundLesson.id}`, {
            headers: getAuthHeaders()
          });
          if (attemptsRes.ok) {
            const attemptsData = await attemptsRes.json();
            setAttemptsInfo(attemptsData);
          }

          const resultsRes = await fetch(`${API_ENDPOINTS.TESTS}?action=results&lessonId=${foundLesson.id}`, {
            headers: getAuthHeaders()
          });
          if (resultsRes.ok) {
            const resultsData = await resultsRes.json();
            setTestResult(resultsData.result);
          }
        }
      }

      if (progressRes.ok && courseData && foundLesson) {
        const data = await progressRes.json();
        const courseProgress = data.progress?.find((p: CourseProgress) => p.courseId === courseData.id);
        console.log('Course progress:', {
          courseId: courseData.id,
          completedLessonIds: courseProgress?.completedLessonIds,
          currentLessonId: foundLesson.id
        });
        setProgress(courseProgress || null);
        setIsCompleted(courseProgress?.completedLessonIds.includes(String(foundLesson.id)) || false);
        
        if (foundLesson && courseData) {
          markLessonStarted(courseData.id, String(foundLesson.id), courseProgress);
        }
      } else if (!progressRes.ok && courseData && foundLesson) {
        markLessonStarted(courseData.id, String(foundLesson.id), null);
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const markLessonStarted = async (courseId: number, lessonUuid: string, currentProgress: CourseProgress | null) => {
    if (currentProgress?.lastAccessedLesson === lessonUuid) {
      return;
    }
    
    try {
      await fetch(`${API_ENDPOINTS.PROGRESS}?action=start`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          courseId: courseId,
          lessonId: lessonUuid
        })
      });
    } catch (error) {
      console.error('Error marking lesson started:', error);
    }
  };

  useEffect(() => {
    loadLessonData();
  }, [courseId, lessonId]);

  return {
    course,
    lesson,
    courseLessons,
    progress,
    loading,
    isCompleted,
    setIsCompleted,
    test,
    attemptsInfo,
    setAttemptsInfo,
    testResult,
    loadLessonData
  };
}