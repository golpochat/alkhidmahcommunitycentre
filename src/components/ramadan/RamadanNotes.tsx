"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RamadanRichTextEditor } from "@/components/ramadan/RamadanRichTextEditor";
import { plainTextLengthFromHtml } from "@/lib/ramadan-notes-html";
import { RAMADAN_NOTES_MAX_LENGTH } from "@/lib/ramadan-settings-types";

interface RamadanNotesProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
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
  const overLimit = plainLength > RAMADAN_NOTES_MAX_LENGTH;

  return (
    <section className="ramadan-notes-section mt-8 mb-8">
      <RamadanRichTextEditor
        value={value}
        onChange={onChange}
        onLengthChange={setPlainLength}
        disabled={disabled}
      />
      <Button
        type="button"
        className="btn-gold"
        disabled={disabled || saving || overLimit}
        onClick={onSave}
      >
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save notes
      </Button>
    </section>
  );
}
