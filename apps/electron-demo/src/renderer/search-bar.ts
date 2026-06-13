import type { EditorAPI } from "@floatboat/nexus-core";
import { findSearchMatches, replaceAllMatches } from "@floatboat/nexus-plugin-search";

/**
 * 搜索栏国际化标签接口
 * @property find - 查找输入框占位文本
 * @property replace - 替换输入框占位文本
 * @property previousMatch - 上一个匹配按钮提示
 * @property nextMatch - 下一个匹配按钮提示
 * @property replaceBtn - 替换按钮文本
 * @property replaceAllBtn - 全部替换按钮文本
 * @property replaceAllTitle - 全部替换按钮提示
 * @property close - 关闭按钮提示
 * @property noResults - 无匹配结果文本
 */
interface SearchBarLabels {
  find: string;
  replace: string;
  previousMatch: string;
  nextMatch: string;
  replaceBtn: string;
  replaceAllBtn: string;
  replaceAllTitle: string;
  close: string;
  noResults: string;
}

/** 英文标签预设 */
const SEARCH_LABELS_EN: SearchBarLabels = {
  find: "Find...",
  replace: "Replace...",
  previousMatch: "Previous match",
  nextMatch: "Next match",
  replaceBtn: "Replace",
  replaceAllBtn: "All",
  replaceAllTitle: "Replace all",
  close: "Close (Esc)",
  noResults: "0 results",
};

/** 中文标签预设 */
const SEARCH_LABELS_ZH: SearchBarLabels = {
  find: "查找...",
  replace: "替换...",
  previousMatch: "上一个匹配",
  nextMatch: "下一个匹配",
  replaceBtn: "替换",
  replaceAllBtn: "全部",
  replaceAllTitle: "全部替换",
  close: "关闭 (Esc)",
  noResults: "0 个结果",
};

/**
 * 根据语言代码获取对应的搜索栏标签
 * @param lang - 语言代码，如 "zh"、"en"，默认返回英文
 * @returns 对应语言的 SearchBarLabels 对象
 */
function getSearchLabels(lang: string): SearchBarLabels {
  return lang === "zh" ? SEARCH_LABELS_ZH : SEARCH_LABELS_EN;
}

export interface SearchBar {
  element: HTMLElement;
  open(): void;
  close(): void;
  isOpen(): boolean;
  destroy(): void;
}

const BAR_STYLES = `
  display: none;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--nexus-bg-subtle, #f6f8fa);
  border-bottom: 1px solid var(--nexus-border, #eee);
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 13px;
  flex-shrink: 0;
`;

const INPUT_STYLES = `
  padding: 4px 8px;
  border: 1px solid var(--nexus-border, #ddd);
  border-radius: 4px;
  font-size: 13px;
  font-family: inherit;
  background: var(--nexus-bg, #fff);
  color: var(--nexus-text, #24292e);
  outline: none;
  width: 200px;
`;

const BTN_STYLES = `
  padding: 4px 10px;
  border: 1px solid var(--nexus-border, #ddd);
  border-radius: 4px;
  background: var(--nexus-bg, #fff);
  color: var(--nexus-text, #24292e);
  cursor: pointer;
  font-size: 12px;
  font-family: inherit;
  transition: background 0.1s;
`;

const COUNT_STYLES = `
  color: var(--nexus-text-muted, #888);
  font-size: 12px;
  min-width: 60px;
`;

const CLOSE_BTN_STYLES = `
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: var(--nexus-text-muted, #888);
  padding: 2px 6px;
  border-radius: 4px;
  line-height: 1;
`;

/**
 * 创建搜索栏组件，支持查找、替换、导航匹配项等功能
 * @param editor - 编辑器 API 实例，用于操作文档和选区
 * @param lang - 界面语言代码，默认 "en"（英文），支持 "zh"（中文）
 * @returns SearchBar 对象，包含 DOM 元素及 open/close/isOpen/destroy 方法
 */
