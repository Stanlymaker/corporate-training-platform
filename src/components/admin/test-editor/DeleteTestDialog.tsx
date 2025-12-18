import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

interface DeleteTestDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  testTitle: string;
  questionsCount: number;
  loading: boolean;
  onConfirm: () => void;
}

export default function DeleteTestDialog({
  isOpen,
  onOpenChange,
  testTitle,
  questionsCount,
  loading,
  onConfirm,
}: DeleteTestDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Icon name="AlertTriangle" className="text-red-600" size={24} />
            </div>
            <DialogTitle>Удалить тест?</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Вы действительно хотите удалить тест <span className="font-semibold text-gray-900">"{testTitle}"</span>?
            <br /><br />
            Это действие нельзя отменить. Тест и все его вопросы ({questionsCount}) будут удалены безвозвратно.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="flex-1">
            Отмена
          </Button>
          <Button 
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            <Icon name="Trash2" className="mr-2" size={16} />
            {loading ? 'Удаление...' : 'Удалить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
