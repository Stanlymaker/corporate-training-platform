import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface DraftTestsDialogProps {
  open: boolean;
  onClose: () => void;
  testNames: string[];
}

export default function DraftTestsDialog({ open, onClose, testNames }: DraftTestsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Icon name="AlertTriangle" className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Невозможно опубликовать курс</DialogTitle>
              <DialogDescription className="text-base mt-1">
                В курсе есть тесты в статусе "Черновик"
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600 mb-3">
            Опубликуйте следующие тесты перед публикацией курса:
          </p>
          <ul className="space-y-2">
            {testNames.map((name, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Icon name="FileText" className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{name}</span>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full sm:w-auto">
            Понятно
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
