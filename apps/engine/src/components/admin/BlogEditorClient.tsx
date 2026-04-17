import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Languages, Loader2, Star, Link2, Unlink2 } from "lucide-react";

interface BlogEditorClientProps {
  blog?: any;
  businessId: string;
  lang: "en" | "pl";
  primaryLanguage: string;
  onSave: () => void;
  onCancel: () => void;
}

export default function BlogEditorClient({
  blog,
  businessId,
  lang,
  primaryLanguage,
  onSave,
  onCancel,
}: BlogEditorClientProps) {
  const isEditing = !!blog;
  const editorRef = useRef<HTMLDivElement>(null);
  const isPrimary = lang === primaryLanguage;

  const [formData, setFormData] = useState({
    slug: blog?.slug || "",
    title: blog?.title || "",
    description: blog?.description || "",
    content: blog?.content || "",
    image: blog?.image || "",
    author: blog?.author || "",
    category: blog?.category || "",
    tags: blog?.tags?.join(", ") || "",
    status: blog?.status || "draft",
    standalone: blog?.standalone || false,
    metaTitle: blog?.metaTitle || "",
    metaDescription: blog?.metaDescription || "",
  });

  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState("");
  const [linkMode, setLinkMode] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [editingExistingLink, setEditingExistingLink] = useState(false);
  const savedSelectionRef = useRef<Range | null>(null);
  const lastEditorSelectionRef = useRef<Range | null>(null);
  const editingLinkRef = useRef<HTMLAnchorElement | null>(null);

  // Convert markdown-style links [text](url) to <a> tags in HTML content
  const convertMarkdownLinks = (html: string): string =>
    html.replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

  // Load content into editor and initialize block structure
  useEffect(() => {
    if (editorRef.current) {
      // Ensure new paragraphs use <p> tags (Chrome/Edge)
      document.execCommand("defaultParagraphSeparator", false, "p");

      if (blog?.content) {
        editorRef.current.innerHTML = convertMarkdownLinks(blog.content);
      }

      // Normalize: wrap bare text nodes in <p> so block commands work
      const editor = editorRef.current;
      Array.from(editor.childNodes).forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
          const p = document.createElement("p");
          editor.insertBefore(p, node);
          p.appendChild(node);
        }
      });
    }
  }, [blog?.content]);

  // Track the last valid selection within the editor so toolbar buttons can restore it
  useEffect(() => {
    const trackSelection = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
        lastEditorSelectionRef.current = sel.getRangeAt(0).cloneRange();
      }
    };
    document.addEventListener("selectionchange", trackSelection);
    return () => document.removeEventListener("selectionchange", trackSelection);
  }, []);

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData({ ...formData, title });
    if (!isEditing && !formData.slug) {
      setFormData({ ...formData, title, slug: generateSlug(title) });
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (!sel || !editorRef.current) return null;

    // Always focus the editor so execCommand / DOM edits target it. `focus()` is a no-op
    // if the editor is already focused, so this is safe.
    editorRef.current.focus();

    // If the current selection is already anchored inside the editor, use it as-is.
    if (sel.rangeCount > 0 && editorRef.current.contains(sel.anchorNode)) {
      lastEditorSelectionRef.current = sel.getRangeAt(0).cloneRange();
      return sel;
    }

    // Otherwise restore the last tracked range from inside the editor.
    const savedRange = lastEditorSelectionRef.current;
    if (savedRange && editorRef.current.contains(savedRange.commonAncestorContainer)) {
      try {
        sel.removeAllRanges();
        sel.addRange(savedRange);
        return sel;
      } catch { /* range detached — fall through */ }
    }

    // Last resort: place cursor at end so block commands have a valid target.
    const fallback = document.createRange();
    fallback.selectNodeContents(editorRef.current);
    fallback.collapse(false);
    try {
      sel.removeAllRanges();
      sel.addRange(fallback);
      lastEditorSelectionRef.current = fallback.cloneRange();
    } catch { /* ignore */ }
    return sel;
  };

  // Find the nearest ancestor element matching any of tagNames, up to (but not including) the editor.
  const findAncestor = (node: Node | null, tagNames: string[]): HTMLElement | null => {
    const editor = editorRef.current;
    if (!editor) return null;
    let current: Node | null = node;
    while (current && current !== editor) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const tag = (current as HTMLElement).tagName.toLowerCase();
        if (tagNames.includes(tag)) return current as HTMLElement;
      }
      current = current.parentNode;
    }
    return null;
  };

  const placeCaretAtEnd = (sel: Selection, el: HTMLElement) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    lastEditorSelectionRef.current = range.cloneRange();
  };

  const handleBlockFormat = (tagName: string) => {
    const sel = restoreSelection();
    const editor = editorRef.current;
    if (!sel || !editor || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const BLOCK_TAGS = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "li", "div"];

    // Case A: selection is inside a list item — unwrap from list and convert,
    // splitting the list in place so the converted block appears where the item was.
    const li = findAncestor(range.startContainer, ["li"]);
    if (li) {
      const list = li.parentElement; // ul/ol
      if (list && (list.tagName === "UL" || list.tagName === "OL") && list.parentNode) {
        const newEl = document.createElement(tagName);
        while (li.firstChild) newEl.appendChild(li.firstChild);
        // Move any following siblings of `li` into a new list that follows `newEl`.
        let next = li.nextSibling;
        let trailingList: HTMLElement | null = null;
        if (next) {
          trailingList = document.createElement(list.tagName.toLowerCase());
          while (next) {
            const toMove = next;
            next = next.nextSibling;
            trailingList.appendChild(toMove);
          }
        }
        list.parentNode.insertBefore(newEl, list.nextSibling);
        if (trailingList) list.parentNode.insertBefore(trailingList, newEl.nextSibling);
        li.remove();
        if (list.children.length === 0) list.remove();
        placeCaretAtEnd(sel, newEl);
        return;
      }
    }

    // Case B: selection is inside an existing block (p/h1..h6/blockquote/div) — replace the tag
    const block = findAncestor(range.startContainer, BLOCK_TAGS);
    if (block && block !== editor) {
      const newEl = document.createElement(tagName);
      while (block.firstChild) newEl.appendChild(block.firstChild);
      Array.from(block.attributes).forEach((a) => newEl.setAttribute(a.name, a.value));
      block.parentNode?.replaceChild(newEl, block);
      placeCaretAtEnd(sel, newEl);
      return;
    }

    // Case C: empty editor — create a block and place caret inside
    if (!editor.firstChild || (editor.childNodes.length === 1 && editor.firstChild.nodeType === Node.ELEMENT_NODE && (editor.firstChild as HTMLElement).tagName === "BR")) {
      if (editor.firstChild) editor.removeChild(editor.firstChild);
      const newEl = document.createElement(tagName);
      newEl.appendChild(document.createElement("br"));
      editor.appendChild(newEl);
      const newRange = document.createRange();
      newRange.setStart(newEl, 0);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
      lastEditorSelectionRef.current = newRange.cloneRange();
      return;
    }

    // Case D: selection is in a text node that's a direct child of the editor (no block wrapper)
    if (range.startContainer.nodeType === Node.TEXT_NODE && range.startContainer.parentNode === editor) {
      const textNode = range.startContainer;
      const newEl = document.createElement(tagName);
      editor.insertBefore(newEl, textNode);
      newEl.appendChild(textNode);
      placeCaretAtEnd(sel, newEl);
      return;
    }

    // Case E: fallback — wrap all direct-child loose inline nodes touched by the range
    try {
      document.execCommand("formatBlock", false, `<${tagName}>`);
    } catch { /* ignore */ }
  };

  const handleList = (listTag: "ul" | "ol") => {
    const sel = restoreSelection();
    const editor = editorRef.current;
    if (!sel || !editor || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    // If already inside a list item, toggle: convert li → p (matching/non-matching list)
    const li = findAncestor(range.startContainer, ["li"]);
    if (li) {
      const list = li.parentElement;
      if (list && (list.tagName === "UL" || list.tagName === "OL")) {
        const currentTag = list.tagName.toLowerCase();
        if (currentTag === listTag) {
          // Same list type: unwrap this item back to a paragraph
          const p = document.createElement("p");
          while (li.firstChild) p.appendChild(li.firstChild);
          list.parentNode?.insertBefore(p, list.nextSibling);
          li.remove();
          if (list.children.length === 0) list.remove();
          placeCaretAtEnd(sel, p);
          return;
        }
        // Different list type: change the list tag (ul ↔ ol)
        const newList = document.createElement(listTag);
        while (list.firstChild) newList.appendChild(list.firstChild);
        list.parentNode?.replaceChild(newList, list);
        const newLi = newList.querySelector("li");
        if (newLi) placeCaretAtEnd(sel, newLi as HTMLElement);
        return;
      }
    }

    // Otherwise wrap the current block in a list
    const block = findAncestor(range.startContainer, ["p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "div"]);
    const newList = document.createElement(listTag);
    const newLi = document.createElement("li");
    if (block && block !== editor) {
      while (block.firstChild) newLi.appendChild(block.firstChild);
      newList.appendChild(newLi);
      block.parentNode?.replaceChild(newList, block);
    } else if (range.startContainer.nodeType === Node.TEXT_NODE && range.startContainer.parentNode === editor) {
      const textNode = range.startContainer;
      editor.insertBefore(newList, textNode);
      newLi.appendChild(textNode);
      newList.appendChild(newLi);
    } else {
      // Empty or unusual state — append an empty list
      newLi.appendChild(document.createElement("br"));
      newList.appendChild(newLi);
      editor.appendChild(newList);
    }
    placeCaretAtEnd(sel, newLi);
  };

  const handleFormat = (command: string, value?: string) => {
    if (command === "formatBlock" && value) {
      handleBlockFormat(value);
      return;
    }
    if (command === "insertUnorderedList") {
      handleList("ul");
      return;
    }
    if (command === "insertOrderedList") {
      handleList("ol");
      return;
    }
    restoreSelection();
    document.execCommand(command, false, value);
  };

  const openLinkDialog = (existingLink: HTMLAnchorElement | null, rangeToSave: Range | null) => {
    savedSelectionRef.current = rangeToSave ? rangeToSave.cloneRange() : null;
    editingLinkRef.current = existingLink;
    setEditingExistingLink(!!existingLink);
    setLinkUrl(existingLink?.getAttribute("href") || "");
    setLinkMode(true);
  };

  const handleLinkButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Ensure the editor owns the selection so we operate on the right place.
    const sel = restoreSelection();
    const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
    // If cursor is inside an existing <a>, enter "edit link" mode.
    const existing =
      range && editorRef.current?.contains(range.startContainer)
        ? (findAncestor(range.startContainer, ["a"]) as HTMLAnchorElement | null)
        : null;
    openLinkDialog(existing, range);
  };

  const closeLinkDialog = () => {
    setLinkMode(false);
    setLinkUrl("");
    setEditingExistingLink(false);
    editingLinkRef.current = null;
    savedSelectionRef.current = null;
  };

  const handleInsertLink = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      closeLinkDialog();
      return;
    }
    const url = /^(https?:|mailto:|tel:|\/|#)/i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const editor = editorRef.current;
    if (!editor) {
      closeLinkDialog();
      return;
    }

    // Editing an existing link: just update href/target/rel
    if (editingLinkRef.current && editor.contains(editingLinkRef.current)) {
      const a = editingLinkRef.current;
      a.setAttribute("href", url);
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
      // Put caret at end of the link so typing continues after it
      editor.focus();
      const sel = window.getSelection();
      if (sel) {
        const r = document.createRange();
        r.selectNodeContents(a);
        r.collapse(false);
        sel.removeAllRanges();
        sel.addRange(r);
        lastEditorSelectionRef.current = r.cloneRange();
      }
      closeLinkDialog();
      return;
    }

    // Restore selection inside the editor.
    editor.focus();
    const sel = window.getSelection();
    if (sel && savedSelectionRef.current && editor.contains(savedSelectionRef.current.commonAncestorContainer)) {
      try {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRef.current);
      } catch { /* detached */ }
    }

    const currentSel = window.getSelection();
    if (!currentSel || currentSel.rangeCount === 0) {
      closeLinkDialog();
      return;
    }
    const range = currentSel.getRangeAt(0);

    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");

    if (range.collapsed) {
      // No text selected — insert the URL as the link text.
      a.textContent = trimmed;
      range.insertNode(a);
    } else {
      // Wrap the selected contents in the anchor.
      const contents = range.extractContents();
      a.appendChild(contents);
      range.insertNode(a);
    }

    // Place caret right after the inserted link.
    const after = document.createRange();
    after.setStartAfter(a);
    after.collapse(true);
    currentSel.removeAllRanges();
    currentSel.addRange(after);
    lastEditorSelectionRef.current = after.cloneRange();

    closeLinkDialog();
  };

  const handleUnlink = (e: React.MouseEvent) => {
    e.preventDefault();
    const sel = restoreSelection();
    if (!sel || sel.rangeCount === 0) return;
    const a = findAncestor(sel.getRangeAt(0).startContainer, ["a"]);
    if (!a) return;
    // Unwrap: replace the <a> with its children.
    const parent = a.parentNode;
    if (!parent) return;
    const frag = document.createDocumentFragment();
    while (a.firstChild) frag.appendChild(a.firstChild);
    parent.replaceChild(frag, a);
    // Place caret at end of where the link was (best-effort).
    if (editorRef.current) {
      const r = document.createRange();
      r.selectNodeContents(editorRef.current);
      r.collapse(false);
      sel.removeAllRanges();
      sel.addRange(r);
      lastEditorSelectionRef.current = r.cloneRange();
    }
  };

  // Double-click an existing link to edit its URL. Single clicks still place the caret normally.
  const handleEditorDblClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const a = target.closest("a") as HTMLAnchorElement | null;
    if (a && editorRef.current?.contains(a)) {
      e.preventDefault();
      const r = document.createRange();
      r.selectNode(a);
      openLinkDialog(a, r);
    }
  };

  // Translate empty fields from primary language blog
  const handleTranslateFromPrimary = async () => {
    setTranslating(true);
    setError("");

    try {
      // Fetch the primary language version of this blog (by slug)
      const slug = formData.slug || blog?.slug;
      if (!slug) {
        setError("Save the blog in the primary language first (slug is required).");
        setTranslating(false);
        return;
      }

      // Fetch primary lang blog by slug
      const listRes = await fetch(
        `/api/admin/blogs/list?business=${businessId}&lang=${primaryLanguage}`
      );
      if (!listRes.ok) throw new Error("Failed to fetch primary language blogs");

      const listData = await listRes.json();
      const primaryBlog = listData.blogs?.find((b: any) => b.slug === slug);

      if (!primaryBlog) {
        setError(
          `No blog with slug "${slug}" found in the primary language (${primaryLanguage.toUpperCase()}). Write it in the primary language first.`
        );
        setTranslating(false);
        return;
      }

      // Collect empty fields that have content in primary
      const fieldsToTranslate: { key: string; value: string; isHtml?: boolean }[] = [];
      const textFields = ["title", "description", "metaTitle", "metaDescription", "category"] as const;

      for (const field of textFields) {
        if (!formData[field]?.trim() && primaryBlog[field]?.trim()) {
          fieldsToTranslate.push({ key: field, value: primaryBlog[field] });
        }
      }

      // Check content (HTML)
      const currentContent = editorRef.current?.innerHTML || formData.content;
      const contentEmpty = !currentContent?.trim() || currentContent === "<br>";
      if (contentEmpty && primaryBlog.content?.trim()) {
        fieldsToTranslate.push({ key: "content", value: primaryBlog.content, isHtml: true });
      }

      if (fieldsToTranslate.length === 0) {
        setError("All fields are already filled. Nothing to translate.");
        setTranslating(false);
        return;
      }

      // Split into text and HTML batches
      const textItems = fieldsToTranslate.filter((f) => !f.isHtml);
      const htmlItems = fieldsToTranslate.filter((f) => f.isHtml);

      const updates: Record<string, string> = {};

      // Translate text fields
      if (textItems.length > 0) {
        const res = await fetch("/api/admin/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            texts: textItems.map((f) => f.value),
            from: primaryLanguage,
            to: lang,
          }),
        });
        if (!res.ok) throw new Error("Translation failed");
        const data = await res.json();
        textItems.forEach((f, i) => {
          updates[f.key] = data.translations[i];
        });
      }

      // Translate HTML fields
      if (htmlItems.length > 0) {
        const res = await fetch("/api/admin/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            texts: htmlItems.map((f) => f.value),
            from: primaryLanguage,
            to: lang,
            isHtml: true,
          }),
        });
        if (!res.ok) throw new Error("HTML translation failed");
        const data = await res.json();
        htmlItems.forEach((f, i) => {
          updates[f.key] = data.translations[i];
        });
      }

      // Apply translations
      const newFormData = { ...formData };
      for (const [key, value] of Object.entries(updates)) {
        if (key === "content") {
          if (editorRef.current) editorRef.current.innerHTML = value;
          newFormData.content = value;
        } else {
          (newFormData as any)[key] = value;
        }
      }

      // Copy non-translatable fields from primary if empty
      if (!newFormData.image && primaryBlog.image) newFormData.image = primaryBlog.image;
      if (!newFormData.author && primaryBlog.author) newFormData.author = primaryBlog.author;
      if (!newFormData.tags && primaryBlog.tags?.length) newFormData.tags = primaryBlog.tags.join(", ");

      setFormData(newFormData);
    } catch (err) {
      setError("Translation error: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setTranslating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const endpoint = isEditing
        ? "/api/admin/blogs/update"
        : "/api/admin/blogs/create";

      const content = convertMarkdownLinks(editorRef.current?.innerHTML || "");

      const payload = {
        businessId,
        ...(isEditing && { blogId: blog.id }),
        blog: {
          ...formData,
          lang,
          content, // HTML content
          tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
          standalone: formData.standalone,
        },
      };

      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save blog");
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">
            {isEditing ? "Edit Blog Post" : "Create New Blog Post"}
          </h2>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-muted">
            {isPrimary && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
            {lang === "en" ? "English" : "Polski"}
          </span>
        </div>
        <div className="flex gap-2">
          {!isPrimary && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTranslateFromPrimary}
                    disabled={translating}
                  >
                    {translating ? (
                      <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Tłumaczenie...</>
                    ) : (
                      <><Languages className="h-4 w-4 mr-1.5" />Przetłumacz z języka wiodącego</>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Tłumaczone są tylko puste pola</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md text-destructive">
          {error}
        </div>
      )}

      {!isPrimary && (
        <div className="p-3 rounded-lg border bg-blue-500/5 border-blue-500/20 text-sm">
          <span className="font-medium">
            {lang === "pl" ? "Język dodatkowy" : "Secondary language"}
          </span>
          {" — "}
          {primaryLanguage === "en" ? "English" : "Polski"}{" "}
          {lang === "pl" ? "jest językiem wiodącym. Użyj przycisku \"Przetłumacz\" aby uzupełnić puste pola." : "is the primary language. Use the \"Translate\" button to fill empty fields."}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Slug *</label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
            />
            <p className="text-xs opacity-60 mt-1">URL: /blog/{formData.slug || "slug"}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 resize-none bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Image URL</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Author</label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="flex items-start gap-3 pt-1">
            <input
              type="checkbox"
              id="standalone-toggle"
              checked={formData.standalone}
              onChange={(e) => setFormData({ ...formData, standalone: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-border"
            />
            <div>
              <label htmlFor="standalone-toggle" className="block text-sm font-medium cursor-pointer">Standalone</label>
              <p className="text-xs text-muted-foreground mt-0.5">Hidden from /blog listing and blog sections. Embed via blog-standalone section type.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content editor */}
      <div>
        <label className="block text-sm font-medium mb-1">Content *</label>
        <div className="border border-border rounded-md overflow-hidden">
          {/* Toolbar */}
          <div className="bg-muted/30 border-b border-border p-2 flex flex-wrap gap-1">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormat("bold");
              }}
              className="px-3 py-1 rounded text-sm font-medium bg-muted/50 hover:bg-muted"
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormat("italic");
              }}
              className="px-3 py-1 rounded text-sm font-medium bg-muted/50 hover:bg-muted"
              title="Italic"
            >
              <em>I</em>
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormat("formatBlock", "h2");
              }}
              className="px-3 py-1 rounded text-sm font-medium bg-muted/50 hover:bg-muted"
              title="Heading 2"
            >
              H2
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormat("formatBlock", "h3");
              }}
              className="px-3 py-1 rounded text-sm font-medium bg-muted/50 hover:bg-muted"
              title="Heading 3"
            >
              H3
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormat("insertUnorderedList");
              }}
              className="px-3 py-1 rounded text-sm font-medium bg-muted/50 hover:bg-muted"
              title="Bullet List"
            >
              • List
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormat("insertOrderedList");
              }}
              className="px-3 py-1 rounded text-sm font-medium bg-muted/50 hover:bg-muted"
              title="Numbered List"
            >
              1. List
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormat("formatBlock", "blockquote");
              }}
              className="px-3 py-1 rounded text-sm font-medium bg-muted/50 hover:bg-muted"
              title="Quote"
            >
              " Quote
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormat("formatBlock", "p");
              }}
              className="px-3 py-1 rounded text-sm font-medium bg-muted/50 hover:bg-muted"
              title="Paragraph"
            >
              ¶
            </button>
            <div className="w-px bg-border self-stretch mx-1" />
            <button
              type="button"
              onMouseDown={handleLinkButtonClick}
              className="px-2 py-1 rounded text-sm font-medium bg-muted/50 hover:bg-muted inline-flex items-center gap-1"
              title="Insert Link"
            >
              <Link2 className="h-4 w-4" />
              Link
            </button>
            <button
              type="button"
              onMouseDown={handleUnlink}
              className="px-2 py-1 rounded text-sm font-medium bg-muted/50 hover:bg-muted inline-flex items-center gap-1"
              title="Remove Link"
            >
              <Unlink2 className="h-4 w-4" />
            </button>
            {linkMode && (
              <div className="flex items-center gap-1 ml-1 basis-full order-last mt-2 md:basis-auto md:order-none md:mt-0">
                <span className="text-xs opacity-60 mr-1">
                  {editingExistingLink ? "Edit link:" : "Add link:"}
                </span>
                <input
                  autoFocus
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="px-2 py-1 text-sm border border-border rounded-md bg-background w-60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleInsertLink(e as any);
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      closeLinkDialog();
                    }
                  }}
                />
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleInsertLink(e); }}
                  className="px-2 py-1 rounded text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {editingExistingLink ? "Update" : "OK"}
                </button>
                {editingExistingLink && (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const a = editingLinkRef.current;
                      if (a && editorRef.current?.contains(a)) {
                        const parent = a.parentNode;
                        if (parent) {
                          const frag = document.createDocumentFragment();
                          while (a.firstChild) frag.appendChild(a.firstChild);
                          parent.replaceChild(frag, a);
                        }
                      }
                      closeLinkDialog();
                    }}
                    className="px-2 py-1 rounded text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20"
                    title="Remove link"
                  >
                    Remove
                  </button>
                )}
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); closeLinkDialog(); }}
                  className="px-2 py-1 rounded text-sm font-medium bg-muted/50 hover:bg-muted"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          {/* Editor */}
          <div
            ref={editorRef}
            contentEditable
            className="prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4 bg-background [&_a]:text-primary [&_a]:underline"
            onDoubleClick={handleEditorDblClick}
            onMouseDown={(e) => {
              // Prevent loss of selection when clicking toolbar buttons
              if (e.target === e.currentTarget) {
                e.currentTarget.focus();
              }
            }}
          />
        </div>
        <p className="text-xs opacity-60 mt-1">
          Use the toolbar to format your content. Double-click a link to edit its URL, or place the cursor inside a link and click the Link button. Content is saved as HTML.
        </p>
      </div>

      {/* SEO section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">SEO Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Meta Title</label>
            <input
              type="text"
              value={formData.metaTitle}
              onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
              placeholder="Leave empty to use blog title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Meta Description</label>
            <textarea
              rows={2}
              value={formData.metaDescription}
              onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 resize-none bg-background"
              placeholder="Leave empty to use blog description"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
