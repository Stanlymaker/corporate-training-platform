import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RevokeAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  courseTitle: string;
  hasProgress: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function RevokeAccessDialog({
  open,
  onOpenChange,
  userName,
  courseTitle,
  hasProgress,
  onConfirm,
  onCancel
}: RevokeAccessDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon name="AlertTriangle" size={24} className="text-orange-500" />
            Отзыв доступа к курсу
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p>
              Вы собираетесь отозвать доступ пользователя <strong>{userName}</strong> к курсу <strong>"{courseTitle}"</strong>.
            </p>
            {hasProgress && (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icon name="AlertCircle" size={20} className="text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="font-semibold text-orange-900">
                      ⚠️ Будет сброшен весь прогресс!
                    </p>
                    <p className="text-sm text-orange-800">
                      У пользователя есть прогресс по этому курсу. При отзыве доступа:
                    </p>
                    <ul className="text-sm text-orange-800 list-disc list-inside space-y-1 ml-2">
                      <li>Все пройденные уроки будут сброшены</li>
                      <li>Результаты тестов будут удалены</li>
                      <li>Статус курса станет "Не начат"</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            <p className="text-sm text-gray-600">
              Это действие нельзя отменить. Продолжить?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            <Icon name="Trash2" size={14} className="mr-2" />
            Отозвать и сбросить прогресс
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
