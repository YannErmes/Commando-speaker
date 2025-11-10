import { useState, useEffect, useRef } from "react";
import { useAppData } from "@/hooks/useAppData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Edit2, Sparkles } from "lucide-react";

const Flashcards = () => {
  const { data, addVocab, updateVocab, markVocabUsed } = useAppData();
  const [currentSet, setCurrentSet] = useState(0);
  const [isAddingVocab, setIsAddingVocab] = useState(false);
  const [studyDialogOpen, setStudyDialogOpen] = useState(false);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  // Study boxes state
  const [studyBoxes, setStudyBoxes] = useState<{ 
    id: string; 
    name: string; 
    words: string[]; 
    studied: string[];
  }[]>([]);
  const [showStudyBox, setShowStudyBox] = useState(false);
  const [showCreateBoxDialog, setShowCreateBoxDialog] = useState(false);
  const [newBoxName, setNewBoxName] = useState("");
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [editingVocab, setEditingVocab] = useState<string | null>(null);
  const [newVocab, setNewVocab] = useState({
    text: "",
    type: "word" as const,
    ipa: "",
    translation: "",
    notes: "",
    examples: [],
    tags: [],
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSuggestion, setGeneratedSuggestion] = useState<{
    translation?: string;
    ipa?: string;
    notes?: string;
    examples?: string[];
  } | null>(null);
  const [acceptedFields, setAcceptedFields] = useState<{ translation: boolean; ipa: boolean; notes: boolean; examples: boolean }>({ translation: false, ipa: false, notes: false, examples: false });

  const PAGE_SIZE = 6;

  // Persistent session timer (stored in localStorage so it keeps running across sections)
  const TIMER_BASE_KEY = 'fln:sessionTimerBase'; // seconds
  const TIMER_LAST_START_KEY = 'fln:sessionTimerLastStart'; // ms timestamp or null

  const [elapsed, setElapsed] = useState<number>(() => {
    try {
      const base = parseInt(localStorage.getItem(TIMER_BASE_KEY) || '0', 10) || 0;
      const last = parseInt(localStorage.getItem(TIMER_LAST_START_KEY) || '0', 10) || 0;
      if (last) {
        const extra = Math.floor((Date.now() - last) / 1000);
        return base + extra;
      }
      return base;
    } catch {
      return 0;
    }
  });

  const intervalRef = useRef<number | null>(null);

  const formatTime = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const startTick = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    try {
      const base = parseInt(localStorage.getItem(TIMER_BASE_KEY) || '0', 10) || 0;
      const last = parseInt(localStorage.getItem(TIMER_LAST_START_KEY) || '0', 10) || 0;
      const current = last ? base + Math.floor((Date.now() - last) / 1000) : base;
      setElapsed(current);
    } catch {}
    intervalRef.current = window.setInterval(() => {
      try {
        const base = parseInt(localStorage.getItem(TIMER_BASE_KEY) || '0', 10) || 0;
        const last = parseInt(localStorage.getItem(TIMER_LAST_START_KEY) || '0', 10) || 0;
        const current = last ? base + Math.floor((Date.now() - last) / 1000) : base;
        setElapsed(current);
      } catch {}
    }, 1000) as unknown as number;
  };

  const stopTick = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startTimer = () => {
    try {
      if (!localStorage.getItem(TIMER_LAST_START_KEY)) {
        localStorage.setItem(TIMER_LAST_START_KEY, String(Date.now()));
      }
    } catch {}
    startTick();
  };

  const pauseTimer = () => {
    try {
      const last = parseInt(localStorage.getItem(TIMER_LAST_START_KEY) || '0', 10) || 0;
      const base = parseInt(localStorage.getItem(TIMER_BASE_KEY) || '0', 10) || 0;
      if (last) {
        const extra = Math.floor((Date.now() - last) / 1000);
        localStorage.setItem(TIMER_BASE_KEY, String(base + extra));
      }
      localStorage.removeItem(TIMER_LAST_START_KEY);
    } catch {}
    stopTick();
    try {
      const base = parseInt(localStorage.getItem(TIMER_BASE_KEY) || '0', 10) || 0;
      setElapsed(base);
    } catch {}
  };

  const resetTimer = () => {
    try {
      localStorage.removeItem(TIMER_LAST_START_KEY);
      localStorage.setItem(TIMER_BASE_KEY, '0');
    } catch {}
    stopTick();
    setElapsed(0);
  };

  useEffect(() => {
    if (localStorage.getItem(TIMER_LAST_START_KEY)) startTick();
    const onStorage = (e: StorageEvent) => {
      if (e.key === TIMER_BASE_KEY || e.key === TIMER_LAST_START_KEY) {
        try {
          const base = parseInt(localStorage.getItem(TIMER_BASE_KEY) || '0', 10) || 0;
          const last = parseInt(localStorage.getItem(TIMER_LAST_START_KEY) || '0', 10) || 0;
          const current = last ? base + Math.floor((Date.now() - last) / 1000) : base;
          setElapsed(current);
          if (last) startTick(); else stopTick();
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      stopTick();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Filter vocab by selected tags in study mode (OR semantics: show if vocab has ANY selected tag)
  // When no tags are selected (selectedTags is empty), show all words
  const filteredVocab = isStudyMode && selectedTags.length > 0
    ? data.vocab.filter(v => v.tags?.some(tag => selectedTags.includes(tag)))
    : data.vocab;

  const totalPages = Math.ceil(filteredVocab.length / PAGE_SIZE);
  const currentVocabSet = filteredVocab.slice(
    currentSet * PAGE_SIZE,
    (currentSet + 1) * PAGE_SIZE
  );

  const resetFlippedElements = () => {
    try {
      const flipped = document.querySelectorAll('.flashcard.flipped');
      flipped.forEach((el) => el.classList.remove('flipped'));
    } catch (e) {
      // ignore
    }
  };

  const handleNextSet = () => {
    if (currentSet < totalPages - 1) {
      resetFlippedElements();
      setCurrentSet((prev) => prev + 1);
    }
  };

  const handlePrevSet = () => {
    if (currentSet > 0) {
      resetFlippedElements();
      setCurrentSet((prev) => prev - 1);
    }
  };

  const handleAddVocab = () => {
    addVocab(newVocab);
    setNewVocab({
      text: "",
      type: "word",
      ipa: "",
      translation: "",
      notes: "",
      examples: [],
      tags: [],
    });
    setIsAddingVocab(false);
  };

  // Study box helpers (visual only)
  const createStudyBox = () => {
    if (!newBoxName.trim()) {
      toast({ title: 'Error', description: 'Please enter a name for the study box' });
      return;
    }
    const id = Date.now().toString();
    setStudyBoxes(prev => [...prev, {
      id,
      name: newBoxName.trim(),
      words: [],
      studied: []
    }]);
    setNewBoxName("");
    setShowCreateBoxDialog(false);
    toast({ title: 'Created', description: `Study box "${newBoxName}" created` });
  };

  const addToStudyBox = (wordId: string, boxId: string) => {
    setStudyBoxes(prev => prev.map(box => 
      box.id === boxId
        ? { ...box, words: box.words.includes(wordId) ? box.words : [...box.words, wordId] }
        : box
    ));
    toast({ title: 'Added', description: 'Word added to study box' });
  };

  const removeFromStudyBox = (wordId: string, boxId: string) => {
    setStudyBoxes(prev => prev.map(box => 
      box.id === boxId
        ? {
            ...box,
            words: box.words.filter(x => x !== wordId),
            studied: box.studied.filter(x => x !== wordId)
          }
        : box
    ));
  };

  const markAsStudied = (wordId: string, boxId: string) => {
    setStudyBoxes(prev => prev.map(box => 
      box.id === boxId
        ? {
            ...box,
            words: box.words.filter(x => x !== wordId),
            studied: box.studied.includes(wordId) ? box.studied : [...box.studied, wordId]
          }
        : box
    ));
  };

  const unmarkStudied = (wordId: string, boxId: string) => {
    setStudyBoxes(prev => prev.map(box => 
      box.id === boxId
        ? {
            ...box,
            studied: box.studied.filter(x => x !== wordId),
            words: box.words.includes(wordId) ? box.words : [...box.words, wordId]
          }
        : box
    ));
  };

  const deleteStudyBox = (boxId: string) => {
    setStudyBoxes(prev => prev.filter(box => box.id !== boxId));
    toast({ title: 'Deleted', description: 'Study box removed' });
  };

  const clearStudyBox = (boxId: string) => {
    setStudyBoxes(prev => prev.map(box => 
      box.id === boxId
        ? { ...box, words: [], studied: [] }
        : box
    ));
  };

  // Persist study boxes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('fln:studyBoxes', JSON.stringify(studyBoxes));
    } catch {}
  }, [studyBoxes]);

  // Load persisted study boxes on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('fln:studyBoxes') || '[]');
      if (Array.isArray(saved)) {
        setStudyBoxes(saved);
      }
    } catch {}
  }, []);

  const downloadStudyBoxAsHtml = (boxId: string) => {
    try {
      const box = studyBoxes.find(b => b.id === boxId);
      if (!box) return;
      const words = box.words.map(id => data.vocab.find(v => v.id === id)?.text).filter(Boolean) as string[];
      if (!words.length) {
        toast({ title: 'Empty', description: 'Study box is empty.' });
        return;
      }

      // Create an HTML document with embedded styles and JavaScript
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Study Box: ${box.name} - ${new Date().toLocaleDateString()}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            max-width: 800px;
            margin: 2rem auto;
            padding: 0 1rem;
            background: #f9fafb;
            color: #111827;
        }
        h1 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #111827;
        }
        .word-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 0.75rem;
            margin: 1rem 0;
        }
        .word {
            background: white;
            border: 1px solid #e5e7eb;
            padding: 0.75rem;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: all 0.2s;
            user-select: none;
            text-align: center;
        }
        .word:hover {
            border-color: #d1d5db;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .word.used {
            background: #fee2e2;
            border-color: #fecaca;
            color: #991b1b;
        }
        .info {
            color: #6b7280;
            font-size: 0.875rem;
            margin: 2rem 0;
            padding: 1rem;
            background: white;
            border-radius: 0.5rem;
            border: 1px solid #e5e7eb;
        }
        .stats {
            font-size: 0.875rem;
            color: #6b7280;
            margin-top: 1rem;
        }
    </style>
