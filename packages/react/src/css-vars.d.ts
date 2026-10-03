import "react";

// style 属性で CSS のカスタムプロパティ（--meter など）を渡せるようにする。
// 値そのものはレシピが持ち、部品からは進み具合や順番だけを渡す
declare module "react" {
  interface CSSProperties {
    [name: `--${string}`]: string | number | undefined;
  }
}
