// Search bar — filter nodes by keyword

import { useState, useCallback } from "preact/hooks";

interface Props {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: Props) {
  const [query, setQuery] = useState("");

  const handleInput = useCallback(
    (e: Event) => {
      const val = (e.target as HTMLInputElement).value;
      setQuery(val);
      onSearch(val);
    },
    [onSearch]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    onSearch("");
  }, [onSearch]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <input
        type="text"
        value={query}
        onInput={handleInput}
        placeholder="Search..."
        style={{
          padding: "4px 8px",
          fontSize: "12px",
          border: "1px solid #e2e8f0",
          borderRadius: "4px",
          width: "160px",
          outline: "none",
        }}
      />
      {query && (
        <button
          onClick={handleClear}
          style={{
            border: "none", background: "none", cursor: "pointer",
            fontSize: "14px", color: "#999", padding: "2px",
          }}
        >
          &times;
        </button>
      )}
    </div>
  );
}
