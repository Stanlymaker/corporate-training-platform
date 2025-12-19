import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { Course } from '@/types';
import { uploadImage } from '@/utils/uploadImage';

interface CreateRewardDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Course[];
  onCreateReward: (rewardData: {
    name: string;
    courseId: string;
    description: string;
    icon: string;
    color: string;
  }) => void;
}

export default function CreateRewardDialog({ 
  isOpen, 
  onOpenChange, 
  courses, 
  onCreateReward 
}: CreateRewardDialogProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newReward, setNewReward] = useState({
    name: '',
    courseId: '',
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('image')) {
      alert('Пожалуйста, загрузите изображение');
      return;
    }

    setUploadingImage(true);
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      alert('Не удалось загрузить изображение');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreate = () => {
    if (!newReward.name || !newReward.courseId || !imageUrl) return;
    
    onCreateReward({
      ...newReward,
      description: '',
      icon: imageUrl,
      color: '#F97316',
    });

    setNewReward({ name: '', courseId: '' });
    setImageUrl('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
          <Icon name="Plus" className="mr-2" size={18} />
          Создать награду
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создать новую награду</DialogTitle>
          <DialogDescription>
            Награда будет автоматически выдана при завершении курса
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="reward-name">Название награды</Label>
            <Input
              id="reward-name"
              placeholder="Например: Эксперт по маркетингу"
              className="mt-1"
              value={newReward.name}
              onChange={(e) => setNewReward({ ...newReward, name: e.target.value })}
            />
          </div>

          <div>
            <Label>Курс</Label>
            <Select value={newReward.courseId} onValueChange={(value) => setNewReward({ ...newReward, courseId: value })}>
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
            <Label>Изображение награды</Label>
            <div className="mt-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="reward-image-upload"
                disabled={uploadingImage}
              />
              <label htmlFor="reward-image-upload">
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
                          setImageUrl('');
                        }}
                      >
                        <Icon name="Trash2" className="mr-2" size={14} />
                        Удалить
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button 
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            onClick={handleCreate}
            disabled={!newReward.name || !newReward.courseId || !imageUrl || uploadingImage}
          >
            Создать награду
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}