import { Card } from '@/components/ui/card';
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
}

export default function CourseSummary({ lessons, totalDuration }: CourseSummaryProps) {
  const videoCount = lessons.filter(l => l.type === 'video').length;
  const textCount = lessons.filter(l => l.type === 'text').length;
  const testCount = lessons.filter(l => l.type === 'test').length;

  return (
    <Card className="p-6 h-fit sticky top-6">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Icon name="BarChart" size={20} />
        Сводка курса
      </h2>

      <div className="space-y-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Всего уроков:</span>
          <span className="font-bold">{lessons.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Общая длительность:</span>
          <span className="font-bold">{totalDuration} мин</span>
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
      </div>
    </Card>
  );
}
