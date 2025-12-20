import { Lesson, CourseProgress } from '@/components/student/types';

interface LockStatus {
  isLocked: boolean;
  reason: 'none' | 'previous' | 'allLessons' | 'allTests';
  message: string;
}

interface UseLessonLockProps {
  lesson: Lesson;
  courseLessons: Lesson[];
  previousLesson: Lesson | null;
  progress: CourseProgress | null;
}

export function useLessonLock({ lesson, courseLessons, previousLesson, progress }: UseLessonLockProps) {
  const getLockStatus = (): LockStatus => {
    console.log('Checking lock status for lesson:', lesson.title, {
      requiresPrevious: lesson.requiresPrevious,
      isFinalTest: lesson.isFinalTest,
      finalTestRequiresAllLessons: lesson.finalTestRequiresAllLessons,
      finalTestRequiresAllTests: lesson.finalTestRequiresAllTests,
      completedLessonIds: progress?.completedLessonIds
    });

    if (lesson.requiresPrevious && previousLesson) {
      const isPrevCompleted = progress?.completedLessonIds.includes(String(previousLesson.id));
      console.log('Previous lesson check:', previousLesson.title, 'completed:', isPrevCompleted);
      if (!isPrevCompleted) {
        return {
          isLocked: true,
          reason: 'previous',
          message: `Чтобы открыть этот урок, необходимо завершить предыдущий урок: "${previousLesson.title}"`
        };
      }
    }

    if (lesson.isFinalTest && lesson.finalTestRequiresAllLessons) {
      const nonTestLessons = courseLessons.filter(l => !l.isFinalTest);
      const completedNonTestLessons = nonTestLessons.filter(l => 
        progress?.completedLessonIds.includes(String(l.id))
      );
      console.log('All lessons check:', completedNonTestLessons.length, '/', nonTestLessons.length);
      
      if (completedNonTestLessons.length < nonTestLessons.length) {
        return {
          isLocked: true,
          reason: 'allLessons',
          message: `Финальный тест откроется после завершения всех уроков курса (${completedNonTestLessons.length}/${nonTestLessons.length})`
        };
      }
    }

    if (lesson.isFinalTest && lesson.finalTestRequiresAllTests) {
      const testLessons = courseLessons.filter(l => l.type === 'test' && !l.isFinalTest);
      const completedTests = testLessons.filter(l => 
        progress?.completedLessonIds.includes(String(l.id))
      );
      console.log('All tests check:', completedTests.length, '/', testLessons.length);
      
      if (completedTests.length < testLessons.length) {
        return {
          isLocked: true,
          reason: 'allTests',
          message: `Финальный тест откроется после прохождения всех тестов курса (${completedTests.length}/${testLessons.length})`
        };
      }
    }

    return { isLocked: false, reason: 'none', message: '' };
  };

  const getCompletedCount = (lockStatus: LockStatus) => {
    if (lockStatus.reason === 'allLessons') {
      const nonTestLessons = courseLessons.filter(l => !l.isFinalTest);
      return nonTestLessons.filter(l => progress?.completedLessonIds.includes(l.id)).length;
    }
    if (lockStatus.reason === 'allTests') {
      const testLessons = courseLessons.filter(l => l.type === 'test' && !l.isFinalTest);
      return testLessons.filter(l => progress?.completedLessonIds.includes(l.id)).length;
    }
    return 0;
  };

  const getTotalCount = (lockStatus: LockStatus) => {
    if (lockStatus.reason === 'allLessons') {
      return courseLessons.filter(l => !l.isFinalTest).length;
    }
    if (lockStatus.reason === 'allTests') {
      return courseLessons.filter(l => l.type === 'test' && !l.isFinalTest).length;
    }
    return 0;
  };

  return {
    getLockStatus,
    getCompletedCount,
    getTotalCount
  };
}
