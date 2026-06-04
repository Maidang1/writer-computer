import { useCallback, useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { LayoutGroup, motion } from "motion/react";
import { EditorArea } from "./editor-area";
import { SidebarNavigator } from "./sidebar/sidebar-navigator";
import { ScrollFade } from "@/components/scroll-fade";
import { useActiveFilePath, useOpenCompactFile, useOpenFiles } from "@/hooks/use-tabs";
import { getFileName } from "@/lib/paths";

const PICKER_POPUP_ID = "compact-file-picker-popup";
const PICKER_SURFACE_LAYOUT_ID = "compact-file-picker-surface";
const pickerTransition = { duration: 0.2, ease: "circOut" } as const;

export function CompactFileLayout() {
  const activeFilePath = useActiveFilePath();
  const openFiles = useOpenFiles();
  const openCompactFile = useOpenCompactFile();
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);
  const pickerRootRef = useRef<HTMLDivElement>(null);
  const activeFile = activeFilePath ? openFiles.get(activeFilePath) : null;
  const title = activeFilePath ? activeFile?.title || getFileName(activeFilePath) : "Choose file";

  const handleOpenFile = useCallback(
    async (path: string) => {
      await openCompactFile(path);
    },
    [openCompactFile],
  );

  useEffect(() => {
    if (!isNavigatorOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && pickerRootRef.current?.contains(target)) return;
      setIsNavigatorOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setIsNavigatorOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isNavigatorOpen]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-transparent text-text-primary">
      <div
        data-tauri-drag-region
        className="absolute inset-x-0 top-0 z-30"
        style={{ height: "var(--chrome-drag-height)" }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-50 flex justify-center"
        style={{
          height: "calc(var(--chrome-control-height) + var(--chrome-control-padding) * 2)",
          paddingBlock: "var(--chrome-control-padding)",
        }}
      >
        <LayoutGroup>
          <div
            ref={pickerRootRef}
            className="pointer-events-auto relative flex w-[min(360px,calc(100vw-40px))] justify-center"
          >
            <button
              type="button"
              aria-label="Open file navigator"
              aria-haspopup="dialog"
              aria-controls={isNavigatorOpen ? PICKER_POPUP_ID : undefined}
              aria-expanded={isNavigatorOpen}
              onClick={() => setIsNavigatorOpen((open) => !open)}
              className="group relative inline-flex h-[var(--chrome-control-height)] max-w-[240px] items-center justify-center gap-1.5 rounded-lg border border-transparent bg-transparent px-3 font-[inherit] text-[13px] text-[var(--fg-base)]"
            >
              {!isNavigatorOpen && (
                <motion.div
                  layoutId={PICKER_SURFACE_LAYOUT_ID}
                  transition={pickerTransition}
                  className="pointer-events-none absolute inset-0 rounded-lg bg-transparent transition-colors group-hover:bg-[var(--surface-input)]"
                />
              )}
              <span className="relative min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                {title}
              </span>
              <span
                aria-hidden="true"
                className={`relative shrink-0 text-[var(--text-icon-muted)] transition-transform duration-150 ease-out ${
                  isNavigatorOpen ? "rotate-180" : ""
                }`}
              >
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={16}
                  color="currentColor"
                  strokeWidth={2}
                />
              </span>
            </button>

            {isNavigatorOpen && (
              <div
                id={PICKER_POPUP_ID}
                role="dialog"
                aria-label="File navigator"
                className="absolute top-full z-50 mt-2 w-full rounded-xl outline-none"
              >
                <motion.div
                  aria-hidden="true"
                  layoutId={PICKER_SURFACE_LAYOUT_ID}
                  transition={pickerTransition}
                  className="surface-card pointer-events-none absolute inset-0 rounded-xl"
                />
                <div className="relative overflow-hidden rounded-xl">
                  <ScrollFade className="max-h-[min(70vh,560px)] overflow-y-auto px-2 py-3 scrollbar-none">
                    <SidebarNavigator
                      openFile={handleOpenFile}
                      enableContextMenus={false}
                      onOpenFileComplete={() => setIsNavigatorOpen(false)}
                      className="flex flex-col gap-4"
                    />
                  </ScrollFade>
                </div>
              </div>
            )}
          </div>
        </LayoutGroup>
      </div>

      <div className="relative h-full min-w-0 bg-bg">
        <EditorArea />
      </div>
    </div>
  );
}
