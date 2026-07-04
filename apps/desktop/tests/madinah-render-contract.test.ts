import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vite-plus/test";

const desktopRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const appCss = readFileSync(resolve(desktopRoot, "src/App.css"), "utf8");
const prosemarkCss = readFileSync(
  resolve(desktopRoot, "src/components/editor-area/prosemark-theme.css"),
  "utf8",
);
const settingsSchema = JSON.parse(
  readFileSync(resolve(desktopRoot, "shared/settings.schema.json"), "utf8"),
) as { settings: Array<{ key: string; default: unknown }> };

function settingDefault(key: string) {
  return settingsSchema.settings.find((setting) => setting.key === key)?.default;
}

describe("Madinah render contract", () => {
  test("loads the local Jinkai font bundle used by the reader font stack", () => {
    expect(appCss).toContain('@import "./assets/fonts/jinkai/jinkai.css";');
    expect(appCss).toMatch(/--reader-font:\s*"TsangerJinKai02"/);
    expect(existsSync(resolve(desktopRoot, "src/assets/fonts/jinkai/jinkai.css"))).toBe(true);
  });

  test("keeps the editor column and paragraph rhythm aligned to the Astro post content", () => {
    expect(appCss).toContain("--reader-content-width: 780px;");
    expect(appCss).toContain("--writer-editor-max-width: var(--reader-content-width);");
    expect(appCss).toContain("--writer-editor-font-size: var(--reader-content-font-size);");
    expect(appCss).toContain("--writer-editor-line-height: var(--reader-content-line-height);");
    expect(settingDefault("editor.font-size")).toBe(16.15);
    expect(settingDefault("editor.line-height")).toBe(1.76);
  });

  test("maps ProseMark core Markdown blocks to Astro post-content values", () => {
    expect(prosemarkCss).toContain(".cm-editor .cm-heading-line-1");
    expect(prosemarkCss).toContain("font-size: var(--reader-h1-size);");
    expect(prosemarkCss).toContain(".cm-editor .cm-inline-code");
    expect(prosemarkCss).toContain("background: var(--reader-code) !important;");
    expect(prosemarkCss).toContain(".cm-editor .cm-fenced-code-line");
    expect(prosemarkCss).toContain("background: var(--reader-code-block) !important;");
    expect(prosemarkCss).toContain(".cm-editor .cm-table-widget th,");
    expect(prosemarkCss).toContain(
      "border: 1px solid color-mix(in srgb, var(--reader-soft) 35%, transparent) !important;",
    );
    expect(prosemarkCss).toContain(".cm-editor .cm-image img");
    expect(prosemarkCss).toContain("border-radius: 6px;");
  });
});
