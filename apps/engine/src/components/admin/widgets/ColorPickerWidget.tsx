import { useState, useRef, useEffect, useCallback } from "react";
import { HexColorPicker } from "react-colorful";
import type { WidgetProps } from "@rjsf/utils";

export function ColorPickerWidget(props: WidgetProps) {
  const { id, value, onChange, disabled, readonly } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [localColor, setLocalColor] = useState(value || "#000000");
  const popoverRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local state when prop value changes externally
  useEffect(() => {
    setLocalColor(value || "#000000");
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced propagation to RJSF onChange
  const debouncedOnChange = useCallback(
    (color: string) => {
      setLocalColor(color);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onChange(color), 100);
    },
    [onChange],
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="relative" ref={popoverRef}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => !disabled && !readonly && setIsOpen(!isOpen)}
          className="w-10 h-10 rounded border border-[var(--border)] cursor-pointer"
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
          className="flex-1 px-3 py-2 border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)' }}
          placeholder="#000000"
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 p-3 rounded-[var(--radius)] shadow-lg" style={{ background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.1)' }}>
          <HexColorPicker color={localColor} onChange={debouncedOnChange} />
        </div>
      )}
    </div>
  );
}
