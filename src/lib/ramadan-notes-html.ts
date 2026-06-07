import {
  RAMADAN_NOTES_HTML_MAX_LENGTH,
  RAMADAN_NOTES_MAX_LENGTH,
} from "@/lib/ramadan-settings-types";

const ALLOWED_TAGS = new Set([
  "B",
  "STRONG",
  "I",
  "EM",
  "U",
  "P",
  "BR",
  "UL",
  "OL",
  "LI",
  "DIV",
  "SPAN",
]);

function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n{3,}/g, "\n\n");
}

export function stripHtmlToPlainText(html: string): string {
  if (!html.trim()) return "";
  return htmlToPlainText(html).trim();
}

/** Count every character shown in the editor, including spaces and newlines. */
export function plainTextLengthFromHtml(html: string): number {
  if (!html.trim()) return 0;
  return htmlToPlainText(html).length;
}

function preserveEmptyParagraphs(html: string): string {
  return html.replace(
    /<div([^>]*)>(?:\s|<br\s*\/?>)*<\/div>/gi,
    "<div$1><br></div>",
  );
}

export type RamadanPdfNoteAlign = "left" | "center" | "right" | "justify";

function parseAlignFromAttrs(attrs: string): RamadanPdfNoteAlign {
  const dataAlign = attrs.match(/data-align=["'](left|center|right)["']/i);
  if (dataAlign) {
    return dataAlign[1].toLowerCase() as RamadanPdfNoteAlign;
  }

  const styleMatch = attrs.match(/style=["']([^"']*)["']/i);
  if (styleMatch) {
    const style = styleMatch[1].toLowerCase();
    if (/text-align:\s*center/.test(style)) return "center";
    if (/text-align:\s*right/.test(style)) return "right";
    if (/text-align:\s*left/.test(style)) return "left";
  }

  return "left";
}

function openingBlockTag(attrs: string): string {
  const align = parseAlignFromAttrs(attrs);
  if (align === "center") return '<div data-align="center">';
  if (align === "right") return '<div data-align="right">';
  return "<div>";
}

function parseBlockAlign(block: string): RamadanPdfNoteAlign {
  const openTag = block.match(/<div[^>]*>/i)?.[0] ?? block.match(/<p[^>]*>/i)?.[0] ?? "";
  return parseAlignFromAttrs(openTag);
}

function convertStyleFormattingToSemanticTags(html: string): string {
  let result = html;
  let previous = "";

  while (result !== previous) {
    previous = result;
    result = result.replace(
      /<span\b([^>]*)>([\s\S]*?)<\/span>/gi,
      (_match, attrs: string, inner: string) => {
        const style = attrs.toLowerCase();
        const bold = /font-weight:\s*(?:bold|700)/i.test(style);
        const italic = /font-style:\s*(?:italic|oblique)/i.test(style);
        if (bold && italic) return `<b><i>${inner}</i></b>`;
        if (bold) return `<b>${inner}</b>`;
        if (italic) return `<i>${inner}</i>`;
        return inner;
      },
    );
  }

  return result;
}

export function sanitizeRamadanNotesHtml(html: string): string {
  if (!html.trim()) return "";

  return preserveEmptyParagraphs(
    convertStyleFormattingToSemanticTags(html)
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
      .replace(/<(\/?)([\w]+)([^>]*)>/g, (_match, closing, tagName, attrs = "") => {
        const upper = tagName.toUpperCase();
        if (upper === "P") {
          return closing ? "</div>" : openingBlockTag(attrs);
        }
        if (!ALLOWED_TAGS.has(upper)) return "";
        if (upper === "DIV") {
          return closing ? "</div>" : openingBlockTag(attrs);
        }
        if (closing) return `</${upper.toLowerCase()}>`;
        return `<${upper.toLowerCase()}>`;
      }),
  );
}

export function isHtmlNotes(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function normalizeRamadanNotesValue(value: string): string {
  if (!value.trim()) return "";
  return isHtmlNotes(value) ? sanitizeRamadanNotesHtml(value) : value;
}

function escapeHtmlText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Turn stored notes into HTML the contenteditable editor can render reliably. */
export function prepareNotesForEditorHtml(value: string): string {
  const normalized = normalizeRamadanNotesValue(value);
  if (!normalized.trim()) return "";

  if (!isHtmlNotes(normalized)) {
    return normalized
      .split(/\r?\n/)
      .map((line) => `<div>${line ? escapeHtmlText(line) : "<br>"}</div>`)
      .join("");
  }

  if (!/<(?:div|p|ul|ol)\b/i.test(normalized)) {
    return `<div>${normalized}</div>`;
  }

  return normalized;
}

export function notesEditorContentEquals(
  editorHtml: string,
  storedValue: string,
): boolean {
  return (
    normalizeRamadanNotesValue(editorHtml) ===
    normalizeRamadanNotesValue(storedValue)
  );
}

function blockHasVisibleText(block: string): boolean {
  return htmlToPlainText(block.replace(/<div[^>]*>/gi, "").replace(/<p[^>]*>/gi, "")).length > 0;
}

export function assertRamadanNotesWithinLimit(value: string): string {
  const normalized = normalizeRamadanNotesValue(value);
  const plainLength = plainTextLengthFromHtml(normalized);

  if (plainLength > RAMADAN_NOTES_MAX_LENGTH) {
    throw new Error(`Notes must be ${RAMADAN_NOTES_MAX_LENGTH} characters or fewer`);
  }

  if (normalized.length > RAMADAN_NOTES_HTML_MAX_LENGTH) {
    throw new Error("Notes formatting is too large. Simplify formatting and try again.");
  }

  return normalized;
}

export type RamadanPdfTextRun = {
  text: string;
  bold?: boolean;
  italic?: boolean;
};

export type RamadanPdfNoteBlock = {
  runs: RamadanPdfTextRun[];
  align: RamadanPdfNoteAlign;
};

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function parseInlineRuns(html: string): RamadanPdfTextRun[] {
  const runs: RamadanPdfTextRun[] = [];
  let index = 0;
  let bold = false;
  let italic = false;

  while (index < html.length) {
    if (html[index] === "<") {
      const end = html.indexOf(">", index);
      if (end === -1) break;

      const tag = html.slice(index, end + 1);
      index = end + 1;

      if (/^<br\s*\/?>$/i.test(tag)) {
        runs.push({ text: "\n" });
        continue;
      }

      const tagName = tag.match(/^<\/?(\w+)/)?.[1]?.toLowerCase();
      if (tagName === "b" || tagName === "strong") {
        bold = !tag.startsWith("</");
      } else if (tagName === "i" || tagName === "em") {
        italic = !tag.startsWith("</");
      }

      continue;
    }

    let nextTag = index;
    while (nextTag < html.length && html[nextTag] !== "<") {
      nextTag += 1;
    }

    const raw = decodeHtmlEntities(html.slice(index, nextTag));
    if (raw) {
      runs.push({ text: raw, bold, italic });
    }

    index = nextTag;
  }

  return runs;
}

function mergeAdjacentRuns(runs: RamadanPdfTextRun[]): RamadanPdfTextRun[] {
  const merged: RamadanPdfTextRun[] = [];

  for (const run of runs) {
    const previous = merged[merged.length - 1];
    if (
      previous &&
      Boolean(previous.bold) === Boolean(run.bold) &&
      Boolean(previous.italic) === Boolean(run.italic)
    ) {
      previous.text += run.text;
      continue;
    }

    merged.push({ ...run });
  }

  return merged;
}

function splitRunsOnNewlines(runs: RamadanPdfTextRun[]): RamadanPdfTextRun[][] {
  const paragraphs: RamadanPdfTextRun[][] = [[]];

  for (const run of runs) {
    const parts = run.text.split("\n");
    parts.forEach((part, index) => {
      if (part) {
        paragraphs[paragraphs.length - 1].push({
          text: part,
          bold: run.bold,
          italic: run.italic,
        });
      }
      if (index < parts.length - 1) {
        paragraphs.push([]);
      }
    });
  }

  return paragraphs;
}

/** Turn one HTML block with line breaks into multiple PDF paragraph blocks. */
export function expandBlocksToParagraphs(blocks: RamadanPdfNoteBlock[]): RamadanPdfNoteBlock[] {
  const expanded: RamadanPdfNoteBlock[] = [];

  for (const block of blocks) {
    const paragraphs = splitRunsOnNewlines(block.runs);

    if (paragraphs.length <= 1) {
      expanded.push(block);
      continue;
    }

    for (const runs of paragraphs) {
      expanded.push({
        runs: runs.length > 0 ? runs : [{ text: "\n" }],
        align: block.align,
      });
    }
  }

  return expanded;
}

function buildNoteBlockFromMarkedFragment(fragment: string): RamadanPdfNoteBlock {
  const isBlankLine = /^\s*\[\[EMPTY_LINE\]\]\s*$/.test(fragment);
  const content = fragment
    .replace(/\[\[EMPTY_LINE\]\]/g, "\n")
    .replace(/\[\[BR\]\]/g, "\n");

  if (isBlankLine || !blockHasVisibleText(content)) {
    return {
      runs: [{ text: "\n" }],
      align: parseBlockAlign(fragment),
    };
  }

  return {
    runs: mergeAdjacentRuns(
      parseInlineRuns(content.replace(/<div[^>]*>/gi, "").replace(/<p[^>]*>/gi, "")),
    ),
    align: parseBlockAlign(fragment),
  };
}

export function parseRamadanNotesForPdf(html: string): RamadanPdfNoteBlock[] {
  const normalized = normalizeRamadanNotesValue(html);
  if (!normalized.trim()) return [];

  if (!isHtmlNotes(normalized)) {
    return expandBlocksToParagraphs(
      normalized.split("\n").map((line) => ({
        runs: [{ text: line }],
        align: "left" as const,
      })),
    );
  }

  const marked = normalized
    .replace(/<div([^>]*)>(?:\s|<br\s*\/?>)*<\/div>/gi, "[[EMPTY_LINE]]")
    .replace(/<br\s*\/?>/gi, "[[BR]]")
    .replace(/<\/p>/gi, "[[/BLOCK]]")
    .replace(/<\/div>/gi, "[[/BLOCK]]")
    .replace(/<\/li>/gi, "[[/BLOCK]]")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<div[^>]*>/gi, "")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<ul[^>]*>/gi, "")
    .replace(/<\/ul>/gi, "")
    .replace(/<ol[^>]*>/gi, "")
    .replace(/<\/ol>/gi, "");

  const blocks = marked
    .split("[[/BLOCK]]")
    .map((fragment) => fragment.trim())
    .filter((fragment) => fragment.length > 0)
    .map((fragment) => buildNoteBlockFromMarkedFragment(fragment));

  return expandBlocksToParagraphs(blocks);
}
