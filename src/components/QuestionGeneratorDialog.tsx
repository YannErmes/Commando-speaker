import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppData } from '@/hooks/useAppData';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  open: boolean;
  text: { id: string; title: string; originalText: string } | null;
  onClose: () => void;
}

export function QuestionGeneratorDialog({ open, text, onClose }: Props) {
  const { data, addExercise } = useAppData();
  const [wordsInput, setWordsInput] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<Array<{ q: string; a?: string }>>([]);
  const [loadedExisting, setLoadedExisting] = useState(false);

  const generateQuestions = async () => {
    if (!text) return;
    const words = wordsInput.split(',').map(w => w.trim()).filter(Boolean).slice(0, 10);
    if (words.length < 1) {
      toast({ title: 'Provide words', description: 'Enter 1-10 words or expressions separated by commas.', variant: 'destructive' });
      return;
    }

    setGenerating(true);
    try {
      const promptLines = [
        'You are an educational assistant. Using the following text as context:',
        text.originalText,
        '',
        'Target words/expressions: ' + words.join(', '),
        '',
        'Generate exactly ' + numQuestions + ' numbered questions. Each question MUST:',
        '- Be answerable using the context text',
        '- Include at least one of the target words/expressions in its wording',
        '- Require the answerer to use the target word/expression in their answer',
        '',
        'Return ONLY a numbered list of questions. Do NOT return code blocks, JSON, or any explanation. Example:',
        '1. ...',
        '2. ...',
        '3. ...',
      ];
      const prompt = promptLines.join('\n');

      const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
        method: 'POST',
        headers: {
          'x-goog-api-key': data.settings.geminiApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (!resp.ok) {
        const err = await resp.text().catch(() => '');
        throw new Error('HTTP ' + resp.status + (err ? ' - ' + err : ''));
      }

      const dataResp = await resp.json();
      const raw = dataResp?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) throw new Error('Empty response from Gemini');

      // Parse numbered questions from model output
      const lines = raw.split(/\n+/).map(l => l.trim()).filter(Boolean);
      const questionRegex = /^\d+\.\s*(.+)$/;
      const parsed = lines
        .map(l => {
          const match = l.match(questionRegex);
          return match ? { q: match[1] } : null;
        })
        .filter(Boolean);
      setGenerated(parsed as Array<{ q: string } >);
      toast({ title: 'Generated', description: 'Generated ' + parsed.length + ' questions' });
    } catch (error) {
      console.error('Generate error', error);
      toast({ title: 'Generation failed', description: error instanceof Error ? error.message : 'Could not generate questions from Gemini.', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    if (!text) return;
    if (!generated.length) {
      toast({ title: 'Nothing to save', description: 'Generate questions first' });
      return;
    }
    const words = wordsInput.split(',').map(w => w.trim()).filter(Boolean).slice(0, 10);
    addExercise({ textId: text.id, words, questions: generated });
    toast({ title: 'Saved', description: 'Exercise saved' });
    setWordsInput('');
    setGenerated([]);
    onClose();
  };

  const handleClose = () => {
    setWordsInput('');
    setGenerated([]);
    onClose();
  };

  // Load existing questions for this text if any
  useEffect(() => {
    if (open && text && !loadedExisting) {
      const existing = data.exercises.find(e => e.textId === text.id);
      if (existing) {
        setGenerated(existing.questions || []);
        setWordsInput((existing.words || []).join(", "));
      } else {
        setGenerated([]);
        setWordsInput("");
      }
      setLoadedExisting(true);
    }
    if (!open) {
      setLoadedExisting(false);
    }
  }, [open, text, data.exercises, loadedExisting]);

  if (!text) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>Generate Questions - {text.title}</DialogTitle>
          <DialogDescription>Enter target words/expressions, then generate questions that use them</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 h-full">
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <Input placeholder="Enter 1-10 words/expressions separated by commas..." value={wordsInput} onChange={(e) => setWordsInput(e.target.value)} className="flex-1" />
              <Input type="number" value={numQuestions} onChange={(e) => setNumQuestions(parseInt(e.target.value || '10'))} className="w-24" />
              <Button onClick={generateQuestions} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</Button>
            </div>

            {wordsInput && (
              <div className="flex flex-wrap gap-1.5">
                {wordsInput.split(',').map((word, idx) => {
                  const trimmed = word.trim();
                  if (!trimmed) return null;
                  return <Badge key={idx} variant="outline">{trimmed}</Badge>;
                })}
              </div>
            )}
          </div>

          <ScrollArea className="h-[350px] w-full rounded-md border p-2 bg-muted">
            {generated.length > 0 ? (
              <ol className="space-y-4 list-decimal list-inside">
                {generated.map((item, i) => (
                  <li key={i} className="bg-background rounded-lg p-4 border shadow-sm">
                    <div className="font-medium mb-2">{item.q}</div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {wordsInput.split(',').map((w, idx) => {
                        const word = w.trim();
                        if (!word) return null;
                        const isUsed = item.q.toLowerCase().includes(word.toLowerCase());
                        return (
                          <Badge key={idx} variant={isUsed ? 'default' : 'secondary'} className={isUsed ? 'bg-success/20 text-success-foreground hover:bg-success/30' : ''}>
                            {word}{isUsed ? ' ✓' : ''}
                          </Badge>
                        );
                      })}
                    </div>
                    {item.a && (
                      <div className="mt-2 text-xs text-muted-foreground italic">Hint: {item.a}</div>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-center text-muted-foreground py-8">Enter target words and generate questions</div>
            )}
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={!generated.length}>Save Exercise</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}