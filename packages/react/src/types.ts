import type {
  EditorAPI,
  EditorConfig
} from "@floatboat/nexus-core";
import type { RefObject } from "react";

export type UseEditorConfig = Omit<EditorConfig, "container"> & {
  /** 编辑器实例创建完成后触发，参数为 EditorAPI 实例。 */
  onReady?: (editor: EditorAPI) => void;
};

export interface UseEditorResult {
  containerRef: RefObject<HTMLDivElement | null>;
  editor: EditorAPI | null;
}
