"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type WysiwygEditorProps = {
  value: string;
  onChange: (value: string) => void;
  minHeightClass?: string;
  showHelper?: boolean;
};

const HEADER_OPTIONS = [
  { value: "p", label: "Paragraph" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
];

const ALIGN_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

function resolveHeight(minHeightClass?: string) {
  if (!minHeightClass) return 420;
  if (minHeightClass.includes("min-h-64")) return 256;
  if (minHeightClass.includes("min-h-80")) return 320;
  if (minHeightClass.includes("min-h-96")) return 384;
  return 420;
}

function normalizeHtml(html: string) {
  const trimmed = html.trim();
  if (trimmed === "<p><br></p>") return "";
  return trimmed;
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlAttr(value: string) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

export function WysiwygEditor({
  value,
  onChange,
  minHeightClass = "min-h-96",
  showHelper = true,
}: WysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastValueRef = useRef(normalizeHtml(value || ""));
  const selectionRef = useRef<Range | null>(null);
  const isFocusedRef = useRef(false);
  const [heading, setHeading] = useState("p");
  const [alignment, setAlignment] = useState("left");

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const next = normalizeHtml(value || "");
    if (next === lastValueRef.current) return;
    editor.innerHTML = next;
    lastValueRef.current = normalizeHtml(editor.innerHTML);
  }, [value]);

  useEffect(() => {
    // Normalize execCommand behavior for block formatting.
    if (typeof document !== "undefined") {
      document.execCommand("styleWithCSS", false, "false");
    }
  }, []);

  function isSelectionInsideEditor(selection: Selection | null) {
    const editor = editorRef.current;
    if (!editor || !selection || selection.rangeCount === 0) return false;
    const anchor = selection.anchorNode;
    const focus = selection.focusNode;
    return !!(anchor && focus && editor.contains(anchor) && editor.contains(focus));
  }

  function storeSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    if (!isSelectionInsideEditor(selection)) return;
    selectionRef.current = selection.getRangeAt(0);
  }

  function restoreSelection() {
    const selection = window.getSelection();
    const editor = editorRef.current;
    if (!selection || !editor) return;
    if (!selectionRef.current) {
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      selectionRef.current = range;
      return;
    }
    selection.removeAllRanges();
    selection.addRange(selectionRef.current);
  }

  function emitChange() {
    const editor = editorRef.current;
    if (!editor) return;
    const html = normalizeHtml(editor.innerHTML);
    if (html === lastValueRef.current) return;
    lastValueRef.current = html;
    onChange(html);
  }

  function runCommand(command: string, value?: string) {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    restoreSelection();
    document.execCommand(command, false, value);
    emitChange();
    storeSelection();
  }

  function setBlock(tag: string) {
    const normalized = tag.startsWith("<") ? tag : `<${tag}>`;
    runCommand("formatBlock", normalized);
  }

  function setAlign(value: string) {
    if (value === "center") runCommand("justifyCenter");
    if (value === "right") runCommand("justifyRight");
    if (value === "left") runCommand("justifyLeft");
  }

  function insertLink() {
    const url = normalizeUrl(window.prompt("Enter URL") || "");
    if (!url) return;
    const selection = window.getSelection();
    const hasSelection = selection && selection.toString().length > 0;
    if (hasSelection) {
      runCommand("createLink", url);
      return;
    }
    runCommand("insertHTML", `<a href="${escapeHtmlAttr(url)}">${escapeHtml(url)}</a>`);
  }

  function insertImage() {
    const url = normalizeUrl(window.prompt("Enter image URL") || "");
    if (!url) return;
    runCommand("insertImage", url);
  }

  useEffect(() => {
    function handleSelectionChange() {
      if (!isFocusedRef.current) return;
      storeSelection();
    }

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/40 p-2" role="toolbar" aria-label="Editor toolbar">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground">Format</label>
          <select
            value={heading}
            onChange={(event) => {
              const next = event.target.value;
              setHeading(next);
              setBlock(next);
            }}
            className="h-8 rounded-md border border-border bg-white px-2 text-xs"
          >
            {HEADER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-1">
          <Button type="button" variant="secondary" className="h-8 px-2 text-xs" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("bold")}>
            B
          </Button>
          <Button type="button" variant="secondary" className="h-8 px-2 text-xs italic" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("italic")}>
            I
          </Button>
          <Button type="button" variant="secondary" className="h-8 px-2 text-xs underline" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("underline")}>
            U
          </Button>
          <Button type="button" variant="secondary" className="h-8 px-2 text-xs line-through" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("strikeThrough")}>
            S
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-1">
          <Button type="button" variant="secondary" className="h-8 px-2 text-xs" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("insertOrderedList")}>
            OL
          </Button>
          <Button type="button" variant="secondary" className="h-8 px-2 text-xs" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("insertUnorderedList")}>
            UL
          </Button>
          <Button type="button" variant="secondary" className="h-8 px-2 text-xs" onMouseDown={(event) => event.preventDefault()} onClick={() => setBlock("blockquote")}>
            Quote
          </Button>
          <Button type="button" variant="secondary" className="h-8 px-2 text-xs" onMouseDown={(event) => event.preventDefault()} onClick={() => setBlock("pre")}>
            Code
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-1">
          <Button type="button" variant="secondary" className="h-8 px-2 text-xs" onMouseDown={(event) => event.preventDefault()} onClick={insertLink}>
            Link
          </Button>
          <Button type="button" variant="secondary" className="h-8 px-2 text-xs" onMouseDown={(event) => event.preventDefault()} onClick={insertImage}>
            Image
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground">Align</label>
          <select
            value={alignment}
            onChange={(event) => {
              const next = event.target.value;
              setAlignment(next);
              setAlign(next);
            }}
            className="h-8 rounded-md border border-border bg-white px-2 text-xs"
          >
            {ALIGN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="h-6 w-px bg-border" />

        <Button type="button" variant="secondary" className="h-8 px-2 text-xs" onMouseDown={(event) => event.preventDefault()} onClick={() => { runCommand("removeFormat"); setBlock("p"); }}>
          Clear
        </Button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className={`wysiwyg-editor ${minHeightClass} rounded-md border border-border bg-white px-3 py-2 text-sm leading-6 outline-none`}
        style={{ minHeight: resolveHeight(minHeightClass) }}
        onInput={emitChange}
        onBlur={emitChange}
        onKeyUp={storeSelection}
        onMouseUp={storeSelection}
        onFocus={() => {
          isFocusedRef.current = true;
          storeSelection();
        }}
        onBlurCapture={() => {
          isFocusedRef.current = false;
        }}
        onClick={storeSelection}
      />

      {showHelper ? (
        <p className="text-xs text-slate-500">WYSIWYG content is stored as HTML.</p>
      ) : null}
    </div>
  );
}
