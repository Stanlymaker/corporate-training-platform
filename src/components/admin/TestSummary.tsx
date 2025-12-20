import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Question {
  id: string;
  type: 'single' | 'multiple' | 'text' | 'matching';
  question: string;
  points: number;
}

interface TestSummaryProps {
  questions: Question[];
  totalPoints: number;
  formData: {
    status: 'draft' | 'published' | 'archived';
    passScore: number;
    timeLimit: number;
    attempts: number;
  };
}

export default function TestSummary({ questions, totalPoints, formData }: TestSummaryProps) {
  const singleChoiceCount = questions.filter(q => q.type === 'single').length;
  const multipleChoiceCount = questions.filter(q => q.type === 'multiple').length;
  const textCount = questions.filter(q => q.type === 'text').length;
  const matchingCount = questions.filter(q => q.type === 'matching').length;

  const getStatusColor = (status: string) => {
    if (status === 'published') return 'bg-green-100 text-green-800';
    if (status === 'archived') return 'bg-gray-100 text-gray-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    <Card className="p-6 h-fit sticky top-6">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Icon name="BarChart" size={20} />
        Статистика теста
      </h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Статус:</span>
          <Badge className={getStatusColor(formData.status)}>
            {formData.status === 'published' ? 'Опубликован' : formData.status === 'archived' ? 'Архивирован' : 'Черновик'}
          </Badge>
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Всего вопросов:</span>
            <span className="font-bold">{questions.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Максимальный балл:</span>
            <span className="font-bold">{totalPoints}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Проходной балл:</span>
            <span className="font-bold">{formData.passScore}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Время на тест:</span>
            <span className="font-bold">{formData.timeLimit} мин</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Попыток:</span>
            <span className="font-bold">{formData.attempts}</span>
          </div>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="GitMerge" size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">Сопоставление</span>
            </div>
            <span className="font-medium">{matchingCount}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}