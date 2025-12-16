export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    COURSES: '/admin/courses',
    USERS: '/admin/users',
    TESTS: '/admin/tests',
    REWARDS: '/admin/rewards',
    ANALYTICS: '/admin/analytics',
    MEDIA: '/admin/media',
    LOGS: '/admin/logs',
  },
  STUDENT: {
    DASHBOARD: '/student/dashboard',
    COURSES: '/student/courses',
    COURSE_DETAIL: '/student/courses/:id',
    TEST: '/student/test/:id',
    PROFILE: '/student/profile',
    REWARDS: '/student/rewards',
    PROGRESS: '/student/progress',
  },
} as const;