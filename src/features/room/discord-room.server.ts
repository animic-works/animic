import { DurableObject } from "cloudflare:workers";
import * as v from "valibot";

import { accountIconSchema } from "../account/account-icon";
import type { AccountIcon } from "../account/account-icon";
import { createRoomCode } from "./room-creation";
import { participantNameSchema, roomCodeSchema } from "./room-state";

const allocationSchema = v.object({
  code: v.nullable(roomCodeSchema),
  participantId: v.string(),
  requestId: v.pipe(v.string(), v.uuid()),
  name: participantNameSchema,
  icon: v.nullable(accountIconSchema),
});
type Member = { id: string; name: string; icon: AccountIcon | null };

/** Activityの起動単位につき1つ。並行した入室でもルームを一つに確定する。 */
export class DiscordRoom extends DurableObject<Env> {
  async #read() {
    const value = await this.ctx.storage.get("allocation");
    return value ? v.parse(allocationSchema, value) : null;
  }

  async #allocate(member: Member) {
    const allocation = {
      code: null,
      participantId: member.id,
      name: member.name,
      icon: member.icon,
      requestId: crypto.randomUUID(),
    };
    await this.ctx.storage.put("allocation", allocation);
    return allocation;
  }

  async #complete(instanceId: string, allocation: v.InferOutput<typeof allocationSchema>) {
    if (!allocation.code) {
      for (let attempt = 0; attempt < 8; attempt++) {
        const code = await createRoomCode(allocation.participantId, allocation.requestId, attempt);
        const created = await this.env.ROOMS.getByName(code).create(
          code,
          allocation,
          allocation.icon,
          instanceId,
        );
        if (created) {
          allocation.code = code;
          await this.ctx.storage.put("allocation", allocation);
          break;
        }
      }
    }
    if (!allocation.code) throw new Error("ルームを作成できませんでした。");
    return allocation.code;
  }

  enter(instanceId: string, member: Member) {
    return this.ctx.blockConcurrencyWhile(async () => {
      let allocation = await this.#read();
      if (allocation?.code) {
        using entry = await this.env.ROOMS.getByName(allocation.code).entry(null);
        if (!entry.exists) allocation = null;
      }
      allocation ??= await this.#allocate(member);
      const code = await this.#complete(instanceId, allocation);
      await this.env.ROOMS.getByName(code).join(member.id, member.name, member.icon);
      return code;
    });
  }
}
