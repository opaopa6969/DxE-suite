// Simple markdown renderer — bold, code, table, list, links + glossary hover

export interface GlossaryEntry {
  term: string;
  definition: string;
  source: string;
  aliases?: string[];
}

function GlossaryTerm({ term, definition, source, children }: { term: string; definition: string; source: string; children: any }) {
  return (
    <span style={{ position: "relative", display: "inline" }}>
      <span
        style={{
          borderBottom: "1px dotted #d69e2e",
          cursor: "help",
        }}
        title={`${term}: ${definition} (${source})`}
      >
        {children}
      </span>
    </span>
  );
}

function applyGlossary(text: string, glossary: GlossaryEntry[]): any {
  if (!glossary || glossary.length === 0) return text;

  // Build regex from all terms (longer first to avoid partial matches)
  const sorted = [...glossary].sort((a, b) => b.term.length - a.term.length);
  const allTerms = sorted.flatMap((e) => [e.term, ...(e.aliases ?? [])]).filter(Boolean);
  if (allTerms.length === 0) return text;

  const escaped = allTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "g");

  const parts = text.split(regex);
  if (parts.length <= 1) return text;

  const termMap = new Map<string, GlossaryEntry>();
  for (const entry of sorted) {
    termMap.set(entry.term.toLowerCase(), entry);
    for (const alias of entry.aliases ?? []) {
      termMap.set(alias.toLowerCase(), entry);
    }
  }

  return parts.map((part, i) => {
    const entry = termMap.get(part.toLowerCase());
    if (entry) {
      return <GlossaryTerm key={i} term={entry.term} definition={entry.definition} source={entry.source}>{part}</GlossaryTerm>;
    }
    return part;
  });
}

function renderInline(text: string, glossary?: GlossaryEntry[]) {
  // Bold, code, links
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} style={{ background: "#edf2f7", padding: "1px 4px", borderRadius: "3px", fontSize: "0.9em" }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return <a key={i} href={linkMatch[2]} style={{ color: "#4299e1" }}>{linkMatch[1]}</a>;
    }
    // Apply glossary to plain text parts
    if (glossary && typeof part === "string" && part.length > 1) {
      return <span key={i}>{applyGlossary(part, glossary)}</span>;
    }
    return part;
  });
}

interface Props {
  text: string;
  fontSize?: string;
  glossary?: GlossaryEntry[];
}

export function Markdown({ text, fontSize = "13px", glossary }: Props) {
  const lines = text.split("\n");
  const elements: any[] = [];
  let tableRows: string[][] = [];
  let inCode = false;
  let codeBlock: string[] = [];

  const flushTable = () => {
    if (tableRows.length === 0) return;
    elements.push(
      <table key={`t-${elements.length}`} style={{
        width: "100%", fontSize: "12px", borderCollapse: "collapse", margin: "8px 0",
        border: "1px solid #e2e8f0",
      }}>
        <tbody>
          {tableRows.map((cells, ri) => (
            <tr key={ri} style={{ borderBottom: "1px solid #e2e8f0", background: ri === 0 ? "#f7fafc" : "transparent" }}>
              {cells.map((cell, ci) => {
                const Tag = ri === 0 ? "th" : "td";
                return (
                  <Tag key={ci} style={{
                    padding: "5px 10px", textAlign: "left",
                    fontWeight: ri === 0 ? "bold" : "normal",
                    fontSize: "12px",
                  }}>
                    {renderInline(cell, glossary)}
                  </Tag>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
    tableRows = [];
  };

  const flushCode = () => {
    if (codeBlock.length === 0) return;
    elements.push(
      <pre key={`c-${elements.length}`} style={{
        background: "#1a202c", color: "#e2e8f0", padding: "10px 12px",
        borderRadius: "6px", fontSize: "12px", overflow: "auto",
        margin: "8px 0", lineHeight: 1.5,
      }}>
        {codeBlock.join("\n")}
      </pre>
    );
    codeBlock = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      if (inCode) { flushCode(); inCode = false; }
      else { inCode = true; }
      continue;
    }
    if (inCode) { codeBlock.push(line); continue; }

    // Table row
    if (line.startsWith("|")) {
      if (/^\|[\s\-:|]+\|$/.test(line)) continue; // separator
      const cells = line.split("|").slice(1, -1).map(c => c.trim());
      tableRows.push(cells);
      continue;
    }
    if (tableRows.length > 0) flushTable();

    // Empty line
    if (!line.trim()) continue;

    // Headers
    if (line.startsWith("### ")) {
      elements.push(<h4 key={i} style={{ fontSize, fontWeight: "bold", margin: "12px 0 4px", color: "#333" }}>{renderInline(line.slice(4), glossary)}</h4>);
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(<h3 key={i} style={{ fontSize, fontWeight: "bold", margin: "14px 0 6px", color: "#333" }}>{renderInline(line.slice(3), glossary)}</h3>);
      continue;
    }

    // List item
    if (line.startsWith("- ")) {
      elements.push(
        <div key={i} style={{ paddingLeft: "16px", margin: "3px 0", fontSize }}>
          {"• "}{renderInline(line.slice(2), glossary)}
        </div>
      );
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={i} style={{ paddingLeft: "16px", margin: "3px 0", fontSize }}>
          {numMatch[1]}. {renderInline(numMatch[2], glossary)}
        </div>
      );
      continue;
    }

    // Normal paragraph
    elements.push(<p key={i} style={{ margin: "4px 0", fontSize, lineHeight: 1.6 }}>{renderInline(line, glossary)}</p>);
  }

  if (tableRows.length > 0) flushTable();
  if (inCode) flushCode();

  return <>{elements}</>;
}
