import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Users, BookOpen, ClipboardList, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        setRole(parsed.role || null);
        setName(parsed.name || parsed.username || null);
      }
    } catch (err) {
      setRole(null);
    }
  }, []);

  // If the user is an admin, show a friendly welcome instead of the generic 404
  if (role === 'admin') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="pt-6">
            <div className="flex items-center mb-4 gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a1 1 0 01.894.553l3 6A1 1 0 0113 10H7a1 1 0 01-.894-1.447l3-6A1 1 0 0110 2z" />
                  <path d="M4 13a6 6 0 1112 0v1a2 2 0 01-2 2H6a2 2 0 01-2-2v-1z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome to the Administrator Panel</h1>
                <p className="text-sm text-muted-foreground mt-1">Have a great day — manage your school with confidence.</p>
              </div>
            </div>
            <div className="mt-6 text-sm text-gray-700">
              <p className="font-medium">Quick actions</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setLocation('/admin/teachers')}
                  onKeyDown={(e) => { if (e.key === 'Enter') setLocation('/admin/teachers'); }}
                  className="flex items-start gap-4 p-4 border rounded-lg bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="rounded-md bg-blue-50 p-2">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Manage Teachers</h3>
                      <Button size="sm" variant="ghost">Open</Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Add, edit and assign teachers to subjects and classes.</p>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setLocation('/admin/students')}
                  onKeyDown={(e) => { if (e.key === 'Enter') setLocation('/admin/students'); }}
                  className="flex items-start gap-4 p-4 border rounded-lg bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="rounded-md bg-green-50 p-2">
                    <BookOpen className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Manage Students</h3>
                      <Button size="sm" variant="ghost">Open</Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Register students, assign classes and track basic info.</p>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setLocation('/admin/quizzes')}
                  onKeyDown={(e) => { if (e.key === 'Enter') setLocation('/admin/quizzes'); }}
                  className="flex items-start gap-4 p-4 border rounded-lg bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="rounded-md bg-orange-50 p-2">
                    <ClipboardList className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Quizzes</h3>
                      <Button size="sm" variant="ghost">Open</Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Create quizzes, preview questions and manage availability.</p>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setLocation('/admin/notices')}
                  onKeyDown={(e) => { if (e.key === 'Enter') setLocation('/admin/notices'); }}
                  className="flex items-start gap-4 p-4 border rounded-lg bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="rounded-md bg-purple-50 p-2">
                    <Bell className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Notices</h3>
                      <Button size="sm" variant="ghost">Open</Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Post announcements and schedule notices for students and staff.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If the user is a teacher, show a friendly teacher welcome instead of 404
  if (role === 'teacher') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="pt-6">
            <div className="flex items-center mb-4 gap-4">
              <div className="rounded-full bg-blue-100 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a6 6 0 016 6v3a3 3 0 01-3 3H7a3 3 0 01-3-3V8a6 6 0 016-6z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome{ name ? `, ${name}` : '' }</h1>
                <p className="text-sm text-muted-foreground mt-1">Have a great day — check your timetable and quizzes below.</p>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-700">
              <p className="font-medium">Quick links</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setLocation('/teacher/timetable')}
                  onKeyDown={(e) => { if (e.key === 'Enter') setLocation('/teacher/timetable'); }}
                  className="flex items-start gap-4 p-4 border rounded-lg bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="rounded-md bg-blue-50 p-2">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Timetable</h3>
                      <Button size="sm" variant="ghost">Open</Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">View your daily and weekly timetable.</p>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setLocation('/teacher/quizzes')}
                  onKeyDown={(e) => { if (e.key === 'Enter') setLocation('/teacher/quizzes'); }}
                  className="flex items-start gap-4 p-4 border rounded-lg bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="rounded-md bg-indigo-50 p-2">
                    <ClipboardList className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Quizzes</h3>
                      <Button size="sm" variant="ghost">Open</Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Take or review quizzes assigned to you.</p>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setLocation('/teacher/attendance')}
                  onKeyDown={(e) => { if (e.key === 'Enter') setLocation('/teacher/attendance'); }}
                  className="flex items-start gap-4 p-4 border rounded-lg bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="rounded-md bg-emerald-50 p-2">
                    <Bell className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Attendance</h3>
                      <Button size="sm" variant="ghost">Open</Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Mark or view attendance for your classes.</p>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setLocation('/teacher/notices')}
                  onKeyDown={(e) => { if (e.key === 'Enter') setLocation('/teacher/notices'); }}
                  className="flex items-start gap-4 p-4 border rounded-lg bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="rounded-md bg-orange-50 p-2">
                    <Bell className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Notices</h3>
                      <Button size="sm" variant="ghost">Open</Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Post announcements and view notices for your classes.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If the user is a student, show a friendly student welcome instead of 404
  if (role === 'student') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="pt-6">
            <div className="flex items-center mb-4 gap-4">
              <div className="rounded-full bg-amber-100 p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 2a6 6 0 016 6v3a3 3 0 01-3 3H7a3 3 0 01-3-3V8a6 6 0 016-6z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome{ name ? `, ${name}` : '' }</h1>
                <p className="text-sm text-muted-foreground mt-1">Have a great day — check your classes and assignments below.</p>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-700">
              <p className="font-medium">Quick links</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setLocation('/student/timetable')}
                  onKeyDown={(e) => { if (e.key === 'Enter') setLocation('/student/timetable'); }}
                  className="flex items-start gap-4 p-4 border rounded-lg bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="rounded-md bg-blue-50 p-2">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">My Timetable</h3>
                      <Button size="sm" variant="ghost">Open</Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">See your daily and weekly class schedule.</p>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setLocation('/student/quizzes')}
                  onKeyDown={(e) => { if (e.key === 'Enter') setLocation('/student/quizzes'); }}
                  className="flex items-start gap-4 p-4 border rounded-lg bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="rounded-md bg-indigo-50 p-2">
                    <ClipboardList className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Quizzes</h3>
                      <Button size="sm" variant="ghost">Open</Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Take your assigned quizzes or review past attempts.</p>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setLocation('/student/attendance')}
                  onKeyDown={(e) => { if (e.key === 'Enter') setLocation('/student/attendance'); }}
                  className="flex items-start gap-4 p-4 border rounded-lg bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="rounded-md bg-emerald-50 p-2">
                    <Bell className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Attendance</h3>
                      <Button size="sm" variant="ghost">Open</Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">View your attendance records and notify absences.</p>
                  </div>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setLocation('/student/grades')}
                  onKeyDown={(e) => { if (e.key === 'Enter') setLocation('/student/grades'); }}
                  className="flex items-start gap-4 p-4 border rounded-lg bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="rounded-md bg-orange-50 p-2">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">My Grades</h3>
                      <Button size="sm" variant="ghost">Open</Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Check your quiz results and performance analytics.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
