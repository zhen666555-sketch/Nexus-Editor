import { createEditor } from "@floatboat/nexus-core";
import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";

import type { UseEditorConfig, UseEditorResult } from "./types";

export function useEditor(config: UseEditorConfig): UseEditorResult {
  const containerRef = ref<HTMLDivElement | null>(null);
  const editor = shallowRef<ReturnType<typeof createEditor> | null>(null);

  const { onReady, ...editorConfig } = config;

  onMounted(() => {
    if (!containerRef.value || editor.value) {
      return;
    }

    const instance = createEditor({
      container: containerRef.value,
      ...editorConfig
    });

    editor.value = instance;

    if (onReady) {
      onReady(instance);
    }
  });

  onBeforeUnmount(() => {
    editor.value?.destroy();
    editor.value = null;
  });

  return {
    containerRef,
    editor
  };
}
