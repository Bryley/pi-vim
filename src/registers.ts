/**
 * Register system for yank/delete/paste.
 *
 * Registers:
 * - `"` (unnamed/default) - last delete or yank
 * - `0` - last yank only
 * - `1-9` - delete history (shifted on each delete)
 * - `a-z` - named registers
 * - `_` - black hole register (discards)
 */

export interface RegisterContent {
  text: string;
  linewise: boolean;
}

const registers: Map<string, RegisterContent> = new Map();

/**
 * Get the content of a register.
 */
export function getRegister(name: string): RegisterContent | undefined {
  return registers.get(name);
}

/**
 * Store text into a register after a yank operation.
 * Updates the unnamed register `"` and the `0` register.
 */
export function yankToRegister(
  name: string,
  text: string,
  linewise: boolean,
): void {
  if (name === "_") return; // black hole

  const content: RegisterContent = { text, linewise };

  if (name === '"') {
    // Unnamed register: also update register 0
    registers.set('"', content);
    registers.set("0", content);
  } else {
    // Named register
    registers.set(name, content);
    registers.set('"', content);
  }
}

/**
 * Store text into a register after a delete/change operation.
 * Updates the unnamed register `"` and shifts the numbered registers 1-9.
 */
export function deleteToRegister(
  name: string,
  text: string,
  linewise: boolean,
): void {
  if (name === "_") return; // black hole

  const content: RegisterContent = { text, linewise };

  if (name === '"') {
    // Shift numbered registers 9 <- 8 <- ... <- 2 <- 1
    for (let i = 9; i >= 2; i--) {
      const prev = registers.get(String(i - 1));
      if (prev) {
        registers.set(String(i), prev);
      }
    }
    registers.set("1", content);
    registers.set('"', content);
  } else {
    // Named register
    registers.set(name, content);
    registers.set('"', content);
  }
}
