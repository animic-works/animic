import { css } from "@animic/styled-system/css";

css({ color: "fg.default", padding: "5", display: "flex" });

// @ts-expect-error 未定義のパレットは利用できない。
css({ color: "blue.500" });

// @ts-expect-error 色の実値はTokenの代わりに指定できない。
css({ color: "#ffffff" });

// @ts-expect-error 任意の余白は利用できない。
css({ padding: "13px" });

// @ts-expect-error 未定義の文字サイズは利用できない。
css({ fontSize: "18px" });

// @ts-expect-error CSSプロパティの値も検査する。
css({ display: "not-a-display-value" });

// @ts-expect-error 未定義のブレークポイントは利用できない。
css({ padding: { sm: "5" } });

// @ts-expect-error パレットの切り替えによる意味の差し替えは利用できない。
css({ color: "colorPalette.primary" });
