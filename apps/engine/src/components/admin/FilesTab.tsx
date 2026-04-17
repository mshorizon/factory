import React, { useEffect, useState, useCallback, useRef } from "react";
import type { ColumnDef } from "@tanstack/react-table";
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
import { UniversalList } from "./UniversalList";

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
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [businessId, loadFiles]);

  const handleDelete = useCallback(async (fileId: number) => {
    setError(null);
    const res = await fetch("/api/admin/files/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Delete failed");
      return;
    }
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const handleCopyLink = useCallback(async (file: BusinessFile) => {
    await navigator.clipboard.writeText(file.url);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const columns: ColumnDef<BusinessFile, unknown>[] = [
    {
      id: "icon",
      header: "",
      enableSorting: false,
      cell: ({ row }) => <div className="shrink-0">{getFileIcon(row.original.mimeType)}</div>,
    },
    {
      accessorKey: "originalName",
      header: "Name",
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-sm font-medium truncate max-w-[360px]" title={row.original.originalName}>
            {row.original.originalName}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatBytes(row.original.size)} · {formatDate(row.original.createdAt)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "mimeType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {getMimeLabel(row.original.mimeType)}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleUpload}
        accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.avif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
      />
      <UniversalList<BusinessFile>
        title="Files"
        subtitle={files.length > 0 ? `${files.length} file${files.length !== 1 ? "s" : ""}` : undefined}
        data={files}
        columns={columns}
        loading={loading}
        error={error}
        emptyIcon={FileText}
        emptyTitle="No files uploaded yet"
        emptyHint='Click "Upload File" to add files.'
        getRowId={(row) => row.id}
        primaryAction={{
          label: uploading ? "Uploading…" : "Upload File",
          icon: Upload,
          onClick: () => fileInputRef.current?.click(),
          disabled: uploading,
        }}
        rowActions={[
          {
            label: "Copy link",
            variant: "outline",
            icon: Copy,
            iconOnly: true,
            title: "Copy link",
            onClick: (file) => handleCopyLink(file),
            // Swap icon to checkmark when recently copied
            show: (file) => copiedId !== file.id,
          },
          {
            label: "Copied",
            variant: "outline",
            icon: Check,
            iconOnly: true,
            className: "text-green-500",
            title: "Copied",
            onClick: () => {},
            show: (file) => copiedId === file.id,
          },
          {
            label: "Delete",
            variant: "ghost",
            icon: Trash2,
            iconOnly: true,
            title: "Delete file",
            className: "text-destructive hover:text-destructive",
            trackBusy: true,
            confirm: () => "Delete this file? This cannot be undone.",
            onClick: (file) => handleDelete(file.id),
          },
        ]}
      />
    </>
  );
}
