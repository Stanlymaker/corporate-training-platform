export type UserRole = 'admin' | 'student';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  registrationDate: string;
  lastActive: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  duration: number;
  lessonsCount: number;
  category: string;
  image: string;
  published: boolean;
  passScore: number;
  level?: string;
  students?: number;
  rating?: number;
  instructor?: string;
  status?: 'draft' | 'published' | 'archived';
  startDate?: string;
  endDate?: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content: string;
  type: 'text' | 'video' | 'pdf';
  order: number;
  duration: number;
  videoUrl?: string;
  description: string;
}

export interface Test {
  id: string;
  courseId: string;
  title: string;
  description: string;
  passScore: number;
  timeLimit: number;
  attempts: number;
  questionsCount: number;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  testId: string;
  type: 'single' | 'multiple' | 'text';
  text: string;
  options?: string[];
  correctAnswer: string | string[];
  points: number;
  order: number;
}

export interface Reward {
  id: string;
  name: string;
  icon: string;
  color: string;
  courseId: string;
}

export interface CourseProgress {
  courseId: string;
  userId: string;
  completedLessons: number;
  totalLessons: number;
  testScore?: number;
  completed: boolean;
  earnedRewards: string[];
}

export interface TestResult {
  id: string;
  userId: string;
  courseId: string;
  testId: string;
  score: number;
  answers: Record<string, string | string[]>;
  completedAt: string;
  passed: boolean;
}