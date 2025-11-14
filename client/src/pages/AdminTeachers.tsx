import { useEffect, useState, useRef } from "react";
import DataTable, { Column } from "@/components/DataTable";
import UserForm from "@/components/UserForm";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Key } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/api";

export default function AdminTeachers() {
  const [showForm, setShowForm] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjectsMap, setSubjectsMap] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<any | null>(null);
  const [viewing, setViewing] = useState<any | null>(null);
  const [revealTarget, setRevealTarget] = useState<any | null>(null);
  const [revealPassword, setRevealPassword] = useState('');
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealResult, setRevealResult] = useState<any | null>(null);
  const revealInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (revealTarget) {
      // ensure password is cleared and focus the input so typing goes there
      setRevealPassword('');
      setTimeout(() => {
        try { revealInputRef.current?.focus(); } catch (e) { /* ignore */ }
      }, 50);
    }
  }, [revealTarget]);

  // Fetch teachers from API
  const loadTeachers = async () => {
    try {
      const res = await fetch('/api/teachers');
      if (!res.ok) throw new Error('Failed to load teachers');
      const data = await res.json();
      setTeachers(data);
    } catch (err) {
      console.error('Error loading teachers:', err);
    }
  };

  const loadSubjects = async () => {
    try {
      const resp = await api.get('/subjects');
      const list = resp.data || [];
      const map: Record<string, string> = {};
      list.forEach((s: any) => { if (s._id) map[s._id] = s.name; });
      setSubjectsMap(map);
    } catch (err) {
      console.error('Error loading subjects:', err);
    }
  };

  useEffect(() => {
    loadTeachers();
    loadSubjects();
  }, []);

  const columns: Column[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'subject', label: 'Subject' },
    { key: 'experience', label: 'Experience' },
    { key: 'status', label: 'Status' }
  ];

  // map API data to table rows
  const data = teachers.map((t) => ({
    id: t._id,
    name: t.name,
    email: t.email,
    phone: t.phone,
    subject: subjectsMap[t.subjectId] || (t.subjectId || '-'),
    experience: t.experience || '-',
    status: t.status || 'Active',
    // include original object so DataTable consumers can access full data
    full: t,
  }));

  return (
    <div className="space-y-6" data-testid="admin-teachers-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Teachers</h1>
          <p className="text-muted-foreground mt-1">Add, edit, or remove teachers from the system</p>
        </div>
        <Button onClick={() => setShowForm(true)} data-testid="button-add-teacher">
          <Plus className="h-4 w-4 mr-2" />
          Add Teacher
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        onEdit={(row) => {
          const t = teachers.find((x) => x._id === row.id);
          setEditing(t || null);
          setShowForm(true);
        }}
        onDelete={async (row) => {
          if (!confirm('Delete this teacher?')) return;
          try {
            const res = await fetch(`/api/teachers/${row.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            setTeachers((prev) => prev.filter((t) => t._id !== row.id));
            console.log('Teacher deleted');
          } catch (err) {
            console.error(err);
            alert('Failed to delete teacher');
          }
        }}
        onView={(row) => {
          const t = teachers.find((x) => x._id === row.id);
          setViewing(t || null);
        }}
        onReveal={(row) => {
          // open reveal dialog for this teacher row
          const t = row.full || teachers.find((x) => x._id === row.id) || { name: row.name };
          const id = t._id || row.id;
          setRevealTarget({ id, name: t.name || row.name });
          setRevealPassword('');
          setRevealResult(null);
        }}
        resetSearchKey={revealTarget?.id}
      />

      <Dialog open={showForm} onOpenChange={(open) => {
        if (!open) {
          setShowForm(false);
          setEditing(null);
        }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Add New'} Teacher</DialogTitle>
          </DialogHeader>
          <UserForm
            type="teacher"
            initialData={editing || undefined}
            onSubmit={async (formData) => {
              try {
                if (editing) {
                  // update
                  const res = await fetch(`/api/teachers/${editing._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                  });
                  if (!res.ok) throw new Error('Failed to update teacher');
                  const updated = await res.json();
                  setTeachers((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
                } else {
                  const res = await fetch('/api/teachers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                  });
                  if (!res.ok) throw new Error('Failed to create teacher');
                  const created = await res.json();
                  setTeachers((prev) => [created, ...prev]);
                }
                setEditing(null);
                setShowForm(false);
              } catch (err) {
                console.error('Error saving teacher:', err);
              }
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Reveal dialog */}
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
                data-testid="input-reveal-password"
                autoComplete="new-password"
                name="reveal-password"
              />
            </div>
          )}

          {revealResult && (
            <div className="space-y-2">
              <p className="font-semibold">Credentials for {revealTarget?.name}</p>
              {revealResult.username && <p><strong>Username:</strong> {revealResult.username}</p>}
              {revealResult.password && <p><strong>Password:</strong> {revealResult.password}</p>}
              {revealResult.tempPassword && <p><strong>Temporary Password:</strong> {revealResult.tempPassword}</p>}
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
                      const response = await api.post(`/admin/teachers/${revealTarget?.id}/reveal-password`, { adminPassword: revealPassword });
                      const respData = response.data;
                      // normalize
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
                  data-testid="button-confirm-reveal"
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

      {/* View dialog */}
      <Dialog open={!!viewing} onOpenChange={(open) => { if (!open) setViewing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Teacher Details</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-2">
              <p><strong>Name:</strong> {viewing.name}</p>
              <p><strong>Email:</strong> {viewing.email}</p>
              <p><strong>Phone:</strong> {viewing.phone}</p>
              <p><strong>Subject:</strong> {viewing.subjectId || '-'}</p>
              <p><strong>Subject:</strong> {subjectsMap[viewing.subjectId] || (viewing.subjectId || '-')}</p>
              <p><strong>Experience:</strong> {viewing.experience || '-'}</p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewing(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
