import { serveDir } from "jsr:@std/http/file-server";

const fsRoot = new URL(".", import.meta.url).pathname;
function buildIndex(dirs: string[]): string {
  const links = dirs
    .map((d) => `  <li><a href="/${d}/">${d}</a></li>`)
    .join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Examples</title></head>
<body>
<h1>Examples</h1>
<ul>
${links}
</ul>
</body>
</html>`;
}

async function findExampleDirs(): Promise<string[]> {
  const dirs: string[] = [];
  for await (const entry of Deno.readDir(fsRoot)) {
    if (!entry.isDirectory) continue;
    const hasStyle = await Deno.stat(`${fsRoot}${entry.name}/style.ts`)
      .then(() => true)
      .catch(() => false);
    const hasIndex = await Deno.stat(`${fsRoot}${entry.name}/index.html`)
      .then(() => true)
      .catch(() => false);
    if (hasStyle && hasIndex) dirs.push(entry.name);
  }
  return dirs.sort();
}

const exampleDirs = await findExampleDirs();
const indexHtml = buildIndex(exampleDirs);

const td = new TextDecoder();
const p = await new Deno.Command(Deno.execPath(), {
  args: ["run", "--allow-read=./examples", "./examples/build.ts"],
})
  .output();
const out = td.decode(p.stdout).trim();
const err = td.decode(p.stderr).trim();
console.log("STDOUT ==> ", out);
console.log("STDERR ==> ", err);

Deno.serve((req) => {
  const url = new URL(req.url);
  if (url.pathname === "/" || url.pathname === "/index.html") {
    return new Response(indexHtml, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
  return serveDir(req, { fsRoot });
});
