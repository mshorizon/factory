import type { WidgetProps } from "@rjsf/utils";
import { ImageUploadField } from "./ImageUploadField";

export function ImageUrlWidget(props: WidgetProps) {
  const { value, onChange, formContext } = props;
  const businessId = formContext?.businessId;

  if (!businessId) {
    return (
      <input
        type="url"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://example.com/image.jpg"
        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
      />
    );
  }

  return (
    <ImageUploadField
      value={value || ""}
      onChange={onChange}
      businessId={businessId}
    />
  );
}
