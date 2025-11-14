import { useEffect, useState } from "react";
import DataTable, { Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ClassForm from "@/components/ClassForm";
import SubjectForm from "@/components/SubjectForm";

interface Class {
  _id: string;
  name: string;
  grade?: string;
  teacherId?: string;
}

interface Subject {
  _id: string;
  name: string;
  code: string;
  teacherId?: string;
  teachers?: any[];
  classes?: any[];
}

interface Teacher {
  _id: string;
  name: string;
}

export default function AdminClasses() {
  const [showClassForm, setShowClassForm] = useState(false);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const loadData = async () => {
    try {
      const [cRes, sRes, tRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/subjects'),
        fetch('/api/teachers')
      ]);
      if (tRes.ok) setTeachers(await tRes.json());
      if (cRes.ok) {
        const rawClasses = await cRes.json();
        // normalize: set teacherId from classTeacher (populated or id)
        const normClasses = rawClasses.map((rc: any) => ({
          ...rc,
          teacherId: rc.classTeacher?._id || rc.classTeacher || undefined
        }));
        setClasses(normClasses);
      }
      if (sRes.ok) {
        const rawSubjects = await sRes.json();
        const normSubjects = rawSubjects.map((rs: any) => ({
          ...rs,
          teacherId: rs.teacher?._id || rs.teacher || undefined,
          teachers: rs.teachers || (rs.teacher ? [rs.teacher] : []),
          classes: rs.classes || []
        }));
        setSubjects(normSubjects);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClassSubmit = async (data: any) => {
    try {
      const url = editingClass ? `/api/classes/${editingClass._id}` : '/api/classes';
      const method = editingClass ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) throw new Error(`Failed to ${editingClass ? 'update' : 'create'} class`);
      const saved = await res.json();
      // If we edited, patch local state to reflect change immediately
      if (editingClass) {
        const patched = {
          ...saved,
          teacherId: saved.classTeacher?._id || saved.classTeacher || undefined
        };
        setClasses((prev) => prev.map((c) => c._id === patched._id ? patched : c));
        // notify other pages that classes updated
        try { window.dispatchEvent(new CustomEvent('classesUpdated', { detail: patched })); } catch (e) {}
      } else {
        // created: ensure teacherId normalized and append
        const created = { ...saved, teacherId: saved.classTeacher?._id || saved.classTeacher || undefined };
        setClasses((prev) => [created, ...prev]);
        // notify other pages that classes updated
        try { window.dispatchEvent(new CustomEvent('classesUpdated', { detail: created })); } catch (e) {}
      }
      setShowClassForm(false);
      setEditingClass(null);
    } catch (err) {
      console.error(`Error ${editingClass ? 'updating' : 'creating'} class:`, err);
    }
  };

  const handleSubjectSubmit = async (data: any) => {
    try {
      const url = editingSubject ? `/api/subjects/${editingSubject._id}` : '/api/subjects';
      const method = editingSubject ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) throw new Error(`Failed to ${editingSubject ? 'update' : 'create'} subject`);
      const saved = await res.json();
      const normalized = {
        ...saved,
        teacherId: saved.teacher?._id || saved.teacher || undefined,
        teachers: saved.teachers || (saved.teacher ? [saved.teacher] : []),
        classes: saved.classes || []
      };
      
      if (editingSubject) {
        setSubjects((prev) => prev.map((s) => s._id === normalized._id ? normalized : s));
      } else {
        setSubjects((prev) => [normalized, ...prev]);
      }
      setShowSubjectForm(false);
      setEditingSubject(null);
    } catch (err) {
      console.error(`Error ${editingSubject ? 'updating' : 'creating'} subject:`, err);
    }
  };

  const classColumns: Column[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Class Name' },
    { key: 'grade', label: 'Div' },
    { key: 'teacherName', label: 'Class Teacher' },
  ];

  const classData = classes.map((c) => ({
    id: c._id,
    name: c.name,
    grade: c.grade,
    teacherName: teachers.find(t => t._id === c.teacherId)?.name || '-'
  }));

  const subjectColumns: Column[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Subject Name' },
    { key: 'code', label: 'Code' },
    { key: 'teacherName', label: 'Assigned Teacher' },
    { key: 'classes', label: 'Assign to Classes' }
  ];

  const subjectData = subjects.map((s) => ({
    id: s._id,
    name: s.name,
    code: s.code,
    teacherName: s.teachers && s.teachers.length > 0 
      ? s.teachers.map((t: any) => t.name || t).join(', ')
      : '-'
  ,
    classes: (s.classes && s.classes.length > 0)
      ? (s.classes as any[]).map((cl: any) => {
        // class may be an id (string) or populated object
        if (!cl) return '-';
        if (typeof cl === 'string') {
          const found = classes.find(c => c._id === cl);
          return found ? `${found.name}${found.grade ? ` (Div ${found.grade})` : ''}` : cl;
        }
        // populated object
        return cl.name ? `${cl.name}${cl.grade ? ` (Div ${cl.grade})` : ''}` : (cl._id || '-');
      }).join(', ')
      : '-'
  }));

  return (
    <div className="space-y-6" data-testid="admin-classes-page">
      <div>
        <h1 className="text-3xl font-bold">Manage Classes & Subjects</h1>
        <p className="text-muted-foreground mt-1">Create and manage classes, subjects, and assignments</p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Classes</h2>
            <Button onClick={() => {
              setEditingClass(null);
              setShowClassForm(true);
            }} data-testid="button-add-class">
              <Plus className="h-4 w-4 mr-2" />
              Add Class
            </Button>
          </div>
          <DataTable
            columns={classColumns}
            data={classData}
            onEdit={(row) => {
              const classToEdit = classes.find(c => c._id === row.id);
              if (classToEdit) {
                setEditingClass(classToEdit);
                setShowClassForm(true);
              }
            }}
            onDelete={async (row) => {
              if (!confirm('Delete class?')) return;
              try {
                const res = await fetch(`/api/classes/${row.id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Delete failed');
                await loadData();
              } catch (err) {
                console.error(err);
                alert('Failed to delete class');
              }
            }}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Subjects</h2>
            <Button onClick={() => {
              setEditingSubject(null);
              setShowSubjectForm(true);
            }} data-testid="button-add-subject">
              <Plus className="h-4 w-4 mr-2" />
              Add Subject
            </Button>
          </div>
          <DataTable
            columns={subjectColumns}
            data={subjectData}
            onEdit={(row) => {
              const subjectToEdit = subjects.find(s => s._id === row.id);
              if (subjectToEdit) {
                setEditingSubject(subjectToEdit);
                setShowSubjectForm(true);
              }
            }}
            onDelete={async (row) => {
              if (!confirm('Delete subject?')) return;
              try {
                const res = await fetch(`/api/subjects/${row.id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Delete failed');
                await loadData();
              } catch (err) {
                console.error(err);
                alert('Failed to delete subject');
              }
            }}
          />
        </div>
      </div>

      <ClassForm
        open={showClassForm}
        onClose={() => {
          setShowClassForm(false);
          setEditingClass(null);
        }}
        onSubmit={handleClassSubmit}
        initialData={editingClass}
        teachers={teachers}
      />

      <SubjectForm
        open={showSubjectForm}
        onClose={() => {
          setShowSubjectForm(false);
          setEditingSubject(null);
        }}
        onSubmit={handleSubjectSubmit}
        initialData={editingSubject}
        teachers={teachers}
        classes={classes}
      />
    </div>
  );
}
