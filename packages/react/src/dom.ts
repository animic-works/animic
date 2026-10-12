import type { AriaAttributes, ReactNode, Ref } from "react";
export interface CommonProps<T extends HTMLElement = HTMLDivElement> extends AriaAttributes {
  children?: ReactNode;
  id?: string;
  title?: string;
  lang?: string;
  dir?: "ltr" | "rtl" | "auto";
  "data-testid"?: string;
  ref?: Ref<T>;
}
// 型を迂回するJavaScriptやスプレッド構文からも、style・className・Ark固有propsを受け渡さない。
export function domProps(props: object) {
  return Object.fromEntries(
    Object.entries(props).filter(
      ([key]) =>
        ["id", "title", "lang", "dir", "data-testid"].includes(key) || key.startsWith("aria-"),
    ),
  );
}
