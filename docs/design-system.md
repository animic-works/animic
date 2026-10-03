# デザインシステム

UIの品質を実装者やAIのセンスに依存させないため、デザインのルールをコードとして定義し、逸脱しにくくし、逸脱したら自動で検知します。見た目の考え方は[デザイン原則](design.md)、選定理由は[ADR 0004](decisions/0004-design-system.md)を参照してください。

## 構成

```text
docs/design.md            なぜそう見せるか
packages/design-system    デザイン言語の定義（Pandaのプリセット）
        │ panda codegen
packages/styled-system    生成された型付きのスタイルの道具（手で編集しない）
        │
packages/react            Reactの部品（Ark UIはこの中でだけ使う）
        │
src/                      画面（部品を組み合わせるだけ）
```

| パッケージ              | 責務                                                                               | 知らないこと                     |
| ----------------------- | ---------------------------------------------------------------------------------- | -------------------------------- |
| `@animic/design-system` | トークン・スタイル・レシピ・パターン・条件・土台。UIフレームワークに依存しない     | React・DOM構造・Ark UI           |
| `@animic/styled-system` | `panda.config.ts`が生成する`css`・`recipes`・`patterns`・`tokens`と型              | React・Ark UI                    |
| `@animic/react`         | 部品のAPI・DOM構造・Ark UIとの接続・アクセシビリティ・状態・レシピと引数の対応づけ | 色・余白・角丸・文字の大きさの値 |
| 画面（`src/`）          | 部品の組み合わせと、ゲームの業務に固有のUI（例: 対戦のタイマー）                   | 見た目の値・Ark UI・生成物       |

生成物は`packages/styled-system/dist`に出力し、Gitに含めません。`vp install`の後に自動で生成され（`prepare`）、手動では`vp run ds:codegen`で作り直します。`packages/styled-system`で管理するのは公開範囲を決める`package.json`だけです。

## 依存の向き

| 依存                                  | 可否 |
| ------------------------------------- | ---- |
| react → styled-system、react → Ark UI | 可   |
| 画面 → react                          | 可   |
| design-system → react・Ark UI         | 不可 |
| styled-system → react・Ark UI         | 不可 |
| 画面 → Ark UI・styled-system・Panda   | 不可 |

画面から見える基本のUIは`@animic/react`だけです。Ark UIを別のヘッドレスUIに替える場合も、変更は`@animic/react`の中に閉じます。

## design-systemの中身

```text
packages/design-system/src/
├─ tokens/primitive/   用途を持たない値（色の段階・余白・角丸・書体・影・時間）
├─ tokens/semantic/    用途を持つ値（bg.surface・fg.muted・accent.default など）
├─ styles/             複数のプロパティの組み合わせ（text・layer・animation・keyframes）
├─ recipes/            部品の見た目の約束（variant・size・state）
│  └─ slots/           複数の部分からなる部品（dialog・field・select・avatar）
├─ patterns/           レイアウトの語彙（stack・cluster・grid・container・center）
├─ conditions.ts       Animic独自の条件（touch・hoverable・shortLandscape など）
├─ global.ts           全体の土台（*・html・body・::selection・フォーカスの輪）
└─ preset.ts           上をまとめたPandaのプリセット
```

- トークンは原始（primitive）と意味（semantic）の2層です。部品ごとのトークン（`button.primary.background`など）は作らず、部品の見た目はレシピが持ちます。
- 画面と部品は意味のトークンを使います。原始のトークンはデザインシステムの中の材料です。
- レシピは「何であるか」、パターンは「どう並べるか」を表します。
- スロットレシピの部分の名前（dialogの`backdrop`・`content`・`title`など）はAnimicが決め、Ark UIの部品との対応づけは`@animic/react`で行います。
- 画面固有の見た目（トップの帯、ロビーの参加者の枠、対戦の残り時間、画面遷移の帯など）も、画面に値を書かずにレシピとして持ちます。`recipes/slots/`に画面ごとのファイル（`landing`・`entry`・`lobby`・`battle`・`result`・`page`・`transition`）を置き、部分の名前は見た目の役割で付けます。ゲームの業務の判断（提出できるか、誰がホストか、残り時間の計算など）はデザインシステムに入れず、`src/`が部品へ値を渡します。
- トップの表示方法（スクロールして画面ごとに吸い付く・JavaScriptなし）は`conditions.ts`の`scrolling`・`plain`で切り替えます。`html`の属性は`src/routes/index.tsx`が読み込み時に付けます。

