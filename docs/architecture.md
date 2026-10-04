# アーキテクチャ

## 基本方針

TanStack Startのフルスタック構成で、機能単位で関連するコードをまとめます。アプリ内の業務APIはServer Functionsを使います。

各機能の役割と依存関係に合わせてコードを配置します。UIのスタイルはPandaを基盤とするDesign Systemで定義し、React実装ではArk UIを内部利用します。Cloudflareにデプロイする構成とし、依存パッケージのバージョン管理は[CONTRIBUTING.md](../CONTRIBUTING.md#依存関係とgitで管理するファイル)に従います。

## Design System

[デザイン原則](design.md)を基準に、具体的なデザイン定義を`packages/design-system/src/`に置きます。`src/routes/`・`src/features/`のUIと、これらのパッケージを利用する外部アプリケーションは同じ定義を使います。デザインを変更する際は、このリポジトリの定義を変更してから各アプリケーションへ反映します。

パッケージを分ける理由は[ADR 0006](decisions/0006-design-system.md)、Pandaのメジャーバージョンの選定は[ADR 0005](decisions/0005-panda-css-v2.md)を参照してください。

### パッケージと依存関係

| 配置                                                                | 責務                                                                                        | 許可する依存                                                                          |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `packages/design-system/`                                           | Primitive・Semantic Tokens、Styles、Recipes、Patterns、Conditions、GlobalをPresetとして定義 | Panda。UIフレームワーク・Ark UIには依存しない                                         |
| `packages/styled-system/`                                           | Pandaが生成する型付きスタイリングAPI、CSS、フォントアセットの配信                           | 生成結果とFontsource。Design System・UIフレームワーク・Ark UIへの実行時の依存関係なし |
| `packages/react/`                                                   | DOMの組み立て、キーボード操作、フォーカス管理、ARIAの関連付け                               | styled-system、React、Ark UI                                                          |
| `src/routes/`・`src/features/`、Reactを利用する外部アプリケーション | 業務状態の判断と、それに応じた画面の組み立て                                                | `@animic/react`の公開サブパス                                                         |

`design-system`パッケージは`tokens/primitive/`と`tokens/semantic/`、`styles/text.ts`・`layer.ts`・`animation.ts`・`keyframes.ts`、`recipes/`とその配下の`slots/`、`patterns/`、`font-assets.ts`、`conditions.ts`、`global.ts`、`preset.ts`に責務を分けます。単なる集約用の`theme.ts`やトップレベルの`slot-recipes/`は設けません。

`design-system`パッケージの`exports`は`/preset`だけです。内部のToken・Style・Recipe・Pattern・`font-assets`は個別に公開しません。styled-systemは`/css`・`/recipes`・`/patterns`・`/styles.css`の4つのエントリーポイントを公開します。生成コードが参照する内部の型やTokenヘルパーを独立したエントリーポイントにしません。ReactはComponentごとのサブパスを明示し、ルートのbarrelファイル・ワイルドカード・内部ヘルパーを公開しません。

### デザイン定義

TokenのカテゴリはPandaの標準形式を使用します。色は`colors`、角丸は`radii`、フォントは`fonts`、文字サイズは`fontSizes`、太さは`fontWeights`、行間は`lineHeights`、影は`shadows`、アニメーションの時間は`durations`、イージングは`easings`、線幅は`borderWidths`です。アイコンと操作領域の寸法は`sizes.icon`と`sizes.control`の独立したスケールとして保持します。具体値は文書へ複製しません。

PandaのSDK・Native Specには余白Tokenの負の派生値も含まれます。これはアプリケーションUI向けの選択肢ではありません。アプリケーションUIからSDKのTokenを直接参照する経路は設けず、Recipe・Patternの公開propsは用途ごとの選択肢に限定します。

重なり順は`tokens/semantic/z-index.ts`の`overlay`・`toast`で定義します。数値のPrimitiveスケールは作らず、通常コンテンツには原則として`z-index`を付けません。

Recipeはスロット・variant・状態へ適用するスタイルを定義し、DOMの組み立てと操作処理はReact実装が担当します。

### CSS・フォント・全体への適用

CSSは`@animic/styled-system/styles.css`から一度読み込みます。このエントリーポイントで生成されたフォントCSSとPanda CSSを読み込み、React固有のCSSエントリーポイントは設けません。採用フォント・フォールバックフォント・太さ・用途はDesign SystemのTypography TokenとText Styleに定義します。非公開の`font-assets.ts`はフォントTokenとFontsourceパッケージだけを対応付けます。リポジトリの生成処理がText Styleから必要なフォントと太さを導出し、styled-systemが依存するFontsource CSSの存在を確認して`generated/fonts.css`へimport文を出力します。Fontsourceの`@font-face`・`unicode-range`・バイナリを再生成しません。

フォントのデザイン判断・アセット解決・配信を分けた比較と判断変更は、[フォントの責務分割の設計事例](design-system/case-studies/font-ownership.md)を参照してください。

利用側はAnimicのUIを構成する範囲に`data-animic-root`を付けます。`preflight: false`とし、CSSの読み込みだけで`html`・`body`全体を変更しません。`global.ts`がこの範囲へ基礎のText Style・文字色・背景・`font-synthesis`を適用し、対象要素・子孫とそれぞれの疑似要素を`border-box`にします。適用範囲の外に描画されるDialog・ToastのPortalには、Recipe側で必要なText Style・`font-synthesis`・`box-sizing`を適用します。

### Reactの公開API

Panda JSX Componentsは公開・使用しません。

| サブパス                                                   | 公開するComponent・操作         | 主な契約                                                                              |
| ---------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------- |
| `text`                                                     | `Text`                          | Text Styleの`variant`、意味に応じた`tone`、`span`または`p`                            |
| `heading`                                                  | `Heading`                       | HTMLの見出しレベル`level`と表示サイズ`size`は両方必須                                 |
| `button`、`icon-button`、`link`                            | `Button`、`IconButton`、`Link`  | 操作・遷移。IconButtonは読み上げ用の`label`を必須とする                               |
| `surface`、`badge`、`separator`                            | `Surface`、`Badge`、`Separator` | 面・状態の補足・区切り。Surfaceは影や角丸を直接選ばせない                             |
| `field`、`input`、`textarea`                               | `Field`、`Input`、`Textarea`    | Fieldがラベル・説明・エラーを関連付け、コントロールを子として組み合わせる             |
| `segmented-control`                                        | `SegmentedControl`              | 値と表示名の選択肢、選択値、値だけを渡す変更通知                                      |
| `dialog`                                                   | `Dialog`                        | 開閉状態、開閉の変更通知、見出し・説明・内容、`presentation`                          |
| `toast`                                                    | `ToastProvider`、`useToast`     | 通知の表示・閉じる操作。Arkのストアは公開しない                                       |
| `avatar`、`progress`、`spinner`                            | `Avatar`、`Progress`、`Spinner` | 画像失敗時の代替、進捗率またはindeterminate状態、文言を伴う処理中表示                 |
| `stack`、`cluster`、`container`、`center`、`grid`、`split` | 同名のPatternのReact Component  | 意味のある配置だけを公開し、Containerの`size`、Gridの`columns`、Splitの`layout`は必須 |

Text・HeadingはRecipeを介さず`styles/text.ts`に定義したText Styleを使います。HTML要素の既定の`margin`をReact実装で消し、外側の余白はPatternに任せます。フォントの個別props、任意のDOM要素への置き換え、`className`・`style`・`asChild`は公開しません。入力用のrefやARIA属性は許可したDOMへ渡し、型を迂回した余分なstyling propsも実装内部で除外します。

Field内ではFieldがInput・Textareaの`id`とラベル・説明・エラーのARIA関連付けを管理します。固定IDが必要な場合はFieldの`id`へ指定し、子のInput・Textareaでは上書きしません。Fieldの外ではInput・Textarea自身の`id`・ARIA属性を使用できます。

### Ark UIとの対応

Animic側でスロット名を定義し、React実装で対応するArk UIの要素へスタイルを適用します。

| AnimicのSlot Recipe | Ark UIの内部利用       | 対応付け                                                                                        |
| ------------------- | ---------------------- | ----------------------------------------------------------------------------------------------- |
| `field`             | Field                  | `description`へHelperText、`error`へErrorText。Input・Textareaは同じFieldのコンテキストを利用   |
| `dialog`            | Dialog・Portal         | `scrim`へBackdrop、`body`へ内容領域、`close`へCloseTrigger                                      |
| `segmented-control` | SegmentGroup           | `label`へItemText、`control`へItemControl。非表示のラジオボタンでフォームとキーボード操作を維持 |
| `avatar`            | Avatar                 | 画像の読み込みと代替表示の切り替え                                                              |
| `progress`          | Progress               | `fill`へRange、`value`へValueText。割合はAnimicのCSS変数へ変換                                  |
| `toast`             | Toaster・Toast・Portal | `viewport`へToaster。内部の位置情報をAnimicのCSS変数へ対応付け、重なり順はSemantic Tokenを優先  |

ArkのAnatomy・型・状態変更の詳細情報を公開APIにしません。Toastの配置余白と重なり順もRecipeに置き、safe-areaと余白の大きい方を使用します。React実装はPortalのテキスト方向（LTR・RTL）に応じて物理方向のsafe-areaを論理方向へ対応付け、祖先の方向指定の変更にも追従します。Arkのインラインスタイルによる位置・z-index指定は除外します。

### UIからの利用

#### 通常UI

`src/routes/`・`src/features/`などのアプリケーションUIは、Panda、Design System内部の定義、styled-systemのJS/TS API、Ark UIを直接利用しません。任意のCSS、インラインスタイル、自由な`className`の上書きでDesign Systemを迂回しません。生成CSSの単一のエントリーポイントを読み込むことは、このJS/TS APIの制約と分けて扱います。

`@animic/react`は自由なCSS propsを公開せず、用途ごとのvariant・配置ルールを公開します。TypographyはText Styleを通して選び、フォント・文字サイズ・太さを個別に組み合わせません。進捗率などの実行時の値は意味のあるpropsで受け、必要なCSS変数への変換をReact実装の内部で行います。

共通UIの視覚表現と状態ごとのスタイルは`packages/design-system/src/`に置きます。DOMと操作は`packages/react/src/`、業務状態の判断と画面の組み立ては`src/routes/`・`src/features/`が担当します。機能固有のアートワーク・演出は次項のVisual領域で扱います。表現の追加・共通化は[デザイン原則](design.md#新しい表現は既存の定義から組み立てる)に従い、新しいデザイン判断は実装前に承認を得ます。

#### 機能固有のVisual

`src/features/<feature>/visuals/`を、固有のアートワーク・Motionのための限定領域とします。各機能の通常UIからこの領域の表現を利用できますが、通常UIへ低レベルのスタイリングAPIを再公開しません。

この領域では`@animic/styled-system/css`の`css()`で、`transform`、`opacity`、`clip-path`、`mask`、装飾配置、アートワークの合成、画面遷移などを扱えます。Token化に意味のない、その表現に固有の位置・寸法の値は、`top: "[-5px]"`のようなPandaのarbitrary value構文で指定します。`strictTokens`・`strictPropertyValues`は維持し、余白Tokenやその負の派生値は流用しません。装飾は可能な限り非対話的にします。

`className`には検査済みの`css({...})`を直接指定するか、同一ファイルの単純な`const artwork = css({...})`を指定します。任意のクラス文字列、テンプレートリテラル、条件合成、インポートしたクラス、未知の関数の戻り値は受け付けません。`css`関数自体の代入・受け渡し・再公開も許可しません。`import { css as draw }`のように、import宣言で指定するaliasは利用できます。

共通MotionはDesign Systemに置き、機能固有のアートワーク・演出・MotionはVisualに置きます。固有Keyframesは同じ`/css`エントリーポイントの`keyframes()`を使い、静的なフレーム定義を同一ファイルの`const`へ格納します。フレーム内にもVisualのプロパティ制限を適用します。生成名は検査済み`css()`の``animationName: `[${sparkle}]` ``として参照します。これは生成名をPandaのarbitrary valueとして渡すための形式です。任意文字列によるアニメーション名の共有、生成名の再公開、`keyframes`関数の代入・受け渡しは許可しません。`css()`内へ`@keyframes`を直接記述しません。

Button・Input・Card・Dialogなどの通常UI、色・Typography・余白の体系、角丸・影、操作状態のスタイルはこの領域へ実装しません。Panda本体やArk UIへの直接依存も許可しません。

#### 境界の検査

パッケージの`exports`が公開エントリーポイントを定め、`scripts/design-guardrails.mjs`がそれをimportできる場所を検査します。`/css`はReact実装と許可されたVisual、`/recipes`・`/patterns`はフレームワーク実装から利用します。スクリプトはインポート・再エクスポート・動的インポート・JSXを構文解析し、通常UIの`style`要素とスタイルシートを読み込む`link`も拒否します。JSX spreadはTypeScriptで解決した閉じたprops型を許可し、禁止するstyling props・`any`・index signatureを持つ型を拒否します。通常のpropsの組み合わせを一律には禁止しません。通常UIのコントロール・Typographyは公開Componentで表現します。Visualのクラス・Keyframesは前項の局所的な形式だけを検査し、関数の戻り値や別ファイルをたどる値追跡は行いません。Surfaceの`padding`は公開variantとして扱い、任意のCSSの`padding`指定とは区別します。

既存画面のCSSとそれを使うルートは、内容のハッシュを固定した限定的な例外です。例外を新しいファイルへ広げず、画面を移行する際に削除します。生成コードを除き、ディレクトリ全体を検査対象外にはしません。これはコードの契約検査であり、任意のJavaScriptを隔離するセキュリティ機構ではありません。

Visualで許可する形式を定めた比較・検証・判断変更は、[Visual / Guardrailの設計事例](design-system/case-studies/visual-guardrails.md)を参照してください。

### レスポンシブと操作状態

#### レスポンシブ

レスポンシブデザインの`base`は条件のない既定値です。特定の端末を意味しません。ブレークポイントの追加・変更もデザイン判断として扱い、アプリケーションUIで任意のメディアクエリを追加しません。

GridとSplitは、内部の外側要素をクエリコンテナ、内側要素を配置領域として利用可能な幅を測ります。Dialogはビューポート全体を占める`positioner`をクエリコンテナとし、`adaptive`では下端表示と中央表示を切り替え、`centered`では中央表示を維持します。操作ボタンの配置はDialogの責務に含めず、呼び出し側がPatternで組み合わせます。

条件は`conditions.ts`で利用先ごとに所有します。共有する値はこれらのPattern・Componentで成立を確認した条件であり、すべてのComponentに適用するブレークポイントではありません。新しい幅による配置変更を追加する場合、そのComponent・Patternが成立する条件を確認してから既存条件を再利用します。`equal` Splitも利用可能幅に応じて縦並びと等幅の2列を切り替え、DOM順は維持します。

幅条件と文字拡大時の組み合わせを判断した経緯は、[Responsive / Typographyの設計事例](design-system/case-studies/responsive-typography.md)を参照してください。

#### フォーカス

フォーカスリングは`recipes/control.ts`の共通Styleで定義し、コントロールの状態を示す境界線とは分けます。通常のフォーカス対象には`:focus-visible`、非表示のラジオボタンを含むSegmentedControlには子のラジオボタンの`:focus-visible`を検出するセレクターを利用します。フォーカスによって入力エラーを示す境界線を置き換えません。

状態の重なりやPortal・テキスト方向（LTR・RTL）を含む検証と修正の経緯は、[Interaction / Environmentの設計事例](design-system/case-studies/interaction-environment.md)を参照してください。

### 生成と開発支援

Pandaのcodegenで型付きSDKとNative Specを、cssgenでCSSを生成します。

`packages/styled-system/package.json`とCSSエントリーポイントの`styles.css`はGit管理し、`generated/`は管理しません。生成コードは手で編集せず、手順は[CONTRIBUTING.md](../CONTRIBUTING.md#design-systemの生成と検証)に従います。

Panda Native Specは、Design Systemの定義から生成する機械向けの一覧情報です。定義全体の再構築は要求せず、含まれない詳細は`packages/design-system/src/`を確認します。全体を別の独自スキーマ・JSONで再定義しません。Panda MCPは定義済みのToken・Recipe・Pattern等、Ark UI MCPは内部利用する操作APIを調べる開発支援です。AIはPanda MCPで既存の定義を調べ、不足する詳細をソースコードで確認します。`panda analyze`は実際の利用状況を調べます。MCPとanalyzeはUIの実行・ビルドに必要な依存ではありません。

## 検索とSNS共有

検索と共有の対象は[ゲーム仕様](product.md#検索とsns共有)に従います。トップ固有のcanonicalとOGPは`src/routes/index.tsx`で設定します。robots.txtとsitemap.xmlは`public/`に置き、サイトマップには公開する正規URLだけを記載します。`src/server.ts`では`animic.party`のトップだけを検索対象とし、それ以外のホスト・パスのページ・APIレスポンスに`X-Robots-Tag: noindex`を付けます。一般公開する説明ページを追加する際は、検索対象の判定とサイトマップを合わせて更新します。画像・CSS・JavaScriptなどの静的アセットは取得を許可し、トップの表示と共有に利用できるようにします。robots.txtでクロールを禁止するだけでは検索除外を保証できず、非公開情報の保護には認証・認可が必要です。

## 画面とAPIの構成

画面の要件は[ゲーム仕様](product.md#対象範囲)に従い、ルートは`src/routes/`で定義します。認証・ルーム・対戦のServer Functions、D1スキーマ、DOは画面の表示から独立させます。ブラウザ側のWebSocket接続・再接続・状態のバージョン比較は`src/features/room/room-connection.ts`に置き、表示は呼び出し側に委ねます。

APIの結合検証は画面のレイアウトやフォームに依存させません。E2E専用クライアントからServer FunctionsとWebSocketを呼び出し、通常のビルドには検証用クライアントを含めません。検証手順は[CONTRIBUTING.md](../CONTRIBUTING.md#セットアップと検証)を参照してください。

## データと入力検証

入力検証はValibotに統一します。自分たちが管理するコードではZodを使用せず、直接依存にも追加しません。外部ライブラリが内部で使用するZodの間接依存は許容します。

リレーショナルデータの永続化にはCloudflare D1、ルーム内の操作と状態の管理にはDurable Objects（以下DO）、DBスキーマとクエリの管理にはDrizzleを採用します。

### ルームと対戦の管理

1ルームを1つのDurable Objectで管理します。ルームと対戦の識別子は分け、同じルームで行う各対戦を区別します。

ルームコードは[ゲーム仕様](product.md#参加方法)の形式でサーバーが生成します。クライアントは作成操作ごとにランダムな要求IDを発行し、同じ入力の再送では同じIDを使います。サーバーは認証済み参加者ID・要求ID・衝突時の試行番号からSHA-256でコード候補を生成します。DOには作成者・要求ID・表示名を初期状態と一緒に保存し、同じ要求なら既存ルームを返します。同じ要求IDで表示名を変更した場合は拒否し、別の要求とのコード衝突では次の候補を試します。作成要求の情報は状態配信に含めず、既存のルームを上書きしません。コードはルームを指定するために使い、参加者本人の確認やホスト権限の判定には使いません。

| 管理対象                                                               | 管理先     |
| ---------------------------------------------------------------------- | ---------- |
| 匿名ユーザー・認証セッション・認証APIの回数制限                        | D1         |
| お題の情報・難易度・画像の参照先                                       | D1         |
| ルームの参加者・ホスト・準備状態・次の対戦の設定                       | ルームのDO |
| 対戦の開始時刻・生成終了時刻・生成履歴の情報・生成回数・提出・採点状態 | ルームのDO |
| 確定した対戦結果の保存・共有用の参照                                   | D1         |
| 採点ワーカー・リンクコード・採点ジョブ・採点結果                       | D1         |

DOの状態はSQLiteストレージに永続化し、再起動・再接続後にも復元します。対戦中の状態はDOで管理し、同じ状態をD1側で独立して更新しません。確定結果は対戦IDで識別してD1へ保存します。保存待ちの情報をDOに保持し、再試行しても結果が重複しないようにします。対戦の確定と保存待ちの記録をDO内の同じトランザクションで保存し、D1の`battle_result`へ対戦IDを主キーとして挿入します。D1への通信前に次の再試行を予約し、保存済みの対戦IDは上書きしません。ルームが閉じた後も保存待ちの記録は再試行の対象にします。

ルームや進行中の対戦に関わる操作は、Server Functionsから対象ルームのDOへ渡します。DOで参加資格・対戦状態・操作が可能な時間・提出済みかどうかを確認して状態を更新します。時間の判定にはサーバー側の時刻を使い、Alarmの起動時刻だけに依存しません。提出の再送やAlarmの再実行で、確定済みの状態が変わらないようにします。

生成の受付と提出の受付を分けて管理します。生成終了時刻を過ぎたら新たな生成を拒否し、画像選択の期限まで未提出者の提出を受け付けます。時間内に受け付けた生成がすべて終了したら、生成終了時刻と最後の処理終了時刻の遅い方を起点に選択期限を確定してDOへ保存します。処理完了の重複通知や再接続で選択期限を延ばしません。期限切れの参加者は未提出として確定し、画像を自動提出しません。提出要求でも期限を確認し、Alarmが遅れても締切後の提出を受け付けません。提出時刻はサーバー側で記録し、`scoring`が時間内の提出かどうかを判定できるようにします。画面の切り替えだけで生成を制限しません。

生成要求を受け付ける際は、DOで生成できるかどうかを確認し、対戦ID・参加者ID・処理ID・サーバー側の受付時刻を記録してから外部サービスを呼び出します。同じ要求の再送を新しい生成として扱わないようにします。処理IDに対応する参加者と入力のハッシュを保存し、同じIDで別の参加者や内容へ差し替えられた要求は拒否します。受付済みなら外部サービスを再度呼び出しません。時間内に受け付けた処理の完了は生成終了時刻後も反映し、未提出者の提出候補に含めます。

画像生成・AI採点などの外部通信中に、ルーム全体の処理をロックしません。結果を反映するときに対戦ID・処理ID・現在の状態を検証し、遅れて届いた結果や重複通知が別の対戦や確定済みの提出を変更しないようにします。生成の受付・処理中・成功・失敗を区別し、受付記録だけで生成完了とは扱いません。

生成の試行記録とスコア用の生成回数は区別します。試行記録には失敗も残し、スコア用の回数は[ゲーム仕様](product.md#対戦の流れ)に従って成功した生成から算出します。同じ処理の完了通知を重複して受けても二重に数えません。提出を確定するときに、その時点の成功回数・提出時刻・速度加点の対象かどうかを保存します。提出後に生成が完了しても、この記録を変更しません。

### 採点

採点は、運営者のPCで動くdesktop-comfyui-serverを採点ワーカーとして登録して実行します。採点ワーカーがAnimicへ採点ジョブを取りに来るため、採点ジョブと採点ワーカーはD1で管理します。構成は[採点の設計](scoring.md)、実行先とキューの方式を選んだ理由は[ADR 0004](decisions/0004-scoring-workers.md)を参照してください。

提出を受け付けたら、`battle`が採点エントリーを追加します。ルームのDOは採点待ちの間、Alarmで`scoring`のサーバー処理を呼び、採点ジョブを登録して状態と結果を取得し、対戦へ反映します。採点ジョブの状態は`scoring`がD1で管理し、ルームのDOが持つ対戦の採点状態とは分けます。結果を反映するときは対戦IDと採点ジョブのIDを照合し、確定済みの結果を変更しません。

採点ワーカー向けAPIは、`src/server.ts`でTanStack Startより前に振り分けます。TanStack StartのCSRF対策は、`Origin`などを持たない非GETの要求を拒否するためです。採点ワーカーはCookieを使わず、リンク時に発行した秘密情報をBearerで送るため、ブラウザ向けのCSRF対策の対象外とします。

## ファイル配置と役割

| 配置            | 役割                                                                      |
| --------------- | ------------------------------------------------------------------------- |
| `src/routes/`   | ルート定義、loader、画面の組み立て                                        |
| `src/features/` | 機能固有のUI、Visual、Server Functions、業務処理                          |
| `src/lib/`      | 参加者の識別・DB接続など、複数の機能で使う処理                            |
| `src/styles/`   | アプリケーション全体のCSS読み込み。既存画面のスタイルは移行対象ごとに整理 |

### 各featureの役割

| 配置                             | 役割                                                                 |
| -------------------------------- | -------------------------------------------------------------------- |
| `src/features/room/`             | ルーム作成・招待・参加者・ホスト・準備状態・次の対戦の設定           |
| `src/features/battle/`           | お題の選定・対戦開始・生成終了・画像選択と提出・勝敗の確定・結果表示 |
| `src/features/image-generation/` | プロンプト入力・生成サービスの呼び出し・生成履歴                     |
| `src/features/scoring/`          | 再現度評価・提出速度と生成回数を含む総合スコア計算                   |

`battle`は対戦中に生成・提出できるかどうかを判断し、スコアに使う生成回数を確定します。`image-generation`は生成処理と履歴を扱い、`scoring`は確定した提出と評価条件からスコアを算出します。生成・採点処理が独立して対戦の進行状態を変更することはありません。

ルームのDOは`room`に配置します。DOは永続化・排他制御・状態配信を担当し、対戦ルールの判断は`battle`の業務処理を呼び出して行います。`battle`から`image-generation`・`scoring`のサーバー処理を利用し、処理結果を呼び出し側が受け取って対戦へ反映します。DOクラスへ各featureの業務処理を集めず、生成・採点処理からDOを呼び出すコードも作りません。

この分割はコードの役割によるものです。featureごとにWorkerやDOを分割することは要求しません。結果画面は`battle`、招待リンクのコピーとQR表示は`room`に含めます。

## 依存関係とクライアント・サーバーの分離

- `src/routes/`から各featureのUIや処理を呼び出し、各featureから共通のUIや処理を利用します。
- 共通のコードから特定のfeatureをimportせず、循環依存も避けます。
- 画面の組み立ては`src/routes/`で行い、業務処理の連携はサーバー側で扱います。
- 通常のデータ取得・操作には`createServerFn`で定義したServer Functionsを使い、サーバー専用のコードをクライアントのバンドルに含めないようにします。ファイルの命名は[実装規約](conventions.md#クライアントとサーバーの分離)に従います。
- 入力検証・認証・認可はサーバー側で行います。画面側の遷移制御だけに依存しません。

画像生成サービスは`image-generation`のサーバー専用処理から呼び出します。Animicが管理する認証情報はサーバー側の秘密情報として保管し、クライアントのコード・レスポンス・ログには含めません。参加者の識別情報と生成サービスの認証情報を分けて扱います。

### 匿名参加のセッション

アカウントへログインしない参加者も、サーバーが発行したセッションで識別します。セッションの秘密情報と画面に公開する参加者IDは分け、表示名・ルームコード・IPアドレスだけで同じ参加者と判断しません。セッションの発行・検証・失効にはBetter Authのanonymousプラグインを使い、ユーザーとセッションをD1へ保存します。Better AuthのユーザーIDを参加者の識別に使い、DBアクセスはDrizzleアダプターを通します。接続と認証設定はリクエスト内で生成します。

認証専用の`/api/auth/$`はTanStack StartのServer Routeにマウントします。ゲームの操作はServer Functionsを使い、認証用のHTTP APIへ混在させません。画面へ返す参加者情報はIDと匿名参加かどうかに絞り、Better Authのセッション全体をルートのデータへ渡しません。SSRでのCookie更新には`tanstackStartCookies`を使います。選定理由は[ADR 0003](decisions/0003-anonymous-sessions.md)を参照してください。

セッションはCookieで送受信し、URLやlocalStorageには保存しません。本番では`HttpOnly`・`Secure`・`SameSite=Lax`・`Path=/`を指定し、`Domain`を設定せず、`__Host-`で始まるCookie名を使います。セッションを含むレスポンスや参加者固有の画面は、共有キャッシュに保存しません。

セッションの有効期限と失効状態をサーバー側で確認します。Cookieの削除だけで失効したとは扱いません。Better AuthのCookieキャッシュは使わず、D1上の状態を確認します。セッションの有効期間と更新間隔はBetter Authの標準設定に従います。匿名ユーザーの自動削除は無効にし、対戦結果の保存とは別に扱います。ルームを閉じる期限とセッションの有効期限は別に管理します。ルームの参加資格・ホスト権限はDOの現在の状態から判定し、Cookieに保存した権限を信用しません。

状態を変更するServer FunctionsはPOSTを使い、`src/start.ts`でTanStack StartのCSRF対策を明示的に設定します。認証のPOSTにも適用し、Cookieを持たない初回の匿名参加を含めて別Originからの操作を拒否します。認証APIの回数制限はD1で管理し、Cloudflareが設定する`CF-Connecting-IP`を使います。WebSocketの接続時も許可したOrigin・セッション・参加資格を確認し、セッションの期限切れや失効後は配信を止めます。

### 処理の呼び出し順序

| 用途                       | 呼び出し順序                                                          |
| -------------------------- | --------------------------------------------------------------------- |
| ルーム操作・生成要求・提出 | UI → 担当featureのServer Function → DOのRPC → 業務処理                |
| お題・保存済み結果の取得   | loaderまたはUI → 担当featureのServer Function → D1                    |
| ルーム・対戦状態の配信     | ルームのDO → WebSocket → UI                                           |
| 採点ジョブの受け渡し       | 採点ワーカー → `src/server.ts` → `scoring`のサーバー処理 → D1         |
| 採点結果の反映             | ルームのDOのAlarm → `scoring`のサーバー処理 → D1 → `battle`の業務処理 |

ルームや対戦を更新するServer Functionsは入力検証と参加者の識別を行ってDOを呼び出し、DOは対象ルームでの権限と状態遷移を検証します。参加者IDはブラウザが指定した値をそのまま信用せず、サーバー側で検証した参加者情報から取得します。保存済み結果の参照も公開範囲に応じて認可します。

依存はfeature名だけでなく、ファイルの役割で管理します。各featureの`*.functions.ts`からルームのDOを呼び出せますが、DOと業務処理は`*.functions.ts`をimportしません。DOが呼ぶ`battle`の業務処理も、DOクラスやDOを呼び出すコードをimportせず、渡された状態と入力から判断します。業務処理を呼ぶためにServer Functionsを経由することはありません。

### 状態の配信と画面表示

WebSocketは状態の配信に使い、開始・生成・提出などの操作はServer Functionsに統一します。WebSocketの接続要求はWorkerで検証してDOへ転送し、DOでもルームへの参加資格を確認します。この処理はWebSocket接続の確立に使い、開始・生成・提出などの操作を受け付けるAPIは別途作りません。DOではHibernation WebSocket APIを使います。接続要求は`/rooms/<コード>/connection`で受け、Workerが検証した参加者ID・セッションIDをDOへ渡します。ブラウザが送った同名の内部ヘッダーは上書きします。

接続の認証情報はWebSocketのattachmentに保持し、休止から復帰した場合も再取得します。状態配信の前にD1上のセッションを確認します。無通信時もAlarmを30秒間隔で予約して失効を再確認します。有効期限も予約対象にし、確認時に失効・期限切れなら接続を閉じます。通信確認のping/pongは自動応答を使い、ゲームの操作は受け付けません。

接続時・再接続時には参加者に公開できる現在の状態を取得し、以降の通知には状態のバージョン番号を付けます。初期取得と通知の順序が前後しても古い状態へ戻らないようにします。DOの内部状態を丸ごと配信せず、共有する対戦状態と本人の生成履歴を分けます。接続ごとに検証済みの参加者IDを使って配信内容を作り、他人の生成履歴・提出画像・入力ハッシュを含めません。初期取得も同じ変換を使います。

参加者の記録とWebSocketの接続状態は分けます。同じ参加者に複数の接続がある場合は、すべて切断されたときにその参加者を切断状態にします。DOの休止や再起動を参加者の切断として扱わず、接続が切れても参加記録や提出を削除しません。

ホストの引き継ぎ条件は[ゲーム仕様](product.md#ホストの退出切断)に従います。DOに参加順とホストの切断を検知した時刻・再接続を待つ期限を保存します。引き継ぎ時には現在のホストと接続状態を確認し、再接続済みの参加者や、すでに引き継ぎ済みのホストに古い切断処理を適用しません。

ルームを閉じる条件は[ゲーム仕様](product.md#ルームの終了)に従います。DOにルームを閉じる期限と閉鎖済みかどうかを保存し、期限内に参加者が再接続したら期限を解除します。接続要求でも期限と閉鎖状態を確認し、Alarmの実行が遅れても期限切れのルームには参加させません。ルームを閉じる処理でD1の保存済み結果を削除せず、D1への保存待ちの結果も保存が完了するまで保持します。

ホストの再接続を待つ期限・ルームを閉じる期限・対戦の締切・保存の再試行に使うAlarmは、ルームのDOでまとめて管理します。各期限を保存して最も早いものを予約し、処理後に次の期限を予約します。実行時に接続状態と期限を再確認し、再接続によって解除された期限は適用しません。Alarmの再実行でホストが繰り返し変わったり、閉じたルームが復活したりしないようにします。

ゲーム画面を構築する際は、同じルームURL上で待機・対戦・画像選択・結果の表示を切り替えます。`src/routes/`で`room`・`battle`・`image-generation`のUIを組み立て、サーバーが確定した状態を表示します。フォームの入力値や提出前に選んでいる画像は画面側で保持します。提出の確定・締切・勝敗はサーバー側の状態で判断します。 残り時間は配信時のサーバー時刻と期限を基準に表示し、受信後の経過時間にはブラウザーの単調増加時計を使います。端末の時計設定を締切判定に使わず、表示が0秒になったことだけで提出状態を確定しません。

### DBアクセスの配置

`src/lib/`にはD1接続など、複数の機能で使う処理を置き、機能固有のDrizzleスキーマ・クエリは担当するfeature内に置きます。お題と保存済み結果は`battle`、DO内のルームと対戦の永続化は`room`、採点ワーカー・採点ジョブ・採点結果は`scoring`が担当します。DBクライアントと業務処理を一律の共通repository層に集約しません。

`src/server.ts`では、通常のリクエストをTanStack Startに渡し、採点ワーカー向けAPIを`scoring`に渡し、WebSocket接続をDOに転送し、DOクラスをexportします。アプリをフロントエンドと独立した業務APIサーバーへ分割しません。

## 参加者と対戦の関係

ルームには複数の参加者と、そのルームで行った対戦を紐づけます。ルームの現在の参加者と、個々の対戦への参加記録は分けます。途中参加ではルームの参加者だけを追加し、開始済みの対戦への参加記録は追加しません。再接続時はサーバーで確認した参加者情報から既存の対戦への参加記録を取得します。退出や次の対戦への参加によって、過去の対戦の参加記録・提出・結果が変わらないようにします。

準備状態と次の対戦の設定はルーム側で管理します。開始時にはDOで接続中のルーム参加者を取得し、[ゲーム仕様](product.md#対象範囲)の人数条件を確認して、参加者・お題・対戦条件・開始時刻・生成終了時刻をその対戦の記録として確定します。人数条件は開始時の業務ルールとして扱い、保存スキーマは2人に固定しません。ルーム側の設定変更が進行中・終了済みの対戦へ遡って適用されないようにします。開始要求には直前の対戦ID（初回はnull）を含めます。DOで現在の対戦と結果の確定を確認してから新しい対戦を作成し、再送で二重作成したり、古い画面から進行中の対戦を置き換えたりしないようにします。設定変更にも同じ対戦IDの確認を適用します。再戦では現在接続中のルーム参加者を対象に新たな対戦ID・履歴・締切を作り、前の結果とD1への保存待ちの記録を保持します。準備状態は開始時にリセットします。

お題はD1に事前登録した画像から、指定した難易度に一致するものをランダムに選びます。該当するお題がない場合は開始しません。D1からのお題取得後、DOでホスト権限・参加人数・対戦状態・設定を再確認して開始を確定します。取得中にホストや設定が変わった場合は、古い要求で開始しません。

生成履歴・提出・スコアは、対戦と参加者の組み合わせに紐づけます。同じ参加者でも対戦ごとに別の記録とし、提出はその対戦で本人が生成した画像から選びます。

対戦と参加者の関係は人数が増えても扱えるデータ構造にし、`player1`・`player2`の固定フィールドや、2人限定のスキーマ制約は設けません。開始できる条件などの対戦ルールと、データ構造を分けて扱います。

## 関連資料

- [ゲーム仕様](product.md)
- [採点の設計](scoring.md)
- [実装規約](conventions.md)
- [CONTRIBUTING.md](../CONTRIBUTING.md)
- [TanStack Start: Server Functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions)
- [TanStack Start: Import Protection](https://tanstack.com/start/latest/docs/framework/react/guide/import-protection)
- [TanStack Start: Authentication](https://tanstack.com/start/latest/docs/framework/react/guide/authentication)
- [OWASP: Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP: WebSocket Security](https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html)
- [Valibot](https://valibot.dev/guides/introduction/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Durable Objectsの設計原則](https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/)
- [Durable ObjectsのAlarms](https://developers.cloudflare.com/durable-objects/api/alarms/)
- [Durable ObjectsのRPC](https://developers.cloudflare.com/durable-objects/best-practices/create-durable-object-stubs-and-send-requests/)
- [Durable ObjectsのWebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/)
- [Drizzle: Cloudflare D1](https://orm.drizzle.team/docs/sqlite/connect-cloudflare-d1)
