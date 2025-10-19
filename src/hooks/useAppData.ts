import { useState, useEffect } from "react";
import { getAppData, saveAppData, AppData, SavedText, VocabEntry, TongueTwister, PdfPath } from "@/lib/storage";

export const useAppData = () => {
  const [data, setData] = useState<AppData>(getAppData());

  useEffect(() => {
    saveAppData(data);
  }, [data]);

  const addText = (text: Omit<SavedText, "id" | "date">) => {
    const newText: SavedText = {
      ...text,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      texts: [newText, ...prev.texts],
    }));
    return newText.id;
  };

  const deleteText = (id: string) => {
    setData((prev) => ({
      ...prev,
      texts: prev.texts.filter((t) => t.id !== id),
    }));
  };

  const updateText = (id: string, updates: Partial<SavedText>) => {
    setData((prev) => ({
      ...prev,
      texts: prev.texts.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  };

  const addVocab = (vocab: Omit<VocabEntry, "id" | "addedAt">) => {
    const newVocab: VocabEntry = {
      ...vocab,
      id: crypto.randomUUID(),
      addedAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      vocab: [newVocab, ...prev.vocab],
    }));
    return newVocab.id;
  };

  const deleteVocab = (id: string) => {
    setData((prev) => ({
      ...prev,
      vocab: prev.vocab.filter((v) => v.id !== id),
    }));
  };

  const updateVocab = (id: string, updates: Partial<VocabEntry>) => {
    setData((prev) => ({
      ...prev,
      vocab: prev.vocab.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    }));
  };

  const toggleTongueTwisterPracticed = (id: string) => {
    setData((prev) => ({
      ...prev,
      tongueTwisters: prev.tongueTwisters.map((tt) =>
        tt.id === id ? { ...tt, practiced: !tt.practiced } : tt
      ),
    }));
  };

  const updateSettings = (settings: Partial<AppData["settings"]>) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }));
  };

  const addPdfPath = (path: Omit<PdfPath, "id" | "addedAt">) => {
    const newPath: PdfPath = {
      ...path,
      id: crypto.randomUUID(),
      addedAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      pdfPaths: [newPath, ...prev.pdfPaths],
    }));
    return newPath.id;
  };

  const deletePdfPath = (id: string) => {
    setData((prev) => ({
      ...prev,
      pdfPaths: prev.pdfPaths.filter((p) => p.id !== id),
    }));
  };

  return {
    data,
    addText,
    deleteText,
    updateText,
    addVocab,
    deleteVocab,
    updateVocab,
    toggleTongueTwisterPracticed,
    updateSettings,
    addPdfPath,
    deletePdfPath,
    setData,
  };
};
