import React, { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  Trash2,
  Copy,
  Check,
  Image,
  FileArchive,
  FileSpreadsheet,
  Presentation,
  File,
} from "lucide-react";

interface BusinessFile {
  id: number;
  name: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface FilesTabProps {
  businessId: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <Image className="h-4 w-4 text-blue-500" />;
  if (mimeType === "application/pdf") return <FileText className="h-4 w-4 text-red-500" />;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType === "text/csv")
    return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return <Presentation className="h-4 w-4 text-orange-500" />;
  if (mimeType.includes("zip")) return <FileArchive className="h-4 w-4 text-yellow-500" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

function getMimeLabel(mimeType: string): string {
  if (mimeType.startsWith("image/")) return mimeType.replace("image/", "").toUpperCase();
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.includes("wordprocessingml") || mimeType === "application/msword") return "DOCX";
  if (mimeType.includes("spreadsheetml") || mimeType.includes("excel")) return "XLSX";
  if (mimeType.includes("presentationml") || mimeType.includes("powerpoint")) return "PPTX";
  if (mimeType === "text/csv") return "CSV";
  if (mimeType === "text/plain") return "TXT";
  if (mimeType.includes("zip")) return "ZIP";
  return mimeType.split("/")[1]?.toUpperCase() ?? "FILE";
}

export function FilesTab({ businessId }: FilesTabProps) {
  const [files, setFiles] = useState<BusinessFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/files/list?business=${businessId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load files");
      setFiles(data.files ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("businessId", businessId);

    try {
      const res = await fetch("/api/admin/files/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Upload failed");
      await loadFiles();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-uploaded if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [businessId, loadFiles]);

  const handleDelete = useCallback(async (fileId: number) => {
    if (!confirm("Delete this file? This cannot be undone.")) return;

    setDeletingId(fileId);
    setError(null);
    try {
      const res = await fetch("/api/admin/files/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }, []);

  const handleCopyLink = useCallback(async (file: BusinessFile) => {
    await navigator.clipboard.writeText(file.url);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Files</CardTitle>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleUpload}
                accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.avif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
              />
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading…" : "Upload File"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-sm text-destructive mb-3">{error}</p>
          )}

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : files.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No files uploaded yet.</p>
              <p className="text-xs mt-1">Click "Upload File" to add files.</p>
            </div>
          ) : (
            <div className="divide-y">
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-3 py-3">
                  <div className="shrink-0">{getFileIcon(file.mimeType)}</div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={file.originalName}>
                      {file.originalName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(file.size)} · {formatDate(file.createdAt)}
                    </p>
                  </div>

                  <Badge variant="outline" className="text-xs shrink-0">
                    {getMimeLabel(file.mimeType)}
                  </Badge>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyLink(file)}
                    title="Copy link"
                  >
                    {copiedId === file.id ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(file.id)}
                    disabled={deletingId === file.id}
                    title="Delete file"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
