/** 仓库面板国际化标签接口，定义所有可翻译的 UI 文本 */
interface VaultPanelLabels {
  /** 面板标题 */
  title: string;
  /** 打开仓库按钮提示 */
  openVault: string;
  /** 根目录新建文件按钮提示 */
  newFile: string;
  /** 根目录新建文件夹按钮提示 */
  newFolder: string;
  /** 未打开仓库时的空状态提示 */
  noVaultOpened: string;
  /** 仓库为空时的提示 */
  vaultEmpty: string;
  /** 右键菜单：在此新建文件 */
  newFileHere: string;
  /** 右键菜单：在此新建文件夹 */
  newFolderHere: string;
  /** 右键菜单：打开文件 */
  open: string;
  /** 右键菜单：在相同文件夹新建文件 */
  newFileInSameFolder: string;
  /** 右键菜单：重命名 */
  rename: string;
  /** 右键菜单：删除 */
  delete: string;
  /** 移至回收站状态消息，{name} 为占位符 */
  movedToTrash: string;
  /** 新建文件默认名称 */
  untitledMd: string;
  /** 新建文件夹默认名称 */
  newFolderDefault: string;
}

/** 英文标签预设 */
const VAULT_LABELS_EN: VaultPanelLabels = {
  title: "Vault",
  openVault: "Open vault\u2026",
  newFile: "New file at root",
  newFolder: "New folder at root",
  noVaultOpened: "No vault opened. Click \uD83D\uDCC1 to choose a folder.",
  vaultEmpty: "Vault is empty. Click + to create a note.",
  newFileHere: "New file here",
  newFolderHere: "New folder here",
  open: "Open",
  newFileInSameFolder: "New file in same folder",
  rename: "Rename",
  delete: "Delete",
  movedToTrash: "Moved {name} to Trash",
  untitledMd: "untitled.md",
  newFolderDefault: "new-folder",
};

/** 中文标签预设 */
const VAULT_LABELS_ZH: VaultPanelLabels = {
  title: "仓库",
  openVault: "打开仓库\u2026",
  newFile: "在根目录新建文件",
  newFolder: "在根目录新建文件夹",
  noVaultOpened: "未打开仓库。点击 \uD83D\uDCC1 选择文件夹。",
  vaultEmpty: "仓库为空。点击 + 创建笔记。",
  newFileHere: "在此新建文件",
  newFolderHere: "在此新建文件夹",
  open: "打开",
  newFileInSameFolder: "在相同文件夹新建文件",
  rename: "重命名",
  delete: "删除",
  movedToTrash: "已将 {name} 移至回收站",
  untitledMd: "未命名.md",
  newFolderDefault: "新建文件夹",
};

/**
 * 根据语言代码获取对应的仓库面板标签
 * @param lang - 语言代码，如 "zh" 或 "en"
 * @returns 对应语言的 VaultPanelLabels 对象
 */
function getVaultLabels(lang: string): VaultPanelLabels {
  return lang === "zh" ? VAULT_LABELS_ZH : VAULT_LABELS_EN;
}

export interface VaultPanelCallbacks {
  onOpenFile(filePath: string): void;
  onError(message: string): void;
  onStatus(message: string): void;
}

export interface VaultPanel {
  element: HTMLElement;
  openVault(vaultPath: string): Promise<void>;
  promptPickVault(): Promise<void>;
  refresh(): Promise<void>;
  setActiveFile(filePath: string | null): void;
  getVaultPath(): string | null;
  destroy(): void;
}

const PANEL_STYLES = `
  width: 240px;
  flex-shrink: 0;
  border-right: 1px solid var(--nexus-border, #eee);
  background: var(--nexus-bg, #fff);
  overflow: hidden;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 13px;
  display: flex;
  flex-direction: column;
`;

