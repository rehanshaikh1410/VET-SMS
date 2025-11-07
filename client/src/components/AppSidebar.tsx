import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardList, 
  FileText, 
  Calendar, 
  Bell,
  Settings,
  LogOut
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface AppSidebarProps {
  role: 'admin' | 'teacher' | 'student';
  userName: string;
}

const menuItems = {
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
    { icon: GraduationCap, label: "Grades", path: "/student/grades" },
    { icon: Bell, label: "Notices", path: "/student/notices" },
  ],
};

export default function AppSidebar({ role, userName }: AppSidebarProps) {
  const [location, setLocation] = useLocation();
  const items = menuItems[role];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-sm">School Portal</h2>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    onClick={() => setLocation(item.path)}
                    isActive={location === item.path}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{getInitials(userName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{userName}</p>
              <p className="text-xs text-muted-foreground capitalize">{role}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start" 
            onClick={() => console.log('Logout clicked')}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
