import { useState } from "react";
import type { WidgetProps } from "@rjsf/utils";

export function ImageUrlWidget(props: WidgetProps) {
  const { id, value, onChange, disabled, readonly, placeholder } = props;
  const [showPreview, setShowPreview] = useState(true);
  const [imageError, setImageError] = useState(false);

  const imageUrl = value || "";

  const handleChange = (newValue: string) => {
    setImageError(false);
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="url"
          value={imageUrl}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          readOnly={readonly}
          placeholder={placeholder || "https://example.com/image.jpg"}
          className="flex-1 px-3 py-2 border border-[var(--border)] rounded-[var(--radius)] bg-white text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
        {imageUrl && (
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-2 text-sm bg-[var(--accent)] rounded-[var(--radius)] hover:opacity-80"
          >
            {showPreview ? "Hide" : "Show"}
          </button>
        )}
      </div>

      {imageUrl && showPreview && !imageError && (
        <div className="mt-2 p-2 bg-[var(--accent)] rounded-[var(--radius)]">
          <img
            src={imageUrl}
            alt="Preview"
            className="max-w-full max-h-32 object-contain rounded"
            onError={() => setImageError(true)}
          />
        </div>
      )}

      {imageError && (
        <p className="text-sm text-red-500">Failed to load image preview</p>
      )}
    </div>
  );
}
