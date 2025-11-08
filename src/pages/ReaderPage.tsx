import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppData } from "@/hooks/useAppData";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Search, Sparkles, Headphones, Play, Pause, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ReaderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, addVocab } = useAppData();
  const [fontSize, setFontSize] = useState(16);
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  // TTS state
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  const [rate, setRate] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const utterRef = React.useRef<SpeechSynthesisUtterance | null>(null);
  const [currentTokenIndex, setCurrentTokenIndex] = React.useState<number>(-1);
  const tokenStartsRef = React.useRef<number[]>([]);

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

  // If a video URL is attached, open it on YouTube in a new tab instead of embedding a player.
  const openVideoInYouTube = () => {
    if (!textItem.videoUrl) return;
    try {
      window.open(textItem.videoUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      // fallback
      window.open(textItem.videoUrl, '_blank');
    }
  };

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

  // --- Text-to-Speech handlers ---
  React.useEffect(() => {
    const loadVoices = () => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
      if (v.length && !selectedVoiceURI) setSelectedVoiceURI(v[0].voiceURI);
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null as any;
      }
    };
  }, [selectedVoiceURI]);

  const stopSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    utterRef.current = null;
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentTokenIndex(-1);
  };

  const startSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast({ title: 'TTS not supported', description: 'Your browser does not support Speech Synthesis.' });
      return;
    }

    stopSpeech();

    const utter = new SpeechSynthesisUtterance(textItem?.originalText || "");
    const voice = voices.find(v => v.voiceURI === selectedVoiceURI) || null;
    if (voice) utter.voice = voice;
    utter.rate = rate;
    utter.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      utterRef.current = null;
      setCurrentTokenIndex(-1);
    };
    utter.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      utterRef.current = null;
      setCurrentTokenIndex(-1);
    };

    // boundary event to highlight current reading position (words/tokens)
    // onboundary gives character index in many browsers
    // compute token starts for mapping
    const text = textItem?.originalText || "";
    const tokens = text.split(/(\s+)/);
    const starts: number[] = [];
    let offset = 0;
    for (const tok of tokens) {
      starts.push(offset);
      offset += tok.length;
    }
    tokenStartsRef.current = starts;

    utter.onboundary = (event: any) => {
      try {
  const charIndex: number = event.charIndex ?? (event.charIndex === 0 ? event.charIndex : -1);
        if (charIndex >= 0) {
          // find token index where start <= charIndex
          const idx = tokenStartsRef.current.reduce((acc, val, i) => (val <= charIndex ? i : acc), 0);
          setCurrentTokenIndex(idx);
        }
      } catch (e) {
        // ignore boundary mapping errors
      }
    };

    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const resumeSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseSpeech();
    } else if (isPaused) {
      resumeSpeech();
    } else {
      startSpeech();
    }
  };

  const renderTextWithHighlights = (text: string) => {
    const tokens = text.split(/(\s+)/);
    return tokens.map((token, idx) => {
      const cleanToken = token.toLowerCase().replace(/[.,!?;:]/g, "");
      const isHighlighted = addedWords.has(cleanToken);
      const isCurrent = idx === currentTokenIndex;

      const classes = [] as string[];
      if (isHighlighted) classes.push("bg-vocab-highlight", "border-b-2", "border-vocab-highlight-border", "font-medium");
      if (isCurrent) classes.push("bg-yellow-300/60");

      return (
        <span key={idx} className={classes.join(" ")}>{token}</span>
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

              {/* Text-to-Speech controls */}
              <div className="flex items-center gap-2 border rounded px-2 py-1">
                <Button size="sm" variant="ghost" onClick={togglePlayPause} className="h-8 w-8 p-0">
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { stopSpeech(); }} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>

                <select
                  value={selectedVoiceURI}
                  onChange={(e) => setSelectedVoiceURI(e.target.value)}
                  className="text-sm bg-transparent border-none outline-none"
                  aria-label="Select voice"
                >
                  {voices.length === 0 ? (
                    <option>Loading voices...</option>
                  ) : (
                    voices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>{v.name} {v.lang ? `(${v.lang})` : ''}</option>
                    ))
                  )}
                </select>

                <label className="text-xs text-muted-foreground ml-2">Rate</label>
                <input
                  type="range"
                  min={0.6}
                  max={1.6}
                  step={0.1}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-24"
                  aria-label="Speech rate"
                />
              </div>

              {textItem.videoUrl && (
                <Button size="sm" variant="ghost" onClick={openVideoInYouTube} title="Open video on YouTube" className="h-8 w-8 p-0">
                  <Play className="h-4 w-4" />
                </Button>
              )}
              <Button size="sm" onClick={() => navigate(-1)}>Back</Button>
            </div>
          </div>


          {/* Content row: text (scrollable) and vocabulary (scrollable) */}
          <div className="grid lg:grid-cols-[1fr_350px] gap-6" style={{ height: 'calc(100vh - 360px)' }}>
            <div className="overflow-y-auto px-6 py-6 min-h-0">
              <div
                className="bg-reader-bg text-reader-text rounded-lg leading-relaxed font-serif whitespace-pre-wrap break-words select-text p-6"
                style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}
                onDoubleClick={handleTextSelection}
                onMouseUp={handleTextSelection}
              >
                {renderTextWithHighlights(textItem.originalText)}
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
