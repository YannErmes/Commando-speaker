import { useState } from "react";
import { useAppData } from "@/hooks/useAppData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Edit2 } from "lucide-react";

const Flashcards = () => {
  const { data, addVocab, updateVocab } = useAppData();
  const [currentSet, setCurrentSet] = useState(0);
  const [isAddingVocab, setIsAddingVocab] = useState(false);
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

  const PAGE_SIZE = 6;
  const totalPages = Math.ceil(data.vocab.length / PAGE_SIZE);
  const currentVocabSet = data.vocab.slice(
    currentSet * PAGE_SIZE,
    (currentSet + 1) * PAGE_SIZE
  );

  const resetFlippedElements = () => {
    // remove any 'flipped' classes from DOM so cards are reset when changing pages
    try {
      const flipped = document.querySelectorAll('.flashcard.flipped');
      flipped.forEach((el) => el.classList.remove('flipped'));
    } catch (e) {
      // ignore when running in non-browser environment
    }
  };

  const handleNextSet = () => {
    // go to next page only if not at the last page
    if (currentSet < totalPages - 1) {
      resetFlippedElements();
      setCurrentSet((prev) => prev + 1);
    }
  };

  const handlePrevSet = () => {
    // go to previous page only if not at the first page
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

  // Toggle flip state for a single card (controlled by buttons)
  const toggleFlip = (cardIndex: number) => {
    const cardElement = document.getElementById(`card-${cardIndex}`);
    if (cardElement) {
      cardElement.classList.toggle("flipped");
    }
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-foreground">Flashcards</h1>
              <p className="text-muted-foreground">
                Practice with {data.vocab.length} vocabulary items
              </p>
            </div>
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
                    <Input
                      placeholder="Word or Expression"
                      value={newVocab.text}
                      onChange={(e) =>
                        setNewVocab({ ...newVocab, text: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="IPA Pronunciation"
                      value={newVocab.ipa}
                      onChange={(e) =>
                        setNewVocab({ ...newVocab, ipa: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Translation"
                      value={newVocab.translation}
                      onChange={(e) =>
                        setNewVocab({ ...newVocab, translation: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Additional Notes"
                      value={newVocab.notes}
                      onChange={(e) =>
                        setNewVocab({ ...newVocab, notes: e.target.value })
                      }
                    />
                  </div>
                  <Button className="w-full" onClick={editingVocab ? handleSaveEdit : handleAddVocab}>
                    {editingVocab ? 'Save Changes' : 'Add Vocabulary'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {currentVocabSet.map((vocab, index) => (
              <div key={vocab.id} className="flashcard-container">
                <Card id={`card-${index}`} className="h-[220px] flashcard">
                  <CardContent className="p-6 h-full relative">
                    <div className="absolute top-2 right-2 z-10 card-actions flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            `https://www.google.com/search?q=${encodeURIComponent(vocab.text + ' meaning')}`,
                            '_blank'
                          );
                        }}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditVocab(vocab.id);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flashcard-inner h-full">
                      <div className="flashcard-front flex flex-col justify-center items-center h-full cursor-pointer" onClick={() => toggleFlip(index)}>
                        <h3 className="text-xl font-bold mb-2">{vocab.text}</h3>
                        {vocab.ipa && (
                          <p className="text-sm text-muted-foreground font-mono">{vocab.ipa}</p>
                        )}
                      </div>

                      <div className="flashcard-back flex flex-col justify-center items-center h-full cursor-pointer" onClick={() => toggleFlip(index)}>
                        {vocab.translation && <p className="text-lg mb-2">{vocab.translation}</p>}
                        {vocab.notes && <p className="text-sm text-muted-foreground">{vocab.notes}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          <div className="fixed bottom-8 left-0 right-0 flex justify-center" style={{ zIndex: 1000 }}>
            <div className="bg-background/95 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border flex gap-4 items-center">
              <Button
                variant="outline"
                onClick={handlePrevSet}
                disabled={currentSet === 0}
                className="relative"
                style={{ pointerEvents: 'auto' }}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {currentSet + 1} of {Math.max(totalPages, 1)}
              </span>
              <Button
                variant="outline"
                onClick={handleNextSet}
                disabled={currentSet >= totalPages - 1}
                className="relative"
                style={{ pointerEvents: 'auto' }}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcards;