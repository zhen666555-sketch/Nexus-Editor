import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick, onMounted } from "vue";
import { describe, expect, it } from "vitest";
import { Editor, useEditor } from "../src/index";
import type { EditorAPI } from "@floatboat/nexus-core";

describe("@floatboat/nexus-vue", () => {
  it("renders an editor into the provided container through the Editor component", async () => {
    const wrapper = mount(Editor, {
      props: {
        initialValue: "# Hello"
      }
    });

    await nextTick();

    expect(wrapper.element.querySelector(".cm-editor")).not.toBeNull();
    expect(wrapper.element.querySelector("[contenteditable='true']")).not.toBeNull();

    wrapper.unmount();

    expect(wrapper.element.querySelector(".cm-editor")).toBeNull();
  });

  it("exposes the core editor api through useEditor", async () => {
    const snapshots: string[] = [];

    const Harness = defineComponent({
      setup() {
        const { containerRef, editor } = useEditor({ initialValue: "start" });

        onMounted(() => {
          editor.value?.setDocument("updated");
          if (editor.value) {
            snapshots.push(editor.value.getDocument());
          }
        });

        return () => h("div", { ref: containerRef });
      }
    });

    mount(Harness);

    await nextTick();

    expect(snapshots).toContain("updated");
  });

  it("invokes onReady callback with the editor instance after creation", async () => {
    let readyEditor: EditorAPI | null = null;

    const Harness = defineComponent({
      setup() {
        const { containerRef } = useEditor({
          initialValue: "hello",
          onReady(editor) {
            readyEditor = editor;
          },
        });

        return () => h("div", { ref: containerRef });
      }
    });

    mount(Harness);
    await nextTick();

    // onReady 应在编辑器创建后被调用，且传入有效的 EditorAPI 实例
    expect(readyEditor).not.toBeNull();
    expect(readyEditor!.getDocument()).toBe("hello");
  });

  it("does not pass onReady to core createEditor config", async () => {
    let capturedDoc: string | null = null;

    const Harness = defineComponent({
      setup() {
        const { containerRef } = useEditor({
          initialValue: "test",
          onReady(editor) {
            capturedDoc = editor.getDocument();
          },
        });

        return () => h("div", { ref: containerRef });
      }
    });

    mount(Harness);
    await nextTick();

    // 确保 onReady 不会泄漏到 core 的 EditorConfig 中
    expect(capturedDoc).toBe("test");
  });
});
