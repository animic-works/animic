export function StartIcon() {
  return (
    <svg width="12" height="13" viewBox="0 0 26 28" aria-hidden="true">
      <path
        d="M3 2.5 L24 14 L3 25.5 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function JoinIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l5-5-5-5M15 12H3" />
    </svg>
  );
}

export function ScoreIcon({ kind }: { kind: "similarity" | "speed" | "attempts" }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === "similarity" && (
        <>
          <path d="M12 3a9 9 0 1 0 9 9" />
          <path d="M12 8a4 4 0 1 0 4 4" />
          <path d="M12 12 21 3" />
        </>
      )}
      {kind === "speed" && (
        <>
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2.5 2.5M9 2h6" />
        </>
      )}
      {kind === "attempts" && (
        <>
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <path d="M3 3v5h5" />
        </>
      )}
    </svg>
  );
}

export function ActionStartIcon() {
  return (
    <svg width="26" height="28" viewBox="0 0 26 28" aria-hidden="true">
      <path
        d="M3 2.5 L24 14 L3 25.5 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ActionJoinIcon() {
  return (
    <svg width="34" height="24" viewBox="0 0 34 24" aria-hidden="true" fill="currentColor">
      <circle cx="17" cy="6.5" r="5.5" />
      <path d="M7 23 c0-6 4.5-9.5 10-9.5 s10 3.5 10 9.5 Z" />
      <circle cx="6.5" cy="9" r="4" />
      <path d="M0 22 c0-4.5 2.8-7 6.5-7 c1.4 0 2.6.3 3.6 1 c-2 1.8-3.1 4.1-3.1 6 Z" />
      <circle cx="27.5" cy="9" r="4" />
      <path d="M34 22 c0-4.5-2.8-7-6.5-7 c-1.4 0-2.6.3-3.6 1 c2 1.8 3.1 4.1 3.1 6 Z" />
    </svg>
  );
}

export function ArrowIcon() {
  return (
    <svg width="12" height="20" viewBox="0 0 12 20" aria-hidden="true">
      <path
        d="M2 2 L10 10 L2 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