## 部品（@animic/react）

部品はサブパスで読み込みます（例: `import { Button } from "@animic/react/button"`）。

| 部品                                                                                        | 元にするもの                                                 |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `Button`                                                                                    | buttonレシピ、Ark UIのfactory                                |
| `Text`・`Heading`                                                                           | textレシピ                                                   |
| `Surface`                                                                                   | surfaceレシピ                                                |
| `Badge`                                                                                     | badgeレシピ                                                  |
| `Icon`・`IconButton`                                                                        | icon・iconButtonレシピ                                       |
| `Avatar`                                                                                    | avatarスロットレシピ、Ark UI Avatar                          |
| `TextField`                                                                                 | fieldスロットレシピ、Ark UI Field                            |
| `Dialog`・`DialogClose`                                                                     | dialogスロットレシピ、Ark UI Dialog                          |
| `Select`                                                                                    | selectスロットレシピ、Ark UI Select                          |
| `SegmentedControl`（`lobby/segmented-control`）                                             | segmentedControlスロットレシピ、Ark UI RadioGroup            |
| `CodeInput`・`CodeDisplay`（`code`）                                                        | codeInput・codeDisplayスロットレシピ、Ark UI PinInput・Field |
| `Toaster`・`toast()`（`toast`）                                                             | toastスロットレシピ、Ark UI Toast                            |
| `Logo`                                                                                      | logoレシピ                                                   |
| `CharacterArt`（`character-art`）                                                           | artImageレシピ。プロンプトの言葉から描く仮の挿絵             |
| `Stack`・`Cluster`・`Grid`・`Container`・`Center`・`VisuallyHidden`                         | 同名のパターン                                               |
| `landing/*`（`Hero`・`LandingNav`・`StepCarousel`・`ScoreCard*`・`Gallery*`・`SiteFooter`） | landingのスロットレシピ                                      |
| `entry`（`EntryPage`・`EntryCard`・`ProviderButton` など）                                  | entryCard・providerButtonスロットレシピ                      |
| `lobby`・`lobby/top-bar`                                                                    | lobbyのスロットレシピ、Ark UI QrCode                         |
| `battle`                                                                                    | battleのスロットレシピ                                       |
| `result`                                                                                    | resultBoardスロットレシピ                                    |
| `page`（`PageDeco`・`BackLink`・`DocPage`）                                                 | pageのレシピ                                                 |
| `transition`（`WipeProvider`・`useWipe`・`Entrance`）                                       | pageWipe・entranceスロットレシピ                             |

部品は`className`と`style`を受け取りません。見た目はvariantなどの引数で選び、引数で表せない見た目が必要になったら、画面で作らずにデザインシステムへの追加を検討します。進み具合や順番のように実行時に決まる値は、部品がCSSのカスタムプロパティ（`--meter`など）として`style`に渡し、値の意味づけはレシピが持ちます。

画面遷移の帯（`WipeProvider`）はアプリのルートに1つだけ置き、画面は`useWipe()`で`wipeTo`（帯で塗りつぶしてから移動）と`buildRoom`（ルームコードを回して確定させてから移動）を呼びます。帯が抜けたあと、`body[data-entering]`の間だけ`Entrance`とカードが順に現れます。視差効果を減らす設定では演出を出しません。

## 値を足すとき

1. 既存のトークン・レシピ・パターンで表せないかを確かめます（Panda MCPで問い合わせる）。
2. 足す場合は、用途を表す名前で意味のトークンかレシピの変種を足します。画面に値を直接書きません。
3. `vp run ds:codegen`で生成し直し、Storybookで状態を確認します。

## 強制と検証

| 仕組み                | 内容                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pandaの厳格モード     | `strictTokens`・`strictPropertyValues`で、トークンにない値（13px・#ff00ffなど）を型で拒否する                                                                |
| lint                  | `src/`からのArk UI・`@animic/styled-system`・Panda・CSS Modulesの読み込み、`style`属性、部品への`className`を禁止する（[vite.config.ts](../vite.config.ts)） |
| 部品の単体テスト      | `packages/react/src/**/*.test.tsx`。項目名・補足・エラーの関連づけ、キーボード操作、状態を確かめる                                                           |
| Storybook             | 部品の状態の一覧（種類・大きさ・無効・処理中など）。アクセシビリティの検査（axe）付き                                                                        |
| アクセシビリティのE2E | `tests/e2e/a11y.spec.ts`。画面をaxeでWCAG 2.1 AAの規則に照らす（PCとスマホの幅）                                                                             |
| 見た目の回帰テスト    | `tests/visual/`。画面のスクリーンショットを基準と比べる。基準はOSごとに`tests/visual/__screenshots__/`へ保存する                                             |

