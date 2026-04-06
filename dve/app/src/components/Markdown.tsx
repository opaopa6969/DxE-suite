// Simple markdown renderer — bold, code, table, list, links

function renderInline(text: string) {
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
    return part;
  });
}

interface Props {
  text: string;
  fontSize?: string;
}

export function Markdown({ text, fontSize = "13px" }: Props) {
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
                    {renderInline(cell)}
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
      elements.push(<h4 key={i} style={{ fontSize, fontWeight: "bold", margin: "12px 0 4px", color: "#333" }}>{renderInline(line.slice(4))}</h4>);
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(<h3 key={i} style={{ fontSize, fontWeight: "bold", margin: "14px 0 6px", color: "#333" }}>{renderInline(line.slice(3))}</h3>);
      continue;
    }

    // List item
    if (line.startsWith("- ")) {
      elements.push(
        <div key={i} style={{ paddingLeft: "16px", margin: "3px 0", fontSize }}>
          {"• "}{renderInline(line.slice(2))}
        </div>
      );
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={i} style={{ paddingLeft: "16px", margin: "3px 0", fontSize }}>
          {numMatch[1]}. {renderInline(numMatch[2])}
        </div>
      );
      continue;
    }

    // Normal paragraph
    elements.push(<p key={i} style={{ margin: "4px 0", fontSize, lineHeight: 1.6 }}>{renderInline(line)}</p>);
  }

  if (tableRows.length > 0) flushTable();
  if (inCode) flushCode();

  return <>{elements}</>;
}
