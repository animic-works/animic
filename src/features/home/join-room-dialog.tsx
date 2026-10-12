import { useEffect, useRef, useState } from "react";
import { Button } from "@animic/react/button";
import { ActionGroup } from "@animic/react/action-group";
import { Dialog } from "@animic/react/dialog";
import { Field } from "@animic/react/field";
import { CodeInput } from "@animic/react/code-input";
import { Stack } from "@animic/react/stack";
import { getRoomEntry } from "../room/room.functions";
import { readRoomCodeInput } from "../room/room-code-input";

export function JoinRoomDialog({
  open,
  onOpenChange,
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (url: string) => void;
}) {
  const request = useRef(0);
  const [pending, setPending] = useState(false);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  function changeOpen(next: boolean) {
    if (!next) {
      request.current++;
      setPending(false);
    }
    onOpenChange(next);
  }
  const [code, setCode] = useState("");
  const [entryError, setEntryError] = useState<string>();
  const { invalid, complete: valid } = readRoomCodeInput(code);
  const description =
    code.length === 8 ? "このコードで参加します" : code.length ? `あと${8 - code.length}文字` : "";

  async function join() {
    if (!valid || pending) return;
    const version = ++request.current;
    setPending(true);
    try {
      const entry = await getRoomEntry({ data: { code } });
      if (version !== request.current) return;
      if (!entry.exists) setEntryError("ルームが見つかりません");
      else onNavigate(`/rooms/${code}`);
    } catch {
      if (version === request.current)
        setEntryError("ルームを確認できませんでした。もう一度お試しください。");
    } finally {
      if (version === request.current) setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={changeOpen}
      title="ルームに参加"
      description="英数字8文字のルームコードを入力してください"
      closeButton={false}
      presentation="adaptive"
      size="compact"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void join();
        }}
      >
        <Stack>
          <Field
            label="ルームコード（8文字）"
            labelVisibility="hidden"
            messageAlign="center"
            messageLayout="status"
            description={description}
            error={invalid ? `「${invalid}」はルームコードに使われていません` : entryError}
          >
            <CodeInput
              invalidIndices={
                invalid
                  ? Array.from(code).flatMap((char, index) =>
                      /[^23456789ABCDEFGHJKMNPQRSTUVWXYZ]/.test(char) ? [index] : [],
                    )
                  : undefined
              }
              length={8}
              editing="append"
              size="compact"
              name="code"
              value={code}
              autoComplete="off"
              onChange={(event) => {
                request.current++;
                setPending(false);
                setEntryError(undefined);
                setCode(readRoomCodeInput(event.target.value).code);
              }}
            />
          </Field>
          <ActionGroup layout="confirm">
            <Button appearance="secondary" shape="pill" size="lg" onClick={() => changeOpen(false)}>
              やめる
            </Button>
            <Button
              appearance="primary"
              shape="pill"
              size="lg"
              type="submit"
              disabled={!valid}
              loading={pending}
            >
              参加する
            </Button>
          </ActionGroup>
        </Stack>
      </form>
    </Dialog>
  );
}
