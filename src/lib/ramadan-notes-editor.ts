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

function readInlineFormatting(element: HTMLElement) {
  const styleAttr = (element.getAttribute("style") ?? "").toLowerCase();
  const bold =
    /font-weight:\s*(?:bold|700)/.test(styleAttr) ||
    element.style.fontWeight === "bold" ||
    Number.parseInt(element.style.fontWeight, 10) >= 700;
  const italic =
    /font-style:\s*(?:italic|oblique)/.test(styleAttr) ||
    element.style.fontStyle === "italic" ||
    element.style.fontStyle === "oblique";
  const underline =
    /text-decoration(?:-line)?:\s*[^;]*underline/.test(styleAttr) ||
    element.style.textDecorationLine === "underline" ||
    element.style.textDecoration.includes("underline");

  return { bold, italic, underline };
}

function wrapInlineFormatting(inner: string, element: HTMLElement) {
  const { bold, italic, underline } = readInlineFormatting(element);
  let result = inner;

  if (underline) result = `<u>${result}</u>`;
  if (italic) result = `<i>${result}</i>`;
  if (bold) result = `<b>${result}</b>`;

  return result;
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

    if (tag === "SPAN" || tag === "FONT") {
      html += wrapInlineFormatting(serializeInlineNodes(node), node);
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

function replaceElementTag(element: Element, tagName: string) {
  const replacement = document.createElement(tagName);
  while (element.firstChild) {
    replacement.appendChild(element.firstChild);
  }
  element.replaceWith(replacement);
}

/** Convert browser contenteditable markup into semantic b/i/u tags before saving. */
export function normalizeNotesEditorDom(root: HTMLElement) {
  root.querySelectorAll("em").forEach((element) => replaceElementTag(element, "i"));
  root.querySelectorAll("strong").forEach((element) => replaceElementTag(element, "b"));

  const spans = Array.from(root.querySelectorAll("span, font")).reverse();
  for (const span of spans) {
    if (!(span instanceof HTMLElement)) continue;
    const { bold, italic, underline } = readInlineFormatting(span);
    const fragment = document.createDocumentFragment();

    while (span.firstChild) {
      fragment.appendChild(span.firstChild);
    }

    if (!bold && !italic && !underline) {
      span.replaceWith(fragment);
      continue;
    }

    let wrapped: Node = fragment;

    if (underline) {
      const underlineTag = document.createElement("u");
      underlineTag.appendChild(wrapped);
      wrapped = underlineTag;
    }

    if (italic) {
      const italicTag = document.createElement("i");
      italicTag.appendChild(wrapped);
      wrapped = italicTag;
    }

    if (bold) {
      const boldTag = document.createElement("b");
      boldTag.appendChild(wrapped);
      wrapped = boldTag;
    }

    span.replaceWith(wrapped);
  }
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
