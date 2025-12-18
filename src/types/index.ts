export type UserRole = 'admin' | 'student';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  registrationDate: string;
  lastActive: string;
  position?: string;
  department?: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
}

export interface Course {
  id: number;
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
  prerequisiteCourses?: number[];
  accessType: 'open' | 'closed';
}

export interface Lesson {
  id: number;
  courseId: number;
  title: string;
  content: string;
  type: 'text' | 'video' | 'pdf' | 'quiz' | 'test';
  order: number;
  duration: number;
  videoUrl?: string;
  description: string;
  materials?: LessonMaterial[];
  requiresPrevious?: boolean;
  testId?: number;
  isFinalTest?: boolean;
  finalTestRequiresAllLessons?: boolean;
  finalTestRequiresAllTests?: boolean;
}

export interface LessonMaterial {
  id: number;
  title: string;
  type: 'pdf' | 'doc' | 'link' | 'video';
  url: string;
}

export interface Test {
  id: number;
  courseId: number;
  lessonId?: number;
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
  id: number;
  testId: number;
  type: 'single' | 'multiple' | 'text' | 'matching';
  text: string;
  options?: string[];
  correctAnswer: string | string[];
  points: number;
  order: number;
  matchingPairs?: { left: string; right: string }[];
  textCheckType?: 'manual' | 'automatic';
}

export interface Reward {
  id: number;
  name: string;
  icon: string;
  color: string;
  courseId: number;
  description?: string;
  condition?: string;
  bonuses?: string[];
}

export interface CourseProgress {
  courseId: number;
  userId: number;
  completedLessons: number;
  totalLessons: number;
  testScore?: number;
  completed: boolean;
  earnedRewards: number[];
  completedLessonIds: number[];
  lastAccessedLesson?: number;
  startedAt?: string;
}

export interface CourseAssignment {
  id: number;
  courseId: number;
  userId: number;
  assignedBy: number;
  assignedAt: string;
  dueDate?: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'overdue';
  notes?: string;
}

export interface TestResult {
  id: number;
  userId: number;
  courseId: number;
  testId: number;
  score: number;
  answers: Record<string, string | string[]>;
  completedAt: string;
  passed: boolean;
}