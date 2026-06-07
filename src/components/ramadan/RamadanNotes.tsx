"use client";

import { useRef, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RamadanRichTextEditor } from "@/components/ramadan/RamadanRichTextEditor";
import { plainTextLengthFromHtml } from "@/lib/ramadan-notes-html";
import { RAMADAN_NOTES_MAX_LENGTH } from "@/lib/ramadan-settings-types";

interface RamadanNotesProps {
  value: string;
  onChange: (value: string) => void;
  onSave: (latestNotes: string) => void | Promise<void>;
  saving?: boolean;
  disabled?: boolean;
}

export function RamadanNotes({
  value,
  onChange,
  onSave,
  saving = false,
  disabled = false,
}: RamadanNotesProps) {
  const [plainLength, setPlainLength] = useState(() => plainTextLengthFromHtml(value));
  const syncEditorRef = useRef<(() => string) | null>(null);
  const overLimit = plainLength > RAMADAN_NOTES_MAX_LENGTH;

  async function handleSaveClick() {
    const latestNotes = syncEditorRef.current?.() ?? value;
    await onSave(latestNotes);
  }

  return (
    <section className="ramadan-notes-section mt-8 mb-8">
      <RamadanRichTextEditor
        value={value}
        onChange={onChange}
        onLengthChange={setPlainLength}
        onRegisterSync={(sync) => {
          syncEditorRef.current = sync;
        }}
        disabled={disabled}
      />
      <Button
        type="button"
        className="btn-gold"
        disabled={disabled || saving || overLimit}
        onClick={() => void handleSaveClick()}
      >
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save notes
      </Button>
    </section>
  );
}
