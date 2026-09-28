// Renders showreel/index.html → showreel/aoun-reel.mp4.
// Headless Chrome over raw CDP (no npm deps) → PNG sub-frames → ffmpeg (tmix motion blur) + WebAudio score.
//   node showreel/render.mjs                 full render
//   node showreel/render.mjs --stills 2.3,9.9  PNG stills to /tmp/aoun-stills
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFile, writeFile, mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";

const { values: opt } = parseArgs({
  options: {
    fps: { type: "string", default: "60" },
    sub: { type: "string", default: "4" }, // sub-frames per frame (motion blur samples)
    workers: { type: "string", default: "6" },
    stills: { type: "string" },
    eval: { type: "string" }, // debug: print an expression evaluated in the page
    out: { type: "string", default: path.join(import.meta.dirname, "aoun-reel.mp4") },
  },
});
const FPS = +opt.fps, SUB = +opt.sub, WORKERS = +opt.workers, SHUTTER = 0.5; // 180° shutter
const ROOT = path.resolve(import.meta.dirname, "..");
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const MIME = { ".html": "text/html; charset=utf-8", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".mp3": "audio/mpeg" };

const server = createServer(async (req, res) => {
  const file = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname));
  try {
    if (!file.startsWith(ROOT)) throw 0;
    const body = await readFile(file);
    res.writeHead(200, { "content-type": MIME[path.extname(file)] ?? "application/octet-stream" }).end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(0, "127.0.0.1");
await new Promise((r) => server.once("listening", r));
const base = `http://127.0.0.1:${server.address().port}`;

const profile = await mkdtemp(path.join(tmpdir(), "aoun-reel-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--hide-scrollbars",
  "--mute-audio", "--force-color-profile=srgb", "--no-first-run", "--no-default-browser-check", "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
const wsUrl = await new Promise((res, rej) => {
  let buf = "";
  chrome.stderr.on("data", (d) => {
    const m = (buf += d).match(/DevTools listening on (ws:\/\/\S+)/);
    if (m) res(m[1]);
  });
  chrome.once("exit", () => rej(new Error("chrome exited")));
});
const httpBase = wsUrl.replace(/^ws/, "http").replace(/\/devtools.*$/, "");
const cleanup = async () => {
  const exited = new Promise((r) => chrome.once("exit", r));
  chrome.kill();
  await exited;
  server.close();
  await rm(profile, { recursive: true, force: true });
};

async function cdp(url) {
  const ws = new WebSocket(url);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const wait = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data), w = wait.get(m.id);
    if (!w) return;
    wait.delete(m.id);
    m.error ? w[1](new Error(m.error.message)) : w[0](m.result);
  };
  return (method, params = {}) => new Promise((a, b) => { wait.set(++id, [a, b]); ws.send(JSON.stringify({ id, method, params })); });
}

async function evaluate(send, expression) {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  return r.result.value;
}

async function openPage() {
  const target = await (await fetch(`${httpBase}/json/new?about:blank`, { method: "PUT" })).json();
  const send = await cdp(target.webSocketDebuggerUrl);
  await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: `${base}/showreel/index.html?capture` });
  for (;;) {
    try { if (await evaluate(send, "!!window.reelReady")) break; } catch {}
    await new Promise((r) => setTimeout(r, 50));
  }
  await evaluate(send, "window.reelReady");
  return send;
}

async function shot(send, t) {
  await evaluate(send, `render(${t})`);
  const { data } = await send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true });
  return Buffer.from(data, "base64");
}

try {
  if (opt.eval) {
    console.log(await evaluate(await openPage(), opt.eval));
  } else if (opt.stills) {
    const send = await openPage(), dir = path.join(tmpdir(), "aoun-stills");
    await mkdir(dir, { recursive: true });
    for (const t of opt.stills.split(",")) await writeFile(path.join(dir, `${t}.png`), await shot(send, +t));
    console.log(dir);
  } else {
    const pages = await Promise.all(Array.from({ length: WORKERS }, openPage));
    const DUR = await evaluate(pages[0], "DUR");
    const wav = path.join(profile, "score.wav");
    await writeFile(wav, Buffer.from(await evaluate(pages[0], "renderAudio()"), "base64"));

    const total = Math.round(DUR * FPS) * SUB;
    const ff = spawn("ffmpeg", [
      "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS * SUB), "-c:v", "png", "-i", "-", "-i", wav,
      "-vf", SUB > 1 ? `tmix=frames=${SUB},select=eq(mod(n\\,${SUB})\\,${SUB - 1}),setpts=N/${FPS}/TB` : "null",
      "-r", String(FPS), "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", "-shortest", opt.out,
    ], { stdio: ["pipe", "inherit", "inherit"] });
    const done = new Promise((r, j) => ff.once("exit", (c) => (c ? j(new Error(`ffmpeg ${c}`)) : r())));

    // Workers render interleaved sub-frames; the writer flushes them to ffmpeg in order.
    const ready = new Map();
    let next = 0, wake = () => {};
    const started = Date.now();
    await Promise.all([
      ...pages.map(async (send, w) => {
        for (let i = w; i < total; i += WORKERS) {
          while (i - next > WORKERS * 8) await new Promise((r) => setTimeout(r, 5));
          const f = Math.floor(i / SUB), j = i % SUB;
          ready.set(i, await shot(send, f / FPS + ((j + 0.5) / SUB) * (SHUTTER / FPS)));
          wake();
        }
      }),
      (async () => {
        while (next < total) {
          if (!ready.has(next)) { await new Promise((r) => (wake = r)); continue; }
          const buf = ready.get(next);
          ready.delete(next++);
          if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
          if (next % (FPS * SUB) === 0) process.stdout.write(`\r${(next / SUB / FPS).toFixed(0)}s / ${DUR}s  (${((Date.now() - started) / 1000).toFixed(0)}s elapsed)`);
        }
        ff.stdin.end();
      })(),
    ]);
    await done;
    console.log(`\n${opt.out}`);
  }
} finally {
  await cleanup();
}
