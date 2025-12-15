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
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content: string;
  type: 'text' | 'video' | 'pdf';
  order: number;
}

export interface Test {
  id: string;
  courseId: string;
  title: string;
  questions: Question[];
  passScore: number;
  attempts: number;
}

export interface Question {
  id: string;
  type: 'single' | 'multiple' | 'text' | 'match';
  text: string;
  options?: string[];
  correctAnswer: string | string[];
  points: number;
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