import { EditorView, ViewPlugin } from "@codemirror/view";
import { imageSrcMapperFacet } from "@/lib/prosemark-core/fold/image";
import { isConvertedOrRemoteSrc, toLocalImageSrc } from "@/lib/local-media-src";
import { getParentDir } from "@/lib/paths";

export function resolveImgSrc(img: HTMLImageElement, markdownDir: string) {
  const rawSrc = img.getAttribute("data-md-src") || img.getAttribute("src");
  if (!rawSrc) return;
  const source = img.getAttribute("data-md-src") || rawSrc;
  if (!img.getAttribute("data-md-src") && isConvertedOrRemoteSrc(rawSrc)) return;
  const resolvedKey = `${markdownDir}\0${source}`;
  if (img.dataset.resolvedFor === resolvedKey) return;
  const next = toLocalImageSrc(source, markdownDir);
  if (!img.getAttribute("data-md-src")) img.setAttribute("data-md-src", source);
  img.dataset.resolvedFor = resolvedKey;
  if (img.getAttribute("src") !== next) img.src = next;
}

function mapperForPath(getActivePath: () => string | null) {
  return (src: string) => {
    const path = getActivePath();
    if (!path) return src;
    return toLocalImageSrc(src, getParentDir(path));
  };
}

export function imageSrcResolver(getActivePath: () => string | null) {
  return [
    imageSrcMapperFacet.of(mapperForPath(getActivePath)),
    ViewPlugin.fromClass(
      class {
        observer: MutationObserver;

        constructor(readonly view: EditorView) {
          const dir = this.getDir(getActivePath());
          if (dir) this.fixAll(view.dom, dir);

          this.observer = new MutationObserver((mutations) => {
            const d = this.getDir(getActivePath());
            if (!d) return;
            for (const m of mutations) {
              for (const node of m.addedNodes) {
                if (node instanceof HTMLImageElement) resolveImgSrc(node, d);
                else if (node instanceof HTMLElement) {
                  for (const img of node.querySelectorAll("img"))
                    resolveImgSrc(img as HTMLImageElement, d);
                }
              }
            }
          });
          this.observer.observe(view.dom, { childList: true, subtree: true });
        }

        update() {
          const dir = this.getDir(getActivePath());
          if (dir) this.fixAll(this.view.dom, dir);
        }

        getDir(path: string | null): string | null {
          return path ? getParentDir(path) : null;
        }

        fixAll(root: HTMLElement, dir: string) {
          for (const img of root.querySelectorAll("img"))
            resolveImgSrc(img as HTMLImageElement, dir);
        }

        destroy() {
          this.observer.disconnect();
        }
      },
    ),
  ];
}
