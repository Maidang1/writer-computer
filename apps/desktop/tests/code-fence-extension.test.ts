import { describe, expect, test } from "vite-plus/test";
import { __testCodeFenceExtension } from "../src/lib/prosemark-core/codeFenceExtension";

describe("codeFenceTheme", () => {
  test("fenced code lines follow the Madinah article code block size", () => {
    const fencedCodeLine = __testCodeFenceExtension.codeFenceThemeSpec[".cm-fenced-code-line"];

    expect(fencedCodeLine.fontSize).toBe("var(--reader-code-block-font-size, 12px)");
    expect(fencedCodeLine.fontFamily).toContain("--pm-code-font");
  });
});
