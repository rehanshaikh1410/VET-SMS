import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogClose } from "@/components/ui/dialog";

interface UserFormProps {
  type: 'student' | 'teacher';
  onSubmit?: (data: any) => void;
  initialData?: any;
}

export default function UserForm({ type, onSubmit, initialData }: UserFormProps) {
  const [classes, setClasses] = useState<Array<{ _id: string, name: string, grade?: string }>>([]);
  const [formData, setFormData] = useState(initialData || {
    username: '',
    password: '',
    name: '',
    email: '',
    phone: '',
    ...(type === 'student' ? { rollNumber: '', classId: '' } : {}),
    ...(type === 'teacher' ? { subjectId: '', experience: '' } : {})
  });

  // Load available classes for student form
  const [subjects, setSubjects] = useState<Array<{ _id: string, name: string }>>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (type === 'student') {
          const res = await fetch('/api/classes');
          if (!res.ok) throw new Error('Failed to load classes');
          const data = await res.json();
          setClasses(data);
        } else if (type === 'teacher') {
          const res = await fetch('/api/subjects');
          if (!res.ok) throw new Error('Failed to load subjects');
          const data = await res.json();
          setSubjects(data);
        }
      } catch (err) {
        console.error(`Error loading ${type === 'student' ? 'classes' : 'subjects'}:`, err);
      }
    };
    loadData();
  }, [type]);

  // Update form when initialData changes (for edit case)
  React.useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
    console.log(`${type} form submitted:`, formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="p-6" data-testid={`user-form-${type}`}>
      <h2 className="text-xl font-bold mb-6">
        {initialData ? 'Edit' : 'Add'} {type === 'student' ? 'Student' : 'Teacher'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('username', e.target.value)}
              required
              disabled={!!initialData}
              data-testid="input-username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('password', e.target.value)}
              required={!initialData}
              disabled={!!initialData}
              data-testid="input-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
              required
              data-testid="input-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('email', e.target.value)}
              data-testid="input-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('phone', e.target.value)}
              data-testid="input-phone"
            />
          </div>

          {type === 'student' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="classId">Class *</Label>
                <Select value={formData.classId || ''} onValueChange={(val) => handleChange('classId', val)}>
                  <SelectTrigger data-testid="select-class">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls._id} value={cls._id}>
                          {cls.name}{cls.grade ? ` - ${cls.grade}` : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rollNumber">Roll Number *</Label>
                <Input
                  id="rollNumber"
                  value={formData.rollNumber || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('rollNumber', e.target.value)}
                  required
                  data-testid="input-roll-number"
                />
              </div>
            </>
          )}

          {type === 'teacher' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="subjectId">Subject *</Label>
                <Select value={formData.subjectId} onValueChange={(val) => handleChange('subjectId', val)}>
                  <SelectTrigger data-testid="select-subject">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject._id} value={subject._id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  value={formData.experience}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('experience', e.target.value)}
                  data-testid="input-experience"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <DialogClose asChild>
            <Button type="button" variant="outline" data-testid="button-cancel">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" data-testid="button-submit">
            {initialData ? 'Update' : 'Create'} {type === 'student' ? 'Student' : 'Teacher'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
