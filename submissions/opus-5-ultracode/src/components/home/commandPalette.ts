/// Opens the shell's command palette by replaying the ⌘K shortcut its global listener watches for.
export function openCommandPalette(): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
}
