import { readFile } from "node:fs/promises";
import path from "node:path";

// ponytail: serves showreel/index.html + its fonts straight from the repo, no copy into public/
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file?: string[] }> },
) {
  const { file } = await params;

  if (!file) {
    const html = await readFile(path.join(process.cwd(), "showreel/index.html"), "utf8");
    return new Response(html.replaceAll("url(/fonts/", "url(/showreel/fonts/"), {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const [dir, name] = file;
  if (file.length !== 2 || dir !== "fonts" || !/^[\w-]+\.woff2$/.test(name)) {
    return new Response(null, { status: 404 });
  }

  const font = await readFile(path.join(process.cwd(), "fonts", name)).catch(() => null);
  if (!font) return new Response(null, { status: 404 });

  return new Response(font, {
    headers: {
      "content-type": "font/woff2",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
