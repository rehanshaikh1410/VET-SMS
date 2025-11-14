import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";

interface SubjectFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  teachers: any[];
  classes?: any[];
}

export default function SubjectForm({ open, onClose, onSubmit, initialData, teachers, classes = [] }: SubjectFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    teacherIds: [] as string[],
    classIds: [] as string[]
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        code: initialData.code || '',
        teacherIds: Array.isArray(initialData.teachers)
          ? (initialData.teachers || []).map((t: any) => t._id || t)
          : (initialData.teacher ? [initialData.teacher._id || initialData.teacher] : []),
        classIds: (initialData.classes || []).map((c: any) => c._id || c)
      });
    } else {
      setFormData({ name: '', code: '', teacherIds: [], classIds: [] });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Map local teacherIds -> server expected `teachers` field
    onSubmit({
      name: formData.name,
      code: formData.code,
      teachers: formData.teacherIds.length > 0 ? formData.teacherIds : undefined,
      classes: formData.classIds.length > 0 ? formData.classIds : undefined,
    });
  };

  const handleChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTeacher = (teacherId: string) => {
    setFormData(prev => ({
      ...prev,
      teacherIds: prev.teacherIds.includes(teacherId)
        ? prev.teacherIds.filter(id => id !== teacherId)
        : [...prev.teacherIds, teacherId]
    }));
  };

  const toggleClass = (classId: string) => {
    setFormData(prev => ({
      ...prev,
      classIds: prev.classIds.includes(classId)
        ? prev.classIds.filter(id => id !== classId)
        : [...prev.classIds, classId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit' : 'Add'} Subject
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Subject Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Subject Code *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={e => handleChange('code', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Subject Teachers</Label>
            <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
              {teachers && teachers.length > 0 ? (
                teachers.map(teacher => (
                  <div key={teacher._id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`teacher-${teacher._id}`}
                      checked={formData.teacherIds.includes(teacher._id)}
                      onChange={() => toggleTeacher(teacher._id)}
                      className="cursor-pointer"
                    />
                    <label htmlFor={`teacher-${teacher._id}`} className="cursor-pointer flex-1">
                      {teacher.name}
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No teachers available</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assign to Classes</Label>
            <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
              {classes && classes.length > 0 ? (
                classes.map(cls => (
                  <div key={cls._id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`class-${cls._id}`}
                      checked={formData.classIds.includes(cls._id)}
                      onChange={() => toggleClass(cls._id)}
                      className="cursor-pointer"
                    />
                    <label htmlFor={`class-${cls._id}`} className="cursor-pointer flex-1">
                      {cls.name}{cls.grade ? ` (Div ${cls.grade})` : ''}
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No classes available</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">
              {initialData ? 'Update' : 'Create'} Subject
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}