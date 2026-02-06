import { useState, useRef } from "react";

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
    if (file) {
      handleFileUpload(file);
    }
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
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileSelected}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadStatus === "uploading"}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {uploadStatus === "uploading" ? "Uploading..." : "Upload"}
        </button>
      </div>

      {uploadStatus === "error" && uploadError && (
        <p className="text-xs text-red-500">{uploadError}</p>
      )}

      {value && !imageError && (
        <div className="p-1 bg-gray-100 rounded inline-block">
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
