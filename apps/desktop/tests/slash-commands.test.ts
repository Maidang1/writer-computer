import { describe, expect, test } from "vite-plus/test";
import type { EditorCommand } from "../src/components/editor-area/editor-commands";
import {
  createSlashCommandItems,
  getSlashCommandPosition,
  matchSlashCommandTriggerText,
  searchSlashCommandItems,
} from "../src/components/editor-area/slash-commands";

describe("slash commands", () => {
  test("builds and sorts slash items by priority", () => {
    const items = createSlashCommandItems([
      command("document.save", "Save", 99, []),
      command("insertTable", "Table", 50, ["slash"]),
      command("ai.polishDocument", "Polish document", 80, ["slash"]),
    ]);

    expect(items.map((item) => item.id)).toEqual(["ai.polishDocument", "insertTable"]);
  });

  test("searches label, group, keywords, and command id", () => {
    const items = createSlashCommandItems([
      command("format.heading2", "Heading 2", 80, ["slash"], ["subtitle"]),
      command("insertTable", "Table", 70, ["slash"], ["grid"]),
      command("ai.rewriteSelection", "Rewrite selection", 90, ["slash"], ["polish"]),
    ]);

    expect(searchSlashCommandItems(items, "head").map((item) => item.id)).toEqual([
      "format.heading2",
    ]);
    expect(searchSlashCommandItems(items, "grid").map((item) => item.id)).toEqual(["insertTable"]);
    expect(searchSlashCommandItems(items, "rewrite").map((item) => item.id)).toEqual([
      "ai.rewriteSelection",
    ]);
  });

  test("matches slash triggers at line start and after whitespace", () => {
    expect(matchSlashCommandTriggerText("/")).toEqual({
      query: "",
      slashOffset: 0,
      atLineStart: true,
    });
    expect(matchSlashCommandTriggerText("  /table")).toEqual({
      query: "table",
      slashOffset: 2,
      atLineStart: true,
    });
    expect(matchSlashCommandTriggerText("hello /ai")).toEqual({
      query: "ai",
      slashOffset: 6,
      atLineStart: false,
    });
    expect(matchSlashCommandTriggerText("a/b")).toBeNull();
    expect(matchSlashCommandTriggerText("/two words")).toBeNull();
  });

  test("keeps the menu inside the viewport", () => {
    expect(
      getSlashCommandPosition(
        { left: 760, top: 560, bottom: 580 },
        { width: 280, height: 340 },
        { width: 800, height: 600 },
      ),
    ).toEqual({
      x: 512,
      y: 212,
    });
  });
});

function command(
  id: string,
  label: string,
  priority: number,
  surfaces: Array<"context" | "slash">,
  keywords: string[] = [],
): EditorCommand {
  return {
    id,
    label,
    group: id.startsWith("ai.") ? "AI" : "Insert",
    description: label,
    keywords,
    priority,
    surfaces,
    run: () => {},
  };
}
