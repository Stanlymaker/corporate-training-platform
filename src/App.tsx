
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminCourses from "./pages/admin/Courses";
import AdminUsers from "./pages/admin/Users";
import StudentDashboard from "./pages/student/Dashboard";
import StudentCourses from "./pages/student/Courses";
import StudentRewards from "./pages/student/Rewards";
import StudentProgress from "./pages/student/Progress";
import StudentProfile from "./pages/student/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.LOGIN} replace />} />
          <Route path={ROUTES.LOGIN} element={<Login />} />
          
          <Route path={ROUTES.ADMIN.DASHBOARD} element={<AdminDashboard />} />
          <Route path={ROUTES.ADMIN.COURSES} element={<AdminCourses />} />
          <Route path={ROUTES.ADMIN.USERS} element={<AdminUsers />} />
          
          <Route path={ROUTES.STUDENT.DASHBOARD} element={<StudentDashboard />} />
          <Route path={ROUTES.STUDENT.COURSES} element={<StudentCourses />} />
          <Route path={ROUTES.STUDENT.REWARDS} element={<StudentRewards />} />
          <Route path={ROUTES.STUDENT.PROGRESS} element={<StudentProgress />} />
          <Route path={ROUTES.STUDENT.PROFILE} element={<StudentProfile />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;