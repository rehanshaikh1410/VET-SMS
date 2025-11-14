import TimetableGrid from "@/components/TimetableGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminTimetable() {
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [editingDay, setEditingDay] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/classes');
        if (!res.ok) throw new Error('Failed to load classes');
        const data = await res.json();
        setClasses(data || []);
        if ((data || []).length > 0) {
          // default to first class id
          setSelectedClass(data[0]._id || data[0].id || '');
        }
      } catch (err) {
        console.error('Load classes for timetable failed', err);
      }
    })();
  }, []);

  // Default days (always show these in the editor) and default times for initial periods
  const DEFAULT_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const DEFAULT_PERIODS = 4;
  const DEFAULT_TIMES = ['8:00 - 8:45','8:50 - 9:35','9:40 - 10:25','10:45 - 11:30'];

  const schedule = DEFAULT_DAYS.map((day) => ({
    day,
    entries: Array.from({ length: DEFAULT_PERIODS }).map((_, idx) => ({ period: idx + 1, subject: '', teacher: '', time: DEFAULT_TIMES[idx] || '' }))
  }));

  const [timetable, setTimetable] = useState<any | null>(null);

  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [editingSchedule, setEditingSchedule] = useState<any[] | null>(null);

  // Handler to open day editor
  const handleEditDay = (dayName: string) => {
    // Initialize editing schedule with current timetable data
    const derived = DEFAULT_DAYS.map((day) => ({
      day,
      entries: Array.from({ length: DEFAULT_PERIODS }).map((_, idx) => ({ period: idx + 1, subjectId: '', teacherId: '', time: DEFAULT_TIMES[idx] || '' }))
    }));

    if (timetable && Array.isArray(timetable.entries)) {
      try {
        timetable.entries.forEach((d: any) => {
          const target = derived.find((x) => x.day === d.day);
          if (target && Array.isArray(d.entries)) {
            target.entries = d.entries.map((e: any, i: number) => ({ period: e.period ?? (i+1), subjectId: e.subjectId || '', teacherId: e.teacherId || '', time: e.time || (DEFAULT_TIMES[e.period-1] || '') }));
          }
        });
      } catch (err) {
        console.warn('Failed to merge existing timetable, falling back to defaults', err);
      }
    }

    setEditingSchedule(derived);
    setEditingDay(dayName);
  };

  // load timetable for selected class
  useEffect(() => {
    if (!selectedClass) return;
    (async () => {
      try {
        const res = await fetch(`/api/timetables?classId=${selectedClass}`);
        if (!res.ok) throw new Error('Failed to load timetable');
        const arr = await res.json();
        if (Array.isArray(arr) && arr.length > 0) {
          setTimetable(arr[0]);
        } else {
          setTimetable(null);
        }
      } catch (err) {
        console.error('Load timetable failed', err);
      }
    })();
  }, [selectedClass]);

  // load subjects & teachers for editor
  useEffect(() => {
    (async () => {
      try {
        const [sRes, tRes] = await Promise.all([fetch('/api/subjects'), fetch('/api/teachers')]);
        if (sRes.ok) setSubjects(await sRes.json());
        if (tRes.ok) setTeachers(await tRes.json());
      } catch (err) {
        console.error('Load subjects/teachers failed', err);
      }
    })();
  }, []);

  // refresh classes when AdminClasses notifies an update
  useEffect(() => {
    const handler = () => {
      (async () => {
        try {
          const res = await fetch('/api/classes');
          if (!res.ok) return;
          const data = await res.json();
          setClasses(data || []);
          if (!selectedClass && (data || []).length > 0) setSelectedClass(data[0]._id || data[0].id || '');
        } catch (err) {
          console.error('Refresh classes failed', err);
        }
      })();
    };
    window.addEventListener('classesUpdated', handler as EventListener);
    return () => window.removeEventListener('classesUpdated', handler as EventListener);
  }, [selectedClass]);


  // Build a schedule object to pass to TimetableGrid
  const displaySchedule = (() => {
    if (!timetable || !timetable.entries) return schedule;

    const entries = timetable.entries;

    if (Array.isArray(entries) && entries.length > 0 && entries[0] && Array.isArray(entries[0].entries)) {
      return entries.map((d: any) => ({
        day: d.day,
        entries: (d.entries || []).map((e: any) => ({ period: e.period, subject: (subjects.find(s => s._id === e.subjectId)?.name || e.subject || ''), teacher: (teachers.find(t => t._id === e.teacherId)?.name || e.teacher || ''), time: e.time }))
      }));
    }

    const grouped: Record<string, any> = {};
    for (const e of entries) {
      const day = e.day || 'Unknown';
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(e);
    }

    return DEFAULT_DAYS.map((day) => {
      const dayEntries = (grouped[day] || []).slice().sort((a: any, b: any) => (a.period || 0) - (b.period || 0));
      if (dayEntries.length === 0) {
        return { day, entries: Array.from({ length: DEFAULT_PERIODS }).map((_, idx) => ({ period: idx + 1, subject: '', teacher: '', time: DEFAULT_TIMES[idx] || '' })) };
      }
      return { day, entries: dayEntries.map((e: any) => ({ period: e.period, subject: (subjects.find(s => s._id === e.subjectId)?.name || e.subject || ''), teacher: (teachers.find(t => t._id === e.teacherId)?.name || e.teacher || ''), time: e.time || '' })) };
    });
  })();

  return (
    <div className="space-y-6" data-testid="admin-timetable-page">
      <div>
        <h1 className="text-3xl font-bold">Manage Timetable</h1>
        <p className="text-muted-foreground mt-1">Create and edit class timetables</p>
      </div>

      <div className="w-64 space-y-2">
        <Label>Select Class</Label>
        <Select value={selectedClass} onValueChange={(val) => setSelectedClass(val === 'none' ? '' : val)}>
          <SelectTrigger data-testid="select-class">
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent>
            {classes.length === 0 && (
              <SelectItem value="none" disabled>No classes</SelectItem>
            )}
            {classes.map((c) => (
              <SelectItem key={c._id || c.id} value={c._id || c.id}>{c.name}{c.grade ? ` (Div ${c.grade})` : ''}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TimetableGrid schedule={displaySchedule} onEditDay={handleEditDay} />

      {/* Day-specific editor dialog */}
      <Dialog open={!!editingDay} onOpenChange={(open) => { if (!open) setEditingDay(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Edit {editingDay} Timetable</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 pt-2">
            {editingSchedule && editingDay ? (
              <div className="space-y-4">
                {editingSchedule
                  .filter((d: any) => d.day === editingDay)
                  .map((day: any, dayIdx: number) => (
                    <div key={day.day || dayIdx}>
                      <div className="space-y-2">
                        {day.entries.map((entry: any, idx: number) => (
                          <div key={entry.period ?? idx} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
                            <div className="col-span-1 text-sm font-medium">Period {entry.period ?? (idx+1)}</div>
                            <div className="md:col-span-2">
                              <Label className="text-xs">Subject</Label>
                              <Select value={(entry.subjectId === '' || !entry.subjectId) ? 'none' : entry.subjectId} onValueChange={(val) => {
                                const copy = JSON.parse(JSON.stringify(editingSchedule));
                                const dayIndex = copy.findIndex((d: any) => d.day === editingDay);
                                copy[dayIndex].entries[idx].subjectId = val === 'none' ? '' : val;
                                setEditingSchedule(copy);
                              }}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select subject" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {subjects.map((s) => (
                                    <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="md:col-span-2">
                              <Label className="text-xs">Teacher</Label>
                              <Select value={(entry.teacherId === '' || !entry.teacherId) ? 'none' : entry.teacherId} onValueChange={(val) => {
                                const copy = JSON.parse(JSON.stringify(editingSchedule));
                                const dayIndex = copy.findIndex((d: any) => d.day === editingDay);
                                copy[dayIndex].entries[idx].teacherId = val === 'none' ? '' : val;
                                setEditingSchedule(copy);
                              }}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select teacher" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {teachers.map((t) => (
                                    <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="md:col-span-1">
                              <Label className="text-xs">Time</Label>
                              <Input value={entry.time || ''} onChange={(e) => {
                                const copy = JSON.parse(JSON.stringify(editingSchedule));
                                const dayIndex = copy.findIndex((d: any) => d.day === editingDay);
                                copy[dayIndex].entries[idx].time = e.target.value;
                                setEditingSchedule(copy);
                              }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const copy = JSON.parse(JSON.stringify(editingSchedule));
                            const dayIndex = copy.findIndex((d: any) => d.day === editingDay);
                            const dayBlock = copy[dayIndex];
                            const lastPeriod = dayBlock.entries[dayBlock.entries.length - 1]?.period || dayBlock.entries.length;
                            const nextPeriod = lastPeriod + 1;
                            dayBlock.entries.push({ period: nextPeriod, subjectId: '', teacherId: '', time: '' });
                            setEditingSchedule(copy);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Period
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div>Loading editor…</div>
            )}
          </div>
          <div className="p-6 border-t flex justify-end gap-4 bg-background sticky bottom-0">
            <Button variant="outline" onClick={() => setEditingDay(null)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                if (!selectedClass) throw new Error('Select a class first');
                if (!editingSchedule) return;
                
                // Build the payload - preserve existing timetable data and merge with edited day
                let finalEntries: any[] = [];
                
                // Start with existing timetable entries if they exist
                if (timetable && timetable.entries && Array.isArray(timetable.entries)) {
                  // Filter out entries from the day being edited
                  finalEntries = timetable.entries.filter((e: any) => e.day !== editingDay);
                }
                
                // Add the edited day's entries
                const editedDayData = editingSchedule.find((d: any) => d.day === editingDay);
                if (editedDayData && editedDayData.entries) {
                  const newEntries = editedDayData.entries.map((e: any, i: number) => ({
                    day: editedDayData.day,
                    period: e.period ?? (i + 1),
                    subjectId: e.subjectId || '',
                    teacherId: e.teacherId || '',
                    time: e.time || ''
                  }));
                  finalEntries = finalEntries.concat(newEntries);
                }

                const payload = { classId: selectedClass, entries: finalEntries };
                if (timetable && timetable._id) {
                  const res = await fetch(`/api/timetables/${timetable._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                  if (!res.ok) throw new Error((await res.json()).message || 'Failed to update timetable');
                } else {
                  const res = await fetch('/api/timetables', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                  if (!res.ok) throw new Error((await res.json()).message || 'Failed to create timetable');
                }
                setEditingDay(null);
                // reload timetable
                const refresh = await fetch(`/api/timetables?classId=${selectedClass}`);
                if (refresh.ok) {
                  const arr = await refresh.json();
                  if (Array.isArray(arr) && arr.length > 0) setTimetable(arr[0]);
                  else setTimetable(null);
                }
              } catch (err: any) {
                alert(err?.message || 'Save failed');
                console.error(err);
              }
            }}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}