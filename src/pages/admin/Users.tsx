import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { mockUsers, mockProgress, mockAssignments } from '@/data/mockData';
import { useState } from 'react';
import UserFilters, { FilterState } from '@/components/admin/UserFilters';
import UserDetailsModal from '@/components/admin/UserDetailsModal';
import AddUserModal, { NewUserData } from '@/components/admin/AddUserModal';
import { User, CourseAssignment } from '@/types';

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
  const [users, setUsers] = useState(mockUsers);
  const [assignments, setAssignments] = useState(mockAssignments);

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

  const getUserProgress = (userId: string) => {
    const progress = mockProgress.filter((p) => p.userId === userId);
    const completed = progress.filter((p) => p.completed).length;
    return { total: progress.length, completed };
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleEditRole = (userId: string, newRole: 'admin' | 'student') => {
    setUsers((prevUsers) =>
      prevUsers.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    setSelectedUser((prev) => (prev && prev.id === userId ? { ...prev, role: newRole } : prev));
  };

  const handleAddUser = (userData: NewUserData) => {
    const newUser: User = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      role: userData.role,
      registrationDate: new Date().toLocaleDateString('ru-RU'),
      lastActive: 'Только что',
    };
    setUsers([...users, newUser]);
    console.log(`Пользователь ${userData.name} создан с паролем: ${userData.password}`);
  };

  const handleEditPassword = (userId: string, newPassword: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      console.log(`Пароль для ${user.name} изменен на: ${newPassword}`);
    }
  };

  const handleAssignCourse = (userId: string, courseId: string) => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const formattedDate = `${day}.${month}.${year}`;
    
    const newAssignment: CourseAssignment = {
      id: `a${Date.now()}`,
      courseId,
      userId,
      assignedBy: '1',
      assignedAt: formattedDate,
      status: 'assigned',
    };
    setAssignments([...assignments, newAssignment]);
  };

  const handleRemoveAssignment = (assignmentId: string) => {
    setAssignments(assignments.filter(a => a.id !== assignmentId));
  };

  const students = users.filter((u) => u.role === 'student');
  const activeUsers = users.filter(
    (u) => u.lastActive.includes('часов') || u.lastActive.includes('минут')
  );

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
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{user.name}</div>
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
                                : 'bg-gray-400'
                            }`}
                          ></div>
                          <span className="text-gray-600">{user.lastActive}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon name="BookOpen" size={14} className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {progress.completed}/{progress.total} курсов
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(user)}
                        >
                          <Icon name="Eye" className="mr-1" size={14} />
                          Детали
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Icon name="Users" size={48} className="mx-auto mb-4 opacity-30" />
                <p>Пользователи не найдены</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card className="border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Icon name="Users" className="text-primary" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{students.length}</div>
                  <div className="text-sm text-gray-600">Всего обучающихся</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Icon name="TrendingUp" className="text-green-600" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {activeUsers.length}
                  </div>
                  <div className="text-sm text-gray-600">Активных пользователей</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Icon name="Award" className="text-blue-600" size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {mockProgress.filter((p) => p.completed).length}
                  </div>
                  <div className="text-sm text-gray-600">Курсов завершено</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <UserDetailsModal
        show={showDetailsModal}
        user={selectedUser}
        onClose={() => setShowDetailsModal(false)}
        onEditRole={handleEditRole}
        onEditPassword={handleEditPassword}
        userProgress={selectedUser ? getUserProgress(selectedUser.id) : { total: 0, completed: 0 }}
        onAssignCourse={handleAssignCourse}
        onRemoveAssignment={handleRemoveAssignment}
        assignments={assignments}
      />

      <AddUserModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddUser}
      />
    </AdminLayout>
  );
}