コマンドは[CONTRIBUTING.md](../CONTRIBUTING.md#セットアップと検証)を参照してください。

## AIからの利用

AIは既存のコードから推測せず、デザインシステムとヘッドレスUIの実装に問い合わせます。[.mcp.json](../.mcp.json)で次のMCPサーバーを使えます。

| サーバー | 問い合わせる内容                                                               |
| -------- | ------------------------------------------------------------------------------ |
| `panda`  | トークン・意味のトークン・レシピとその変種・パターン・条件・文字と面のスタイル |
| `ark-ui` | 部品のAPI・部分（parts）・状態・実装例                                         |

機械が読める仕様は`vp run ds:codegen`で`packages/styled-system/dist/specs/design-system.json`に出力します。

## 画面モックとの対応

画面の見た目は`mock/`（別リポジトリの画面モック。`mock/README.md`）を基準に作ります。モックの色・大きさ・余白はトークンとレシピに写し、次の点だけ意図して変えています。

- 色・文字の大きさ・行の高さ・余白・角丸・アイコンの大きさはモックの値をそのまま写す。行の高さの既定は書体の既定（`lineHeights.normal` = `normal`）で、モックが明示している1.7は`relaxed`にする
- 幅の切り替えはモックの値（トップ900px・ロビー820px・対戦と結果860px・スマホ560px）に合わせる
- 対戦画面の上部バーはロゴを左の列に入れ、残り時間を中央の列に置く（モックと同じ3列）
- 画像（キャラクター・遊び方の挿絵・難易度の挿絵）はモックのものをそのまま使う。置き場は[CONTRIBUTING.md](../CONTRIBUTING.md#画面モックの画像)を参照
- 書体はモックと同じGoogle Fontsから読み込む（`src/routes/__root.tsx`）
- ロビーの条件は[ゲーム仕様](product.md)のとおり難易度・制限時間・画像選択の猶予にする。モックの「生成可能回数」は仕様に入っていないため、仕様が決まるまで置かない
- ログインは未決定（#11）のため、トップの「ログイン」とログイン画面の連携先のボタンは準備中の通知を出すだけにする。Xでのログインは提供しない（#17）
- スマホのトップのアプリバー（`appBar`）は、モックでは幅375px以下で「スタート」「参加」の文字が折り返す。アプリでは折り返さずにロゴを残りの幅に縮め、359px以下では「参加」をアイコンだけにする（名前は`aria-label`で読む）
- トップのギャラリーで、モックが縦長の画像の幅から対戦のカードを狭める計算は、画面に合わせて同じ式で行う
- 対戦・結果・マイページ・戦績の詳細は、最新のモック（採点の演出、プロンプトの分割と重み、マイページ）にまだ合わせていない（#16 と対戦画面の作り直しは別の作業）
- 結果画面の採点の演出にある「×3」（早送り）と「スキップ」はモックだけの操作で、アプリには置かない
- ログインのスマホの上のバー（戻るとロゴ）は、モックより12px下げる（`mobileBar`の`float`。上端に詰まって見えないようにするため）
- ロビーの表示名の変更（自分の枠の鉛筆のボタンと「表示名を変更」の窓）はモックにない、アプリの追加
- ロビーの難易度の挿絵の帯は、モックの`backdrop-filter`ではなく、同じ画像のぼかしたコピーを帯の中に置いて同じ見た目にする（`levelArt`の`cap`）。`backdrop-filter`と`mask-image`を同じ要素に使うと、画面遷移で親が動いている間にChromiumがマスクを落とし、帯が硬い長方形で出てからぼけた帯に切り替わるため

## まだ決めていないこと

- Webフォントの読み込み方法（#14。モックと同じGoogle Fontsからの読み込みを暫定で使い、自前配信などへの切り替えを検討する）
- 文字と背景のコントラスト（WCAG 2.1 AA）の扱い。モックの色（ピンクの地に白い文字、薄いグレーの注記）をそのまま使っているため満たさない組み合わせがあり、`tests/e2e/a11y.spec.ts`ではコントラストの規則（`color-contrast`）を検査していない
- 暗い配色（ダークモード）の要否
- 見た目の回帰テストをCIで動かすためのLinux用の基準画像の作り方（#15）
