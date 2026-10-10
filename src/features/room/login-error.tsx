import { Notice } from "@animic/react/notice";

export function LoginError({ message }: { message: string }) {
  return (
    <div role="alert">
      <Notice tone="danger" density="compact">
        {message}
      </Notice>
    </div>
  );
}
