# Interaction / Environmentの設計事例: 操作と利用環境まで状態を確かめる

2026-10-04までの操作状態・利用環境に関する判断と、ブラウザで確認した問題・修正を扱う事例です。見た目の定義があることと、操作・状態の重なり・環境変化の中でその意味が成立することを分けて扱います。

## 静止した状態だけでは分からなかったこと

Animicでは、状態を色だけに依存させず、文言・形・ARIA等も組み合わせること、Motionを止めても情報と操作が成立することが前提だった。Recipeが状態表現を持ち、ReactがDOM、Ark UIとの接続、フォーカスや操作を担当する分担も既にあった。

それでも、各状態を別々に表示しただけでは分からない不整合が残った。disabledの要素へポインターを重ねる、押下する、Toastを表示した後でテキスト方向（LTR・RTL）を変える、といった入力によって初めて確認できる問題だった。

以下は複数のレビュー・修正を責務ごとにまとめたものであり、すべての問題が一つの実験で見つかったという経緯ではない。

## フォーカスと入力エラーを同時に伝える

フォーカスリングは現在の操作位置を、入力の境界線は通常・invalid等の状態を示すものとして分けた。実表示を確認した後の承認では、リングの表現を修正するとともに、invalidの境界線をフォーカス色へ置き換えないことが明示された。

共通Styleへリングの表現を集めても、フォーカスを検出するDOMは同じとは限らなかった。通常の対象は`:focus-visible`で扱える一方、SegmentedControlは非表示の子radioがフォーカスを持つ。そこで子の`:focus-visible`を親の表示へ反映し、表現の定義は共通Styleを再利用することにした。親にフォーカスが含まれるという理由だけで、ポインター選択にも同じリングを出す方式にはしなかった。

これは「ポインターならすべての要素でリングを消す」という規則ではない。現在のテストでも、Button・Link・SegmentedControlのポインター操作を検査し、テキスト入力ではブラウザが`:focus-visible`を成立させることと区別している。

ARIAの関連付けと操作も、見た目とは別に確かめた。現在のブラウザテストは、Fieldのラベル・説明・エラーと入力の関係、SegmentedControlの矢印操作とdisabled選択肢のスキップ、Dialog内のTab移動・Escapeで閉じた後のフォーカス復帰を検査対象にしている。リングの画像が一致することだけで、これらの操作が成立したとは扱わない。

`forced-colors`ではOS・ブラウザによる色の調整を一律に無効にしない判断を採った。検査も元の色との一致を求めず、リングの外形と、入力エラーのARIA・説明が維持されることを確認する形だった。具体的な色・寸法は[共通Control Style](../../../packages/design-system/src/recipes/control.ts)と参照するTokenが所有する。

## disabledを他の見た目より優先する

修正前の個別検証では、Primary Buttonは`disabled: true`でも通常appearanceの色と透明な境界線が残った。Button・loadingのButton・IconButtonのいずれにも、hoverの影と押下時の移動が観測された。

この修正では公開APIやSemantic Tokenを変更しなかった。承認済みのdisabledの意味に合わせ、背景・文字・境界線の色を適用し、hoverの影や押下時のtransformを残さないよう、Recipeで有効時の表現とdisabledを分けた。loadingのButtonも操作不能である以上、操作可能なように反応する表示を残さない扱いにした。

問題はdisabled用の値が存在しないことではなく、appearanceや操作状態との優先関係がブラウザで成立していないことだった。単なるopacity変更を追加する設計問題へ広げず、承認済み状態の実装不備として修正した。

## 動きを抑える環境でも情報を残す

共通のSpinnerはデザインシステム側のAnimation Styleで動きを定め、`prefers-reduced-motion`に応じて停止する。React側は処理中の意味と必須のラベルを維持する。回転がなくても文言と状態を失わない分担である。

ブラウザテストは通常のControlの反応を確認した後、reduced motion設定へ切り替え、トランジションやSpinnerのアニメーションが停止することを検査する。動く状態のスクリーンショットだけでは、この環境への応答は分からない。

