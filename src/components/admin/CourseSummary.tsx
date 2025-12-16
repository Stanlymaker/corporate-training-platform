import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'test';
  duration: number;
  content?: string;
  videoUrl?: string;
  testId?: string;
  order: number;
}

interface CourseSummaryProps {
  lessons: Lesson[];
  totalDuration: number;
  formData: {
    status: 'draft' | 'published' | 'archived';
    startDate: string;
    endDate: string;
  };
}

export default function CourseSummary({ lessons, totalDuration, formData }: CourseSummaryProps) {
  const videoCount = lessons.filter(l => l.type === 'video').length;
  const textCount = lessons.filter(l => l.type === 'text').length;
  const testCount = lessons.filter(l => l.type === 'test').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'не указано';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <Card className="p-6 h-fit sticky top-6">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Icon name="BarChart" size={20} />
        Сводка курса
      </h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Статус:</span>
          <Badge className={getStatusColor(formData.status)}>
            {formData.status === 'published' ? 'Опубликован' : 
             formData.status === 'draft' ? 'Черновик' : 'Архив'}
          </Badge>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Всего уроков:</span>
            <span className="font-bold">{lessons.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Общая длительность:</span>
            <span className="font-bold">{totalDuration} мин</span>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="Video" size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">Видео</span>
            </div>
            <span className="font-medium">{videoCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="FileText" size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">Текст</span>
            </div>
            <span className="font-medium">{textCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="ClipboardList" size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">Тесты</span>
            </div>
            <span className="font-medium">{testCount}</span>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Начало:</span>
            <span className="font-medium">{formatDate(formData.startDate)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Окончание:</span>
            <span className="font-medium">{formatDate(formData.endDate)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}