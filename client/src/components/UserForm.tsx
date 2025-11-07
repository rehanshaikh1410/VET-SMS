import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserFormProps {
  type: 'student' | 'teacher';
  onSubmit?: (data: any) => void;
  initialData?: any;
}

export default function UserForm({ type, onSubmit, initialData }: UserFormProps) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    email: '',
    phone: '',
    ...(type === 'student' ? { rollNumber: '', classId: '' } : {}),
    ...(type === 'teacher' ? { subjectId: '', experience: '' } : {})
  });

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
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
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
              onChange={(e) => handleChange('email', e.target.value)}
              data-testid="input-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              data-testid="input-phone"
            />
          </div>

          {type === 'student' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="rollNumber">Roll Number *</Label>
                <Input
                  id="rollNumber"
                  value={formData.rollNumber}
                  onChange={(e) => handleChange('rollNumber', e.target.value)}
                  required
                  data-testid="input-roll-number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="classId">Class *</Label>
                <Select value={formData.classId} onValueChange={(val) => handleChange('classId', val)}>
                  <SelectTrigger data-testid="select-class">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class-1">Class 1</SelectItem>
                    <SelectItem value="class-2">Class 2</SelectItem>
                    <SelectItem value="class-3">Class 3</SelectItem>
                  </SelectContent>
                </Select>
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
                    <SelectItem value="math">Mathematics</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="science">Science</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  value={formData.experience}
                  onChange={(e) => handleChange('experience', e.target.value)}
                  data-testid="input-experience"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" data-testid="button-cancel">
            Cancel
          </Button>
          <Button type="submit" data-testid="button-submit">
            {initialData ? 'Update' : 'Create'} {type === 'student' ? 'Student' : 'Teacher'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
