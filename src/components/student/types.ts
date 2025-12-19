export interface Course {
  id: number;
  title: string;
  description: string;
}

export interface Lesson {
  id: string;
  courseId: number;
  title: string;
  description: string;
  content: string;
  type: string;
  order: number;
  duration: number;
  videoUrl?: string;
  requiresPrevious?: boolean;
  testId?: number;
  materials?: Array<{
    id: number;
    title: string;
    type: string;
    url: string;
  }>;
}

export interface Test {
  id: number;
  title: string;
  description: string;
  passingScore: number;
  timeLimit: number;
  questionsCount: number;
  questions: TestQuestion[];
}

export interface TestQuestion {
  id: number;
  type: string;
  question: string;
  options: string[];
  correctAnswer: number | number[] | string;
  points: number;
  imageUrl?: string;
  matchingPairs?: Array<{ left: string; right: string }>;
}

export interface CourseProgress {
  courseId: number;
  userId: number;
  completedLessons: number;
  totalLessons: number;
  completedLessonIds: string[];
  lastAccessedLesson: string | null;
}