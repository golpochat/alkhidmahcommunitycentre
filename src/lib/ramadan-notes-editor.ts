import { plainTextLengthFromHtml } from "@/lib/ramadan-notes-html";

/**
 * Serialize contenteditable DOM without destroying paragraph breaks.
 */

function readBlockAlign(element: HTMLElement): "left" | "center" | "right" {
  const dataAlign = element.getAttribute("data-align");
  if (dataAlign === "center" || dataAlign === "right") {
    return dataAlign;
  }

  const textAlign = element.style.textAlign;
  if (textAlign === "center" || textAlign === "right") {
    return textAlign;
  }

  return "left";
}

function openingDiv(align: "left" | "center" | "right") {
  if (align === "center") return '<div data-align="center">';
  if (align === "right") return '<div data-align="right">';
  return "<div>";
}

function escapeText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isEmptyBlock(element: HTMLElement) {
  const text = (element.textContent ?? "").replace(/\u00a0/g, " ").trim();
  const hasBr = element.querySelector("br") != null;
  return !text && !hasBr;
}

function serializeInlineNodes(parent: Node): string {
  let html = "";

  parent.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      html += escapeText(node.textContent ?? "");
      return;
    }

    if (!(node instanceof HTMLElement)) {
      return;
    }

    const tag = node.tagName;

    if (tag === "BR") {
      html += "<br>";
      return;
    }

    if (tag === "B" || tag === "STRONG") {
      html += `<b>${serializeInlineNodes(node)}</b>`;
      return;
    }

    if (tag === "I" || tag === "EM") {
      html += `<i>${serializeInlineNodes(node)}</i>`;
      return;
    }

    if (tag === "U") {
      html += `<u>${serializeInlineNodes(node)}</u>`;
      return;
    }

    if (tag === "SPAN") {
      html += serializeInlineNodes(node);
      return;
    }

    html += serializeInlineNodes(node);
  });

  return html;
}

function serializeInlineGroup(nodes: Node[], align: "left" | "center" | "right") {
  const wrapper = document.createElement("div");
  nodes.forEach((node) => wrapper.appendChild(node.cloneNode(true)));
  return `${openingDiv(align)}${serializeInlineNodes(wrapper)}</div>`;
}

/** Split one block element into multiple divs when user used Shift+Enter (br) inside a paragraph. */
function serializeBlockElement(element: HTMLElement) {
  const align = readBlockAlign(element);

  if (isEmptyBlock(element)) {
    return `${openingDiv(align)}<br></div>`;
  }

  const segments: string[] = [];
  let current: Node[] = [];

  const flush = () => {
    if (current.length === 0) {
      return;
    }
    segments.push(serializeInlineGroup(current, align));
    current = [];
  };

  element.childNodes.forEach((node) => {
    if (node instanceof HTMLElement && node.tagName === "BR") {
      flush();
      return;
    }
    current.push(node);
  });

  flush();

  if (segments.length === 0) {
    return `${openingDiv(align)}<br></div>`;
  }

  return segments.join("");
}

export function serializeNotesEditorElement(editor: HTMLElement): string {
  const parts: string[] = [];

  editor.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text.trim()) {
        parts.push(`<div>${escapeText(text)}</div>`);
      }
      return;
    }

    if (!(node instanceof HTMLElement)) {
      return;
    }

    const tag = node.tagName;

    if (tag === "BR") {
      parts.push("<div><br></div>");
      return;
    }

    if (tag === "DIV" || tag === "P") {
      parts.push(serializeBlockElement(node));
      return;
    }

    parts.push(`<div>${serializeInlineNodes(node)}</div>`);
  });

  return parts.join("");
}

export function readNotesLengthFromEditor(editor: HTMLElement): number {
  const serialized = serializeNotesEditorElement(editor);
  if (!serialized.trim()) return 0;
  return plainTextLengthFromHtml(serialized);
}
