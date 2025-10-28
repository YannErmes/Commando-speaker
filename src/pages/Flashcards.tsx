import { useState } from "react";
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

  // Filter vocab by selected tags in study mode (OR semantics: show if vocab has ANY selected tag)
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
                    <p className="text-sm text-muted-foreground">Select tags to focus your study session on specific vocabulary.</p>
                    <div className="flex flex-wrap gap-2">
                      {data.tags.map(tag => (
                        <Button
                          key={tag}
                          variant={selectedTags.includes(tag) ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                        >
                          {tag}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => {
                          if (selectedTags.length === 0) {
                            toast({ title: 'Select tags', description: 'Please select at least one tag to start studying.', variant: 'destructive' });
                            return;
                          }
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