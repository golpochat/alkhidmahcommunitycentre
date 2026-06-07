"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListOrdered,
  Underline,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  normalizeNotesEditorDom,
  readNotesLengthFromEditor,
  serializeNotesEditorElement,
} from "@/lib/ramadan-notes-editor";
import {
  normalizeRamadanNotesValue,
  prepareNotesForEditorHtml,
} from "@/lib/ramadan-notes-html";
import { RAMADAN_NOTES_MAX_LENGTH } from "@/lib/ramadan-settings-types";

interface RamadanRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onLengthChange?: (length: number) => void;
  onRegisterSync?: (sync: () => string) => void;
  disabled?: boolean;
}

const INSERT_INPUT_TYPES = new Set([
  "insertText",
  "insertReplacementText",
  "insertLineBreak",
  "insertParagraph",
  "insertFromPaste",
  "insertFromDrop",
  "insertFromYank",
  "insertTranspose",
]);

function isDeletionInput(inputType: string) {
  return (
    inputType.startsWith("delete") ||
    inputType === "historyUndo" ||
    inputType === "historyRedo"
  );
}

export function RamadanRichTextEditor({
  value,
  onChange,
  onLengthChange,
  onRegisterSync,
  disabled = false,
}: RamadanRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isFocusedRef = useRef(false);
  const skipExternalSyncRef = useRef(false);
  const [displayLength, setDisplayLength] = useState(0);

  const updateLength = useCallback(
    (editor: HTMLElement) => {
      const length = readNotesLengthFromEditor(editor);
      setDisplayLength(length);
      onLengthChange?.(length);
      return length;
    },
    [onLengthChange],
  );

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (skipExternalSyncRef.current) {
      skipExternalSyncRef.current = false;
      updateLength(editor);
      return;
    }

    if (isFocusedRef.current) return;

    normalizeNotesEditorDom(editor);
    const currentNormalized = normalizeRamadanNotesValue(
      serializeNotesEditorElement(editor),
    );
    const storedNormalized = normalizeRamadanNotesValue(value);

    if (currentNormalized === storedNormalized) {
      updateLength(editor);
      return;
    }

    editor.innerHTML = prepareNotesForEditorHtml(value);
    updateLength(editor);
  }, [value, updateLength]);

  const syncValue = useCallback((): string => {
    const editor = editorRef.current;
    if (!editor) return value;

    normalizeNotesEditorDom(editor);
    const serialized = normalizeRamadanNotesValue(
      serializeNotesEditorElement(editor),
    );
    const plainLength = readNotesLengthFromEditor(editor);

    setDisplayLength(plainLength);
    onLengthChange?.(plainLength);

    if (plainLength > RAMADAN_NOTES_MAX_LENGTH) {
      return serialized;
    }

    skipExternalSyncRef.current = true;
    onChange(serialized);
    return serialized;
  }, [onChange, onLengthChange, value]);

  useEffect(() => {
    onRegisterSync?.(syncValue);
  }, [onRegisterSync, syncValue]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || disabled) return;

    updateLength(editor);

    const handleBeforeInput = (event: Event) => {
      const inputEvent = event as InputEvent;
      const plainLength = readNotesLengthFromEditor(editor);

      if (plainLength < RAMADAN_NOTES_MAX_LENGTH) return;
      if (isDeletionInput(inputEvent.inputType)) return;

      if (
        inputEvent.inputType === "insertLineBreak" ||
        inputEvent.inputType === "insertParagraph"
      ) {
        if (plainLength + 1 <= RAMADAN_NOTES_MAX_LENGTH) return;
      }

      if (!INSERT_INPUT_TYPES.has(inputEvent.inputType)) return;

      event.preventDefault();
    };

    const handlePaste = (event: ClipboardEvent) => {
      event.preventDefault();
      const pasted = event.clipboardData?.getData("text/plain") ?? "";
      if (!pasted) return;

      const remaining = RAMADAN_NOTES_MAX_LENGTH - readNotesLengthFromEditor(editor);
      if (remaining <= 0) return;

      document.execCommand("insertText", false, pasted.slice(0, remaining));
      syncValue();
    };

    editor.addEventListener("beforeinput", handleBeforeInput);
    editor.addEventListener("paste", handlePaste);

    return () => {
      editor.removeEventListener("beforeinput", handleBeforeInput);
      editor.removeEventListener("paste", handlePaste);
    };
  }, [disabled, syncValue, updateLength]);

  function handleToolbarMouseDown(event: React.MouseEvent) {
    event.preventDefault();
  }

  function runCommand(command: string) {
    if (disabled) return;
    editorRef.current?.focus();
    document.execCommand(command);
    syncValue();
  }

  function runAlignCommand(align: "left" | "center" | "right") {
    if (disabled) return;
    editorRef.current?.focus();

    const command =
      align === "left"
        ? "justifyLeft"
        : align === "center"
          ? "justifyCenter"
          : "justifyRight";

    document.execCommand(command);
    syncValue();
  }

  const overLimit = displayLength > RAMADAN_NOTES_MAX_LENGTH;
  const atLimit = displayLength >= RAMADAN_NOTES_MAX_LENGTH;

  return (
    <div className="ramadan-rich-text-editor">
      <div className="ramadan-rich-text-toolbar">
        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={disabled}
          onMouseDown={handleToolbarMouseDown}
          onClick={() => runCommand("bold")}
          aria-label="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={disabled}
          onMouseDown={handleToolbarMouseDown}
          onClick={() => runCommand("italic")}
          aria-label="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={disabled}
          onMouseDown={handleToolbarMouseDown}
          onClick={() => runCommand("underline")}
          aria-label="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={disabled}
          onMouseDown={handleToolbarMouseDown}
          onClick={() => runAlignCommand("left")}
          aria-label="Align left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={disabled}
          onMouseDown={handleToolbarMouseDown}
          onClick={() => runAlignCommand("center")}
          aria-label="Align center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={disabled}
          onMouseDown={handleToolbarMouseDown}
          onClick={() => runAlignCommand("right")}
          aria-label="Align right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={disabled}
          onMouseDown={handleToolbarMouseDown}
          onClick={() => runCommand("insertUnorderedList")}
          aria-label="Bullet list"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          disabled={disabled}
          onMouseDown={handleToolbarMouseDown}
          onClick={() => runCommand("insertOrderedList")}
          aria-label="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <span
          className={cn(
            "ramadan-notes-counter",
            atLimit && "ramadan-notes-counter--limit",
          )}
        >
          {displayLength} / {RAMADAN_NOTES_MAX_LENGTH}
        </span>
      </div>
      {overLimit ? (
        <p className="ramadan-notes-over-limit">
          Remove {displayLength - RAMADAN_NOTES_MAX_LENGTH} character
          {displayLength - RAMADAN_NOTES_MAX_LENGTH === 1 ? "" : "s"} to save.
          Line breaks count toward the limit.
        </p>
      ) : null}
      <div
        ref={editorRef}
        className={cn(
          "ramadan-rich-text-content",
          disabled && "ramadan-rich-text-content--disabled",
          atLimit && "ramadan-rich-text-content--limit",
        )}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onFocus={() => {
          isFocusedRef.current = true;
        }}
        onBlur={() => {
          isFocusedRef.current = false;
          syncValue();
        }}
        onInput={syncValue}
        data-placeholder="Community iftar details, taraweeh reminders, parking notes..."
      />
    </div>
  );
}
