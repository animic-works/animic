import { useRef } from "react";
import { Button } from "./button";
type FileButtonProps = {
  label: string;
  accept: string;
  disabled?: boolean;
} & (
  | { multiple: true; onFiles: (files: File[]) => void; onFile?: never }
  | { multiple?: false; onFile: (file: File) => void; onFiles?: never }
);

export function FileButton(props: FileButtonProps) {
  const { label, accept, disabled } = props;
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button
        appearance="secondary"
        shape="pill"
        disabled={disabled}
        onClick={() => input.current?.click()}
      >
        {label}
      </Button>
      <input
        hidden
        ref={input}
        type="file"
        accept={accept}
        multiple={props.multiple}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (!files.length) return;
          if (props.multiple) props.onFiles(files);
          else if (files[0]) props.onFile(files[0]);
        }}
      />
    </>
  );
}
