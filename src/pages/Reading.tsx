import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "@/hooks/useAppData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, BookOpen, Plus, Minus, X, Search, Sparkles, Headphones } from "lucide-react";
import { QuestionGeneratorDialog } from "@/components/QuestionGeneratorDialog";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const GoalsList: React.FC = () => {
  const { data, addGoal, updateGoal, deleteGoal } = useAppData();
  const [localGoals, setLocalGoals] = useState<string[]>(() => (data.goals || []).slice(0,3).map(g => g.text));

  const handleSave = () => {
    // For simplicity, replace existing first 3 goals
    // remove existing first 3
    const existing = data.goals || [];
    for (let i = 0; i < 3; i++) {
      const text = localGoals[i] || "";
      const g = existing[i];
      if (g) {
        updateGoal(g.id, { text });
      } else if (text.trim()) {
        addGoal({ text });
      }
    }
    toast({ title: "Goals saved" });
  };

  return (
    <div className="space-y-2">
      {[0,1,2].map(i => (
        <Input key={i} value={localGoals[i] || ""} onChange={(e) => { const arr = [...localGoals]; arr[i] = e.target.value; setLocalGoals(arr); }} placeholder={`Goal ${i+1}`} />
      ))}
      <div className="flex gap-2 mt-2">
        <Button onClick={handleSave}>Save Goals</Button>
      </div>
    </div>
  );
};

