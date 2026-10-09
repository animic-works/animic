# Visual / Guardrailの検証記録

2026-10-04の調査と修正後検証から、[Visual / Guardrailの設計事例](../case-studies/visual-guardrails.md)を支える観測事実を抽出した記録です。現在の利用規則は[アーキテクチャ](../../architecture.md#機能固有のvisual)を参照してください。

## 環境と記録の範囲

| 項目          | 調査時の環境                                       |
| ------------- | -------------------------------------------------- |
| 調査日        | 2026-10-04                                         |
| Panda         | 2.0.1                                              |
| TypeScript    | 7.0.2                                              |
| Playwright    | 1.63.0                                             |
| Storybook     | 10.6.1                                             |
| ブラウザ      | Chromium                                           |
| Pandaの型制約 | `strictTokens: true`、`strictPropertyValues: true` |

検証用入力、computed style、生成CSS、型診断、テスト結果と、当時の実装確認を記録しています。コード例は関連部分の抜粋で、改行を整えています。提案・決定・後からの解釈は設計事例で区別します。

| ID                | 観測                                                                   |
| ----------------- | ---------------------------------------------------------------------- |
| [VG-E01](#vg-e01) | 任意のクラスのGuardrail通過と、別の検証でのSurface表示                 |
| [VG-E02](#vg-e02) | `css`の直接呼び出しと関数の別変数への代入の検査差                      |
| [VG-E03](#vg-e03) | 位置・寸法を直接指定したときのGuardrailと型制約の不一致                |
| [VG-E04](#vg-e04) | `css()`内に直接書くKeyframesの型拒否・不正な生成構造・CSSOMの0フレーム |
| [VG-E05](#vg-e05) | `keyframes()`の試作コードの修正と2フレームの成立                       |
| [VG-E06](#vg-e06) | 修正後のVisualのストーリーを複数の検証層へ接続                         |
| [VG-E07](#vg-e07) | analyzeの0と、生成・ブラウザ成立の併存                                 |

## VG-E01

**任意のクラスのGuardrail通過とSurface表示**

**検証環境:** 共通環境の修正前Guardrail。ブラウザでの個別検証ではStorybookのSurfaceのストーリーを開きました。ビューポートは1000×900でした。

**入力:** `src/features/sample/visuals/art.tsx`をファイル名として旧Guardrailへ次を渡しました。

```tsx
const artwork = (
  <div className="animic-surface animic-surface--appearance_framed animic-surface--padding_spacious">
    作品
  </div>
);
```

Guardrailとは別に行ったブラウザでの検証では、生成済み`surface({ appearance: "framed", padding: "spacious" })`から得た同じクラス文字列を、JavaScriptで作った普通の`div`へ設定し、`data-animic-root`内へ追加しました。

**観測結果:** Guardrailは`0 diagnostics`でした。ブラウザのcomputed styleは次のとおりでした。

| 記録の項目 | 取得したプロパティ | 観測値                            |
| ---------- | ------------------ | --------------------------------- |
| padding    | `padding`          | `32px`                            |
| border     | `borderWidth`      | `2px`                             |
| shadow     | `boxShadow`        | `rgb(11, 27, 43) 4px 4px 0px 0px` |
| radius     | `borderRadius`     | `24px`                            |

旧Guardrailの読み取り結果では、Visualの`className`を禁止するスタイル指定属性の例外にしており、その値の生成元を確認していませんでした。

**この記録から分かること:** この入力は旧Guardrailを通り、同じクラスを持つ普通の要素がReactのSurfaceを介さずSurface相当の視覚表現を得られました。

**この記録だけでは分からないこと:** Guardrailへ渡したTSXをそのままビルド・実行した一貫したE2E検証ではありません。ブラウザでの確認は別の検証です。実際の機能で発生した障害ではなく、監査用の検証コードによる再現です。どのようなクラスでも同様の表示を得られるとは示していません。

**出所:** 修正前Guardrailへの入力検査・実装確認と、Storybookでのブラウザ個別検証。

## VG-E02

**`css`の直接呼び出しと関数の別変数への代入の検査差**

**検証環境:** 共通環境の修正前Guardrail。どちらもVisualのファイル名として検査しました。

**入力:** 直接呼び出しと、同じ関数を別変数へ代入した呼び出しを比較しました。

```ts
import { css } from "@animic/styled-system/css";

const art = css({ p: "5" });
```

```ts
import { css } from "@animic/styled-system/css";

const draw = css;
const art = draw({ p: "5" });
```

**観測結果:** 直接呼び出しは「Visualで許可されていないstyle propertyです」として拒否され、別変数経由は`0 diagnostics`でした。

旧Guardrailは`css`のインポート時のローカル識別子を記録し、呼び出し先の名前がその集合に含まれる直接呼び出しの引数を検査していました。関数を代入した`draw`はその対象に含まれませんでした。

**この記録から分かること:** この別変数経由の入力は、直接呼び出しなら働くプロパティ検査から外れました。`import`宣言で`css as draw`と名前を変えることとは別の入力です。

**この記録だけでは分からないこと:** 別変数経由ならすべてのスタイル指定を必ず迂回できるとは示していません。この検証はGuardrailの結果であり、別変数経由の入力の生成CSSやブラウザ表示の検証ではありません。汎用的なデータフロー解析器の実装・性能比較も行っていません。

**出所:** 修正前Guardrailへの二つの入力の比較と、インポート・関数呼び出しを検査する実装の確認。

## VG-E03

**位置・寸法を直接指定したときのGuardrailと型制約の不一致**

**検証環境:** 共通環境。型検査用TSXはリポジトリのTypeScript設定を継承し、Pandaのstrict設定を維持しました。

**入力:** 旧Guardrailテストの許可例には、次の指定がコード文字列の中にありました。同じ指定を実際のTSXでも検査しました。

```ts
css({
  top: "-5px",
  transform: "rotate(12deg)",
  opacity: 0.5,
  _motionReduce: { transform: "none" },
});
```

比較したarbitrary value構文の検証用入力は次のとおりです。

```ts
export const geometry = css({
  top: "[-5px]",
  width: "[37px]",
  height: "[19px]",
  animationDuration: "[800ms]",
  transform: "rotate(12deg)",
  opacity: 0.5,
});
```

**観測結果:** 旧許可テストは成功しましたが、実際のTSXの`top: "-5px"`にはTS2769が出ました。関連する診断は次のとおりです。

```text
No overload matches this call.
Type '"-5px"' is not assignable to type 'ConditionalValue<SpacingValue> | undefined'.
```

角括弧で囲む形式の位置・寸法指定はGuardrailで`0 diagnostics`となり、型検査も通りました。同形式の位置・寸法指定を含む生成CSSには`top: -5px`、`width: 37px`、`height: 19px`がありました。その後、修正後ストーリーのブラウザテストでもcomputed styleの`top: -5px`を確認しました（[VG-E06](#vg-e06)）。

**この記録から分かること:** 文字列内の入力を検査するGuardrailテストの成功は、そのコードが型チェックを通ることを保証していませんでした。確認した位置・寸法指定は、strict設定を緩和せずarbitrary value構文で記述できました。

**この記録だけでは分からないこと:** その表現に固有の位置・寸法全般が禁止されていたわけではありません。また、すべての直接指定した値がこの形式で成立することの証明でもありません。`"[-5px]"`はその表現に固有の寸法であり、デザインで定めた余白Tokenや`"-5"`等の負の派生値を利用した結果ではありません。旧許可テストが現行版でも同じ結果になる、とは示していません。

**出所:** 修正前の許可テストと実TSXの型検査、arbitrary value構文の入力検査・生成CSS、修正後の[ブラウザ検証](#vg-e06)。

## VG-E04

**`css()`内に直接書くKeyframesの不成立**

**検証環境:** 共通環境の修正前Guardrailとstrictな型制約。隔離した生成設定で対象の検証用入力を明示し、生成したCSSをChromiumへ読み込ませました。

**入力:** `css()`へ渡したKeyframes定義の関連部分です。

```ts
export const effect = css({
  "@keyframes animic-review-spark": {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  animationName: "[animic-review-spark]",
  animationDuration: "[800ms]",
  animationTimingFunction: "linear",
});
```

**観測結果:**

| 層              | 観測                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------- |
| Guardrail       | `0 diagnostics`。旧検査は`@keyframes`・`from`・`to`等のキーを許可していた                           |
| TypeScript      | TS2769。`"@keyframes animic-review-spark"`は`SystemStyleObject`の既知のプロパティではないとして拒否 |
| Pandaによる生成 | 対象1ファイルを解析し、6740 bytesのCSSを出力。コマンドは成功し、診断は0件                           |
| ブラウザのCSSOM | 対象の`CSSKeyframesRule.cssRules.length`は0                                                         |

生成された関連部分は、期待する`from { opacity: 0 }`等ではなく、次の構造でした。

```css
@keyframes animic-review-spark {
  .\[\@keyframes_animic-review-spark\]\:animic-from_0 {
    from: 0;
  }
  .\[\@keyframes_animic-review-spark\]\:animic-to_1 {
    to: 1px;
  }
}
```

ブラウザでは、このKeyframes規則は有効なフレームを持たない空の規則として観測されました。

**この記録から分かること:** この直接記述形式はGuardrailが受理しても、strictな型制約と有効なKeyframesの生成・ブラウザ解釈が成立しませんでした。生成コマンドの成功と、有効なフレームを持つことは異なりました。

**この記録だけでは分からないこと:** Pandaによる生成コマンドが失敗した、またはCSSが生成されなかった、という結果ではありません。ブラウザでの個別検証はCSSOMのフレーム数を確認したもので、実要素のアニメーションを再生した検査ではありません。ほかのPandaのバージョンでの挙動は確認していません。

**出所:** 上記入力のGuardrail・型検査、対象1ファイルを解析したcssgenの出力と、生成CSSを読み込んだブラウザのCSSOM。

## VG-E05

**`keyframes()`の試作コードの修正と2フレームの成立**

**検証環境:** 共通環境。旧Guardrail、strictな型制約、隔離したPanda生成とCSSOMの個別検証を使った比較です。

**入力:** 最初の試作コードは`animationName: spark`でした。型診断を受け、次の角括弧で囲む形式へ修正しました。

```ts
import { css, keyframes } from "@animic/styled-system/css";

const spark = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});
export const effect = css({
  animationName: `[${spark}]`,
  animationDuration: "[800ms]",
  animationTimingFunction: "linear",
});
```

**観測結果:**

| 試作コードの段階                    | 観測                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `animationName: spark`              | TS2769。`string`を`ConditionalValue<KeyframesValue>`へ代入できない      |
| 同じ初期試作コードの旧Guardrail検査 | `keyframes()`のインポートと静的に確認できる局所的な値ではない参照を拒否 |
| 角括弧で囲む形式へ修正後            | 型検査が通り、Pandaが対象1ファイルから6457 bytesのCSSを生成。診断は0件  |
| 修正後CSSのCSSOM                    | 生成名`animic-kf_feVUdh`の規則に2フレーム。`opacity`は0と1              |

生成CSSには次のフレームがあり、ユーティリティクラス側の`animation-name`も同じ生成名を参照していました。

```css
@keyframes animic-kf_feVUdh {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

**この記録から分かること:** このPandaのバージョンでは、同じ生成SDKのエントリーポイントの`keyframes()`とarbitrary value構文による生成名参照で、strictな型制約・生成・CSSOMのフレーム構造が成立しました。

**この記録だけでは分からないこと:** 旧Guardrailの拒否結果は`animationName: spark`を使う初期試作コードのもので、角括弧で囲む形式へ修正後の結果ではありません。ここに示す`export`を含む試作コードは現在のVisual利用規則の例ではなく、API比較の入力です。生成名の将来的な安定性も保証しません。実要素のアニメーション・reduced motion設定の確認は後の[VG-E06](#vg-e06)と分けます。

**出所:** 初期試作コードのGuardrail・型診断、修正後の型検査・生成CSSと、そのCSSを読み込んだブラウザのCSSOM。

## VG-E06

**修正後のVisualのストーリーと検証層の接続**

**検証環境:** 共通環境の修正後実装。以下は2026-10-04時点のストーリー・設定・テストと、検証結果の対応です。リンク先は現行資料であり、後の変更によってこの観測記録を書き換えるものではありません。

**入力:** [Visualのストーリー](../../../stories/visuals.stories.tsx)の`LocalMotion`を共用しました。当時の入力は次の特徴を持ちます。

- 同一ファイルの`keyframes()`で`opacity`が0から1へ変わるフレームを定義し、生成名を角括弧で囲む形式で参照。
- `const`に格納したクラスで、`top: "[-5px]"`、`width: "[37px]"`、`height: "[19px]"`を指定。
- 800ms・linear・infiniteのアニメーションと、`_motionReduce`内の`animationName: "[none]"`を指定。
- 別要素では`css()`を`className`へ直接渡し、`top: "[-5px]"`を指定。

**観測結果:**

| 検証層             | 接続と成功した確認                                                                                                                                                                                                                                                                                                 | 保証の限界                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Guardrail          | [テスト](../../../tests/design-system/guardrails.test.ts)がストーリー全体を読み、`src/features/example/visuals/effect.tsx`という仮想ファイル名で検査。診断0件                                                                                                                                                      | 実際の機能のファイルを追加した検証ではなく、型・生成も単独では保証しない                   |
| TypeScript         | [TypeScript設定](../../../tsconfig.json)の対象にストーリーを含め、`tsc --noEmit`が成功                                                                                                                                                                                                                             | ブラウザのCSS解釈までは保証しない                                                          |
| Pandaによる生成    | [生成設定](../../../panda.config.ts)がストーリーを含み、生成CSSに位置・寸法の指定と`opacity`の2フレームが存在                                                                                                                                                                                                      | コマンド成功だけでは生成内容の妥当性を保証しない                                           |
| ブラウザ           | [テスト](../../../tests/design-system/browser/components.spec.ts)がストーリーを開く。`const`側でcomputed styleの`top`は`-5px`・`width`は`37px`・`height`は`19px`、直接呼び出し側で`top`は`-5px`。`getAnimations()`から`CSSAnimation`を取得し、`KeyframeEffect.getKeyframes()`の`opacity`が`[0, 1]`であることを確認 | この利用例の実要素のアニメーションであり、任意の機能固有の表現すべての保証ではない         |
| reduced motion設定 | 同じテストで環境を`reduce`へ変更し、`animation-name: none`と`getAnimations().length === 0`を確認                                                                                                                                                                                                                   | すべてのVisualに停止指定が書かれることの包括的検査ではない                                 |
| 画像比較テスト     | [Componentの画像比較](../../../tests/design-system/browser/components.spec.ts)と[フォーカスの画像比較](../../../tests/design-system/browser/focus-responsive.spec.ts)の既存7枚が一致。基準画像更新なし                                                                                                             | Visualのストーリー自身は基準画像の対象外。見た目やフレームを画像比較で承認した証拠ではない |
| analyze            | 同じ生成設定で対象を解析。[VG-E07](#vg-e07)の結果                                                                                                                                                                                                                                                                  | 実行時に成立するかどうかの検査ではない                                                     |

上記のアサーションを含むブラウザテストは46件成功しました。ストーリーを読み込むGuardrailテストを含む契約テストは95件成功し、静的検査でもGuardrail・型チェックが成功しました。これらの件数にはVisual以外の検証も含まれます。

修正後のGuardrailテストには、直接呼び出し・単純な`const`・import aliasの許可と、任意のクラス・関数の別変数への代入・未知の生成元・禁止プロパティ・負の余白Token等の拒否が含まれていました。

**この記録から分かること:** 同じストーリーの内容をGuardrail・型・生成・実ブラウザへ接続し、許可した位置・寸法指定と固有Keyframesが実際に成立することを確認しました。

**この記録だけでは分からないこと:** Visualのストーリー自身の画像比較テストの基準画像はありません。一つのストーリーで動的なアートワークに必要な自由度や、すべての許可形式のブラウザ成立を証明したものではありません。当時の成功を、今後の実装変更後にも成功する証拠にはできません。

**出所:** 上記ストーリー・設定・テストによる修正後の静的検査・契約テスト・ブラウザテスト、生成CSSと基準画像の変更有無の確認。

## VG-E07

**analyzeの0と、生成・ブラウザ成立の併存**

**検証環境:** 共通環境の修正後実装。`panda analyze`で同じリポジトリの生成設定を解析しました。

**入力:** `vp run design-system:analyze`。解析対象には[VG-E06](#vg-e06)のストーリーを含みます。

**観測結果:**

| 項目             | 値  |
| ---------------- | --- |
| scanned files    | 29  |
| keyframes uses   | 0   |
| keyframes unique | 0   |

この実行でKeyframesは0として集計されました。同時に、生成CSSに`opacity`の2フレームがあり、ブラウザで実要素のアニメーションと2フレームを確認した結果が残っています（[VG-E06](#vg-e06)）。

**この記録から分かること:** このanalyze実行の0という観測と、確認したVisual内のKeyframesの生成・ブラウザ成立は併存していました。

**この記録だけでは分からないこと:** analyzeが`keyframes()`を常に集計しない、analyzeの不具合である、解析ツールが不正確である、とは断定できません。0になった内部原因は調査結果から確定していません。

**出所:** 修正後の`vp run design-system:analyze`の集計、生成CSSと[VG-E06](#vg-e06)のブラウザ検証。この集計を機能の成立判定には使用しませんでした。

## 証拠全体の限界

- 問題は実際の機能の障害ではなく、監査用の検証コードで発見しました。
- 任意のクラスのGuardrailへの検証用入力とブラウザでの個別検証は別であり、一貫したE2E検証ではありません。
- 汎用的なデータフロー解析器は実装・性能比較していません。
- `keyframes()`の初期試作コードへの旧Guardrail出力と、修正後の型・生成結果は同一の入力に対する結果ではありません。
- 修正前Keyframesのブラウザ確認はCSSOMであり、実要素のアニメーション確認ではありません。
- 修正後Visualのストーリー自身の画像比較テストの基準画像はありません。
- analyzeが0を返した内部原因は不明です。

現在の実装と検証を調べる場合は、[設計事例の現行資料](../case-studies/visual-guardrails.md#現行資料)を参照してください。
