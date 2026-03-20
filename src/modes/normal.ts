/**
 * Normal mode handler.
 * Implements basic hjkl navigation, mode switching, and count prefixes.
 */

import type { VimState } from "../state.js";
import { resetOperatorState } from "../state.js";
import { isDigit, ESCAPE_SEQS } from "../keys.js";

export interface NormalModeContext {
  state: VimState;
  superHandleInput: (data: string) => void;
  getText: () => string;
  getCursor: () => { line: number; col: number };
  setText: (text: string) => void;
  moveCursorTo: (line: number, col: number) => void;
}

/**
 * Handle input in normal mode.
 * Returns true if the key was handled.
 */
export function handleNormalMode(data: string, ctx: NormalModeContext): boolean {
  const { state } = ctx;

  // Count prefix handling: 1-9 start a count, 0 continues if already started
  if (isDigit(data) && (data !== "0" || state.countStarted)) {
    state.count = state.count * 10 + parseInt(data, 10);
    state.countStarted = true;
    return true;
  }

  const count = state.count || 1;

  switch (data) {
    // --- Basic motions ---
    case "h":
      for (let i = 0; i < count; i++) ctx.superHandleInput(ESCAPE_SEQS.left);
      resetOperatorState(state);
      return true;

    case "j":
      for (let i = 0; i < count; i++) ctx.superHandleInput(ESCAPE_SEQS.down);
      resetOperatorState(state);
      return true;

    case "k":
      for (let i = 0; i < count; i++) ctx.superHandleInput(ESCAPE_SEQS.up);
      resetOperatorState(state);
      return true;

    case "l":
      for (let i = 0; i < count; i++) ctx.superHandleInput(ESCAPE_SEQS.right);
      resetOperatorState(state);
      return true;

    // --- Line motions ---
    case "0":
      ctx.superHandleInput(ESCAPE_SEQS.home);
      resetOperatorState(state);
      return true;

    case "$": {
      ctx.superHandleInput(ESCAPE_SEQS.end);
      resetOperatorState(state);
      return true;
    }

    case "^": {
      // Move to first non-whitespace character on the line
      const lines = ctx.getText().split("\n");
      const cursor = ctx.getCursor();
      const line = lines[cursor.line] || "";
      const match = line.match(/^\s*/);
      const targetCol = match ? match[0].length : 0;
      ctx.moveCursorTo(cursor.line, targetCol);
      resetOperatorState(state);
      return true;
    }

    // --- Insert mode entry ---
    case "i":
      state.mode = "insert";
      resetOperatorState(state);
      return true;

    case "a":
      state.mode = "insert";
      ctx.superHandleInput(ESCAPE_SEQS.right);
      resetOperatorState(state);
      return true;

    case "I": {
      // Insert at first non-whitespace
      const lines = ctx.getText().split("\n");
      const cursor = ctx.getCursor();
      const line = lines[cursor.line] || "";
      const match = line.match(/^\s*/);
      const targetCol = match ? match[0].length : 0;
      ctx.moveCursorTo(cursor.line, targetCol);
      state.mode = "insert";
      resetOperatorState(state);
      return true;
    }

    case "A":
      ctx.superHandleInput(ESCAPE_SEQS.end);
      state.mode = "insert";
      resetOperatorState(state);
      return true;

    case "o": {
      // Open line below: insert new line after current line
      const lines = ctx.getText().split("\n");
      const cursor = ctx.getCursor();
      lines.splice(cursor.line + 1, 0, "");
      ctx.setText(lines.join("\n"));
      ctx.moveCursorTo(cursor.line + 1, 0);
      state.mode = "insert";
      resetOperatorState(state);
      return true;
    }

    case "O": {
      // Open line above: insert new line before current line
      const lines = ctx.getText().split("\n");
      const cursor = ctx.getCursor();
      lines.splice(cursor.line, 0, "");
      ctx.setText(lines.join("\n"));
      ctx.moveCursorTo(cursor.line, 0);
      state.mode = "insert";
      resetOperatorState(state);
      return true;
    }

    // --- Basic editing in normal mode ---
    case "x": {
      // Delete character under cursor
      for (let i = 0; i < count; i++) {
        ctx.superHandleInput(ESCAPE_SEQS.delete);
      }
      resetOperatorState(state);
      return true;
    }

    case "X": {
      // Delete character before cursor (backspace)
      for (let i = 0; i < count; i++) {
        ctx.superHandleInput(ESCAPE_SEQS.backspace);
      }
      resetOperatorState(state);
      return true;
    }

    // --- Escape in normal mode passes to super (abort agent, etc.) ---
    // This is handled in vim-editor.ts before reaching here

    default:
      break;
  }

  // If we have an unrecognized key, reset count and pass control sequences through
  resetOperatorState(state);

  // Pass control sequences to super for app keybindings (ctrl+d, etc.)
  if (data.length === 1 && data.charCodeAt(0) < 32) {
    ctx.superHandleInput(data);
    return true;
  }

  // Pass escape sequences through
  if (data.length > 1 && data.startsWith("\x1b")) {
    ctx.superHandleInput(data);
    return true;
  }

  // Ignore unrecognized printable characters in normal mode
  return true;
}
