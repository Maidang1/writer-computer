import { convertFileSrc } from "@tauri-apps/api/core";
import { resolveImagePath } from "./paths";

const REMOTE_OR_CONVERTED_SRC =
  /^(?:https?:|asset:|data:|blob:|tauri:|http:\/\/asset\.localhost|https:\/\/asset\.localhost)/i;

export function isConvertedOrRemoteSrc(src: string): boolean {
  return REMOTE_OR_CONVERTED_SRC.test(src);
}

export function toLocalImageSrc(imageSrc: string, markdownDir: string): string {
  const absolute = resolveImagePath(imageSrc, markdownDir);
  if (!absolute || isConvertedOrRemoteSrc(absolute)) return absolute || imageSrc;
  try {
    return convertFileSrc(absolute);
  } catch {
    return absolute;
  }
}

function escapeAttribute(value: string, quote: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(quote === '"' ? /"/g : /'/g, quote === '"' ? "&quot;" : "&#39;");
}

/** Rewrite `<img src>` in an HTML fragment so local files resolve before the node is inserted. */
export function rewriteHtmlImageSources(html: string, mapSrc: (src: string) => string): string {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const srcMatch = tag.match(/\ssrc\s*=\s*(["'])([^"']*)\1/i);
    if (!srcMatch) return tag;
    const [, quote, src] = srcMatch;
    const original = tag.match(/\sdata-md-src\s*=\s*(["'])([^"']*)\1/i)?.[2] ?? src;
    const next = mapSrc(original);
    if (next === src && tag.includes("data-md-src=")) return tag;
    let rewritten = tag.replace(
      /\ssrc\s*=\s*(["'])([^"']*)\1/i,
      ` src=${quote}${escapeAttribute(next, quote)}${quote}`,
    );
    if (!/\sdata-md-src\s*=/i.test(rewritten)) {
      rewritten = rewritten.replace(
        /^<img\b/i,
        `<img data-md-src=${quote}${escapeAttribute(original, quote)}${quote}`,
      );
    }
    return rewritten;
  });
}