const Reading = () => {
  const navigate = useNavigate();
  const { data, addText, deleteText, addVocab, addExercise } = useAppData();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const titleRef = React.useRef<HTMLInputElement | null>(null);
  const textRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [savedSignal, setSavedSignal] = useState(false);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(16);
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const savedListRef = React.useRef<HTMLDivElement | null>(null);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [activeText, setActiveText] = useState<SavedText | null>(null);

  const handleAddText = () => {
    if (!title.trim() || !text.trim()) {
      toast({
        title: "Missing fields",
        description: "Please provide both title and text",
        variant: "destructive",
      });
      // focus the first empty field so user sees where to type
      if (!title.trim()) {
        titleRef.current?.focus();
      } else {
        textRef.current?.focus();
      }
      return;
    }

    const newId = addText({ title, originalText: text });
    setTitle("");
    setText("");
    // show short inline confirmation in addition to toast
    setSavedSignal(true);
    setTimeout(() => setSavedSignal(false), 2500);
    // scroll saved list to top so the new item (prepended) is visible
    requestAnimationFrame(() => {
      if (savedListRef.current) {
        savedListRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
    toast({
      title: "Text saved",
      description: "Your reading material has been saved",
    });
  };

  const handleTextSelection = (textId: string, originalText: string) => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === "") return;
    const selectedString = selection.toString().trim();
    const isWord = !selectedString.includes(" ");

    let context = "";
    if (isWord) {
      const anchorNode = selection.anchorNode;
      if (anchorNode && anchorNode.textContent) {
        const fullText = anchorNode.textContent;
        const selectionStart = selection.anchorOffset;

        const beforeText = fullText.substring(0, selectionStart);
        const afterText = fullText.substring(selectionStart + selectedString.length);

        const sentenceStart = Math.max(
          beforeText.lastIndexOf("."),
          beforeText.lastIndexOf("!"),
          beforeText.lastIndexOf("?")
        ) + 1;

        const sentenceEnd = Math.min(
          ...[afterText.indexOf("."), afterText.indexOf("!"), afterText.indexOf("?")]
            .filter(i => i !== -1)
            .map(i => i + selectionStart + selectedString.length)
        );

        context = fullText.substring(
          sentenceStart,
          sentenceEnd !== Infinity ? sentenceEnd + 1 : fullText.length
        ).trim();
      }
    }

    addVocab({
      text: selectedString,
      type: isWord ? "word" : "sentence",
      context: isWord ? context : undefined,
      ipa: "",
      translation: "",
      notes: "",
      examples: [],
      tags: [],
      textId: textId,
    });

    setAddedWords(prev => new Set(prev).add(selectedString.toLowerCase()));
    toast({
      title: "Added to vocabulary",
      description: `"${selectedString}" has been saved`,
    });
    selection.removeAllRanges();
  };

  const openGoogleSearch = (word: string) => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(word + ' meaning')}`, '_blank');
  };

  const getGeminiMeaning = async (word: string) => {
    const apiKey = data.settings?.geminiApiKey || "";
    if (!apiKey) {
      toast({
        title: "AI unavailable",
        description: "Set your Gemini API key in Settings to enable AI definitions — falling back to Google.",
        variant: "destructive",
      });
      openGoogleSearch(word);
      return;
    }

    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Define the word "${word}" in a few words` }],
          }],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const meaning = data.candidates?.[0]?.content?.parts?.[0]?.text || "No definition found";

      toast({ title: word, description: meaning, duration: 10000 });
    } catch (error) {
      console.error("Error fetching meaning:", error);
      toast({
        title: "Error",
        description: "Failed to fetch meaning from Gemini AI — falling back to Google.",
        variant: "destructive",
      });
      openGoogleSearch(word);
    }
  };

  const generateQuestions = async (textId: string, sourceText: string) => {
    const apiKey = data.settings?.geminiApiKey || "";
    if (!apiKey) {
      toast({ title: "AI unavailable", description: "Set your Gemini API key in Settings to enable Gemini.", variant: "destructive" });
      return;
    }

    const words = wordsInput.split(",").map(w => w.trim()).filter(Boolean).slice(0, 10);
    if (words.length < 1) {
      toast({ title: "Provide words", description: "Enter 1-10 words or expressions separated by commas.", variant: "destructive" });
      return;
    }

    setGenerating(true);
    try {
      // Craft a very specific prompt to ensure JSON output
      const prompt = `You are a JSON-only API that generates questions. Using this text as context:
"${sourceText}"

And these target words/expressions: ${words.join(", ")}

Generate ${numQuestions} questions where each question MUST:
1. Include at least one of the target words in its text
2. Require using a target word in the answer

Return ONLY a JSON array of objects with this exact format, nothing else:
[
  {
    "q": "Question text here?",
    "a": "Brief expected answer format"
  }
]`;

      const resp = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const dataResp = await resp.json();
      const raw = dataResp?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) throw new Error("Empty response from Gemini");

      // Attempt to extract JSON from model output
      const start = raw.indexOf("[");
      const jsonText = start !== -1 ? raw.substring(start) : raw;
      let parsed: Array<{ q: string; a?: string }> = [];
      try {
        parsed = JSON.parse(jsonText);
      } catch (e) {
        // fallback: try to parse lines
        const lines = raw.split(/\n+/).map(l => l.trim()).filter(Boolean);
        parsed = lines.map((l) => ({ q: l }));
      }

      setGeneratedMap((m) => ({ ...m, [textId]: parsed }));
      toast({ title: "Generated", description: `Generated ${parsed.length} questions` });
    } catch (error) {
      console.error("Generate error", error);
      toast({ title: "Generation failed", description: "Could not generate questions from Gemini.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const saveGenerated = (textId: string) => {
    const qs = generatedMap[textId];
    if (!qs || qs.length === 0) {
      toast({ title: "Nothing to save", description: "Generate questions first" });
      return;
    }
    const words = wordsInput.split(",").map(w => w.trim()).filter(Boolean).slice(0, 10);
    addExercise({ textId, words, questions: qs });
    toast({ title: "Saved", description: "Exercise saved" });
    setActiveGenerator(null);
    setWordsInput("");
  };

  const openYouGlish = (word: string) => {
    window.open(`https://fr.youglish.com/pronounce/${encodeURIComponent(word)}/english/us`, '_blank');
  };

  const renderTextWithHighlights = (text: string) => {
    const words = text.split(/(\s+)/);
    return words.map((word, idx) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:]/g, "");
      const isHighlighted = addedWords.has(cleanWord);

      return (
        <span
          key={idx}
          className={
            isHighlighted
              ? "bg-vocab-highlight border-b-2 border-vocab-highlight-border font-medium"
              : ""
          }
        >
          {word}
        </span>
      );
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-foreground">Reading Section</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Paste texts and select words or sentences to add to your vocabulary
            </p>
          </div>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
            {/* Add New Text */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Add New Text</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Paste or type your reading material</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <Input
                    ref={titleRef}
                    placeholder="Text title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-sm sm:text-base"
                  />
                  <Textarea
                    ref={textRef}
                    placeholder="Paste your text here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={8}
                    className="resize-none text-sm sm:text-base"
                  />
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    <Button type="button" onClick={handleAddText} className="w-full sm:w-auto">
                      Save Text
                    </Button>
                    {savedSignal && <span className="text-sm text-success">Saved!</span>}
                  </div>
                </CardContent>
              </Card>
              <Card className="mt-3 sm:mt-4">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Weekly Goals (3)</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Quick reminders for the week</CardDescription>
                </CardHeader>
                <CardContent>
                  <GoalsList />
                </CardContent>
              </Card>
            </div>

            {/* Saved Texts List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Saved Texts ({data.texts.length})</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Your reading materials</CardDescription>
              </CardHeader>
              <CardContent>
                <div ref={savedListRef} className="h-[320px] sm:h-[400px] pr-2 sm:pr-4 overflow-y-auto">
                  {data.texts.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No texts saved yet</p>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {data.texts.map((t) => (
                        <Card key={t.id}>
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                              <div className="flex-1">
                                <h3 className="font-semibold mb-1 text-base sm:text-lg">{t.title}</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                  {t.originalText}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {new Date(t.date).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex flex-row sm:flex-col gap-2">
                                <Button size="sm" variant="outline" onClick={() => navigate(`/reading/${t.id}`)}>
                                  <BookOpen className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    deleteText(t.id);
                                    toast({
                                      title: "Text deleted",
                                      description: "Reading material removed",
                                    });
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-0 sm:mt-2"
                                  onClick={() => {
                                    setActiveText(t);
                                    setGeneratorOpen(true);
                                  }}
                                >
                                  <Sparkles className="h-4 w-4 mr-1" />
                                  <span className="hidden sm:inline">Practice with AI</span>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <QuestionGeneratorDialog
        open={generatorOpen}
        text={activeText}
        onClose={() => {
          setGeneratorOpen(false);
          setActiveText(null);
        }}
      />
    </div>
  );
};

export default Reading;
