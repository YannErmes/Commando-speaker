import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Subject = {
  id: string;
  title: string;
  headlines: string[];
};

const STORAGE_KEY = 'fln:subjects';

const SubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{ title: string; headlines: string[] }>({ title: '', headlines: ['', ''] });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || '[]';
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setSubjects(parsed);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
    } catch (e) {}
  }, [subjects]);

  const resetForm = () => setForm({ title: '', headlines: ['', ''] });

  const startAdd = () => { resetForm(); setEditingId(null); setIsAdding(true); };

  const startEdit = (s: Subject) => {
    setEditingId(s.id);
    setForm({ title: s.title, headlines: s.headlines.length ? s.headlines.slice() : ['', ''] });
    setIsAdding(true);
  };

  const save = () => {
    const title = form.title.trim();
    const headlines = form.headlines.map(h => h.trim()).filter(Boolean);
    if (!title) {
      toast({ title: 'Missing title', description: 'Please enter a subject title.' });
      return;
    }
    if (editingId) {
      setSubjects(prev => prev.map(s => s.id === editingId ? { ...s, title, headlines } : s));
      toast({ title: 'Saved', description: 'Subject updated.' });
    } else {
      const id = `s_${Date.now()}`;
      setSubjects(prev => [{ id, title, headlines }, ...prev]);
      toast({ title: 'Added', description: 'Subject created.' });
    }
    setIsAdding(false);
    resetForm();
    setEditingId(null);
  };

  const remove = (id: string) => {
    if (!confirm('Delete this subject?')) return;
    setSubjects(prev => prev.filter(s => s.id !== id));
    toast({ title: 'Deleted' });
  };

  const addHeadlineField = () => {
    setForm(f => ({ ...f, headlines: [...f.headlines, ''] }));
  };

  const updateHeadline = (idx: number, value: string) => {
    setForm(f => {
      const copy = f.headlines.slice();
      copy[idx] = value;
      return { ...f, headlines: copy };
    });
  };

  const downloadSubjects = () => {
    try {
      const html = `<!doctype html><html><head><meta charset=\"utf-8\"><title>Subjects</title></head><body><pre>${escapeHtml(JSON.stringify(subjects, null, 2))}</pre></body></html>`;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'subjects.html';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Downloaded' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to download subjects', variant: 'destructive' });
    }
  };

  const escapeHtml = (s: string) => s.replace(/[&<>\"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;' } as any)[c]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Subjects</h1>
              <p className="text-sm text-muted-foreground">Create subjects and attach short headlines (2–3 hints) to help you connect them to memories or contexts.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadSubjects}><Download className="h-4 w-4 mr-2"/>Export</Button>
              <Button onClick={startAdd}><Plus className="h-4 w-4 mr-2"/>New Subject</Button>
            </div>
          </div>

          {subjects.length === 0 ? (
            <div className="p-6 bg-muted/10 rounded">No subjects yet — create one with the button above.</div>
          ) : (
            <div className="space-y-4">
              {subjects.map(s => (
                <div key={s.id} className="p-4 border rounded bg-card flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{s.title}</div>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {s.headlines.length === 0 ? (<div className="italic">No headlines</div>) : s.headlines.map((h, i) => (<div key={i}>• {h}</div>))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(s)}><Edit2 className="h-4 w-4"/></Button>
                    <Button size="sm" variant="destructive" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4"/></Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Subject' : 'New Subject'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input placeholder="Subject title" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Headlines (hints) — click Add to create more</div>
                  {form.headlines.map((h, i) => (
                    <Input key={i} placeholder={`Headline ${i+1}`} value={h} onChange={(e) => updateHeadline(i, e.target.value)} />
                  ))}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={addHeadlineField}>Add headline</Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={save}>{editingId ? 'Save' : 'Create'}</Button>
                  <Button variant="ghost" onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </div>
  );
};

export default SubjectsPage;
