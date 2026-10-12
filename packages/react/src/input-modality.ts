// フォーカスを外さず、操作方法に応じて表示だけを切り替える。
export function observeInputModality(document: Document) {
  const root = document.documentElement;
  const pointer = () => {
    root.dataset.animicInput = "pointer";
  };
  const keyboard = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return;
    const activation =
      ["Enter", " "].includes(event.key) &&
      !(
        event.target instanceof Element &&
        event.target.closest("input, textarea, select, [contenteditable=true]")
      );
    if (
      activation ||
      [
        "Tab",
        "Escape",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
        "PageUp",
        "PageDown",
      ].includes(event.key)
    ) {
      root.dataset.animicInput = "keyboard";
    }
  };
  document.addEventListener("pointerdown", pointer, true);
  document.addEventListener("keydown", keyboard, true);
  return () => {
    document.removeEventListener("pointerdown", pointer, true);
    document.removeEventListener("keydown", keyboard, true);
    delete root.dataset.animicInput;
  };
}
