import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';
import { Reward, Course } from '@/types';
import RewardStatsCards from '@/components/admin/rewards/RewardStatsCards';
import RewardCard from '@/components/admin/rewards/RewardCard';
import CreateRewardDialog from '@/components/admin/rewards/CreateRewardDialog';
import EditRewardDialog from '@/components/admin/rewards/EditRewardDialog';

export default function Rewards() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<(Reward & { earnedCount: number }) | null>(null);
  const [rewards, setRewards] = useState<(Reward & { earnedCount: number })[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleCreateReward = async (rewardData: {
    name: string;
    courseId: string;
    description: string;
    icon: string;
    color: string;
  }) => {
    try {
      const response = await fetch(API_ENDPOINTS.REWARDS, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: rewardData.name,
          icon: rewardData.icon,
          color: rewardData.color,
          course_id: rewardData.courseId,
          description: rewardData.description || null,
        }),
      });

      if (response.ok) {
        setIsAddDialogOpen(false);
        await loadRewards();
      }
    } catch (error) {
      console.error('Error creating reward:', error);
    }
  };

  const handleEditReward = (reward: Reward & { earnedCount: number }) => {
    setEditingReward(reward);
    setIsEditDialogOpen(true);
  };

  const handleUpdateReward = async (rewardData: {
    id: string;
    name: string;
    description: string | null;
    icon: string;
    color: string;
  }) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.REWARDS}?id=${rewardData.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: rewardData.name,
          icon: rewardData.icon,
          color: rewardData.color,
          description: rewardData.description,
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
            <h1 className="text-3xl font-bold text-gray-900">Управление наградами</h1>
          </div>
          <CreateRewardDialog
            isOpen={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            courses={courses}
            onCreateReward={handleCreateReward}
          />
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
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  course={course}
                  onEdit={handleEditReward}
                  onDelete={handleDeleteReward}
                />
              );
            })}
          </div>
        )}

        <EditRewardDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          reward={editingReward}
          onUpdateReward={handleUpdateReward}
        />
      </div>
    </AdminLayout>
  );
}