// DVE Slack Bot — slash commands + event handling
// Endpoints: POST /api/slack/command, POST /api/slack/events

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { traceDecision, impactOf, orphanGaps, search, overturned } from "../graph/query.js";
import { detectProjectState } from "../parser/state-detector.js";
import type { DVEGraph, Gap, Decision } from "../graph/schema.js";

function loadGraph(distDir: string, project?: string): DVEGraph | null {
  const file = project
    ? path.join(distDir, `graph-${project}.json`)
    : path.join(distDir, "graph.json");
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf-8"));
}

// ─── Slash Command Handler ───
// /dve trace DD-003
// /dve orphans
// /dve status
// /dve search JWT
// /dve help

export function handleSlashCommand(
  text: string,
  distDir: string,
  projectDirs: { name: string; path: string }[]
): { response_type: string; text: string; blocks?: any[] } {
  const parts = text.trim().split(/\s+/);
  const cmd = parts[0]?.toLowerCase() ?? "help";
  const args = parts.slice(1);

  const graph = loadGraph(distDir);
  if (!graph && cmd !== "help" && cmd !== "status") {
    return { response_type: "ephemeral", text: "❌ graph.json not found. Run `dve build` first." };
  }

  switch (cmd) {
    case "trace": {
      if (!args[0]) return { response_type: "ephemeral", text: "Usage: /dve trace DD-001" };
      const chain = traceDecision(graph!, args[0]);
      if (chain.length === 0) return { response_type: "ephemeral", text: `❌ ${args[0]} not found.` };

      const lines = chain.map((n) => {
        const d = n.data as any;
        switch (n.type) {
          case "decision": return `📋 *${n.id}*: ${d.title} (${d.date}) [${d.status}]`;
          case "gap": return `  ← 🔴 ${n.id}: ${(d.summary ?? "").slice(0, 80)} (${d.severity})`;
          case "session": return `  ← 📁 ${n.id} (${(d.characters ?? []).join(", ")})`;
          default: return `  ← ${n.type}: ${n.id}`;
        }
      });
      return { response_type: "in_channel", text: `*Trace: ${args[0]}*\n${lines.join("\n")}` };
    }

    case "orphans": {
      const orphans = orphanGaps(graph!);
      if (orphans.length === 0) return { response_type: "in_channel", text: "✅ No orphan gaps. All gaps linked to decisions." };

      const lines = orphans.slice(0, 10).map((g) => {
        const d = g.data as Gap;
        return `• ${g.id}: ${(d.summary ?? "").slice(0, 60)} (${d.severity})`;
      });
      const more = orphans.length > 10 ? `\n_... and ${orphans.length - 10} more_` : "";
      return { response_type: "in_channel", text: `*Orphan Gaps (${orphans.length})*\n${lines.join("\n")}${more}` };
    }

    case "search": {
      if (!args[0]) return { response_type: "ephemeral", text: "Usage: /dve search <keyword>" };
      const results = search(graph!, args.join(" "));
      if (results.length === 0) return { response_type: "ephemeral", text: `No results for "${args.join(" ")}".` };

      const lines = results.slice(0, 8).map((n) => {
        const d = n.data as any;
        const label = d.title ?? d.summary ?? d.theme ?? "";
        return `• \`${n.type}\` ${n.id}: ${label.slice(0, 60)}`;
      });
      return { response_type: "in_channel", text: `*Search: "${args.join(" ")}"* (${results.length} results)\n${lines.join("\n")}` };
    }

    case "status": {
      const statusLines = projectDirs.map((p) => {
        const state = detectProjectState(p.name, p.path);
        const wf = state.workflow;
        const current = wf.currentPhase;
        const sub = wf.subState ? ` > ${wf.subState}` : "";
        return `• *${p.name}*: \`${current}${sub}\` | S:${state.dgeSessionCount} DD:${state.ddCount} | DRE: ${state.dre.installState}`;
      });
      return { response_type: "in_channel", text: `*DVE Status*\n${statusLines.join("\n")}` };
    }

    case "overturned": {
      const ot = overturned(graph!);
      if (ot.length === 0) return { response_type: "in_channel", text: "✅ No overturned decisions." };
      const lines = ot.map(({ decision, impact }) => {
        const d = decision.data as any;
        return `• ❌ *${decision.id}*: ${d.title} → ${impact.length} affected nodes`;
      });
      return { response_type: "in_channel", text: `*Overturned Decisions*\n${lines.join("\n")}` };
    }

    case "list": {
      const filter = args[0]?.toLowerCase() ?? "all"; // dd / gap / session / spec / all
      const nodes = graph!.nodes.filter((n) => {
        if (filter === "dd" || filter === "decisions") return n.type === "decision";
        if (filter === "gap" || filter === "gaps") return n.type === "gap";
        if (filter === "session" || filter === "sessions") return n.type === "session";
        if (filter === "spec" || filter === "specs") return n.type === "spec";
        return n.type === "decision" || n.type === "session" || n.type === "spec";
      });

      if (nodes.length === 0) return { response_type: "ephemeral", text: `No ${filter} found.` };

      const blocks: any[] = [
        { type: "section", text: { type: "mrkdwn", text: `*${filter === "all" ? "All Items" : filter.toUpperCase()}* (${nodes.length})` } },
      ];

      // Group by type
      const grouped: Record<string, typeof nodes> = {};
      for (const n of nodes) {
        if (!grouped[n.type]) grouped[n.type] = [];
        grouped[n.type].push(n);
      }

      for (const [type, items] of Object.entries(grouped)) {
        const icon = type === "decision" ? "📋" : type === "session" ? "📁" : type === "spec" ? "📄" : type === "gap" ? "🔴" : "📎";
        blocks.push({ type: "divider" });
        blocks.push({ type: "section", text: { type: "mrkdwn", text: `*${icon} ${type}* (${items.length})` } });

        for (const item of items.slice(0, 10)) {
          const d = item.data as any;
          const label = d.title ?? d.theme ?? d.summary?.slice(0, 50) ?? item.id;
          const meta = type === "decision" ? `${d.date ?? ""} | ${d.status ?? ""}` :
            type === "session" ? `${d.date ?? ""} | ${(d.characters ?? []).slice(0, 3).join(", ")}` :
            type === "spec" ? `${d.type ?? ""} | ${d.status ?? ""}` :
            `${(d as any).severity ?? ""}`;

          blocks.push({
            type: "section",
            text: { type: "mrkdwn", text: `*${item.id}*\n${label}\n_${meta}_` },
            accessory: {
              type: "button",
              text: { type: "plain_text", text: type === "decision" ? "Trace" : "Detail" },
              action_id: `dve_detail_${item.id}`,
              value: item.id,
            },
          });
        }

        if (items.length > 10) {
          blocks.push({ type: "section", text: { type: "mrkdwn", text: `_... and ${items.length - 10} more_` } });
        }
      }

      return { response_type: "in_channel", text: `List: ${filter}`, blocks };
    }

    case "summary": {
      const s = graph!.stats;
      const orphanCount = orphanGaps(graph!).length;
      const otCount = overturned(graph!).length;
      return {
        response_type: "in_channel",
        text: `*DVE Summary*\nSessions: ${s.sessions} | Gaps: ${s.gaps} | Decisions: ${s.decisions} | Specs: ${s.specs ?? 0} | Annotations: ${s.annotations}\nOrphan Gaps: ${orphanCount} | Overturned: ${otCount}`,
      };
    }

    default:
      return {
        response_type: "ephemeral",
        text: `*DVE Slack Commands*
\`/dve list [dd|gap|session|spec]\` — 一覧（ボタン付き）
\`/dve trace DD-001\` — 因果チェーン
\`/dve orphans\` — 未解決 Gap
\`/dve search <keyword>\` — 検索
\`/dve status\` — 全プロジェクト状態
\`/dve summary\` — 統計サマリー
\`/dve overturned\` — 撤回された DD
\`/dve help\` — このヘルプ`,
      };
  }
}

// ─── Events API Handler ───
// @DVE メンション → 自然言語でクエリ

export function handleEvent(event: any, distDir: string): string | null {
  if (event.type !== "app_mention" && event.type !== "message") return null;

  const text = (event.text ?? "").replace(/<@[^>]+>/g, "").trim().toLowerCase();

  // Simple keyword routing
  if (/trace|経緯|なぜ/.test(text)) {
    const ddMatch = text.match(/DD-\d+/i);
    if (ddMatch) {
      const graph = loadGraph(distDir);
      if (!graph) return "graph.json not found.";
      const chain = traceDecision(graph, ddMatch[0]);
      return chain.map((n) => `${n.type}: ${n.id}`).join(" ← ");
    }
    return "DD 番号を指定してください（例: DD-003 の経緯）";
  }

  if (/orphan|未解決|未決定/.test(text)) {
    const graph = loadGraph(distDir);
    if (!graph) return "graph.json not found.";
    const orphans = orphanGaps(graph);
    return `未解決 Gap: ${orphans.length} 件`;
  }

  if (/status|状態|フェーズ/.test(text)) {
    return "Use `/dve status` for project status.";
  }

  return "🤖 `/dve help` でコマンド一覧を見れます。";
}