const HEADER_STYLES = `
  padding: 8px 10px;
  border-bottom: 1px solid var(--nexus-border, #eee);
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

const HEADER_TITLE_STYLES = `
  flex: 1;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--nexus-text-muted, #888);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const ICON_BTN_STYLES = `
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 3px 7px;
  font-size: 14px;
  line-height: 1;
  color: var(--nexus-text-muted, #555);
  border-radius: 3px;
  transition: background 0.12s;
`;

function attachIconBtnFeedback(btn: HTMLButtonElement): void {
  btn.addEventListener("mouseenter", () => {
    if (!btn.disabled) btn.style.background = "var(--nexus-bg-muted, #eef)";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.background = "transparent";
  });
}

const TREE_STYLES = `
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 0;
`;

const EMPTY_STYLES = `
  padding: 16px 12px;
  color: var(--nexus-text-faint, #bbb);
  font-size: 12px;
  font-style: italic;
  text-align: center;
`;

const ITEM_BASE = `
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  padding: 3px 8px;
  color: var(--nexus-text, #24292e);
  font-size: 13px;
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: inherit;
  user-select: none;
`;

const ACTIVE_STYLES = `
  background: var(--nexus-bg-active, #e7f0ff);
  color: var(--nexus-text, #0366d6);
`;

interface ContextMenuItem {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

function showContextMenu(x: number, y: number, items: ContextMenuItem[]): void {
  document.querySelectorAll(".nexus-vault-ctxmenu").forEach((el) => el.remove());

  const menu = document.createElement("div");
  menu.className = "nexus-vault-ctxmenu";
  menu.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    background: var(--nexus-bg, #fff);
    border: 1px solid var(--nexus-border, #ddd);
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    padding: 4px 0;
    z-index: 10000;
    min-width: 160px;
    font-size: 13px;
  `;

  for (const item of items) {
    const btn = document.createElement("button");
    btn.textContent = item.label;
    btn.style.cssText = `
      display: block;
      width: 100%;
      border: none;
      background: transparent;
      padding: 6px 12px;
      cursor: pointer;
      text-align: left;
      color: ${item.destructive ? "#d73a49" : "inherit"};
      font-size: 13px;
      font-family: inherit;
    `;
    btn.addEventListener("mouseenter", () => {
      btn.style.background = "var(--nexus-bg-muted, #f0f0f0)";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.background = "transparent";
    });
    btn.addEventListener("click", () => {
      menu.remove();
      item.onClick();
    });
    menu.appendChild(btn);
  }

  document.body.appendChild(menu);

  setTimeout(() => {
    const close = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        menu.remove();
        document.removeEventListener("mousedown", close);
      }
    };
    document.addEventListener("mousedown", close);
  }, 0);
}

function folderIcon(open: boolean): string {
  return open ? "\u25BE" : "\u25B8"; // ▾ / ▸
}

function fileIcon(): string {
  return "\u00B7"; // middle dot
}

/**
 * 创建仓库面板组件
 * @param callbacks - 回调接口，包含文件打开、错误和状态消息的处理函数
 * @param lang - 语言代码，默认 "en"，支持 "zh" 中文
 * @returns VaultPanel 对象，包含面板元素和相关操作方法
 */
export function createVaultPanel(callbacks: VaultPanelCallbacks, lang: string = "en"): VaultPanel {
  /** 获取当前语言的标签集 */
  const l = getVaultLabels(lang);

  const panel = document.createElement("div");
  panel.className = "nexus-vault-panel";
  panel.style.cssText = PANEL_STYLES;

  const header = document.createElement("div");
  header.style.cssText = HEADER_STYLES;

  const title = document.createElement("div");
  title.style.cssText = HEADER_TITLE_STYLES;
  title.textContent = l.title;

  const openBtn = document.createElement("button");
  openBtn.type = "button";
  openBtn.style.cssText = ICON_BTN_STYLES;
  openBtn.textContent = "\uD83D\uDCC1"; // 📁
  openBtn.title = l.openVault;

  const newFileBtn = document.createElement("button");
  newFileBtn.type = "button";
  newFileBtn.style.cssText = ICON_BTN_STYLES;
  newFileBtn.textContent = "\u002B"; // +
  newFileBtn.title = l.newFile;
  newFileBtn.disabled = true;

  const newFolderBtn = document.createElement("button");
  newFolderBtn.type = "button";
  newFolderBtn.style.cssText = ICON_BTN_STYLES;
  newFolderBtn.textContent = "\uD83D\uDCC2"; // 📂
  newFolderBtn.title = l.newFolder;
  newFolderBtn.disabled = true;

  header.append(title, newFileBtn, newFolderBtn, openBtn);
  attachIconBtnFeedback(openBtn);
  attachIconBtnFeedback(newFileBtn);
  attachIconBtnFeedback(newFolderBtn);

  function syncButtonEnabled(): void {
    const hasVault = vaultPath !== null;
    newFileBtn.disabled = !hasVault;
    newFolderBtn.disabled = !hasVault;
    newFileBtn.style.opacity = hasVault ? "1" : "0.4";
    newFolderBtn.style.opacity = hasVault ? "1" : "0.4";
    newFileBtn.style.cursor = hasVault ? "pointer" : "not-allowed";
    newFolderBtn.style.cursor = hasVault ? "pointer" : "not-allowed";
  }

  const tree = document.createElement("div");
  tree.style.cssText = TREE_STYLES;

  panel.append(header, tree);

  let vaultPath: string | null = null;
  let currentTree: VaultNode[] = [];
  let activeFile: string | null = null;
  const collapsed = new Set<string>();
  let unsubscribeChanged: (() => void) | null = null;

  function renderEmpty(message: string): void {
    tree.innerHTML = "";
    const empty = document.createElement("div");
    empty.style.cssText = EMPTY_STYLES;
    empty.textContent = message;
    tree.appendChild(empty);
  }

  function renderNode(node: VaultNode, depth: number, parent: HTMLElement): void {
    const row = document.createElement("div");
    row.style.cssText = ITEM_BASE;
    row.style.paddingLeft = `${8 + depth * 14}px`;
    row.dataset.path = node.path;
    row.dataset.kind = node.kind;

    const isActive = node.kind === "file" && activeFile === node.path;
    if (isActive) row.style.cssText = ITEM_BASE + ACTIVE_STYLES;

    const icon = document.createElement("span");
    icon.style.cssText = "width: 12px; flex-shrink: 0; color: #888; font-size: 11px;";
    if (node.kind === "directory") {
      const open = !collapsed.has(node.path);
      icon.textContent = folderIcon(open);
    } else {
      icon.textContent = fileIcon();
    }

    const label = document.createElement("span");
    label.textContent = node.name;
    label.style.cssText = "flex: 1; overflow: hidden; text-overflow: ellipsis;";

    row.append(icon, label);
    parent.appendChild(row);

    row.addEventListener("mouseenter", () => {
      if (!isActive) row.style.background = "var(--nexus-bg-muted, #f4f4f4)";
    });
    row.addEventListener("mouseleave", () => {
      if (!isActive) row.style.background = "transparent";
    });

    row.addEventListener("click", () => {
      if (node.kind === "directory") {
        if (collapsed.has(node.path)) collapsed.delete(node.path);
        else collapsed.add(node.path);
        renderTree();
      } else {
        callbacks.onOpenFile(node.path);
      }
    });

    row.addEventListener("dblclick", (e) => {
      if (node.kind !== "file") return;
      e.stopPropagation();
      beginInlineRename(row, label, node);
    });

    row.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openNodeContextMenu(e.clientX, e.clientY, node);
    });

    if (node.kind === "directory" && !collapsed.has(node.path) && node.children) {
      for (const child of node.children) {
        renderNode(child, depth + 1, parent);
      }
    }
  }

  function renderTree(): void {
    tree.innerHTML = "";
    if (!vaultPath) {
      renderEmpty(l.noVaultOpened);
      return;
    }
    if (currentTree.length === 0) {
      renderEmpty(l.vaultEmpty);
      return;
    }
    for (const node of currentTree) renderNode(node, 0, tree);
  }

  function beginInlineRename(row: HTMLElement, label: HTMLElement, node: VaultNode): void {
    const input = document.createElement("input");
    input.type = "text";
    input.value = node.name;
    input.style.cssText = `
      flex: 1;
      border: 1px solid var(--nexus-accent, #0366d6);
      padding: 1px 4px;
      font-size: 13px;
      font-family: inherit;
      background: var(--nexus-bg, #fff);
      color: inherit;
    `;
    label.replaceWith(input);
    input.focus();

    const dot = node.name.lastIndexOf(".");
    if (node.kind === "file" && dot > 0) input.setSelectionRange(0, dot);
    else input.select();

    let finished = false;
    const finish = async (commit: boolean) => {
      if (finished) return;
      finished = true;
      const newName = input.value.trim();
      if (!commit || !newName || newName === node.name) {
        input.replaceWith(label);
        return;
      }
      try {
        await window.nexusDemo.vault.rename(node.path, newName);
        await refresh();
      } catch (err) {
        callbacks.onError(err instanceof Error ? err.message : String(err));
        input.replaceWith(label);
      }
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        finish(true);
      } else if (e.key === "Escape") {
        e.preventDefault();
        finish(false);
      }
    });
    input.addEventListener("blur", () => finish(true));
  }

  function openNodeContextMenu(x: number, y: number, node: VaultNode): void {
    const parentDir = node.kind === "directory" ? node.path : node.path.replace(/[\\/][^\\/]+$/, "");
    const items: ContextMenuItem[] = [];

    if (node.kind === "directory") {
      items.push({
        label: l.newFileHere,
        onClick: () => createFilePrompt(node.path),
      });
      items.push({
        label: l.newFolderHere,
        onClick: () => createFolderPrompt(node.path),
      });
    } else {
      items.push({
        label: l.open,
        onClick: () => callbacks.onOpenFile(node.path),
      });
      items.push({
        label: l.newFileInSameFolder,
        onClick: () => createFilePrompt(parentDir),
      });
    }

    items.push({
      label: l.rename,
      onClick: () => {
        const row = tree.querySelector<HTMLElement>(`[data-path="${cssEscape(node.path)}"]`);
        const label = row?.querySelector<HTMLElement>("span:last-child");
        if (row && label) beginInlineRename(row, label, node);
      },
    });

    items.push({
      label: l.delete,
      destructive: true,
      onClick: () => deleteNode(node),
    });

    showContextMenu(x, y, items);
  }

  function inlineInputRow(opts: {
    defaultValue: string;
    selectExt: boolean;
    iconChar: string;
    onCommit: (value: string) => Promise<void>;
  }): void {
    const row = document.createElement("div");
    row.style.cssText = ITEM_BASE;
    row.style.paddingLeft = "8px";

    const icon = document.createElement("span");
    icon.style.cssText = "width: 12px; flex-shrink: 0; color: #888; font-size: 11px;";
    icon.textContent = opts.iconChar;

    const input = document.createElement("input");
    input.type = "text";
    input.value = opts.defaultValue;
    input.style.cssText = `
      flex: 1;
      border: 1px solid var(--nexus-accent, #0366d6);
      padding: 1px 4px;
      font-size: 13px;
      font-family: inherit;
      background: var(--nexus-bg, #fff);
      color: inherit;
    `;

    row.append(icon, input);
    tree.insertBefore(row, tree.firstChild);
    input.focus();

    const dot = opts.defaultValue.lastIndexOf(".");
    if (opts.selectExt && dot > 0) input.setSelectionRange(0, dot);
    else input.select();

    let finished = false;
    const finish = async (commit: boolean) => {
      if (finished) return;
      finished = true;
      const value = input.value.trim();
      row.remove();
      if (!commit || !value) return;
      try {
        await opts.onCommit(value);
      } catch (err) {
        callbacks.onError(err instanceof Error ? err.message : String(err));
      }
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void finish(true);
      } else if (e.key === "Escape") {
        e.preventDefault();
        void finish(false);
      }
    });
    input.addEventListener("blur", () => {
      void finish(true);
    });
  }

  function createFilePrompt(parentDir: string): void {
    inlineInputRow({
      defaultValue: l.untitledMd,
      selectExt: true,
      iconChar: fileIcon(),
      onCommit: async (name) => {
        const result = await window.nexusDemo.vault.createFile(parentDir, name);
        await refresh();
        callbacks.onOpenFile(result.path);
      },
    });
  }

  function createFolderPrompt(parentDir: string): void {
    inlineInputRow({
      defaultValue: l.newFolderDefault,
      selectExt: false,
      iconChar: folderIcon(true),
      onCommit: async (name) => {
        await window.nexusDemo.vault.createFolder(parentDir, name);
        await refresh();
      },
    });
  }

  async function deleteNode(node: VaultNode): Promise<void> {
    // In Electron window.confirm may be a no-op; the context menu entry is
    // destructive-styled and requires an explicit click, so we proceed directly.
    try {
      await window.nexusDemo.vault.delete(node.path);
      callbacks.onStatus(l.movedToTrash.replace("{name}", node.name));
      if (node.kind === "file" && activeFile === node.path) {
        activeFile = null;
      }
      await refresh();
    } catch (err) {
      callbacks.onError(err instanceof Error ? err.message : String(err));
    }
  }

  async function refresh(): Promise<void> {
    if (!vaultPath) return;
    try {
      currentTree = await window.nexusDemo.vault.list(vaultPath);
      renderTree();
    } catch (err) {
      callbacks.onError(err instanceof Error ? err.message : String(err));
    }
  }

  async function openVault(nextPath: string): Promise<void> {
    vaultPath = nextPath;
    title.textContent = nextPath.split(/[\\/]/).pop() || l.title;
    title.title = nextPath;
    syncButtonEnabled();
    collapsed.clear();

    if (unsubscribeChanged) unsubscribeChanged();
    unsubscribeChanged = window.nexusDemo.vault.onChanged(() => {
      void refresh();
    });

    await refresh();
    await window.nexusDemo.vault.setLast(nextPath);
  }

  async function promptPickVault(): Promise<void> {
    try {
      const picked = await window.nexusDemo.vault.pick();
      if (!picked) return;
      await openVault(picked.path);
    } catch (err) {
      callbacks.onError(err instanceof Error ? err.message : String(err));
    }
  }

  openBtn.addEventListener("click", () => {
    void promptPickVault();
  });
  newFileBtn.addEventListener("click", () => {
    if (vaultPath) createFilePrompt(vaultPath);
  });
  newFolderBtn.addEventListener("click", () => {
    if (vaultPath) createFolderPrompt(vaultPath);
  });

  syncButtonEnabled();

  return {
    element: panel,
    openVault,
    promptPickVault,
    refresh,
    setActiveFile(filePath) {
      activeFile = filePath;
      renderTree();
    },
    getVaultPath: () => vaultPath,
    destroy() {
      if (unsubscribeChanged) unsubscribeChanged();
      panel.remove();
    },
  };
}

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/([^a-zA-Z0-9_-])/g, "\\$1");
}
