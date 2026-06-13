import { describe, expect, it } from "vitest";

import { createEditor, enLocale, zhLocale, resolveLocale } from "../src/index";
import { createGfmPreset } from "../../preset-gfm/src/index";

describe("internationalization", () => {
  it("resolveLocale returns English by default", () => {
    const locale = resolveLocale();
    expect(locale.addColumn).toBe("Add column");
    expect(locale.addRow).toBe("Add row");
    expect(locale.deleteColumn).toBe("Delete column");
  });

  it("resolveLocale merges partial overrides with English defaults", () => {
    const locale = resolveLocale({ addColumn: "Custom" });
    expect(locale.addColumn).toBe("Custom");
    expect(locale.addRow).toBe("Add row"); // Fallback to English
  });

  it("zhLocale provides all Chinese translations", () => {
    expect(zhLocale.addColumn).toBe("添加列");
    expect(zhLocale.addRow).toBe("添加行");
    expect(zhLocale.deleteColumn).toBe("删除列");
    expect(zhLocale.openLink).toBe("打开链接");
  });

  it("editor uses locale for table button labels", () => {
    const container = document.createElement("div");
    const editor = createEditor({
      container,
      initialValue: "| A | B |\n| --- | --- |\n| 1 | 2 |",
      livePreview: true,
      locale: zhLocale,
      plugins: [createGfmPreset()]
    });

    // The add-column button should have Chinese title
    const addColBtn = container.querySelector("button[title='添加列']");
    expect(addColBtn).not.toBeNull();
    editor.destroy();
  });

  it("enLocale has all required keys", () => {
    const keys: (keyof typeof enLocale)[] = [
      "addColumn", "addRow", "deleteColumn", "deleteRow",
      "insertColumnBefore", "insertColumnAfter",
      "insertRowAbove", "insertRowBelow",
      "alignLeft", "alignCenter", "alignRight",
      "foldCode", "unfoldCode", "foldHeading", "unfoldHeading",
      "openLink", "codeBlockLabel"
    ];
    for (const key of keys) {
      expect(typeof enLocale[key]).toBe("string");
      expect(enLocale[key].length).toBeGreaterThan(0);
    }
  });

  it("getLocale returns the initial locale", () => {
    const container = document.createElement("div");
    const editor = createEditor({
      container,
      initialValue: "hello",
      locale: zhLocale,
    });

    const locale = editor.getLocale();
    expect(locale.addColumn).toBe("添加列");
    editor.destroy();
  });

  it("getLocale returns English by default", () => {
    const container = document.createElement("div");
    const editor = createEditor({
      container,
      initialValue: "hello",
    });

    const locale = editor.getLocale();
    expect(locale.addColumn).toBe("Add column");
    editor.destroy();
  });

  it("setLocale switches locale at runtime", () => {
    const container = document.createElement("div");
    const editor = createEditor({
      container,
      initialValue: "hello",
    });

    // 初始为英文
    expect(editor.getLocale().addColumn).toBe("Add column");

    // 切换为中文
    editor.setLocale(zhLocale);
    expect(editor.getLocale().addColumn).toBe("添加列");

    // 切换回英文
    editor.setLocale(enLocale);
    expect(editor.getLocale().addColumn).toBe("Add column");

    editor.destroy();
  });

  it("setLocale emits localeChange event", () => {
    const container = document.createElement("div");
    const editor = createEditor({
      container,
      initialValue: "hello",
    });

    const received: import("../src/locale").NexusLocale[] = [];
    editor.on("localeChange", (locale) => {
      received.push(locale);
    });

    editor.setLocale(zhLocale);
    expect(received).toHaveLength(1);
    expect(received[0].addColumn).toBe("添加列");

    editor.destroy();
  });

  it("setLocale with partial override merges with English defaults", () => {
    const container = document.createElement("div");
    const editor = createEditor({
      container,
      initialValue: "hello",
    });

    editor.setLocale({ addColumn: "Custom" });
    const locale = editor.getLocale();
    expect(locale.addColumn).toBe("Custom");
    expect(locale.addRow).toBe("Add row"); // 英文默认值

    editor.destroy();
  });

  it("setLocale updates live-preview table labels", () => {
    const container = document.createElement("div");
    const editor = createEditor({
      container,
      initialValue: "| A | B |\n| --- | --- |\n| 1 | 2 |",
      livePreview: true,
      plugins: [createGfmPreset()]
    });

    // 初始为英文
    const enBtn = container.querySelector("button[title='Add column']");
    expect(enBtn).not.toBeNull();

    // 切换为中文后，live-preview 应重建并使用中文标签
    editor.setLocale(zhLocale);
    const zhBtn = container.querySelector("button[title='添加列']");
    expect(zhBtn).not.toBeNull();

    editor.destroy();
  });
});
