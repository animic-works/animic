import { useState } from "react";
import { useToast } from "@animic/react/toast";
import { submitBattleImage } from "./battle.functions";

/** 画像の提出と、提出前の確認・失敗の表示を扱う。 */
export function useBattleSubmission({
  code,
  battleId,
  locked,
}: {
  code: string;
  battleId: string;
  locked: boolean;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const toast = useToast();

  async function submit(generationId: string) {
    if (pending || locked) return;
    setPending(true);
    setError(undefined);
    try {
      await submitBattleImage({ data: { code, battleId, generationId } });
      setConfirmId(null);
    } catch {
      const message = "提出できませんでした。もう一度押してください";
      setError(message);
      toast.show({ title: message });
    } finally {
      setPending(false);
    }
  }

  return { confirmId, setConfirmId, pending, error, submit };
}
