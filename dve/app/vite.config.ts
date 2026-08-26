import { defineConfig, type Connect, type Plugin } from "vite";
import preact from "@preact/preset-vite";

/**
 * 外形監視用の health エンドポイント。
 *
 * 監視が認証リダイレクト(302)しか観測できず、サービスが落ちていても
 * 緑に見える事故があったため、認証を素通しさせる専用パスを用意する。
 * そのため応答はステータスと "ok" のみとし、パス構成・内部情報は一切返さない。
 *
 * configureServer / configurePreviewServer のミドルウェアは
 * Vite 内部のミドルウェア（静的配信・SPA fallback）より **前** に登録されるため、
 * catch-all に飲まれず、既存のルーティングにも影響しない。
 */
const healthz = (): Plugin => {
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    // クエリ文字列は無視しつつ、パスは厳密に /healthz のみ受ける
    const pathname = (req.url ?? "").split("?")[0];
    if (pathname !== "/healthz") {
      next();
      return;
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end("ok");
  };

  return {
    name: "dve-healthz",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
};

export default defineConfig({
  plugins: [healthz(), preact()],
  base: "./",
  build: {
    outDir: "../dist",
    emptyDir: false,
  },
  preview: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
