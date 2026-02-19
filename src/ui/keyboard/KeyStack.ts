export type KeyStackHandler = (event: KeyboardEvent) => void;

const MOD_ORDER_MAP = {
  Ctrl: 0,
  Shift: 1,
  Alt: 2,
  Meta: 3,
} as const;

const MOD_ALIASES: Record<string, keyof typeof MOD_ORDER_MAP> = {
  ctrl: "Ctrl",
  control: "Ctrl",
  ctl: "Ctrl",
  shift: "Shift",
  alt: "Alt",
  option: "Alt",
  meta: "Meta",
  cmd: "Meta",
  command: "Meta",
  win: "Meta",
};

const KEY_ALIASES: Record<string, string> = {
  esc: "Escape",
  escape: "Escape",
  space: "Space",
  spacebar: "Space",
  enter: "Enter",
  return: "Enter",
  tab: "Tab",
  backspace: "Backspace",
  del: "Delete",
  delete: "Delete",
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  ".": "Period",
  ",": "Comma",
  "[": "BracketLeft",
  "]": "BracketRight",
  "/": "Slash",
  "\\": "Backslash",
  "'": "Quote",
  ";": "Semicolon",
  "`": "Backquote",
  "-": "Minus",
  "=": "Equal",
};

function normalizeKeyPart(input: string): string {
  const raw = input.trim();
  if (!raw) return "";
  const lower = raw.toLowerCase();
  if (KEY_ALIASES[lower]) return KEY_ALIASES[lower];

  if (raw.startsWith("Key") || raw.startsWith("Digit") || raw.startsWith("Arrow")) {
    return raw;
  }

  if (raw.length === 1) {
    const char = raw.toUpperCase();
    if (char >= "A" && char <= "Z") {
      return `Key${char}`;
    }
    if (char >= "0" && char <= "9") {
      return `Digit${char}`;
    }
  }

  return raw;
}

function normalizeCombo(combo: string): string {
  const parts = combo
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);

  const mods = new Set<string>();
  let keyPart = "";

  for (const part of parts) {
    const lower = part.toLowerCase();
    const mod = MOD_ALIASES[lower];
    if (mod) {
      mods.add(mod);
    } else {
      keyPart = normalizeKeyPart(part);
    }
  }

  if (!keyPart) return "";

  const orderedMods = Array.from(mods).sort(
    (a, b) => MOD_ORDER_MAP[a as keyof typeof MOD_ORDER_MAP] - MOD_ORDER_MAP[b as keyof typeof MOD_ORDER_MAP],
  );

  return orderedMods.length ? `${orderedMods.join("+")}+${keyPart}` : keyPart;
}

function normalizeEvent(event: KeyboardEvent): string {
  const mods: string[] = [];
  if (event.ctrlKey) mods.push("Ctrl");
  if (event.shiftKey) mods.push("Shift");
  if (event.altKey) mods.push("Alt");
  if (event.metaKey) mods.push("Meta");

  const keyPart = normalizeKeyPart(event.code || event.key || "");
  if (!keyPart) return "";

  return mods.length ? `${mods.join("+")}+${keyPart}` : keyPart;
}

class KeyStack {
  private stacks = new Map<string, KeyStackHandler[]>();
  private listening = false;

  private onKeyDown = (event: KeyboardEvent) => {
    const combo = normalizeEvent(event);
    if (!combo) return;
    const stack = this.stacks.get(combo);
    if (!stack || stack.length === 0) return;
    const handler = stack[stack.length - 1];
    handler(event);
  };

  private ensureListening() {
    if (this.listening) return;
    document.addEventListener("keydown", this.onKeyDown, true);
    this.listening = true;
  }

  private cleanupListening() {
    if (!this.listening) return;
    if (this.stacks.size > 0) return;
    document.removeEventListener("keydown", this.onKeyDown, true);
    this.listening = false;
  }

  subscribe(combo: string, handler: KeyStackHandler): () => void {
    const normalized = normalizeCombo(combo);
    if (!normalized) return () => {};
    const stack = this.stacks.get(normalized) ?? [];
    stack.push(handler);
    this.stacks.set(normalized, stack);
    this.ensureListening();
    return () => this.unsubscribe(normalized, handler);
  }

  subscribeMany(combos: string[], handler: KeyStackHandler): () => void {
    const unsubs = combos.map((combo) => this.subscribe(combo, handler));
    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }

  unsubscribe(combo: string, handler: KeyStackHandler): void {
    const normalized = normalizeCombo(combo);
    const stack = this.stacks.get(normalized);
    if (!stack || stack.length === 0) return;
    for (let i = stack.length - 1; i >= 0; i -= 1) {
      if (stack[i] === handler) {
        stack.splice(i, 1);
        break;
      }
    }
    if (stack.length === 0) {
      this.stacks.delete(normalized);
    } else {
      this.stacks.set(normalized, stack);
    }
    this.cleanupListening();
  }

  unsubscript(combo: string, handler: KeyStackHandler): void {
    this.unsubscribe(combo, handler);
  }
}

export const keyStack = new KeyStack();
