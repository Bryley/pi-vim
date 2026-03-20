/**
 * pi-vim: Vim motions extension for pi-coding-agent.
 * Replaces the default input editor with a vim-modal editor.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { VimEditor } from "./vim-editor.js";

export default function (pi: ExtensionAPI) {
  pi.on("session_start", (_event, ctx) => {
    ctx.ui.setEditorComponent((tui, theme, keybindings) =>
      new VimEditor(tui, theme, keybindings)
    );
  });
}
