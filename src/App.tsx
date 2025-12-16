
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ROUTES } from "@/constants/routes";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminCourses from "./pages/admin/Courses";
import AdminCourseEditor from "./pages/admin/CourseEditor";
import AdminCourseView from "./pages/admin/CourseView";
import AdminAssignments from "./pages/admin/Assignments";
import AdminUsers from "./pages/admin/Users";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminTests from "./pages/admin/Tests";
import AdminTestEditor from "./pages/admin/TestEditor";
import AdminTestView from "./pages/admin/TestView";
import AdminRewards from "./pages/admin/Rewards";
import AdminMedia from "./pages/admin/Media";
import AdminLogs from "./pages/admin/Logs";
import StudentDashboard from "./pages/student/Dashboard";
import StudentCourses from "./pages/student/Courses";
import StudentCourseDetail from "./pages/student/CourseDetail";
import StudentCourseDetails from "./pages/student/CourseDetails";
import StudentLesson from "./pages/student/Lesson";
import StudentTest from "./pages/student/Test";
import StudentTestPage from "./pages/student/TestPage";
import StudentProfile from "./pages/student/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.LOGIN} replace />} />
            <Route path={ROUTES.LOGIN} element={<Login />} />
            
            <Route path={ROUTES.ADMIN.DASHBOARD} element={<AdminDashboard />} />
            <Route path={ROUTES.ADMIN.COURSES} element={<AdminCourses />} />
            <Route path="/admin/courses/edit" element={<AdminCourseEditor />} />
            <Route path="/admin/courses/edit/:courseId" element={<AdminCourseEditor />} />
            <Route path="/admin/courses/view/:courseId" element={<AdminCourseView />} />
            <Route path={ROUTES.ADMIN.ASSIGNMENTS} element={<AdminAssignments />} />
            <Route path={ROUTES.ADMIN.USERS} element={<AdminUsers />} />
            <Route path={ROUTES.ADMIN.ANALYTICS} element={<AdminAnalytics />} />
            <Route path={ROUTES.ADMIN.TESTS} element={<AdminTests />} />
            <Route path="/admin/tests/edit" element={<AdminTestEditor />} />
            <Route path="/admin/tests/edit/:testId" element={<AdminTestEditor />} />
            <Route path="/admin/tests/view/:testId" element={<AdminTestView />} />
            <Route path={ROUTES.ADMIN.REWARDS} element={<AdminRewards />} />
            <Route path={ROUTES.ADMIN.MEDIA} element={<AdminMedia />} />
            <Route path={ROUTES.ADMIN.LOGS} element={<AdminLogs />} />
            
            <Route path={ROUTES.STUDENT.DASHBOARD} element={<StudentDashboard />} />
            <Route path={ROUTES.STUDENT.COURSES} element={<StudentCourses />} />
            <Route path="/student/courses/:courseId" element={<StudentCourseDetails />} />
            <Route path="/student/courses/:courseId/lesson/:lessonId" element={<StudentLesson />} />
            <Route path="/student/courses/:courseId/test/:testId" element={<StudentTestPage />} />
            <Route path={ROUTES.STUDENT.COURSE_DETAIL} element={<StudentCourseDetail />} />
            <Route path={ROUTES.STUDENT.TEST} element={<StudentTest />} />
            <Route path={ROUTES.STUDENT.PROFILE} element={<StudentProfile />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;