</head>
<body>
    <h1>Study Box: ${box.name} - ${new Date().toLocaleDateString()}</h1>
    <div class="word-grid">
        ${words.map(word => `<div class="word" onclick="toggleWord(this)" data-word="${word.replace(/"/g, '&quot;')}">${word}</div>`).join('\n        ')}
    </div>
    <div class="stats">
        Words remaining: <span id="remaining">${words.length}</span>
        <br>
        Words used: <span id="used">0</span>
    </div>
    <div class="info">
        Click/tap a word to mark it as used. Your progress is saved automatically in this file's URL.
        <br>
        Bookmark this page to keep your progress.
    </div>
    <script>
        // Load used words from URL hash
        const loadUsedWords = () => {
            try {
                const hash = window.location.hash.slice(1);
                return hash ? JSON.parse(decodeURIComponent(hash)) : [];
            } catch (e) {
                return [];
            }
        };

        // Save used words to URL hash
        const saveUsedWords = (words) => {
            window.location.hash = encodeURIComponent(JSON.stringify(words));
        };

        // Initialize from URL hash
        const usedWords = loadUsedWords();
        usedWords.forEach(word => {
            const el = document.querySelector(\`.word[data-word="\${word}"]\`);
            if (el) el.classList.add('used');
        });

        // Update stats
        const updateStats = () => {
            const total = document.querySelectorAll('.word').length;
            const used = document.querySelectorAll('.word.used').length;
            document.getElementById('remaining').textContent = total - used;
            document.getElementById('used').textContent = used;
        };

        // Toggle word used state
        function toggleWord(el) {
            const word = el.dataset.word;
            const isUsed = el.classList.toggle('used');
            
            // Update used words list
            const usedWords = loadUsedWords();
            const newUsedWords = isUsed
                ? [...usedWords, word]
                : usedWords.filter(w => w !== word);
            
            saveUsedWords(newUsedWords);
            updateStats();
        }

        // Initial stats update
        updateStats();
    </script>
</body>
</html>`;

      const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `study-box-${new Date().toLocaleDateString().replace(/\//g, '-')}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Downloaded',
        description: 'Open the HTML file in your browser. Your progress will be saved in the URL when you click words.',
      });
    } catch (e) {
      console.error('Download error', e);
      toast({ title: 'Error', description: 'Failed to download study box as HTML.', variant: 'destructive' });
    }
  };

  // Toggle an item between boxes (click behavior in the dialog)
  const toggleStudyItem = (id: string) => {
    if (studyBox.includes(id)) {
      markAsStudied(id);
      return;
    }
    if (studiedBox.includes(id)) {
      unmarkStudied(id);
      return;
    }
    addToStudyBox(id);
  };

  const handleEditVocab = (id: string) => {
    const vocab = data.vocab.find(v => v.id === id);
    if (vocab) {
      setNewVocab({
        text: vocab.text,
        type: vocab.type,
        ipa: vocab.ipa,
        translation: vocab.translation,
        notes: vocab.notes,
        examples: vocab.examples,
        tags: vocab.tags,
      });
      setEditingVocab(id);
      setIsAddingVocab(true);
    }
  };

  const handleSaveEdit = () => {
    if (editingVocab) {
      updateVocab(editingVocab, newVocab);
      setEditingVocab(null);
      setIsAddingVocab(false);
      setNewVocab({
        text: "",
        type: "word",
        ipa: "",
        translation: "",
        notes: "",
        examples: [],
        tags: [],
      });
    }
  };

  const generateMissingWithGemini = async () => {
    const word = newVocab.text?.trim();
    if (!word) {
      toast({ title: 'No word', description: 'Please enter a word before generating.' });
      return;
    }

    const apiKey = data.settings?.geminiApiKey || "";
    if (!apiKey) {
      toast({ title: 'AI unavailable', description: 'Set your Gemini API key in Settings to enable AI generation.', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Return a JSON object with the following keys for the word: \"${word}\": translation (short), ipa (if known, otherwise empty string), notes (a short explanatory note), examples (an array of 1-3 example sentences using the word). Respond ONLY with valid JSON.`;

      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const dataResp = await response.json();
      const text = dataResp.candidates?.[0]?.content?.parts?.[0]?.text || "";

      let parsed: any = null;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try { parsed = JSON.parse(jsonMatch[0]); } catch (_) { parsed = null; }
        }
      }

      if (!parsed) {
        toast({ title: 'Generation failed', description: 'AI response was not valid JSON. Check API key and try again.', variant: 'destructive' });
      } else {
        const suggestion = {
          translation: parsed.translation || "",
          ipa: parsed.ipa || "",
          notes: parsed.notes || "",
          examples: Array.isArray(parsed.examples) ? parsed.examples : [],
        };
        setGeneratedSuggestion(suggestion);
        setAcceptedFields({
          translation: !newVocab.translation,
          ipa: !newVocab.ipa,
          notes: !newVocab.notes,
          examples: !(newVocab.examples && newVocab.examples.length > 0),
        });
        toast({ title: 'Generated', description: 'AI suggestions ready — review and apply the ones you want.' });
      }
    } catch (err) {
      console.error('Gemini generation error', err);
      toast({ title: 'Error', description: 'Failed to generate from Gemini API.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-foreground">Flashcards</h1>
              <p className="text-muted-foreground">
                {isStudyMode
                  ? `Studying ${filteredVocab.length} words with selected tags`
                  : `Practice with ${data.vocab.length} vocabulary items`}
              </p>
              {/* Session timer */}
              <div className="mt-3 flex items-center gap-2">
                <div className="font-mono bg-muted/10 px-3 py-1 rounded text-sm">{formatTime(elapsed)}</div>
                <Button size="sm" onClick={() => {
                  if (localStorage.getItem('fln:sessionTimerLastStart')) pauseTimer(); else startTimer();
                }}>
                  {localStorage.getItem('fln:sessionTimerLastStart') ? 'Pause' : 'Start'}
                </Button>
                <Button size="sm" variant="ghost" onClick={resetTimer}>Reset</Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Dialog open={studyDialogOpen} onOpenChange={setStudyDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant={isStudyMode ? "secondary" : "outline"}>
                    {isStudyMode ? "End Study Session" : "Start Study Session"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Start Study Session</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">Select tags to focus your study session on specific vocabulary, or choose "All Words" to study everything.</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={selectedTags.length === 0 ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTags([])}
                      >
                        All Words ({data.vocab.length})
                      </Button>
                      {data.tags.map(tag => {
                        const wordsWithTag = data.vocab.filter(v => v.tags?.includes(tag)).length;
                        return (
                          <Button
                            key={tag}
                            variant={selectedTags.includes(tag) ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                          >
                            {tag} ({wordsWithTag})
                          </Button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => {
                          setIsStudyMode(true);
                          setStudyDialogOpen(false);
                          setCurrentSet(0);
                        }}
                      >
                        Start Session
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => { setSelectedTags([]); setStudyDialogOpen(false); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Study Boxes dialog */}
              <Dialog open={showStudyBox} onOpenChange={setShowStudyBox}>
                <DialogTrigger asChild>
                  <Button variant="outline">Study Boxes</Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl w-[92vw] p-6">
                  <DialogHeader>
                    <DialogTitle>Study Boxes</DialogTitle>
                  </DialogHeader>
                  <div className="pt-4">
                    {studyBoxes.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">No study boxes created yet</p>
                        <Button onClick={() => setShowCreateBoxDialog(true)}>Create Study Box</Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between mb-4">
                          <Button variant="outline" onClick={() => setShowCreateBoxDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Study Box
                          </Button>
                        </div>
                        
                        <div className="space-y-6">
                          {studyBoxes.map(box => (
                            <div key={box.id} className="border rounded-lg p-4">
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">{box.name}</h3>
                                <Button variant="destructive" size="sm" onClick={() => deleteStudyBox(box.id)}>Delete</Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl border bg-red-50 shadow-sm">
                                  <h4 className="font-semibold mb-3 text-red-900 text-lg">To Use</h4>
                                  {box.words.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No items added yet</p>
                                  ) : (
                                    <div className="flex flex-wrap gap-2">
                                      {box.words.map(id => {
                                        const v = data.vocab.find(x => x.id === id);
                                        if (!v) return null;
                                        return (
                                          <button
                                            key={id}
                                            onClick={() => markAsStudied(id, box.id)}
                                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-red-100 text-red-900 text-sm hover:shadow-md transition"
                                            title="Click to mark used"
                                          >
                                            <span className="truncate max-w-[10rem]">{v.text}</span>
                                            <span className="text-[10px] text-red-700">→</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>

                                <div className="p-4 rounded-2xl border bg-green-50 shadow-sm">
                                  <h4 className="font-semibold mb-3 text-green-900 text-lg">Used</h4>
                                  {box.studied.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No items used yet</p>
                                  ) : (
                                    <div className="flex flex-wrap gap-2">
                                      {box.studied.map(id => {
                                        const v = data.vocab.find(x => x.id === id);
                                        if (!v) return null;
                                        return (
                                          <button
                                            key={id}
                                            onClick={() => unmarkStudied(id, box.id)}
                                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-green-100 text-green-900 text-sm hover:shadow-md transition"
                                            title="Click to move back"
                                          >
                                            <span className="truncate max-w-[10rem]">{v.text}</span>
                                            <span className="text-[10px] text-green-700">↶</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" onClick={() => downloadStudyBoxAsHtml(box.id)}>
                                  Download HTML
                                </Button>
                                <Button variant="destructive" onClick={() => clearStudyBox(box.id)}>Clear</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Create Study Box Dialog */}
              <Dialog open={showCreateBoxDialog} onOpenChange={setShowCreateBoxDialog}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Study Box</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input
                      placeholder="Enter study box name"
                      value={newBoxName}
                      onChange={(e) => setNewBoxName(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setShowCreateBoxDialog(false)}>Cancel</Button>
                      <Button onClick={createStudyBox}>Create</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                onClick={() => {
                  if (isStudyMode) {
                    // end session
                    setIsStudyMode(false);
                    setSelectedTags([]);
                  }
                }}
                variant="ghost"
              >
                {isStudyMode ? 'End Session' : null}
              </Button>

              <Dialog open={isAddingVocab} onOpenChange={setIsAddingVocab}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Vocabulary</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Input placeholder="Word or Expression" value={newVocab.text} onChange={(e) => setNewVocab({ ...newVocab, text: e.target.value })} />
                    </div>
                    <div>
                      <Input placeholder="IPA Pronunciation" value={newVocab.ipa} onChange={(e) => setNewVocab({ ...newVocab, ipa: e.target.value })} />
                    </div>
                    <div>
                      <Input placeholder="Translation" value={newVocab.translation} onChange={(e) => setNewVocab({ ...newVocab, translation: e.target.value })} />
                    </div>
                    <div>
                      <Textarea placeholder="Additional Notes" value={newVocab.notes} onChange={(e) => setNewVocab({ ...newVocab, notes: e.target.value })} />
                    </div>
                    <div>
                      <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={generateMissingWithGemini} disabled={isGenerating}>
                        {isGenerating ? 'Generating...' : (<><Sparkles className="h-4 w-4" />Generate with Gemini</>)}
                      </Button>
                    </div>

                    {generatedSuggestion && (
                      <div className="p-3 bg-muted/10 rounded border mt-2 space-y-3">
                        <div className="flex items-start gap-2">
                          <Checkbox checked={acceptedFields.translation} onCheckedChange={(v) => setAcceptedFields((s) => ({ ...s, translation: !!v }))} />
                          <div>
                            <div className="text-xs text-muted-foreground">Translation (suggested)</div>
                            <div className="font-medium">{generatedSuggestion.translation || <span className="text-muted-foreground">(none)</span>}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Checkbox checked={acceptedFields.ipa} onCheckedChange={(v) => setAcceptedFields((s) => ({ ...s, ipa: !!v }))} />
                          <div>
                            <div className="text-xs text-muted-foreground">IPA (suggested)</div>
                            <div className="font-medium">{generatedSuggestion.ipa || <span className="text-muted-foreground">(none)</span>}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Checkbox checked={acceptedFields.notes} onCheckedChange={(v) => setAcceptedFields((s) => ({ ...s, notes: !!v }))} />
                          <div>
                            <div className="text-xs text-muted-foreground">Notes (suggested)</div>
                            <div className="font-medium whitespace-pre-wrap">{generatedSuggestion.notes || <span className="text-muted-foreground">(none)</span>}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Checkbox checked={acceptedFields.examples} onCheckedChange={(v) => setAcceptedFields((s) => ({ ...s, examples: !!v }))} />
                          <div className="flex-1">
                            <div className="text-xs text-muted-foreground">Examples (suggested)</div>
                            {generatedSuggestion.examples && generatedSuggestion.examples.length > 0 ? (
                              <ul className="list-disc pl-5 text-sm">
                                {generatedSuggestion.examples.map((ex, i) => (
                                  <li key={i}>{ex}</li>
                                ))}
                              </ul>
                            ) : (
                              <div className="text-muted-foreground text-sm">(none)</div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={() => {
                            setNewVocab((prev) => ({
                              ...prev,
                              translation: acceptedFields.translation ? (generatedSuggestion.translation || prev.translation) : prev.translation,
                              ipa: acceptedFields.ipa ? (generatedSuggestion.ipa || prev.ipa) : prev.ipa,
                              notes: acceptedFields.notes ? (generatedSuggestion.notes || prev.notes) : prev.notes,
                              examples: acceptedFields.examples ? (generatedSuggestion.examples || prev.examples) : prev.examples,
                            }));
                            setGeneratedSuggestion(null);
                            toast({ title: 'Applied', description: 'Selected suggestions applied to the form. Edit if needed then save.' });
                          }}>Apply selected</Button>
                          <Button variant="ghost" onClick={() => { setGeneratedSuggestion(null); toast({ title: 'Discarded', description: 'AI suggestions discarded.' }); }}>Discard</Button>
                        </div>
                      </div>
                    )}

                    <Button className="w-full" onClick={editingVocab ? handleSaveEdit : handleAddVocab}>{editingVocab ? 'Save Changes' : 'Add Vocabulary'}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {currentVocabSet.map((vocab, index) => (
              <div key={vocab.id} className="flashcard-container">
                <Card id={`card-${index}`} className="h-[220px] flashcard" onClick={() => markVocabUsed(vocab.id)}>
                  <CardContent className="p-6 h-full relative cursor-pointer">
                    <div className="absolute left-3 top-3 z-20 bg-muted/50 text-xs px-2 py-1 rounded-full">Used: {vocab.usageCount || 0}</div>
                    <div className="absolute top-2 right-2 z-10 card-actions flex gap-2">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/search?q=${encodeURIComponent(vocab.text + ' meaning')}`, '_blank'); }}>
                        <Search className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleEditVocab(vocab.id); }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {isStudyMode && studyBoxes.length > 0 && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add to Study Box</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-2 pt-4">
                              {studyBoxes.map(box => (
                                <Button
                                  key={box.id}
                                  variant="outline"
                                  className="w-full justify-start text-left"
                                  onClick={() => {
                                    addToStudyBox(vocab.id, box.id);
                                    document.querySelector('button[aria-label="Close"]')?.click();
                                  }}
                                >
                                  {box.name}
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    ({box.words.length} words)
                                  </span>
                                </Button>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>

                    <div className="flashcard-inner h-full">
                      <div className="flashcard-front flex flex-col justify-center items-center h-full">
                        <h3 className="text-xl font-bold">{vocab.text}</h3>
                        {vocab.ipa && (<p className="text-sm text-muted-foreground font-mono mt-2">{vocab.ipa}</p>)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          <div className="fixed bottom-8 left-0 right-0 flex justify-center" style={{ zIndex: 1000 }}>
            <div className="bg-background/95 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border flex gap-4 items-center">
              <Button variant="outline" onClick={handlePrevSet} disabled={currentSet === 0} className="relative" style={{ pointerEvents: 'auto' }}>Previous</Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">Page {currentSet + 1} of {Math.max(totalPages, 1)}</span>
              <Button variant="outline" onClick={handleNextSet} disabled={currentSet >= totalPages - 1} className="relative" style={{ pointerEvents: 'auto' }}>Next</Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Flashcards;