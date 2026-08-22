"use client";

import React, { useState } from "react";
import { Word } from "@clipforge/shared";
import { Edit3, Check, Trash2, Plus, RefreshCw, Save } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface InteractiveWordEditorProps {
  clipId: string;
  words: Word[];
  onWordsChange: (updatedWords: Word[]) => void;
}

export function InteractiveWordEditor({
  clipId,
  words,
  onWordsChange,
}: InteractiveWordEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editStart, setEditStart] = useState<number>(0);
  const [editEnd, setEditEnd] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditText(words[index].text);
    setEditStart(words[index].start);
    setEditEnd(words[index].end);
  };

  const handleSaveWord = (index: number) => {
    if (!editText.trim()) return;
    const updated = [...words];
    updated[index] = {
      ...updated[index],
      text: editText.trim(),
      start: editStart,
      end: editEnd,
    };
    onWordsChange(updated);
    setEditingIndex(null);
  };

  const handleDeleteWord = (index: number) => {
    const updated = words.filter((_, i) => i !== index);
    onWordsChange(updated);
    if (editingIndex === index) setEditingIndex(null);
  };

  const handleAddWord = () => {
    const lastWord = words[words.length - 1];
    const newStart = lastWord ? lastWord.end + 0.1 : 0;
    const newEnd = newStart + 0.5;
    const newWord: Word = {
      text: "kata_baru",
      start: Math.round(newStart * 100) / 100,
      end: Math.round(newEnd * 100) / 100,
    };
    const updated = [...words, newWord];
    onWordsChange(updated);
    handleStartEdit(updated.length - 1);
  };

  const handleSaveAllToBackend = async () => {
    setIsSaving(true);
    setSuccessMessage("");
    try {
      const res = await apiFetch(`/api/clips/${clipId}/words`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words }),
      });
      if (res.ok) {
        setSuccessMessage("Perubahan kata subtitle berhasil disimpan.");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        alert("Gagal menyimpan perubahan kata");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-primary/80 uppercase tracking-wider flex items-center gap-1.5">
            <Edit3 className="h-3.5 w-3.5" /> Editor Kata Subtitle (Interactive Word-by-Word)
          </h4>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Klik pada kata untuk mengubah ejaan kata ucapan atau memperbaiki typo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddWord}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            <Plus className="h-3 w-3" /> Kata
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAllToBackend}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-primary text-black hover:bg-primary/80 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            {isSaving ? "Menyimpan..." : "Simpan Kata"}
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-500/20 border border-green-500/30 text-green-400 text-xs px-3 py-1.5 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Words Chips Grid */}
      <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-2 bg-black/60 rounded-xl border border-white/10">
        {words.length === 0 ? (
          <p className="text-xs text-gray-500 p-2 italic">Belum ada kata transkripsi. Klik tombol &quot;Transkripsi Ulang (Whisper)&quot; untuk memuat kata.</p>
        ) : (
          words.map((w, idx) => {
            const isEditing = editingIndex === idx;

            if (isEditing) {
              return (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 bg-primary/20 border border-primary p-1.5 rounded-lg text-xs"
                >
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="bg-black border border-white/20 rounded px-1.5 py-0.5 text-white font-bold text-xs w-24 focus:outline-none focus:border-primary"
                    autoFocus
                  />
                  <input
                    type="number"
                    step="0.1"
                    value={editStart}
                    onChange={(e) => setEditStart(parseFloat(e.target.value) || 0)}
                    className="bg-black border border-white/20 rounded px-1 text-[10px] text-gray-300 w-12"
                  />
                  <span className="text-[10px] text-gray-500">-</span>
                  <input
                    type="number"
                    step="0.1"
                    value={editEnd}
                    onChange={(e) => setEditEnd(parseFloat(e.target.value) || 0)}
                    className="bg-black border border-white/20 rounded px-1 text-[10px] text-gray-300 w-12"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveWord(idx)}
                    className="p-1 bg-green-500 text-black rounded hover:bg-green-400"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteWord(idx)}
                    className="p-1 bg-red-500/80 text-white rounded hover:bg-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleStartEdit(idx)}
                className="group relative flex items-center gap-1 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-primary/50 px-2.5 py-1 rounded-lg text-xs transition-all hover:scale-105"
              >
                <span className="font-bold text-white group-hover:text-primary">{w.text}</span>
                <span className="text-[9px] text-gray-500 font-mono">({w.start.toFixed(1)}s)</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
