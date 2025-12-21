export type LogLevel = 'info' | 'warning' | 'error' | 'success';

export type LogAction = 
  | 'user.login'
  | 'user.logout'
  | 'user.register'
  | 'user.update'
  | 'user.failed_login'
  | 'course.create'
  | 'course.update'
  | 'course.delete'
  | 'course.publish'
  | 'course.complete'
  | 'lesson.create'
  | 'lesson.update'
  | 'lesson.delete'
  | 'test.create'
  | 'test.update'
  | 'test.delete'
  | 'test.submit'
  | 'reward.earned'
  | 'media.upload'
  | 'media.delete'
  | 'system.error'
  | 'api.request'
  | 'api.error';

export interface SystemLog {
  id: number;
  timestamp: string;
  level: LogLevel;
  action: LogAction;
  userId?: number;
  userName?: string;
  message: string;
  details?: string;
  metadata?: {
    ip?: string;
    userAgent?: string;
    path?: string;
    method?: string;
    statusCode?: number;
    error?: string;
    [key: string]: any;
  };
}