export type UserRole = 'admin' | 'student';

export interface User {
  id: string;
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
  prerequisiteCourses?: string[];
  accessType: 'open' | 'closed';
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content: string;
  type: 'text' | 'video' | 'pdf' | 'quiz' | 'test';
  order: number;
  duration: number;
  videoUrl?: string;
  description: string;
  materials?: LessonMaterial[];
  requiresPrevious?: boolean;
  testId?: string;
  isFinalTest?: boolean;
  finalTestRequiresAllLessons?: boolean;
  finalTestRequiresAllTests?: boolean;
}

export interface LessonMaterial {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'link' | 'video';
  url: string;
}

export interface Test {
  id: string;
  courseId: string;
  lessonId?: string;
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
  id: string;
  name: string;
  icon: string;
  color: string;
  courseId: string;
  description?: string;
  condition?: string;
  bonuses?: string[];
}

export interface CourseProgress {
  courseId: string;
  userId: string;
  completedLessons: number;
  totalLessons: number;
  testScore?: number;
  completed: boolean;
  earnedRewards: string[];
  completedLessonIds: string[];
  lastAccessedLesson?: string;
  startedAt?: string;
}

export interface CourseAssignment {
  id: string;
  courseId: string;
  userId: string;
  assignedBy: string;
  assignedAt: string;
  dueDate?: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'overdue';
  notes?: string;
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