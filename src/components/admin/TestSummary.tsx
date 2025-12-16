import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface Question {
  id: string;
  type: 'single' | 'multiple' | 'text';
  question: string;
  points: number;
}

interface TestSummaryProps {
  questions: Question[];
  totalPoints: number;
}

export default function TestSummary({ questions, totalPoints }: TestSummaryProps) {
  const singleChoiceCount = questions.filter(q => q.type === 'single').length;
  const multipleChoiceCount = questions.filter(q => q.type === 'multiple').length;
  const textCount = questions.filter(q => q.type === 'text').length;

  return (
    <Card className="p-6 h-fit sticky top-6">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Icon name="BarChart" size={20} />
        Статистика теста
      </h2>

      <div className="space-y-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Всего вопросов:</span>
          <span className="font-bold">{questions.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Максимальный балл:</span>
          <span className="font-bold">{totalPoints}</span>
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="Circle" size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">Один вариант</span>
            </div>
            <span className="font-medium">{singleChoiceCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="CheckSquare" size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">Множественный</span>
            </div>
            <span className="font-medium">{multipleChoiceCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="Type" size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">Текстовый</span>
            </div>
            <span className="font-medium">{textCount}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
