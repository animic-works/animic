# 0004: デザインシステムをPanda CSSとArk UIで3つのパッケージに分けて作る

- 状態: 承認済み
- 決定日: 2026-10-03
- 関連: [デザインシステム](../design-system.md)、[デザイン原則](../design.md)、[アーキテクチャ](../architecture.md)

## 背景

AI駆動で画面を実装すると、その場で色や余白の値が作られ、画面ごとに見た目がぶれやすい。UIの品質を実装者のセンスに頼らず、定義済みのデザイン言語を組み合わせて作れるようにし、逸脱を自動で検知する仕組みが必要になった。[ADR 0002](0002-application-foundation.md)のBase UIとCSS Modulesでは、値の制約や機械が読めるデザインの定義を持てない。

## 判断基準

- デザインの値をコードで定義し、定義外の値を型・lintで拒否できること
- デザインの定義がReactやヘッドレスUIのライブラリに依存しないこと
- AIがデザインの定義と部品の実装方法を問い合わせられること
- アクセシビリティ（ARIA・フォーカス・キーボード操作）を自前で作り込まなくてよいこと

## 検討した選択肢

| 選択肢                        | 利点                                                                                                              | 欠点・制約                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Base UI + CSS Modules（従来） | 依存が少ない                                                                                                      | 値の制約・機械が読める仕様がなく、画面ごとに値を書けてしまう |
| Panda CSS + Ark UI            | トークン・レシピ・パターンを型付きで生成し、厳格モード・Spec・MCPがある。Ark UIはヘッドレスで部分の対応づけが容易 | 生成の手順が増える。Panda 2系は新しく、資料が少ない          |
| Tailwind CSS + Radix          | 利用者が多い                                                                                                      | クラス名で任意の値を書きやすく、デザインの定義を強制しにくい |

## 決定

- `packages/design-system`にPandaのプリセットとしてデザイン言語を定義し、ルートの`panda.config.ts`で`packages/styled-system`に生成する。`packages/react`がそれとArk UIを使って部品を実装し、画面は`@animic/react`だけを使う。
- Pandaは2.1.0を使い、ユーティリティと条件のために`@pandacss/preset-base`だけを読み込む。値はAnimicのプリセットだけにする。厳格モード（`strictTokens`・`strictPropertyValues`）を有効にする。
- 画面からのArk UI・生成物・Pandaの直接利用と、`style`・`className`の指定をlintで禁止する。
- 部品の状態はStorybook、アクセシビリティは部品の単体テスト・Storybook・axeのE2E、見た目の変化はPlaywrightのスクリーンショットで確かめる。
- AI向けにPanda MCPとArk UI MCPを`.mcp.json`で使えるようにする。

## 理由

Pandaはデザインの定義（プリセット）と生成物を分けられ、生成物がUIフレームワークに依存しないため、design-system・styled-system・reactの依存の向きを保てる。厳格モードとlintの組み合わせで、定義外の値を画面に書けないようにできる。Spec・MCPでデザインの定義をAIが問い合わせられる。Ark UIはスタイルを持たず、部分ごとにクラスを渡せるため、Animicが決めたスロットの名前をそのまま対応づけられる。React以外への展開も可能な状態機械ベースの実装を利用できる。

## 影響

- ADR 0002のUIの方針（Base UIとCSS Modules）を置き換える。画面のCSS Modulesは廃止した。
- `vp install`の後にPandaの生成（`prepare`）が走る。生成物はGitに含めない。
- ワークスペースにパッケージを置いたため、Vite+のコマンドは対象を明示する（`vp dev .`・`vp build .`・`vp preview .`）。`package.json`のスクリプトから実行する。
- Storybook 10.6.1はpeerDependenciesでVite+ 0.2系までを想定している。0.3.3でのビルドは確認したが、更新時に互換性を確かめる。

## 見直す条件

Pandaの厳格モード・生成の仕組みが大きく変わる場合、Ark UIの保守が止まる場合、React以外のUIフレームワークを使う場合、またはVite+とStorybookの互換性が保てなくなった場合に再検討する。

## 根拠

2026-10-03に、導入したバージョンのパッケージの型定義・CLI・生成結果を確認した。

- Panda CSS 2.1.0（`@pandacss/dev`・`@pandacss/preset-base`・`@pandacss/mcp`）: preset-baseはトークンを持たないこと、`staticCss`・`importMap`・`--spec`の動作、`panda-mcp`のツール一覧を手元で確認した
- Ark UI 5.39.2、`@ark-ui/mcp` 1.3.0: Dialog・Field・Select・Avatarの部品と、MCPのツール一覧を確認した
- Storybook 10.6.1: 専用のVite設定でビルドと表示を確認した
- [Panda CSS](https://panda-css.com/)、[Ark UI](https://ark-ui.com/)、[Storybook](https://storybook.js.org/)
