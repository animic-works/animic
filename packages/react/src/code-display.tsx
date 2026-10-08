import { codeDisplay } from "@animic/styled-system/recipes";
export function CodeDisplay({
  value,
  presentation,
  size,
  onCopy,
  settledCount,
}: {
  value: string;
  presentation?: "adaptive" | "cells" | "inline";
  size?: "sm" | "md";
  onCopy?: () => void;
  settledCount?: number;
}) {
  const c = codeDisplay({
    presentation: settledCount === undefined ? presentation : "cells",
    size,
    rolling: settledCount !== undefined,
  });
  const content = (
    <>
      <span className={c.compact} aria-hidden="true">
        {value}
      </span>
      {Array.from(value).map((char, index) => (
        <span
          key={index}
          className={c.cell}
          data-settled={settledCount !== undefined && index < settledCount ? "" : undefined}
          aria-hidden="true"
        >
          {char}
        </span>
      ))}
      {onCopy && (
        <svg
          className={c.copyIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <rect x="8" y="8" width="12" height="13" rx="2" />
          <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
        </svg>
      )}
    </>
  );
  return onCopy ? (
    <button
      type="button"
      className={c.root}
      aria-label={`コード ${value} をコピー`}
      onClick={onCopy}
    >
      {content}
    </button>
  ) : (
    <span className={c.root}>
      <span className={c.value}>{value}</span>
      {content}
    </span>
  );
}
