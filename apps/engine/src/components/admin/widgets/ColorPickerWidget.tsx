import { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import type { WidgetProps } from "@rjsf/utils";

export function ColorPickerWidget(props: WidgetProps) {
  const { id, value, onChange, disabled, readonly } = props;
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const colorValue = value || "#000000";

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

  return (
    <div className="relative" ref={popoverRef}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => !disabled && !readonly && setIsOpen(!isOpen)}
          className="w-10 h-10 rounded border border-[var(--border)] cursor-pointer"
          style={{ backgroundColor: colorValue }}
          disabled={disabled || readonly}
          aria-label="Pick color"
        />
        <input
          id={id}
          type="text"
          value={colorValue}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          readOnly={readonly}
          className="flex-1 px-3 py-2 border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)' }}
          placeholder="#000000"
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 p-3 rounded-[var(--radius)] shadow-lg" style={{ background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.1)' }}>
          <HexColorPicker color={colorValue} onChange={onChange} />
        </div>
      )}
    </div>
  );
}
