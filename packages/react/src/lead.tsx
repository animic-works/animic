import type { ReactNode } from "react";
import { lead } from "@animic/styled-system/recipes";
export function Lead({ children, conclusion }: { children: ReactNode; conclusion?: ReactNode }) {
  return (
    <p className={lead()}>
      {children}
      {conclusion && (
        <>
          <br />
          <span data-lead-conclusion>{conclusion}</span>
        </>
      )}
    </p>
  );
}
