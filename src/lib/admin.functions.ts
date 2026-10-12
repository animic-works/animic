import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import * as v from "valibot";

import { endAdminSession, isAdmin, startAdminSession, verifyAdminPassword } from "./admin.server";

export const getAdminSession = createServerFn({ method: "GET" }).handler(() => {
  setResponseHeader("Cache-Control", "private, no-store");
  return { authenticated: isAdmin() };
});

export const loginAdmin = createServerFn({ method: "POST" })
  .validator(v.object({ password: v.pipe(v.string(), v.maxLength(256)) }))
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "private, no-store");
    if (!verifyAdminPassword(data.password)) {
      // 総当たりの試行を遅らせる。
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { error: "パスワードが違います。" };
    }
    startAdminSession();
    return { error: null };
  });

export const logoutAdmin = createServerFn({ method: "POST" }).handler(() => {
  setResponseHeader("Cache-Control", "private, no-store");
  endAdminSession();
});
