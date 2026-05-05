import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Check, AlertCircle, RotateCcw, Copy, XCircle } from "lucide-react";

interface SchemaError {
  instancePath: string;
  message: string;
  keyword?: string;
  params?: Record<string, unknown>;
}

interface BusinessJsonTabProps {
  businessId: string;
  formData: Record<string, unknown>;
  onFormDataChange: (data: Record<string, unknown>) => void;
}

type SaveStatus = "idle" | "saving" | "success" | "error";

export function BusinessJsonTab({ businessId, formData, onFormDataChange }: BusinessJsonTabProps) {
  const [jsonText, setJsonText] = useState(() => JSON.stringify(formData, null, 2));
  const [parseError, setParseError] = useState<string | undefined>();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [schemaErrors, setSchemaErrors] = useState<SchemaError[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync textarea when formData changes externally (e.g. from other tabs)
  useEffect(() => {
    if (!isDirty) {
      setJsonText(JSON.stringify(formData, null, 2));
    }
  }, [formData, isDirty]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setJsonText(value);
    setIsDirty(true);
    setParseError(undefined);
    try {
      JSON.parse(value);
    } catch {
      setParseError("Invalid JSON");
    }
  }, []);

  const handleReset = useCallback(() => {
    setJsonText(JSON.stringify(formData, null, 2));
    setParseError(undefined);
    setSchemaErrors([]);
    setErrorMessage(undefined);
    setIsDirty(false);
    setSaveStatus("idle");
  }, [formData]);

  const handleApply = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText);
      onFormDataChange(parsed);
      setIsDirty(false);
      setParseError(undefined);
    } catch {
      setParseError("Invalid JSON — fix before applying");
    }
  }, [jsonText, onFormDataChange]);

  const handleSave = useCallback(async () => {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setParseError("Invalid JSON — fix before saving");
      return;
    }

    setSaveStatus("saving");
    setErrorMessage(undefined);
    setSchemaErrors([]);

    try {
      const response = await fetch("/api/admin/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, data: parsed }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.errors && Array.isArray(error.errors)) {
          setSchemaErrors(error.errors);
          setSaveStatus("error");
          setErrorMessage(`Schema validation failed (${error.errors.length} error${error.errors.length !== 1 ? "s" : ""})`);
        } else {
          throw new Error(error.message || "Failed to save");
        }
        return;
      }

      onFormDataChange(parsed);
      setIsDirty(false);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);

      if (typeof (window as any).refreshPreview === "function") {
        (window as any).refreshPreview();
      }
    } catch (err) {
      setSaveStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Save failed");
    }
  }, [businessId, jsonText, onFormDataChange]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }, [jsonText]);

  return (
    <div className="flex flex-col h-full gap-3 p-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Raw Business JSON</span>
          {parseError && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="w-3 h-3 mr-1" />
              {parseError}
            </Badge>
          )}
          {saveStatus === "success" && (
            <Badge variant="default" className="text-xs bg-green-600">
              <Check className="w-3 h-3 mr-1" />
              Saved
            </Badge>
          )}
          {saveStatus === "error" && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errorMessage || "Save failed"}
            </Badge>
          )}
          {isDirty && !parseError && saveStatus === "idle" && (
            <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-400">
              Unsaved changes
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="h-7 text-xs">
            <Copy className="w-3 h-3 mr-1" />
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!isDirty || saveStatus === "saving"}
            className="h-7 text-xs"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleApply}
            disabled={!!parseError || !isDirty || saveStatus === "saving"}
            className="h-7 text-xs"
          >
            Apply to editor
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!!parseError || saveStatus === "saving"}
            className="h-7 text-xs"
          >
            <Save className="w-3 h-3 mr-1" />
            {saveStatus === "saving" ? "Saving…" : "Save to DB"}
          </Button>
        </div>
      </div>
      <textarea
        className="flex-1 w-full min-h-[calc(100vh-260px)] rounded-md border border-input bg-muted/40 p-3 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        value={jsonText}
        onChange={handleChange}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
      {schemaErrors.length > 0 && (
        <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-destructive shrink-0" />
            <span className="text-sm font-medium text-destructive">
              Schema validation failed — {schemaErrors.length} error{schemaErrors.length !== 1 ? "s" : ""}
            </span>
          </div>
          <ul className="space-y-1">
            {schemaErrors.map((err, i) => (
              <li key={i} className="flex gap-2 text-xs font-mono">
                <span className="text-destructive/70 shrink-0">
                  {err.instancePath || "(root)"}
                </span>
                <span className="text-destructive">{err.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Editing raw JSON directly bypasses form validation. Use <strong>Apply to editor</strong> to sync changes to other tabs, or <strong>Save to DB</strong> to persist directly.
      </p>
    </div>
  );
}
