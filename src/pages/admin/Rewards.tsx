import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';
import { Reward, Course } from '@/types';

export default function Rewards() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [selectedIcon, setSelectedIcon] = useState('🏆');
  const [selectedColor, setSelectedColor] = useState('#F97316');
  const [rewards, setRewards] = useState<(Reward & { earnedCount: number })[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReward, setNewReward] = useState({
    name: '',
    courseId: '',
    description: '',
  });

  const icons = ['🏆', '🎯', '💎', '📊', '💰', '🚀', '⭐', '🎓', '👑', '🔥', '💪', '🌟'];
  const colors = [
    { name: 'Оранжевый', value: '#F97316' },
    { name: 'Синий', value: '#3B82F6' },
    { name: 'Зеленый', value: '#10B981' },
    { name: 'Фиолетовый', value: '#8B5CF6' },
    { name: 'Розовый', value: '#EC4899' },
    { name: 'Желтый', value: '#FBBF24' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadRewards(), loadCourses()]);
    setLoading(false);
  };

  const loadRewards = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.REWARDS, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setRewards(data.rewards || []);
      }
    } catch (error) {
      console.error('Error loading rewards:', error);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.COURSES, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const handleCreateReward = async () => {
    if (!newReward.name || !newReward.courseId) return;

    try {
      const response = await fetch(API_ENDPOINTS.REWARDS, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newReward.name,
          icon: selectedIcon,
          color: selectedColor,
          course_id: newReward.courseId,
          description: newReward.description || null,
        }),
      });

      if (response.ok) {
        setIsAddDialogOpen(false);
        setNewReward({ name: '', courseId: '', description: '' });
        setSelectedIcon('🏆');
        setSelectedColor('#F97316');
        await loadRewards();
      }
    } catch (error) {
      console.error('Error creating reward:', error);
    }
  };

  const handleEditReward = (reward: Reward & { earnedCount: number }) => {
    setEditingReward(reward);
    setSelectedIcon(reward.icon);
    setSelectedColor(reward.color);
    setIsEditDialogOpen(true);
  };

  const handleUpdateReward = async () => {
    if (!editingReward) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.REWARDS}?id=${editingReward.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editingReward.name,
          icon: selectedIcon,
          color: selectedColor,
          description: editingReward.description || null,
        }),
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        setEditingReward(null);
        await loadRewards();
      }
    } catch (error) {
      console.error('Error updating reward:', error);
    }
  };

  const handleDeleteReward = async (rewardId: string) => {
    if (!confirm('Удалить награду?')) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.REWARDS}?id=${rewardId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        await loadRewards();
      }
    } catch (error) {
      console.error('Error deleting reward:', error);
    }
  };

  const totalEarned = rewards.reduce((sum, r) => sum + r.earnedCount, 0);

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
                  <Label htmlFor="reward-description">Описание (опционально)</Label>
                  <Textarea
                    id="reward-description"
                    placeholder="Краткое описание награды"
                    className="mt-1"
                    value={newReward.description}
                    onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                  />
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
                <Button 
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                  onClick={handleCreateReward}
                  disabled={!newReward.name || !newReward.courseId}
                >
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
                  <div className="text-2xl font-bold text-gray-900">{rewards.length}</div>
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
                  <div className="text-2xl font-bold text-gray-900">{totalEarned}</div>
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
                  <div className="text-2xl font-bold text-gray-900">{courses.length}</div>
                  <div className="text-sm text-gray-600">Курсов с наградами</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Icon name="Loader2" className="animate-spin" size={32} />
          </div>
        ) : rewards.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon name="Award" className="text-orange-400" size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Наград пока нет</h3>
              <p className="text-gray-600 mb-6">Создайте первую награду для мотивации студентов</p>
              <Button 
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Icon name="Plus" className="mr-2" size={18} />
                Создать награду
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => {
              const course = courses.find(c => c.id === reward.courseId);
              
              return (
                <Card key={reward.id} className="border-0 shadow-md hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl border-4"
                        style={{
                          backgroundColor: reward.color + '20',
                          borderColor: reward.color,
                        }}
                      >
                        {reward.icon}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditReward(reward)}
                        >
                          <Icon name="Edit" size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteReward(reward.id)}
                        >
                          <Icon name="Trash2" size={16} />
                        </Button>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2">{reward.name}</h3>
                    
                    {reward.description && (
                      <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Icon name="BookOpen" size={14} />
                        <span>{course?.title || 'Курс не найден'}</span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <Icon name="Users" size={16} className="text-green-600" />
                          <span className="text-sm font-medium text-gray-900">
                            {reward.earnedCount} студентов
                          </span>
                        </div>
                        <Badge className="bg-orange-100 text-orange-700">
                          За курс
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Редактировать награду</DialogTitle>
              <DialogDescription>
                Измените параметры награды
              </DialogDescription>
            </DialogHeader>
            {editingReward && (
              <div className="space-y-6 py-4">
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
                  <Label htmlFor="edit-reward-description">Описание</Label>
                  <Textarea
                    id="edit-reward-description"
                    className="mt-1"
                    value={editingReward.description || ''}
                    onChange={(e) => setEditingReward({ ...editingReward, description: e.target.value })}
                  />
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
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Отмена
              </Button>
              <Button 
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                onClick={handleUpdateReward}
              >
                Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
