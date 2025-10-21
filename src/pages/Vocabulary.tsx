import { useState } from "react";
import { useAppData } from "@/hooks/useAppData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Trash2, Volume2, Edit2, Save, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const Vocabulary = () => {
  const { data, deleteVocab, updateVocab } = useAppData();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    ipa: string;
    translation: string;
    notes: string;
  }>({ ipa: "", translation: "", notes: "" });

  const filteredVocab = data.vocab.filter((v) =>
    v.text.toLowerCase().includes(search.toLowerCase())
  );

  const handleSpeak = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "Not supported",
        description: "Text-to-speech is not supported in your browser",
        variant: "destructive",
      });
    }
  };

  const startEditing = (vocab: any) => {
    setEditingId(vocab.id);
    setEditForm({
      ipa: vocab.ipa,
      translation: vocab.translation,
      notes: vocab.notes,
    });
  };

  const saveEdit = () => {
    if (editingId) {
      updateVocab(editingId, editForm);
      setEditingId(null);
      toast({
        title: "Updated",
        description: "Vocabulary entry has been updated",
      });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ ipa: "", translation: "", notes: "" });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-foreground">Vocabulary Manager</h1>
            <p className="text-muted-foreground">
              Manage your words and sentences with IPA and translations
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Search Vocabulary ({filteredVocab.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search your vocabulary..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <ScrollArea className="h-[calc(100vh-20rem)]">
            {filteredVocab.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {data.vocab.length === 0
                      ? "No vocabulary yet. Add words from the Reading section!"
                      : "No results found"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4 pr-4">
                {filteredVocab.map((vocab) => {
                  const isEditing = editingId === vocab.id;

                  return (
                    <Card key={vocab.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-bold text-foreground">{vocab.text}</h3>
                              <Badge variant={vocab.type === "word" ? "default" : "secondary"}>
                                {vocab.type}
                              </Badge>
                            </div>
                            {vocab.context && (
                              <p className="text-sm text-muted-foreground italic mb-2">
                                Context: "{vocab.context}"
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(vocab.text + ' meaning')}`, '_blank')}
                            >
                              <Search className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSpeak(vocab.text)}
                            >
                              <Volume2 className="h-4 w-4" />
                            </Button>
                            {!isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditing(vocab)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    deleteVocab(vocab.id);
                                    toast({
                                      title: "Deleted",
                                      description: "Vocabulary entry removed",
                                    });
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button size="sm" variant="default" onClick={saveEdit}>
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEdit}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="space-y-3 bg-muted p-4 rounded-lg">
                            <div>
                              <label className="text-sm font-medium mb-1 block">
                                IPA Pronunciation
                              </label>
                              <Input
                                placeholder="e.g., /həˈloʊ/"
                                value={editForm.ipa}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, ipa: e.target.value })
                                }
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-1 block">Translation</label>
                              <Input
                                placeholder="Translation in your language..."
                                value={editForm.translation}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, translation: e.target.value })
                                }
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-1 block">Notes</label>
                              <Textarea
                                placeholder="Additional notes..."
                                value={editForm.notes}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, notes: e.target.value })
                                }
                                rows={3}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid gap-2 text-sm">
                            {vocab.ipa && (
                              <div>
                                <span className="font-medium text-muted-foreground">IPA: </span>
                                <span className="text-foreground font-mono">{vocab.ipa}</span>
                              </div>
                            )}
                            {vocab.translation && (
                              <div>
                                <span className="font-medium text-muted-foreground">
                                  Translation:{" "}
                                </span>
                                <span className="text-foreground">{vocab.translation}</span>
                              </div>
                            )}
                            {vocab.notes && (
                              <div>
                                <span className="font-medium text-muted-foreground">Notes: </span>
                                <span className="text-foreground">{vocab.notes}</span>
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground mt-2">
                              Added: {new Date(vocab.addedAt).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default Vocabulary;
