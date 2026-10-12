import type { ReactNode } from "react";
import { Portal } from "@ark-ui/react/portal";
import { overlay } from "@animic/styled-system/patterns";

export function Overlay({ children }: { children: ReactNode }) {
  return (
    <Portal>
      <div aria-hidden="true" inert className={overlay()}>
        {children}
      </div>
    </Portal>
  );
}
