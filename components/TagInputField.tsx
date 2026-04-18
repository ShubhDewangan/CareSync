"use client";

import { useState, useRef, KeyboardEvent } from "react";

interface TagInputFieldProps {
  label?: string;
  values?: string[];          // legacy prop name
  value?: string[];           // react-hook-form compatible
  onChange: (values: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  allowCustom?: boolean;
  validate?: (val: string) => string | null;
}

export default function TagInputField({
  label,
  values,
  value,
  onChange,
  suggestions = [],
  placeholder = "Type and press Enter...",
  allowCustom = true,
  validate,
}: TagInputFieldProps) {
  // support both `values` (legacy) and `value` (react-hook-form)
  const tags = value ?? values ?? []

  const [inputVal, setInputVal] = useState("");
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestions.filter(
    (s) =>
      !tags.includes(s) &&
      (inputVal === "" || s.toLowerCase().includes(inputVal.toLowerCase()))
  );

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag || tags.includes(tag)) return;

    if (validate) {
      const validationError = validate(tag);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setError(null);
    onChange([...tags, tag]);
    setInputVal("");
    inputRef.current?.focus();
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && allowCustom) {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === "Backspace" && inputVal === "" && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setFocused(false);
      if (allowCustom && inputVal.trim()) addTag(inputVal);
    }, 150);
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-[13px] font-medium text-gray-600">{label}</label>
      )}

      <div
        onClick={() => {
          inputRef.current?.focus();
          setFocused(true);
        }}
        style={{
          minHeight: 44,
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          alignItems: "center",
          padding: "6px 12px",
          background: "#EFECE3",
          border: error
            ? "1px solid #ef4444"
            : focused
            ? "1px solid #203C67"
            : "1px solid #9ca3af",
          borderRadius: 8,
          cursor: "text",
          transition: "border-color 0.15s, box-shadow 0.15s",
          boxShadow: error
            ? "0 0 0 3px rgba(239,68,68,0.12)"
            : focused
            ? "0 0 0 3px rgba(32,60,103,0.12)"
            : "none",
        }}
      >
        {tags.map((tag, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: "#203C67",
              color: "#fff",
              borderRadius: 6,
              padding: "3px 10px",
              fontSize: 12,
              fontWeight: 500,
              userSelect: "none",
              maxWidth: 220,
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {tag}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(i); }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                color: "#8FABD4",
                fontSize: 16,
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
                justifyContent: "center",
              }}
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          value={inputVal}
          onChange={(e) => { setInputVal(e.target.value); setFocused(true); setError(null); }}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? placeholder : ""}
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 13,
            color: "#374151",
            flex: "1 1 120px",
            minWidth: 80,
            padding: "2px 0",
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* Inline validation error */}
      {error && (
        <p style={{ margin: 0, fontSize: 11, color: "#ef4444" }}>{error}</p>
      )}

      {/* Suggestions dropdown */}
      {focused && filteredSuggestions.length > 0 && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            maxHeight: 200,
            overflowY: "auto",
            zIndex: 50,
            position: "relative",
          }}
        >
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "9px 14px",
                background: "none",
                border: "none",
                borderBottom: "0.5px solid #f3f4f6",
                cursor: "pointer",
                fontSize: 13,
                color: "#374151",
                textAlign: "left",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f4fb")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <span
                style={{
                  width: 18, height: 18, borderRadius: 4,
                  background: "#e8f2fd", color: "#203C67",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 600, flexShrink: 0,
                }}
              >
                +
              </span>
              {s}
            </button>
          ))}
          {allowCustom && inputVal.trim() && !suggestions.includes(inputVal.trim()) && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); addTag(inputVal); }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "9px 14px",
                background: "#f8f9ff", border: "none",
                cursor: "pointer", fontSize: 13,
                color: "#203C67", fontWeight: 500, textAlign: "left",
              }}
            >
              <span
                style={{
                  width: 18, height: 18, borderRadius: 4,
                  background: "#203C67", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 600, flexShrink: 0,
                }}
              >
                +
              </span>
              Add &ldquo;{inputVal.trim()}&rdquo;
            </button>
          )}
        </div>
      )}

      <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>
        Click a suggestion or type a custom value and press{" "}
        <kbd style={{ fontFamily: "monospace", background: "#e5e7eb", borderRadius: 3, padding: "0 4px", fontSize: 10 }}>
          Enter
        </kbd>
      </p>
    </div>
  );
}