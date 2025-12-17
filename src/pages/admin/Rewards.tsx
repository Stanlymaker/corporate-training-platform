import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { mockCourses, mockRewards, mockProgress } from '@/data/mockData';

export default function Rewards() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<any>(null);
  const [selectedIcon, setSelectedIcon] = useState('🏆');
  const [selectedColor, setSelectedColor] = useState('#F97316');

  const icons = ['🏆', '🎯', '💎', '📊', '💰', '🚀', '⭐', '🎓', '👑', '🔥', '💪', '🌟'];
  const colors = [
    { name: 'Оранжевый', value: '#F97316' },
    { name: 'Синий', value: '#3B82F6' },
    { name: 'Зеленый', value: '#10B981' },
    { name: 'Фиолетовый', value: '#8B5CF6' },
    { name: 'Розовый', value: '#EC4899' },
    { name: 'Желтый', value: '#FBBF24' },
  ];

  const rewardStats = mockRewards.map(reward => {
    const earnedCount = mockProgress.filter(p => p.earnedRewards.includes(reward.id)).length;
    return { ...reward, earnedCount };
  });

  const handleEditReward = (reward: any) => {
    setEditingReward(reward);
    setSelectedIcon(reward.icon);
    setSelectedColor(reward.color);
    setIsEditDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Управление наградами</h1>
            <p className="text-gray-600">Создавайте и настраивайте награды за достижения студентов</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                <Icon name="Plus" className="mr-2" size={18} />
                Создать награду
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Создать новую награду</DialogTitle>
                <DialogDescription>
                  Добавьте новую награду за прохождение курса
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div>
                  <Label htmlFor="reward-name">Название награды</Label>
                  <Input
                    id="reward-name"
                    placeholder="Например: Эксперт по маркетингу"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Курс</Label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Выберите курс" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockCourses.map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Выберите иконку</Label>
                  <div className="grid grid-cols-6 gap-2 mt-2">
                    {icons.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setSelectedIcon(icon)}
                        className={`aspect-square text-4xl rounded-lg border-2 transition-all ${
                          selectedIcon === icon
                            ? 'border-orange-500 bg-orange-50 scale-110'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Выберите цвет</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {colors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setSelectedColor(color.value)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedColor === color.value
                            ? 'border-gray-900 scale-105'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: color.value + '20' }}
                      >
                        <div
                          className="w-full h-8 rounded"
                          style={{ backgroundColor: color.value }}
                        />
                        <div className="text-sm font-medium text-gray-700 mt-2">{color.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-gray-50 rounded-xl">
                  <Label className="mb-3 block">Предпросмотр</Label>
                  <div className="flex items-center justify-center">
                    <div
                      className="w-32 h-32 rounded-2xl flex items-center justify-center text-6xl border-4"
                      style={{
                        backgroundColor: selectedColor + '20',
                        borderColor: selectedColor,
                      }}
                    >
                      {selectedIcon}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Отмена
                </Button>
                <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                  Создать награду
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Icon name="Award" className="text-orange-600" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{mockRewards.length}</div>
                  <div className="text-sm text-gray-600">Всего наград</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Icon name="Users" className="text-green-600" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {mockProgress.reduce((sum, p) => sum + p.earnedRewards.length, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Получено студентами</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Icon name="BookOpen" className="text-purple-600" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{mockCourses.length}</div>
                  <div className="text-sm text-gray-600">Курсов с наградами</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Trophy" size={20} />
              Список наград
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewardStats.map((reward) => {
                const course = mockCourses.find(c => c.id === reward.courseId);
                
                return (
                  <Card
                    key={reward.id}
                    className="border-2 border-gray-200 hover:border-orange-300 transition-all hover:shadow-lg"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        <div
                          className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl mb-4 border-4"
                          style={{
                            backgroundColor: reward.color + '20',
                            borderColor: reward.color,
                          }}
                        >
                          {reward.icon}
                        </div>
                        
                        <h3 className="font-bold text-lg text-gray-900 mb-2">{reward.name}</h3>
                        
                        {course && (
                          <Badge variant="secondary" className="mb-3">
                            {course.title}
                          </Badge>
                        )}

                        <div className="w-full p-3 bg-gray-50 rounded-lg mb-4">
                          <div className="text-2xl font-bold text-orange-600">{reward.earnedCount}</div>
                          <div className="text-xs text-gray-600">Получили студентов</div>
                        </div>

                        <div className="flex gap-2 w-full">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleEditReward(reward)}
                          >
                            <Icon name="Edit" size={14} />
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 text-red-600">
                            <Icon name="Trash2" size={14} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Редактировать награду</DialogTitle>
              <DialogDescription>
                Измените параметры награды
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div>
                <Label htmlFor="edit-reward-name">Название награды</Label>
                <Input
                  id="edit-reward-name"
                  defaultValue={editingReward?.name}
                  placeholder="Например: Эксперт по маркетингу"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Курс</Label>
                <Select defaultValue={editingReward?.courseId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Выберите курс" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCourses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Выберите иконку</Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {icons.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setSelectedIcon(icon)}
                      className={`aspect-square text-4xl rounded-lg border-2 transition-all ${
                        selectedIcon === icon
                          ? 'border-orange-500 bg-orange-50 scale-110'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Выберите цвет</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedColor(color.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedColor === color.value
                          ? 'border-gray-900 scale-105'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ backgroundColor: color.value + '20' }}
                    >
                      <div
                        className="w-full h-8 rounded"
                        style={{ backgroundColor: color.value }}
                      />
                      <div className="text-sm font-medium text-gray-700 mt-2">{color.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-xl">
                <Label className="mb-3 block">Предпросмотр</Label>
                <div className="flex items-center justify-center">
                  <div
                    className="w-32 h-32 rounded-2xl flex items-center justify-center text-6xl border-4"
                    style={{
                      backgroundColor: selectedColor + '20',
                      borderColor: selectedColor,
                    }}
                  >
                    {selectedIcon}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Отмена
              </Button>
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                Сохранить изменения
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}