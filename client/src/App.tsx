import { useState, useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import AppSidebar from "@/components/AppSidebar";
import SplashScreen from "@/components/SplashScreen";

// Page imports
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/LoginPage";
import AdminDashboard from "@/pages/AdminDashboard";
import TeacherDashboard from "@/pages/TeacherDashboard";
import StudentDashboard from "@/pages/StudentDashboard";
import AdminTeachers from "@/pages/AdminTeachers";
import AdminStudents from "@/pages/AdminStudents";
import AdminQuizzes from "@/pages/AdminQuizzes";
import AdminClasses from "@/pages/AdminClasses";
import AdminTimetable from "@/pages/AdminTimetable";
import AdminNotices from "@/pages/AdminNotices";
import AdminReports from "@/pages/AdminReports";
import TeacherTimetable from "@/pages/TeacherTimetable";
import TeacherAttendance from "@/pages/TeacherAttendance";
import TeacherQuizzes from "@/pages/TeacherQuizzes";
import TeacherGrades from "@/pages/TeacherGrades";
import TeacherNotices from "@/pages/TeacherNotices";
import StudentTimetable from "@/pages/StudentTimetable";
import StudentAttendance from "@/pages/StudentAttendance";
import StudentQuizzes from "@/pages/StudentQuizzes";
import StudentGrades from "@/pages/StudentGrades";
import StudentNotices from "@/pages/StudentNotices";

function Router() {
  const [location] = useLocation();
  // Start as not logged in to ensure the login page is shown by default.
  // We'll validate any token that exists on mount and update state accordingly.
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash screen on first visit, not after login
    const splashShown = sessionStorage.getItem('splashShown');
    return !splashShown;
  });
  const [userRole, setUserRole] = useState<'admin' | 'teacher' | 'student'>(() => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        if (parsed.role && ['admin', 'teacher', 'student'].includes(parsed.role)) {
          return parsed.role;
        }
      }
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
    return 'student';
  });
  
  const [userName, setUserName] = useState(() => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        return parsed.name || parsed.username || '';
      }
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
    return '';
  });

  useEffect(() => {
    const check = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoggedIn(false);
        setAuthChecked(true);
        return;
      }
      try {
        const api = (await import("@/lib/api")).default;
        const { data } = await api.get('/me');
        if (data) {
          setIsLoggedIn(true);
          setUserRole(data.role);
          setUserName(data.name || data.username);
          localStorage.setItem('user', JSON.stringify(data));
          setAuthChecked(true);
        } else {
          setIsLoggedIn(false);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setAuthChecked(true);
        }
      } catch (err) {
        console.error('Token validation failed:', err);
        setIsLoggedIn(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthChecked(true);
      }
    };
    check();
  }, []);

  const handleLogin = (username: string, role: string) => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        setUserName(parsed.name || parsed.username);
        setUserRole(parsed.role as 'admin' | 'teacher' | 'student');
        setIsLoggedIn(true);
        window.location.href = `/${parsed.role}`;
      }
    } catch (err) {
      console.error('Error during login:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsLoggedIn(false);
      window.location.href = '/login';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserRole('student');
    setUserName('');
    window.location.href = '/login';
  };

  // While we're checking auth, show the login page (prevents accidental access to protected routes)
  if (showSplash) {
    return (
      <SplashScreen
        onComplete={() => {
          sessionStorage.setItem('splashShown', 'true');
          setShowSplash(false);
        }}
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen">
        <Switch>
          <Route path="/login">
            <LoginPage onLogin={handleLogin} />
          </Route>
          <Route>
            <Redirect to="/login" />
          </Route>
        </Switch>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar role={userRole} userName={userName} onLogout={handleLogout} />
      <div className="flex-1 overflow-hidden">
        <main className="h-full overflow-y-auto p-4">
          <Switch>
            <Route path="/admin">{() => userRole === 'admin' ? <AdminDashboard /> : <Redirect to={`/${userRole}`} />}</Route>
            <Route path="/admin/teachers">{() => userRole === 'admin' ? <AdminTeachers /> : <Redirect to={`/${userRole}`} />}</Route>
            <Route path="/admin/students">{() => userRole === 'admin' ? <AdminStudents /> : <Redirect to={`/${userRole}`} />}</Route>
            <Route path="/admin/classes">{() => userRole === 'admin' ? <AdminClasses /> : <Redirect to={`/${userRole}`} />}</Route>
            <Route path="/admin/quizzes">{() => userRole === 'admin' ? <AdminQuizzes /> : <Redirect to={`/${userRole}`} />}</Route>
            <Route path="/admin/timetable">{() => userRole === 'admin' ? <AdminTimetable /> : <Redirect to={`/${userRole}`} />}</Route>
            <Route path="/admin/reports">{() => userRole === 'admin' ? <AdminReports /> : <Redirect to={`/${userRole}`} />}</Route>
            <Route path="/admin/notices">{() => userRole === 'admin' ? <AdminNotices /> : <Redirect to={`/${userRole}`} />}</Route>

            <Route path="/teacher">{() => userRole === 'teacher' ? <TeacherDashboard /> : <Redirect to={`/${userRole}`} />}</Route>
            <Route path="/teacher/timetable">{() => userRole === 'teacher' ? <TeacherTimetable /> : <Redirect to={`/${userRole}`} />}</Route>
            <Route path="/teacher/attendance">{() => userRole === 'teacher' ? <TeacherAttendance /> : <Redirect to={`/${userRole}`} />}</Route>
            <Route path="/teacher/quizzes">{() => userRole === 'teacher' ? <TeacherQuizzes /> : <Redirect to={`/${userRole}`} />}</Route>
            <Route path="/teacher/grades">{() => userRole === 'teacher' ? <TeacherGrades /> : <Redirect to={`/${userRole}`} />}</Route>
            <Route path="/teacher/notices">{() => userRole === 'teacher' ? <TeacherNotices /> : <Redirect to={`/${userRole}`} />}</Route>

            <Route path="/student">{() => userRole === 'student' ? <StudentDashboard /> : <Redirect to={`/${userRole}`} />}</Route>
            <Route path="/student/timetable">{() => <StudentTimetable />}</Route>
            <Route path="/student/attendance">{() => <StudentAttendance />}</Route>
            <Route path="/student/quizzes">{() => <StudentQuizzes />}</Route>
            <Route path="/student/grades">{() => <StudentGrades />}</Route>
            <Route path="/student/notices">{() => <StudentNotices />}</Route>

            <Route path="/">{() => <Redirect to={`/${userRole}`} />}</Route>
            <Route>{() => <NotFound />}</Route>
          </Switch>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}
