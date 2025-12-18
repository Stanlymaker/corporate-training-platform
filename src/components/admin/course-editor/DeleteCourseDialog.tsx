import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface DeleteCourseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  courseTitle: string;
  lessonsCount: number;
  loading: boolean;
  onConfirm: () => void;
}

export default function DeleteCourseDialog({
  isOpen,
  onOpenChange,
  courseTitle,
  lessonsCount,
  loading,
  onConfirm,
}: DeleteCourseDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Icon name="AlertTriangle" size={24} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Удалить курс?
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Вы собираетесь удалить курс <span className="font-semibold">"{courseTitle}"</span>
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-red-800 font-medium mb-2">
                ⚠️ Это действие необратимо!
              </p>
              <p className="text-xs text-red-700">
                Будет удалено:
              </p>
              <ul className="text-xs text-red-700 list-disc list-inside mt-1">
                <li>{lessonsCount} {lessonsCount === 1 ? 'урок' : lessonsCount < 5 ? 'урока' : 'уроков'}</li>
                <li>Весь прогресс студентов по этому курсу</li>
                <li>Привязки к тестам</li>
              </ul>
            </div>
            
            <p className="text-xs text-gray-500">
              Сами тесты не будут удалены и останутся доступными для использования в других курсах.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Удаление...' : 'Удалить курс'}
          </Button>
        </div>
      </div>
    </div>
  );
}
