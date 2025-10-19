import { useState } from "react";
import { useAppData } from "@/hooks/useAppData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Volume2, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";

const TongueTwisters = () => {
  const { data, toggleTongueTwisterPracticed } = useAppData();
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(0.9);

  // Get unique sounds from all tongue twisters
  const allSounds = Array.from(
    new Set(data.tongueTwisters.flatMap((tt) => tt.focus))
  ).sort();

  const filteredTwisters = selectedSound
    ? data.tongueTwisters.filter((tt) => tt.focus.includes(selectedSound))
    : data.tongueTwisters;

  const handleSpeak = (text: string) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = playbackRate;
      speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "Not supported",
        description: "Text-to-speech is not supported in your browser",
        variant: "destructive",
      });
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return "bg-success";
    if (difficulty <= 3) return "bg-primary";
    if (difficulty <= 4) return "bg-accent";
    return "bg-destructive";
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-foreground">Tongue Twisters</h1>
            <p className="text-muted-foreground">
              Practice pronunciation with {data.tongueTwisters.length} tongue twisters
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {/* Filters Sidebar */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Filter by Sound</CardTitle>
                <CardDescription>Focus on specific phonemes</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-2">
                    <Button
                      variant={selectedSound === null ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setSelectedSound(null)}
                    >
                      All Sounds ({data.tongueTwisters.length})
                    </Button>
                    {allSounds.map((sound) => {
                      const count = data.tongueTwisters.filter((tt) =>
                        tt.focus.includes(sound)
                      ).length;
                      return (
                        <Button
                          key={sound}
                          variant={selectedSound === sound ? "default" : "outline"}
                          className="w-full justify-start font-mono"
                          onClick={() => setSelectedSound(sound)}
                        >
                          /{sound}/ ({count})
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Tongue Twisters Grid */}
            <div className="lg:col-span-3">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Playback Speed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Speed: {playbackRate.toFixed(1)}x</span>
                      <div className="flex gap-2">
                        <Badge variant="outline">Slow</Badge>
                        <Badge variant="outline">Normal</Badge>
                        <Badge variant="outline">Fast</Badge>
                      </div>
                    </div>
                    <Slider
                      value={[playbackRate]}
                      onValueChange={(value) => setPlaybackRate(value[0])}
                      min={0.5}
                      max={1.5}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              <ScrollArea className="h-[calc(100vh-25rem)]">
                {filteredTwisters.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">No tongue twisters found</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 pr-4">
                    {filteredTwisters.map((tt) => (
                      <Card
                        key={tt.id}
                        className={tt.practiced ? "bg-success/5 border-success/20" : ""}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${getDifficultyColor(
                                    tt.difficulty
                                  )}`}
                                />
                                <span className="text-xs text-muted-foreground">
                                  Difficulty {tt.difficulty}/5
                                </span>
                              </div>
                              <p className="text-lg font-medium mb-3 text-foreground leading-relaxed">
                                {tt.text}
                              </p>
                              <div className="bg-muted p-3 rounded-lg mb-3">
                                <p className="text-sm font-mono text-muted-foreground">
                                  IPA: {tt.ipa}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {tt.focus.map((sound) => (
                                  <Badge key={sound} variant="secondary" className="font-mono">
                                    /{sound}/
                                  </Badge>
                                ))}
                              </div>
                              {tt.notes && (
                                <p className="text-sm text-muted-foreground italic mt-2">
                                  💡 {tt.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSpeak(tt.text)}
                              >
                                <Volume2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={tt.practiced ? "default" : "outline"}
                                onClick={() => toggleTongueTwisterPracticed(tt.id)}
                              >
                                {tt.practiced ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TongueTwisters;
