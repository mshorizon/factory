import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

type UploadStatus = "idle" | "uploading" | "error";

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  businessId: string;
  placeholder?: string;
}

export function ImageUploadField({ value, onChange, businessId, placeholder }: ImageUploadFieldProps) {
  const [imageError, setImageError] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadError, setUploadError] = useState<string>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (newValue: string) => {
    setImageError(false);
    onChange(newValue);
  };

  const handleFileUpload = async (file: File) => {
    setUploadStatus("uploading");
    setUploadError(undefined);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("businessId", businessId);

      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Upload failed");
      }

      setUploadStatus("idle");
      handleChange(result.url);
    } catch (err) {
      setUploadStatus("error");
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = "";
  };

  return (
    <div className="flex-1 space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={uploadStatus === "uploading"}
          placeholder={placeholder || "https://example.com/image.jpg"}
          className="flex-1 px-3 py-2 border border-border bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileSelected}
          className="hidden"
        />
        <Button
          type="button"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadStatus === "uploading"}
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          {uploadStatus === "uploading" ? "..." : "Upload"}
        </Button>
      </div>

      {uploadStatus === "error" && uploadError && (
        <p className="text-xs text-destructive">{uploadError}</p>
      )}

      {value && !imageError && (
        <div className="p-1 bg-muted/30 rounded inline-block">
          <img
            src={value}
            alt="Preview"
            className="max-w-full max-h-24 object-contain rounded"
            onError={() => setImageError(true)}
          />
        </div>
      )}
    </div>
  );
}
