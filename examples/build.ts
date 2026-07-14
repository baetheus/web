const examplesDir = new URL(".", import.meta.url).pathname;

export async function build() {
  for await (const entry of Deno.readDir(examplesDir)) {
    if (!entry.isDirectory) continue;

    const dir = `${examplesDir}${entry.name}`;
    const styleTs = `${dir}/style.ts`;
    const indexHtml = `${dir}/index.html`;

    const hasStyle = await Deno.stat(styleTs).then(() => true).catch(() =>
      false
    );
    const hasIndex = await Deno.stat(indexHtml).then(() => true).catch(() =>
      false
    );
    if (!hasStyle || !hasIndex) continue;

    const mod = await import(styleTs);
    if (typeof mod.css !== "string") {
      console.warn(
        `${entry.name}: style.ts has no string export named "css", skipping`,
      );
      continue;
    }

    await Deno.writeTextFile(`${dir}/style.css`, mod.css);
    console.log(`${entry.name}: wrote style.css`);
  }
}

if (import.meta.main) {
  await build();
}
