import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { useState, useEffect } from 'react';
import UserFilters, { FilterState } from '@/components/admin/UserFilters';
import UserDetailsModal from '@/components/admin/UserDetailsModal';
import AddUserModal, { NewUserData } from '@/components/admin/AddUserModal';
import { User, CourseAssignment } from '@/types';
import { API_ENDPOINTS, getAuthHeaders } from '@/config/api';

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    role: 'all',
    registrationDateFrom: '',
    registrationDateTo: '',
    activityStatus: 'all',
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
    loadAssignments();
    loadCourses();
    loadProgress();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.USERS, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        const formattedUsers = data.users.map((u: any) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          position: u.position,
          department: u.department,
          phone: u.phone,
          avatar: u.avatar,
          isActive: u.isActive,
          registrationDate: new Date(u.registrationDate).toLocaleDateString('ru-RU'),
          lastActive: formatLastActive(u.lastActive),
        }));
        setUsers(formattedUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.ASSIGNMENTS, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.COURSES, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        // Фильтруем только опубликованные курсы (без черновиков)
        const publishedCourses = (data.courses || []).filter((c: any) => c.published !== false);
        setCourses(publishedCourses);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadProgress = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.PROGRESS, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setProgressData(data.progress || []);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const formatLastActive = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} минут назад`;
    if (diffHours < 24) return `${diffHours} часов назад`;
    if (diffDays < 30) return `${diffDays} дней назад`;
    return `${Math.floor(diffDays / 30)} месяц назад`;
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filters.role === 'all' || user.role === filters.role;

    let matchesActivity = true;
    if (filters.activityStatus === 'active') {
      matchesActivity = user.lastActive.includes('часов') || user.lastActive.includes('минут');
    } else if (filters.activityStatus === 'inactive') {
      matchesActivity = user.lastActive.includes('месяц');
    }

    return matchesSearch && matchesRole && matchesActivity;
  });

  const getUserProgress = (userId: number) => {
    // Получаем весь прогресс пользователя
    const userProgress = progressData.filter(p => p.userId === userId);
    
    // Получаем назначенные закрытые курсы для пользователя
    const userAssignedClosedCourses = assignments
      .filter(a => a.userId === userId)
      .map(a => a.courseId);
    
    // Доступные опубликованные курсы
    const availablePublishedCourses = courses.filter(c => 
      c.published !== false && (c.accessType === 'open' || userAssignedClosedCourses.includes(c.id))
    );
    const availablePublishedCourseIds = availablePublishedCourses.map(c => c.id);
    
    // Считаем только прогресс по опубликованным доступным курсам
    const relevantProgress = userProgress.filter(p => 
      availablePublishedCourseIds.includes(p.courseId)
    );
    
    // Считаем завершенные курсы (проверяем completed ИЛИ все уроки пройдены)
    const completed = relevantProgress.filter(p => 
      p.completed === true || (p.completedLessons >= p.totalLessons && p.totalLessons > 0)
    ).length;
    
    const total = availablePublishedCourses.length;
    
    return { total, completed };
  };

  const getUserAssignments = (userId: number) => {
    return assignments.filter(a => a.userId === userId);
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleEditRole = async (userId: number, newRole: 'admin' | 'student') => {
    try {
      const response = await fetch(`${API_ENDPOINTS.USERS}?id=${userId}&action=role`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        setSelectedUser((prev) => (prev && prev.id === userId ? { ...prev, role: newRole } : prev));
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleAddUser = async (userData: NewUserData) => {
    try {
      const response = await fetch(API_ENDPOINTS.USERS, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: userData.email,
          name: userData.name,
          role: userData.role,
          password: userData.password,
          position: userData.position,
          department: userData.department,
          phone: userData.phone,
        }),
      });

      if (response.ok) {
        await loadUsers();
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleEditPassword = async (userId: number, newPassword: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.USERS}?id=${userId}&action=password`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ password: newPassword }),
      });

      if (response.ok) {
        console.log('Пароль успешно изменен');
      }
    } catch (error) {
      console.error('Error updating password:', error);
    }
  };

  const handleEditUser = async (userId: number, userData: Partial<User>) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.USERS}?id=${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: userData.name,
          position: userData.position,
          department: userData.department,
          phone: userData.phone,
          avatar: userData.avatar,
        }),
      });

      if (response.ok) {
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u.id === userId ? { ...u, ...userData } : u))
        );
        setSelectedUser((prev) => (prev && prev.id === userId ? { ...prev, ...userData } : prev));
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.USERS}?id=${userId}&action=toggle`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        setUsers((prevUsers) =>
          prevUsers.map((u) => (u.id === userId ? { ...u, isActive } : u))
        );
        setSelectedUser((prev) => (prev && prev.id === userId ? { ...prev, isActive } : prev));
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleAssignCourse = async (userId: number, courseId: number) => {
    try {
      const response = await fetch(API_ENDPOINTS.ASSIGNMENTS, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, courseId }),
      });

      if (response.ok) {
        await loadAssignments();
      }
    } catch (error) {
      console.error('Error assigning course:', error);
    }
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.ASSIGNMENTS}?id=${assignmentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        await loadAssignments();
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
    }
  };

  const students = users.filter((u) => u.role === 'student');
  const activeUsers = users.filter(
    (u) => u.lastActive.includes('часов') || u.lastActive.includes('минут')
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Icon name="Loader2" className="animate-spin" size={32} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Управление пользователями
            </h1>
            <p className="text-gray-600">
              Отслеживайте прогресс и управляйте доступом
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Icon name="UserPlus" className="mr-2" size={18} />
            Добавить пользователя
          </Button>
        </div>

        <UserFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onFilterApply={setFilters}
        />

        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Регистрация</TableHead>
                  <TableHead>Последняя активность</TableHead>
                  <TableHead>Прогресс</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const progress = getUserProgress(user.id);
                  return (
                    <TableRow key={user.id} className={`hover:bg-gray-50 ${user.isActive === false ? 'opacity-50' : ''}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold relative">
                            {user.name.charAt(0)}
                            {user.isActive === false && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                                <Icon name="Ban" size={10} className="text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">{user.name}</span>
                              {user.isActive === false && (
                                <Badge variant="destructive" className="text-xs">Отключен</Badge>
                              )}
                            </div>
                            <Badge
                              variant={user.role === 'admin' ? 'default' : 'outline'}
                              className="mt-1"
                            >
                              {user.role === 'admin' ? 'Администратор' : 'Обучающийся'}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{user.email}</TableCell>
                      <TableCell className="text-gray-600">
                        {user.registrationDate}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              user.lastActive.includes('часов') ||
                              user.lastActive.includes('минут')
                                ? 'bg-green-500'
                                : 'bg-gray-300'
                            }`}
                          />
                          <span className="text-sm text-gray-600">
                            {user.lastActive}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 whitespace-nowrap">
                            {progress.completed}/{progress.total}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(user)}
                        >
                          <Icon name="Eye" size={18} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          show={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
          onEditRole={handleEditRole}
          onEditPassword={handleEditPassword}
          onEditUser={handleEditUser}
          onToggleActive={handleToggleActive}
          userProgress={getUserProgress(selectedUser.id)}
          onAssignCourse={handleAssignCourse}
          onRemoveAssignment={handleRemoveAssignment}
          assignments={getUserAssignments(selectedUser.id)}
        />
      )}

      <AddUserModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddUser}
      />
    </AdminLayout>
  );
}