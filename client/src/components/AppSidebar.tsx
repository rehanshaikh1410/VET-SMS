import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardList, 
  FileText, 
  Calendar, 
  Bell,
  LogOut,
  Key
} from "lucide-react";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  role: 'admin' | 'teacher' | 'student';
  userName: string;
  onLogout?: () => void;
}

type MenuItem = {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
};

const menuItems: Record<string, MenuItem[]> = {
  admin: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: Users, label: "Teachers", path: "/admin/teachers" },
    { icon: GraduationCap, label: "Students", path: "/admin/students" },
    { icon: BookOpen, label: "Classes & Subjects", path: "/admin/classes" },
    { icon: ClipboardList, label: "Quizzes", path: "/admin/quizzes" },
    { icon: Calendar, label: "Timetable", path: "/admin/timetable" },
    { icon: FileText, label: "Reports", path: "/admin/reports" },
    { icon: Bell, label: "Notices", path: "/admin/notices" },
  ],
  teacher: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/teacher" },
    { icon: Calendar, label: "Timetable", path: "/teacher/timetable" },
    { icon: ClipboardList, label: "Attendance", path: "/teacher/attendance" },
    { icon: FileText, label: "Quizzes", path: "/teacher/quizzes" },
    { icon: GraduationCap, label: "Grades", path: "/teacher/grades" },
    { icon: Bell, label: "Notices", path: "/teacher/notices" },
  ],
  student: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/student" },
    { icon: Calendar, label: "Timetable", path: "/student/timetable" },
    { icon: ClipboardList, label: "Attendance", path: "/student/attendance" },
    { icon: ClipboardList, label: "Quizzes", path: "/student/quizzes" },
    { icon: GraduationCap, label: "Grades", path: "/student/grades" },
    { icon: Bell, label: "Notices", path: "/student/notices" },
  ],
};

export default function AppSidebar({ role, userName, onLogout }: AppSidebarProps) {
  const [location, setLocation] = useLocation();
  const items = menuItems[role as keyof typeof menuItems] || [];

  const getInitials = (name: string = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <div className="flex flex-col h-full border-r bg-card w-64 min-w-[240px]">
      <div className="p-3 border-b">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-sm">{getInitials(userName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <h2 className="font-semibold text-sm truncate">{userName}</h2>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <nav className="p-1.5 space-y-0.5">
          {items.map((item) => {
            const isActive = location === item.path
            return (
              <Button
                key={item.path}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-sm px-2 py-1.5 h-auto",
                  isActive && "bg-muted"
                )}
                style={isActive ? { color: "hsl(var(--sidebar-accent-foreground))" } : undefined}
                onClick={() => setLocation(item.path)}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Button>
            )
          })}
        </nav>
      </div>

      <div className="p-4 border-t">
        <Button 
          variant="outline" 
          className="w-full justify-start" 
          onClick={onLogout}
          data-testid="button-logout"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