export function createSearchBar(editor: EditorAPI, lang: string = "en"): SearchBar {
  const l = getSearchLabels(lang);
  const bar = document.createElement("div");
  bar.className = "nexus-search-bar";
  bar.style.cssText = BAR_STYLES;

  // Find input
  const findInput = document.createElement("input");
  findInput.type = "text";
  findInput.placeholder = l.find;
  findInput.style.cssText = INPUT_STYLES;

  // Replace input
  const replaceInput = document.createElement("input");
  replaceInput.type = "text";
  replaceInput.placeholder = l.replace;
  replaceInput.style.cssText = INPUT_STYLES;
  replaceInput.style.width = "160px";

  // Buttons
  const prevBtn = document.createElement("button");
  prevBtn.textContent = "\u2191"; // ↑
  prevBtn.title = l.previousMatch;
  prevBtn.style.cssText = BTN_STYLES;

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "\u2193"; // ↓
  nextBtn.title = l.nextMatch;
  nextBtn.style.cssText = BTN_STYLES;

  const replaceBtn = document.createElement("button");
  replaceBtn.textContent = l.replaceBtn;
  replaceBtn.style.cssText = BTN_STYLES;

  const replaceAllBtn = document.createElement("button");
  replaceAllBtn.textContent = l.replaceAllBtn;
  replaceAllBtn.title = l.replaceAllTitle;
  replaceAllBtn.style.cssText = BTN_STYLES;

  // Count label
  const countLabel = document.createElement("span");
  countLabel.style.cssText = COUNT_STYLES;

  // Close
  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "&times;";
  closeBtn.title = l.close;
  closeBtn.style.cssText = CLOSE_BTN_STYLES;

  const spacer = document.createElement("div");
  spacer.style.flex = "1";

  bar.append(findInput, prevBtn, nextBtn, countLabel, replaceInput, replaceBtn, replaceAllBtn, spacer, closeBtn);

  // State
  let matches: Array<{ from: number; to: number }> = [];
  let currentIdx = -1;
  let visible = false;

  function updateMatches() {
    const query = findInput.value;
    if (!query) {
      matches = [];
      currentIdx = -1;
      countLabel.textContent = "";
      return;
    }
    const doc = editor.getDocument();
    matches = findSearchMatches(doc, query);
    if (matches.length === 0) {
      currentIdx = -1;
      countLabel.textContent = l.noResults;
    } else {
      // Find nearest match to current cursor
      const { anchor } = editor.getSelection();
      currentIdx = 0;
      for (let i = 0; i < matches.length; i++) {
        if (matches[i].from >= anchor) { currentIdx = i; break; }
      }
      highlightCurrent();
    }
  }

  function highlightCurrent() {
    if (currentIdx < 0 || currentIdx >= matches.length) return;
    const m = matches[currentIdx];
    editor.setSelection(m.from, m.to);
    editor.focus();
    countLabel.textContent = `${currentIdx + 1} / ${matches.length}`;
  }

  function goNext() {
    if (matches.length === 0) return;
    currentIdx = (currentIdx + 1) % matches.length;
    highlightCurrent();
  }

  function goPrev() {
    if (matches.length === 0) return;
    currentIdx = (currentIdx - 1 + matches.length) % matches.length;
    highlightCurrent();
  }

  function doReplace() {
    if (currentIdx < 0 || currentIdx >= matches.length) return;
    const m = matches[currentIdx];
    const doc = editor.getDocument();
    const newDoc = doc.slice(0, m.from) + replaceInput.value + doc.slice(m.to);
    editor.setDocument(newDoc);
    editor.setSelection(m.from + replaceInput.value.length);
    updateMatches();
  }

  function doReplaceAll() {
    const query = findInput.value;
    if (!query) return;
    const doc = editor.getDocument();
    const newDoc = replaceAllMatches(doc, query, replaceInput.value);
    editor.setDocument(newDoc);
    updateMatches();
  }

  // Event handlers
  findInput.addEventListener("input", updateMatches);
  findInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.shiftKey ? goPrev() : goNext(); e.preventDefault(); }
    if (e.key === "Escape") { close(); }
  });
  replaceInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { doReplace(); e.preventDefault(); }
    if (e.key === "Escape") { close(); }
  });
  nextBtn.addEventListener("click", goNext);
  prevBtn.addEventListener("click", goPrev);
  replaceBtn.addEventListener("click", doReplace);
  replaceAllBtn.addEventListener("click", doReplaceAll);
  closeBtn.addEventListener("click", close);

  function open() {
    if (visible) { findInput.focus(); findInput.select(); return; }
    visible = true;
    bar.style.display = "flex";
    findInput.focus();
    // Pre-fill with selected text
    const { anchor, head } = editor.getSelection();
    if (anchor !== head) {
      const doc = editor.getDocument();
      const from = Math.min(anchor, head);
      const to = Math.max(anchor, head);
      const sel = doc.slice(from, to);
      if (sel.length < 100 && !sel.includes("\n")) {
        findInput.value = sel;
        updateMatches();
      }
    }
    findInput.select();
  }

  function close() {
    visible = false;
    bar.style.display = "none";
    matches = [];
    currentIdx = -1;
    countLabel.textContent = "";
    editor.focus();
  }

  return {
    element: bar,
    open,
    close,
    isOpen: () => visible,
    destroy() {
      close();
      bar.remove();
    },
  };
}
