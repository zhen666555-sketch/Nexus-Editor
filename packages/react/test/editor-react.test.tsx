import { render } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { Editor, useEditor } from "../src/index";
import type { EditorAPI } from "@floatboat/nexus-core";

describe("@floatboat/nexus-react", () => {
  it("renders an editor into the provided container through the Editor component", () => {
    const { container, unmount } = render(<Editor initialValue="# Hello" />);

    expect(container.querySelector(".cm-editor")).not.toBeNull();
    expect(container.querySelector("[contenteditable='true']")).not.toBeNull();

    unmount();

    expect(container.querySelector(".cm-editor")).toBeNull();
  });

  it("exposes the core editor api through useEditor", () => {
    const snapshots: string[] = [];

    function Harness() {
      const { containerRef, editor } = useEditor({ initialValue: "start" });

      useEffect(() => {
        if (!editor) {
          return;
        }

        editor.setDocument("updated");
        snapshots.push(editor.getDocument());
      }, [editor]);

      return <div ref={containerRef} />;
    }

    render(<Harness />);

    expect(snapshots).toContain("updated");
  });

  it("invokes onReady callback with the editor instance after creation", () => {
    let readyEditor: EditorAPI | null = null;

    function Harness() {
      const { containerRef } = useEditor({
        initialValue: "hello",
        onReady(editor) {
          readyEditor = editor;
        },
      });

      return <div ref={containerRef} />;
    }

    render(<Harness />);

    // onReady 应在编辑器创建后被调用，且传入有效的 EditorAPI 实例
    expect(readyEditor).not.toBeNull();
    expect(readyEditor!.getDocument()).toBe("hello");
  });

  it("does not pass onReady to core createEditor config", () => {
    // 确保 onReady 不会泄漏到 core 的 EditorConfig 中
    let capturedDoc: string | null = null;

    function Harness() {
      const { containerRef } = useEditor({
        initialValue: "test",
        onReady(editor) {
          capturedDoc = editor.getDocument();
        },
      });

      return <div ref={containerRef} />;
    }

    render(<Harness />);

    expect(capturedDoc).toBe("test");
  });
});
