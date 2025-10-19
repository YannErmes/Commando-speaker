import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppData } from "@/hooks/useAppData";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Search, Sparkles, Headphones } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ReaderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, addVocab } = useAppData();
  const [fontSize, setFontSize] = useState(16);
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());

  const textItem = data.texts.find((t) => t.id === id);
  if (!textItem) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold">Text not found</h2>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Go back
        </Button>
      </div>
    );
  }

  const handleTextSelection = () => {
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
      textId: id!,
    });

    setAddedWords(prev => new Set(prev).add(selectedString.toLowerCase()));
    toast({ title: "Added to vocabulary", description: `\"${selectedString}\" has been saved` });
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
          contents: [{ parts: [{ text: `Define the word "${word}" in a few words` }] }],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const dataResp = await response.json();
      const meaning = dataResp.candidates?.[0]?.content?.parts?.[0]?.text || "No definition found";

      toast({ title: word, description: meaning, duration: 10000 });
    } catch (error) {
      console.error("Error fetching meaning:", error);
      toast({ title: "Error", description: "Failed to fetch meaning from Gemini AI — falling back to Google.", variant: "destructive" });
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
        <span key={idx} className={isHighlighted ? "bg-vocab-highlight border-b-2 border-vocab-highlight-border font-medium" : ""}>
          {word}
        </span>
      );
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{textItem.title}</h1>
              <p className="text-sm text-muted-foreground">Reading view</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setFontSize(Math.max(12, fontSize - 2))}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{fontSize}px</span>
              <Button size="sm" variant="outline" onClick={() => setFontSize(Math.min(24, fontSize + 2))}>
                <Plus className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={() => navigate(-1)}>Back</Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_350px] gap-6 min-h-[60vh]">
            <div className="flex flex-col h-full min-h-0 border-r">
              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
                <div
                  className="bg-reader-bg text-reader-text rounded-lg leading-relaxed font-serif whitespace-pre-wrap break-words select-text p-6"
                  style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}
                  onDoubleClick={handleTextSelection}
                  onMouseUp={handleTextSelection}
                >
                  {renderTextWithHighlights(textItem.originalText)}
                </div>
              </div>
            </div>

            <aside className="flex flex-col h-full bg-muted/20">
              <div className="px-4 py-3 border-b">
                <h3 className="font-semibold text-base">Vocabulary</h3>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3">
                {data.vocab.filter(v => v.textId === id).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Select text to add vocabulary</p>
                ) : (
                  <div className="space-y-3 pb-4">
                    {data.vocab.filter(v => v.textId === id).map(v => (
                      <div key={v.id} className="p-3 bg-background rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-sm font-semibold mb-2">{v.text}</div>
                        {v.ipa && <div className="text-xs text-muted-foreground font-mono mb-2">/{v.ipa}/</div>}
                        {v.translation && <div className="text-xs mb-2">{v.translation}</div>}
                        {v.context && (
                          <div className="text-xs text-muted-foreground italic mb-3 p-2 bg-muted/50 rounded">"{v.context}"</div>
                        )}
                        <div className="flex flex-col gap-2">
                          <Button size="sm" variant="outline" onClick={() => openGoogleSearch(v.text)} className="h-9 w-full text-xs justify-start gap-2">
                            <Search className="h-3.5 w-3.5" />
                            Search on Google
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => getGeminiMeaning(v.text)} className="h-9 w-full text-xs justify-start gap-2">
                            <Sparkles className="h-3.5 w-3.5" />
                            Get AI Definition
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openYouGlish(v.text)} className="h-9 w-full text-xs justify-start gap-2">
                            <Headphones className="h-3.5 w-3.5" />
                            Hear Pronunciation
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReaderPage;
