import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Reward, Course } from '@/types';

interface EditRewardDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  reward: (Reward & { earnedCount: number }) | null;
  courses: Course[];
  onUpdateReward: (rewardData: {
    id: string;
    name: string;
    courseId: string;
    description: string | null;
    icon: string;
    color: string;
  }) => void;
}

export default function EditRewardDialog({ 
  isOpen, 
  onOpenChange, 
  reward,
  courses,
  onUpdateReward 
}: EditRewardDialogProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingReward, setEditingReward] = useState<(Reward & { earnedCount: number }) | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('svg')) {
      alert('Пожалуйста, загрузите SVG файл');
      return;
    }

    setUploadingImage(true);
    const fakeUrl = URL.createObjectURL(file);
    setTimeout(() => {
      setImageUrl(fakeUrl);
      setUploadingImage(false);
    }, 500);
  };

  useEffect(() => {
    if (reward) {
      setEditingReward(reward);
      setImageUrl(reward.icon);
    }
  }, [reward]);

  const handleUpdate = () => {
    if (!editingReward || !imageUrl || !editingReward.courseId) return;
    
    onUpdateReward({
      id: editingReward.id,
      name: editingReward.name,
      courseId: editingReward.courseId,
      description: null,
      icon: imageUrl,
      color: '#F97316',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать награду</DialogTitle>
          <DialogDescription>
            Измените название или изображение награды
          </DialogDescription>
        </DialogHeader>
        {editingReward && (
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-reward-name">Название награды</Label>
              <Input
                id="edit-reward-name"
                className="mt-1"
                value={editingReward.name}
                onChange={(e) => setEditingReward({ ...editingReward, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Курс</Label>
              <Select 
                value={editingReward.courseId} 
                onValueChange={(value) => setEditingReward({ ...editingReward, courseId: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Выберите курс" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Изображение награды (SVG)</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept=".svg,image/svg+xml"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="edit-reward-image-upload"
                  disabled={uploadingImage}
                />
                <label htmlFor="edit-reward-image-upload">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-orange-500 transition-colors">
                    {uploadingImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <Icon name="Loader2" className="animate-spin text-gray-400" size={32} />
                        <p className="text-sm text-gray-600">Загрузка...</p>
                      </div>
                    ) : imageUrl ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-32 h-32 flex items-center justify-center">
                          <img src={imageUrl} alt="Награда" className="max-w-full max-h-full" />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            document.getElementById('edit-reward-image-upload')?.click();
                          }}
                        >
                          <Icon name="Upload" className="mr-2" size={14} />
                          Изменить изображение
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Icon name="Upload" size={32} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-1">Нажмите для загрузки SVG изображения</p>
                        <p className="text-xs text-gray-500">Рекомендуемый размер: 128x128px</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button 
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            onClick={handleUpdate}
          >
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}