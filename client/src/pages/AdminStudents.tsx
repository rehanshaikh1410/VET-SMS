import { useEffect, useState, useRef } from "react";
import DataTable, { Column } from "@/components/DataTable";
import UserForm from "@/components/UserForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from '@/lib/api';
import { Plus, ChevronDown, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";

export default function AdminStudents() {
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<Record<string, string>>({});
  const [classesData, setClassesData] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [viewing, setViewing] = useState<any | null>(null);
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [revealTarget, setRevealTarget] = useState<any | null>(null);
  const [revealPassword, setRevealPassword] = useState('');
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealResult, setRevealResult] = useState<any | null>(null);
  const revealInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (revealTarget) {
      setRevealPassword('');
      setTimeout(() => {
        try { revealInputRef.current?.focus(); } catch (e) { /* ignore */ }
      }, 50);
    }
  }, [revealTarget]);

  // Load class information
  const loadClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      if (!res.ok) throw new Error('Failed to load classes');
      const data = await res.json();
      setClassesData(data);
      const classMap = data.reduce((acc: Record<string, string>, cls: any) => {
        // include division/grade when present so UI shows "Class - Division"
        const division = cls.grade ? ` - ${cls.grade}` : '';
        acc[cls._id] = `${cls.name}${division}`;
        return acc;
      }, {});
      setClasses(classMap);
    } catch (err) {
      console.error('Error loading classes:', err);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await fetch('/api/students');
      if (!res.ok) throw new Error('Failed to load students');
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error('Error loading students:', err);
    }
  };

  useEffect(() => { 
    loadStudents();
    loadClasses();
  }, []);

  const columns: Column[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'rollNumber', label: 'Roll No.' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'status', label: 'Status' }
  ];

  const data = students.map((s) => ({
    id: s._id,
    name: s.name,
    rollNumber: s.rollNumber || '-',
    email: s.email,
    phone: s.phone,
    status: s.status || 'Active',
  }));

  // Group students by class
  const groupedByClass = classesData.map((cls) => {
    const classStudents = students.filter((s) => s.classId === cls._id);
    return {
      classId: cls._id,
      className: classes[cls._id] || cls.name,
      students: classStudents,
      count: classStudents.length
    };
  }).filter(group => group.students.length > 0); // Only show classes with students

  const toggleClassExpanded = (classId: string) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(classId)) {
      newExpanded.delete(classId);
    } else {
      newExpanded.add(classId);
    }
    setExpandedClasses(newExpanded);
  };

  return (
    <div className="space-y-6" data-testid="admin-students-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Students</h1>
          <p className="text-muted-foreground mt-1">Add, edit, or remove students from the system</p>
        </div>
        <Button onClick={() => setShowForm(true)} data-testid="button-add-student">
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      {groupedByClass.length > 0 ? (
        <div className="space-y-4">
          {groupedByClass.map((group) => (
            <Card key={group.classId} className="overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 bg-gray-50"
                onClick={() => toggleClassExpanded(group.classId)}
              >
                <div className="flex items-center gap-3">
                  {expandedClasses.has(group.classId) ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                  <h3 className="font-semibold text-lg">{group.className}</h3>
                </div>
                <span className="text-sm text-muted-foreground bg-white px-3 py-1 rounded-full">
                  {group.count} student{group.count !== 1 ? 's' : ''}
                </span>
              </div>
              
              {expandedClasses.has(group.classId) && (
                <div className="border-t p-4">
                  <DataTable
                        columns={columns}
                        data={group.students.map((s: any) => ({
                          id: s._id,
                          name: s.name,
                          rollNumber: s.rollNumber || '-',
                          email: s.email,
                          phone: s.phone,
                          status: s.status || 'Active',
                          // include original student object for reliable reveal
                          full: s,
                        }))}
                    onEdit={(row) => {
                      const s = group.students.find((x: any) => x._id === row.id);
                      setEditing(s || null);
                      setShowForm(true);
                    }}
                    onDelete={async (row) => {
                      if (!confirm('Delete this student?')) return;
                      try {
                        const res = await fetch(`/api/users/${row.id}`, { method: 'DELETE' });
                        if (!res.ok) throw new Error('Delete failed');
                        setStudents((prev) => prev.filter((t) => t._id !== row.id));
                      } catch (err) {
                        console.error(err);
                        alert('Failed to delete student');
                      }
                    }}
                    onView={(row) => {
                      const student = group.students.find((s: any) => s._id === row.id);
                      setViewing(student || null);
                    }}
                    onReveal={(row) => {
                      // open reveal dialog for this student row
                      const s = row.full || group.students.find((x: any) => x._id === row.id) || { name: row.name };
                      const id = s._id || row.id;
                      setRevealTarget({ id, name: s.name || row.name });
                      setRevealPassword('');
                      setRevealResult(null);
                    }}
                    resetSearchKey={revealTarget?.id}
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center text-muted-foreground">
          No students assigned to any class yet.
        </Card>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-sm">Name:</label>
                  <p>{viewing.name}</p>
                </div>
                <div>
                  <label className="font-semibold text-sm">Roll Number:</label>
                  <p>{viewing.rollNumber || '-'}</p>
                </div>
                <div>
                  <label className="font-semibold text-sm">Class:</label>
                  <p>{classes[viewing.classId] || '-'}</p>
                </div>
                <div>
                  <label className="font-semibold text-sm">Email:</label>
                  <p>{viewing.email || '-'}</p>
                </div>
                <div>
                  <label className="font-semibold text-sm">Phone:</label>
                  <p>{viewing.phone || '-'}</p>
                </div>
                <div>
                  <label className="font-semibold text-sm">Status:</label>
                  <p>{viewing.status || 'Active'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Add New'} Student</DialogTitle>
          </DialogHeader>
          <UserForm
            type="student"
            initialData={editing || undefined}
            onSubmit={async (formData) => {
              try {
                if (editing) {
                  const res = await fetch(`/api/users/${editing._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                  });
                  if (!res.ok) throw new Error('Failed to update student');
                  const updated = await res.json();
                  setStudents((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
                } else {
                  const res = await fetch('/api/students', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                  });
                  if (!res.ok) throw new Error('Failed to create student');
                  const created = await res.json();
                  setStudents((prev) => [created, ...prev]);
                }
                setEditing(null);
                setShowForm(false);
              } catch (err) {
                console.error('Error saving student:', err);
                alert('Failed to save student');
              }
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Reveal dialog for students */}
      <Dialog open={!!revealTarget} onOpenChange={(open) => { if (!open) { setRevealTarget(null); setRevealResult(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reveal / Reset Password</DialogTitle>
          </DialogHeader>
          {revealTarget && !revealResult && (
            <div className="space-y-4">
              <p>Enter your admin password to reveal or reset the password for <strong>{revealTarget.name}</strong>.</p>
              <Input
                ref={(el) => { revealInputRef.current = el as any; }}
                type="password"
                placeholder="Your admin password"
                value={revealPassword}
                onChange={(e) => setRevealPassword(e.target.value)}
                data-testid="input-reveal-password-student"
                autoComplete="new-password"
                name="reveal-password-student"
              />
            </div>
          )}

          {revealResult && (
            <div className="space-y-2">
              <p className="font-semibold">Credentials for {revealTarget?.name}</p>
              {revealResult.username && <p><strong>Username:</strong> {revealResult.username}</p>}
              {revealResult.password && <p><strong>Password:</strong> {revealResult.password}</p>}
              {revealResult.tempPassword && <p><strong>Temporary Password:</strong> {revealResult.tempPassword}</p>}
              {revealResult.message && <p className="text-sm text-muted-foreground">{revealResult.message}</p>}
            </div>
          )}

          <DialogFooter>
            {!revealResult ? (
              <>
                <Button variant="outline" onClick={() => { setRevealTarget(null); setRevealPassword(''); }}>Cancel</Button>
                <Button
                  onClick={async () => {
                    if (!revealPassword) return alert('Please enter your admin password');
                    try {
                      setRevealLoading(true);
                      const response = await api.post(`/admin/students/${revealTarget?.id}/reveal-password`, { adminPassword: revealPassword });
                      const respData = response.data;
                      const result: any = {};
                      if (respData?.username && respData?.password) {
                        result.username = respData.username;
                        result.password = respData.password;
                      } else if (respData?.tempPassword) {
                        result.tempPassword = respData.tempPassword;
                      } else if (respData?.data?.tempPassword) {
                        result.tempPassword = respData.data.tempPassword;
                      }
                      setRevealResult(result.username || result.password || result.tempPassword ? result : { message: 'No credentials returned' });
                    } catch (err: any) {
                      console.error('Reveal failed:', err);
                      const msg = err.response?.data?.message || err.message || 'Failed to reveal password';
                      setRevealResult({ message: msg });
                    } finally {
                      setRevealLoading(false);
                    }
                  }}
                  disabled={revealLoading}
                >
                  {revealLoading ? 'Processing...' : 'Reveal / Reset'}
                </Button>
              </>
            ) : (
              <Button onClick={() => { setRevealTarget(null); setRevealResult(null); }}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
