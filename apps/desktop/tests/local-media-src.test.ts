import { beforeEach, describe, expect, test, vi } from "vite-plus/test";

vi.mock("@tauri-apps/api/core", () => ({
  convertFileSrc: (path: string) => `asset://localhost/${encodeURIComponent(path)}`,
}));

import { rewriteHtmlImageSources, toLocalImageSrc } from "../src/lib/local-media-src";

const markdownDir = "/Users/bytedance/DoubaoWork/chats/2026-09-14/new-chat-1";

describe("toLocalImageSrc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("converts a relative image next to the markdown file", () => {
    expect(toLocalImageSrc("Refactoring_UI_assets/page_007_1.jpeg", markdownDir)).toBe(
      `asset://localhost/${encodeURIComponent(`${markdownDir}/Refactoring_UI_assets/page_007_1.jpeg`)}`,
    );
  });

  test("keeps remote https URLs", () => {
    expect(toLocalImageSrc("https://example.com/cover.png", markdownDir)).toBe(
      "https://example.com/cover.png",
    );
  });

  test("keeps already-converted asset URLs", () => {
    const converted = `asset://localhost/${encodeURIComponent("/tmp/pic.png")}`;
    expect(toLocalImageSrc(converted, markdownDir)).toBe(converted);
  });

  test("unwraps angle-bracket destinations with spaces", () => {
    expect(toLocalImageSrc("<note assets/img file.png>", markdownDir)).toBe(
      `asset://localhost/${encodeURIComponent(`${markdownDir}/note assets/img file.png`)}`,
    );
  });
});

describe("rewriteHtmlImageSources", () => {
  const mapSrc = (src: string) => toLocalImageSrc(src, markdownDir);

  test("rewrites the centered HTML img blocks used by the Refactoring UI translation", () => {
    const html =
      '<p align="center"><img src="Refactoring_UI_assets/page_007_1.jpeg" alt="Start with a feature, not a layout p.7" style="max-width:100%;border-radius:6px;"></p>';
    const rewritten = rewriteHtmlImageSources(html, mapSrc);
    expect(rewritten).toContain(
      `src="asset://localhost/${encodeURIComponent(`${markdownDir}/Refactoring_UI_assets/page_007_1.jpeg`)}"`,
    );
    expect(rewritten).toContain('data-md-src="Refactoring_UI_assets/page_007_1.jpeg"');
    expect(rewritten).toContain('alt="Start with a feature, not a layout p.7"');
  });

  test("rewrites a later figure in the same document", () => {
    const html =
      '<p align="center"><img src="Refactoring_UI_assets/page_010_1.jpeg" alt="Detail comes later p.10" style="max-width:100%;border-radius:6px;"></p>';
    const rewritten = rewriteHtmlImageSources(html, mapSrc);
    expect(rewritten).toContain("page_010_1.jpeg");
    expect(rewritten).toContain("asset://localhost/");
    expect(rewritten).not.toMatch(/\ssrc="Refactoring_UI_assets\/page_010_1\.jpeg"/);
  });

  test("leaves remote img src unchanged", () => {
    const html = '<img src="https://cdn.example.com/a.png" alt="remote">';
    expect(rewriteHtmlImageSources(html, mapSrc)).toContain('src="https://cdn.example.com/a.png"');
  });
});
