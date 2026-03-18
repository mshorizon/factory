import { useState, useRef, useEffect, useCallback } from "react";
import { HexColorPicker } from "react-colorful";
import type { WidgetProps } from "@rjsf/utils";

export function ColorPickerWidget(props: WidgetProps) {
  const { id, value, onChange, disabled, readonly } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [localColor, setLocalColor] = useState(value || "#000000");
  const popoverRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalColor(value || "#000000");
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const debouncedOnChange = useCallback(
    (color: string) => {
      setLocalColor(color);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onChange(color), 100);
    },
    [onChange],
  );

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  return (
    <div className="relative" ref={popoverRef}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => !disabled && !readonly && setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-md border border-border cursor-pointer transition-shadow hover:ring-2 hover:ring-ring/20"
          style={{ backgroundColor: localColor }}
          disabled={disabled || readonly}
          aria-label="Pick color"
        />
        <input
          id={id}
          type="text"
          value={localColor}
          onChange={(e) => {
            setLocalColor(e.target.value);
            onChange(e.target.value);
          }}
          disabled={disabled}
          readOnly={readonly}
          className="flex-1 px-3 py-2 border border-border bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
          placeholder="#000000"
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 p-3 rounded-lg shadow-lg bg-popover border border-border">
          <HexColorPicker color={localColor} onChange={debouncedOnChange} />
        </div>
      )}
    </div>
  );
}
