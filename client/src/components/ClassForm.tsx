import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ClassFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  teachers: any[];
}

export default function ClassForm({ open, onClose, onSubmit, initialData, teachers }: ClassFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    div: '',
    teacherId: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        // backend stores this value in `grade`; expose it as `div` in the form
        div: initialData.grade?.toString() || '',
        teacherId: initialData.teacherId || ''
      });
    } else {
      setFormData({ name: '', div: '', teacherId: '' });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Map local teacherId -> server expected `classTeacher` field
    onSubmit({
      name: formData.name,
      // send division string in the `grade` field on the server (schema uses string)
      grade: formData.div || undefined,
      classTeacher: formData.teacherId || undefined,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit' : 'Add'} Class
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Class Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="div">Division *</Label>
            <Input
              id="div"
              value={formData.div}
              onChange={e => handleChange('div', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacher">Class Teacher</Label>
            <Select value={formData.teacherId} onValueChange={val => handleChange('teacherId', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map(teacher => (
                  <SelectItem key={teacher._id} value={teacher._id}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {initialData ? 'Update' : 'Create'} Class
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}