機能固有Motionをどこで定義するか、Keyframesが実際に生成されるかは[Visual / Guardrailの設計事例](visual-guardrails.md#pandaの型生成の仕組みに合わせる)で扱う。この事例は共通UIが利用環境へどう応答するかに範囲を絞る。

## 適用範囲とPortalを一緒に扱う

CSSを読み込むだけで、ホストページ全体の文字・背景・`box-sizing`を変更することは避けた。そのため、`preflight: false`を維持し、利用側がAnimicのUIを構成する領域に`data-animic-root`を付け、その範囲へ基礎Typography、文字色・背景、`font-synthesis`等を適用する判断になった。`border-box`は対象要素・子孫だけでなく、それぞれの疑似要素まで含めた。

一方、Dialog・ToastのPortalは、そのDOM範囲の外へ描画される。範囲を限定するだけではPortal内の基礎設定を失うため、Recipe側に必要なText Style・`font-synthesis`・`box-sizing`を持たせた。Text・Headingごとの重複指定へ戻したり、`html`・`body`全体へ適用範囲を広げたりして解決しなかった。

現在のテストは、対象範囲の内側と外側を比較し、Portalが実際に範囲外であることと必要な設定を持つことを別に確認している。Dialogを開いた際のスクロール制限等の操作処理と、CSSの読み込みだけによる全体変更は別の責務である。

## Toastは表示後の方向変更にも応答する

ToastはCSSの論理方向に沿って配置し、デザインシステムの余白とsafe-areaの大きい方を使う判断だった。物理方向の左右をinline-endへ対応付けるには、Portalのテキスト方向（LTR・RTL）を確認する必要があった。

修正前の調査では、左右が異なるsafe-areaを設定し、Toastの表示後にLTRからRTLへ変更した。computed styleの`direction`はRTLになったが、safe-areaの参照は右側のまま残った。初回表示だけを確認するテストでは捉えられない不整合だった。

修正後のReact実装はPortalのテキスト方向（LTR・RTL）を確認し、祖先の`dir`・`style`・`class`変更を監視して物理方向との対応を更新する。新しい公開propや方向管理のProviderは追加しなかった。余白の値と重なり順はRecipe側に残し、Reactは環境とArk UIとの接続を担当した。

Ark UIのインラインの位置・z-index指定も、そのままAnimicのデザイン定義とはしなかった。必要な内部情報を対応付けながら、Recipeが所有する配置・余白・重なり順を優先する構成を維持した。

## どの記録で何を確認したか

Chromiumでの過去の個別測定・修正後の検証と、現在のテストの検査内容を分けて示す。

| 対象               | 入力・観測または検査内容                                                                                                                                | 検証方法・範囲                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 修正前disabled     | `disabled: true`のPrimary Buttonとloading Buttonで通常appearanceの色が残り、IconButtonを含む3対象でhoverの影と押下時の移動を観測                        | hover・押下後に200ms待った個別測定。実際の機能での障害記録ではない                                                                                                   |
| 修正前Toast        | safe-areaを上40・左60・右25・下0pxにして表示後LTRからRTLへ変更。方向はRTLになったが、参照は右側、inline-endの余白は25pxのまま                           | この入力で更新されなかった事実であり、すべての方向変更の網羅検証ではない                                                                                             |
| 修正後の検証       | disabled・loading・IconButtonの色とhover / pressed抑制、mount後のToast方向変更を含むブラウザテストの成功                                                | 全46件成功には他の検査も含む。現在の全アサーションが当時と同一だった証明にはしない                                                                                   |
| 現在のdisabled検査 | 3対象で通常・hover・実際の`:active`中の色、影なし、transformなし。loadingは`aria-busy`も検査                                                            | [Componentテスト](../../../tests/design-system/browser/components.spec.ts)が検査する内容                                                                             |
| 現在のToast検査    | CDPで左右非対称のsafe-areaを設定しLTR → RTL → LTRへ変更。inline-end25 → 60 → 25pxと実要素位置を確認。小さいsafe-areaでは既定余白を維持し、Enterで閉じる | [基盤テスト](../../../tests/design-system/browser/foundation.spec.ts)。内部CSS変数の上書きだけでなく物理方向からの対応を検査。全ブラウザ・縦書きの成功までは示さない |
| フォーカス・環境   | Tab・矢印操作、invalidとの共存、ポインター選択、forced-colors、reduced motion設定、root内外・Portalの基礎設定                                           | [フォーカステスト](../../../tests/design-system/browser/focus-responsive.spec.ts)、上記Component・基盤テストの検査対象。修正後の同名検査も成功                       |

画像比較は対象の見た目の変化を検出するが、mount後の方向変更や状態の優先順位すべてを代わりに検査するものではない。axeによる検査も併用したが、キーボード操作や環境変化への応答は明示したブラウザ操作で確認する必要があった。

## 修正しても変えなかった責務

フォーカスの表現と検出方法を分け、disabledの優先関係とToastの環境変化への追従を具体化した。一方、3パッケージの構成、Recipeが視覚表現を持つこと、ReactがDOM・操作・ARIAとArk UIへの接続を持つことは維持した。

disabledとToastの修正を理由に新しいToken・公開APIを増やさず、CSSの適用範囲やPortalの基本方針も変えなかった。ブラウザで問題が出たことを、状態表現をすべてReactへ移す理由にはしなかった。

この事例から別の設計へ持ち出せるのは、特定の色やセレクターではなく、次の確認事項である。

- 状態を一つずつ見るだけでなく、重なったときの優先順位を検査する。
- フォーカスとバリデーションを別々に表現し、実際にフォーカスを持つDOMを確認する。
- reduced motionやforced colorsで、動き・色以外の情報と操作が残るか確認する。
- 基礎設定を限定した範囲の外側とPortalを、同じホストページで確認する。
- テキスト方向の初期値だけでなく、表示後の変更も検査し、左右の違いが分かるsafe-areaを使う。
- ライブラリ内部のインラインスタイルが、デザインシステム側の状態・配置を上書きしていないか調べる。

これらは後から整理したレビュー観点であり、すべての環境変更を監視する共通基盤の導入を勧めるものではない。

## 現行資料と記録上の限界

現在の利用方法は[アーキテクチャ](../../architecture.md#デザインシステム)と[検証手順](../../../CONTRIBUTING.md#デザインシステムの生成と検証)を確認する。具体的な定義は[共通Control Style](../../../packages/design-system/src/recipes/control.ts)、[SegmentedControl](../../../packages/design-system/src/recipes/slots/segmented-control.ts)、[基礎設定](../../../packages/design-system/src/global.ts)、[共通Animation Style](../../../packages/design-system/src/styles/animation.ts)、[Toast Recipe](../../../packages/design-system/src/recipes/slots/toast.ts)・[React実装](../../../packages/react/src/toast.tsx)が所有する。

個別測定と修正後の検証結果は、検査した入力・環境の範囲を示す。現在の検査コードを過去の全動作の証拠にはしない。特にforced-colorsはブラウザの模擬環境であり、すべてのOS設定・支援技術での確認ではない。Toastの検査は横書きの方向変更で、任意のCSS変更や縦書きのすべてを保証しない。現在のリンク先が変わっても、この事例の当時の観測を書き換えない。
