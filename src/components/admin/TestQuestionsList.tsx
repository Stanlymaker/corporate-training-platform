import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Question {
  id: string;
  type: 'single' | 'multiple' | 'text';
  question: string;
  imageUrl?: string;
  points: number;
}

interface TestQuestionsListProps {
  questions: Question[];
  onAddQuestion: () => void;
  onEditQuestion: (question: Question) => void;
  onDeleteQuestion: (questionId: string) => void;
  onReorderQuestion: (questionId: string, direction: 'up' | 'down') => void;
  getQuestionTypeLabel: (type: string) => string;
  isDisabled?: boolean;
}

export default function TestQuestionsList({
  questions,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onReorderQuestion,
  getQuestionTypeLabel,
  isDisabled = false,
}: TestQuestionsListProps) {
  return (
    <Card className="col-span-3 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Icon name="List" size={20} />
          Вопросы теста
        </h2>
        <Button onClick={onAddQuestion} disabled={isDisabled}>
          <Icon name="Plus" className="mr-2" size={16} />
          Добавить вопрос
        </Button>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Icon name="HelpCircle" size={48} className="mx-auto mb-4 opacity-30" />
          <p>Вопросов пока нет. Добавьте первый вопрос.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="group flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1">
                <span className="text-sm font-medium text-gray-500 w-8 mt-1">
                  #{index + 1}
                </span>
                <div className="flex-1">
                  <div className="font-medium mb-2">
                    {question.question || 'Без текста вопроса'}
                  </div>
                  {question.imageUrl && (
                    <div className="mb-2">
                      <img 
                        src={question.imageUrl} 
                        alt="Изображение вопроса" 
                        className="max-h-32 rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {getQuestionTypeLabel(question.type)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {question.points} {question.points === 1 ? 'балл' : 'баллов'}
                    </span>
                    {question.imageUrl && (
                      <Badge variant="outline" className="text-xs">
                        <Icon name="Image" size={12} className="mr-1" />
                        С изображением
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReorderQuestion(question.id, 'up')}
                  disabled={index === 0 || isDisabled}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Icon name="ChevronUp" size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReorderQuestion(question.id, 'down')}
                  disabled={index === questions.length - 1 || isDisabled}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Icon name="ChevronDown" size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditQuestion(question)}
                  disabled={isDisabled}
                >
                  <Icon name="Edit" size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteQuestion(question.id)}
                  disabled={isDisabled}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Icon name="Trash2" size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}