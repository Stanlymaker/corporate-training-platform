import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Lesson {
  id: number;
  title: string;
  type: 'video' | 'text' | 'test';
  duration: number;
  content?: string;
  videoUrl?: string;
  testId?: number;
  order: number;
}

interface CourseSummaryProps {
  lessons: Lesson[];
  totalDuration: number;
  formData: {
    status: 'draft' | 'published' | 'archived';
    accessType: 'open' | 'closed';
    testId?: number;
  };
}

export default function CourseSummary({ lessons, totalDuration, formData }: CourseSummaryProps) {
  const videoCount = lessons.filter(l => l.type === 'video').length;
  const textCount = lessons.filter(l => l.type === 'text').length;
  const testCount = lessons.filter(l => l.type === 'test').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="p-6 h-fit sticky top-6 border-0 shadow-md">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Icon name="BarChart" size={20} />
        Сводка курса
      </h2>

      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Статус публикации:</span>
            <Badge variant="outline" className={getStatusColor(formData.status)}>
              {formData.status === 'published' ? 'Опубликован' : 
               formData.status === 'draft' ? 'Черновик' : 'Архив'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Тип доступа:</span>
            <Badge variant="outline" className={formData.accessType === 'open' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}>
              <Icon name={formData.accessType === 'open' ? 'Unlock' : 'Lock'} size={12} className="mr-1" />
              {formData.accessType === 'open' ? 'Открытый' : 'Закрытый'}
            </Badge>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Всего уроков:</span>
            <span className="font-bold text-gray-900">{lessons.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Общая длительность:</span>
            <span className="font-bold text-gray-900">{totalDuration} мин</span>
          </div>
        </div>

        {lessons.length > 0 && (
          <div className="border-t pt-4 space-y-2">
            <p className="text-xs font-medium text-gray-500 mb-3">СОСТАВ УРОКОВ</p>
            {videoCount > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Icon name="Video" size={16} className="text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-700">Видео</span>
                </div>
                <span className="font-semibold text-gray-900">{videoCount}</span>
              </div>
            )}
            {textCount > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <Icon name="FileText" size={16} className="text-green-600" />
                  </div>
                  <span className="text-sm text-gray-700">Текст</span>
                </div>
                <span className="font-semibold text-gray-900">{textCount}</span>
              </div>
            )}
            {testCount > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Icon name="ClipboardList" size={16} className="text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-700">Тесты</span>
                </div>
                <span className="font-semibold text-gray-900">{testCount}</span>
              </div>
            )}
          </div>
        )}



        <div className="border-t pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Icon name="Info" size={16} className="text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-700">
                {formData.accessType === 'open' 
                  ? 'Курс будет доступен всем студентам после публикации' 
                  : 'Для доступа к курсу потребуется назначение администратором в разделе "Назначения"'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}