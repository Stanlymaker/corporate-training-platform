import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { mockAssignments, mockCourses, mockUsers } from '@/data/mockData';
import type { CourseAssignment } from '@/types';

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState<CourseAssignment[]>(mockAssignments);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [newAssignment, setNewAssignment] = useState({
    courseId: '',
    userId: '',
    dueDate: '',
    notes: '',
  });

  const students = mockUsers.filter(u => u.role === 'student');

  const handleCreateAssignment = () => {
    if (!newAssignment.courseId || !newAssignment.userId) return;

    const assignment: CourseAssignment = {
      id: `a${assignments.length + 1}`,
      courseId: newAssignment.courseId,
      userId: newAssignment.userId,
      assignedBy: '1',
      assignedAt: new Date().toISOString(),
      dueDate: newAssignment.dueDate || undefined,
      status: 'assigned',
      notes: newAssignment.notes || undefined,
    };

    setAssignments([...assignments, assignment]);
    setIsDialogOpen(false);
    setNewAssignment({ courseId: '', userId: '', dueDate: '', notes: '' });
  };

  const handleDeleteAssignment = (id: string) => {
    setAssignments(assignments.filter(a => a.id !== id));
  };

  const handleUpdateStatus = (id: string, newStatus: CourseAssignment['status']) => {
    setAssignments(assignments.map(a => 
      a.id === id ? { ...a, status: newStatus } : a
    ));
  };

  const filteredAssignments = assignments.filter(assignment => {
    const course = mockCourses.find(c => c.id === assignment.courseId);
    const student = students.find(u => u.id === assignment.userId);
    
    const matchesSearch = 
      course?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || assignment.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: CourseAssignment['status']) => {
    switch (status) {
      case 'assigned':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Назначен</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">В процессе</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Завершен</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Просрочен</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: CourseAssignment['status']) => {
    switch (status) {
      case 'assigned': return 'Clock';
      case 'in_progress': return 'PlayCircle';
      case 'completed': return 'CheckCircle';
      case 'overdue': return 'AlertCircle';
      default: return 'Circle';
    }
  };

  const statsCards = [
    {
      title: 'Всего назначений',
      value: assignments.length,
      icon: 'BookOpen',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'В процессе',
      value: assignments.filter(a => a.status === 'in_progress').length,
      icon: 'PlayCircle',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Завершено',
      value: assignments.filter(a => a.status === 'completed').length,
      icon: 'CheckCircle',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Просрочено',
      value: assignments.filter(a => a.status === 'overdue').length,
      icon: 'AlertCircle',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Управление назначениями</h1>
        <p className="text-gray-600">Назначайте курсы студентам и отслеживайте прогресс</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                  <Icon name={stat.icon as any} size={24} className={stat.color} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Назначения курсов</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Icon name="Plus" size={16} className="mr-2" />
                  Назначить курс
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Назначение курса студенту</DialogTitle>
                  <DialogDescription>
                    Выберите студента и курс для назначения
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="student">Студент</Label>
                    <Select
                      value={newAssignment.userId}
                      onValueChange={(value) => setNewAssignment({ ...newAssignment, userId: value })}
                    >
                      <SelectTrigger id="student">
                        <SelectValue placeholder="Выберите студента" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name} ({student.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="course">Курс</Label>
                    <Select
                      value={newAssignment.courseId}
                      onValueChange={(value) => setNewAssignment({ ...newAssignment, courseId: value })}
                    >
                      <SelectTrigger id="course">
                        <SelectValue placeholder="Выберите курс" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockCourses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title} ({course.category})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="dueDate">Срок выполнения (опционально)</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={newAssignment.dueDate}
                      onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="notes">Заметки (опционально)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Дополнительная информация о назначении..."
                      value={newAssignment.notes}
                      onChange={(e) => setNewAssignment({ ...newAssignment, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button onClick={handleCreateAssignment} disabled={!newAssignment.courseId || !newAssignment.userId}>
                    Назначить курс
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Поиск по студенту или курсу..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="assigned">Назначен</SelectItem>
                <SelectItem value="in_progress">В процессе</SelectItem>
                <SelectItem value="completed">Завершен</SelectItem>
                <SelectItem value="overdue">Просрочен</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Студент</TableHead>
                  <TableHead>Курс</TableHead>
                  <TableHead>Дата назначения</TableHead>
                  <TableHead>Срок</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Заметки</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Icon name="Inbox" size={48} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">Назначений не найдено</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssignments.map((assignment) => {
                    const course = mockCourses.find(c => c.id === assignment.courseId);
                    const student = students.find(u => u.id === assignment.userId);
                    
                    return (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Icon name="User" size={16} className="text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{student?.name}</div>
                              <div className="text-xs text-gray-500">{student?.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{course?.title}</div>
                            <Badge variant="outline" className="text-xs mt-1">{course?.category}</Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(assignment.assignedAt).toLocaleDateString('ru-RU')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {assignment.dueDate ? (
                            <div className="text-sm">
                              {new Date(assignment.dueDate).toLocaleDateString('ru-RU')}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Не указан</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={assignment.status}
                            onValueChange={(value) => handleUpdateStatus(assignment.id, value as CourseAssignment['status'])}
                          >
                            <SelectTrigger className="w-[140px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="assigned">
                                <div className="flex items-center gap-2">
                                  <Icon name="Clock" size={14} />
                                  Назначен
                                </div>
                              </SelectItem>
                              <SelectItem value="in_progress">
                                <div className="flex items-center gap-2">
                                  <Icon name="PlayCircle" size={14} />
                                  В процессе
                                </div>
                              </SelectItem>
                              <SelectItem value="completed">
                                <div className="flex items-center gap-2">
                                  <Icon name="CheckCircle" size={14} />
                                  Завершен
                                </div>
                              </SelectItem>
                              <SelectItem value="overdue">
                                <div className="flex items-center gap-2">
                                  <Icon name="AlertCircle" size={14} />
                                  Просрочен
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {assignment.notes ? (
                            <div className="text-sm text-gray-600 max-w-xs truncate" title={assignment.notes}>
                              {assignment.notes}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Icon name="Trash2" size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
