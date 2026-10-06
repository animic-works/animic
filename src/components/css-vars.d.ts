import "react";

// style 属性で CSS のカスタムプロパティ（--char-index など）を渡せるようにする。
// 値そのものはレシピが持ち、部品からは順番や進み具合だけを渡す
declare module "react" {
  interface CSSProperties {
    [name: `--${string}`]: string | number | undefined;
  }
}
