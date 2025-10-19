import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "@/hooks/useAppData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, BookOpen, Plus, Minus, X, Search, Sparkles, Headphones } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

const Reading = () => {
  const navigate = useNavigate();
  const { data, addText, deleteText, addVocab } = useAppData();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const titleRef = React.useRef<HTMLInputElement | null>(null);
  const textRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [savedSignal, setSavedSignal] = useState(false);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(16);
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const savedListRef = React.useRef<HTMLDivElement | null>(null);

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
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      toast({
        title: "AI unavailable",
        description: "Set VITE_GEMINI_API_KEY in your .env to enable AI definitions — falling back to Google.",
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-foreground">Reading Section</h1>
            <p className="text-muted-foreground">
              Paste texts and select words or sentences to add to your vocabulary
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Add New Text */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Text</CardTitle>
                <CardDescription>Paste or type your reading material</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  ref={titleRef}
                  placeholder="Text title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Textarea
                  ref={textRef}
                  placeholder="Paste your text here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={10}
                  className="resize-none"
                />
                <div className="flex items-center gap-3">
                  <Button type="button" onClick={handleAddText} className="w-full">
                    Save Text
                  </Button>
                  {savedSignal && <span className="text-sm text-success">Saved!</span>}
                </div>
              </CardContent>
            </Card>

            {/* Saved Texts List */}
            <Card>
              <CardHeader>
                <CardTitle>Saved Texts ({data.texts.length})</CardTitle>
                <CardDescription>Your reading materials</CardDescription>
              </CardHeader>
              <CardContent>
                <div ref={savedListRef} className="h-[400px] pr-4 overflow-y-auto">
                  {data.texts.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No texts saved yet</p>
                  ) : (
                    <div className="space-y-3">
                      {data.texts.map((t) => (
                        <Card key={t.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="font-semibold mb-1">{t.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {t.originalText}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {new Date(t.date).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-2">
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
    </div>
  );
};

export default Reading;
