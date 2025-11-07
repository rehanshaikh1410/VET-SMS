import { useState } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/LoginPage";
import AdminDashboard from "@/pages/AdminDashboard";
import TeacherDashboard from "@/pages/TeacherDashboard";
import StudentDashboard from "@/pages/StudentDashboard";
import AdminTeachers from "@/pages/AdminTeachers";
import AdminStudents from "@/pages/AdminStudents";
import AdminQuizzes from "@/pages/AdminQuizzes";
import TeacherAttendance from "@/pages/TeacherAttendance";
import StudentQuizzes from "@/pages/StudentQuizzes";

function Router() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'teacher' | 'student'>('student');
  const [userName, setUserName] = useState('Demo User');

  const handleLogin = (username: string, role: string) => {
    setUserName(username);
    setUserRole(role as 'admin' | 'teacher' | 'student');
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar role={userRole} userName={userName} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            <Switch>
              <Route path="/" component={() => <Redirect to={`/${userRole}`} />} />
              
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin/teachers" component={AdminTeachers} />
              <Route path="/admin/students" component={AdminStudents} />
              <Route path="/admin/quizzes" component={AdminQuizzes} />
              
              <Route path="/teacher" component={TeacherDashboard} />
              <Route path="/teacher/attendance" component={TeacherAttendance} />
              
              <Route path="/student" component={StudentDashboard} />
              <Route path="/student/quizzes" component={StudentQuizzes} />
              
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
