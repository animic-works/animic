# アーキテクチャ

## 基本方針

TanStack Startのフルスタック構成で、機能単位で関連するコードをまとめます。アプリ内の業務APIはServer Functionsを使います。

各機能の役割と依存関係に合わせてコードを配置します。UIのスタイルはPandaを基盤とするデザインシステムで定義し、React実装ではArk UIを内部利用します。Cloudflareにデプロイする構成とし、依存パッケージのバージョン管理は[CONTRIBUTING.md](../CONTRIBUTING.md#依存関係とgitで管理するファイル)に従います。

## デザインシステム

[デザイン原則](design.md)を基準に、具体的なデザイン定義を`packages/design-system/src/`に置きます。`src/routes/`・`src/features/`のUIと、これらのパッケージを利用する外部アプリケーションは同じ定義を使います。デザインを変更する際は、このリポジトリの定義を変更してから各アプリケーションへ反映します。

パッケージを分ける理由は[ADR 0009](decisions/0009-design-system.md)、Pandaのメジャーバージョンの選定は[ADR 0010](decisions/0010-panda-css-v2.md)を参照してください。

### パッケージと依存関係

| 配置                                                                | 責務                                                                                        | 許可する依存                                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `packages/design-system/`                                           | Primitive・Semantic Tokens、Styles、Recipes、Patterns、Conditions、GlobalをPresetとして定義 | Panda。UIフレームワーク・Ark UIには依存しない                                            |
| `packages/styled-system/`                                           | Pandaが生成する型付きスタイリングAPI、CSS、フォントアセットの配信                           | 生成結果とFontsource。デザインシステム・UIフレームワーク・Ark UIへの実行時の依存関係なし |
| `packages/react/`                                                   | DOMの組み立て、キーボード操作、フォーカス管理、ARIAの関連付け                               | styled-system、React、Ark UI                                                             |
| `src/routes/`・`src/features/`、Reactを利用する外部アプリケーション | 業務状態の判断と、それに応じた画面の組み立て                                                | `@animic/react`の公開サブパス                                                            |

`design-system`パッケージは`tokens/primitive/`と`tokens/semantic/`、`styles/text.ts`・`layer.ts`・`animation.ts`・`keyframes.ts`、`recipes/`とその配下の`slots/`、`patterns/`、`font-assets.ts`、`conditions.ts`、`global.ts`、`preset.ts`に責務を分けます。単なる集約用の`theme.ts`やトップレベルの`slot-recipes/`は設けません。

`design-system`パッケージの`exports`は`/preset`だけです。内部のToken・Style・Recipe・Pattern・`font-assets`は個別に公開しません。styled-systemは`/css`・`/recipes`・`/patterns`・`/styles.css`の4つのエントリーポイントを公開します。生成コードが参照する内部の型やTokenヘルパーを独立したエントリーポイントにしません。ReactはComponentごとのサブパスを明示し、ルートのbarrelファイル・ワイルドカード・内部ヘルパーを公開しません。

### デザイン定義

TokenのカテゴリはPandaの標準形式を使用します。色は`colors`、角丸は`radii`、フォントは`fonts`、文字サイズは`fontSizes`、太さは`fontWeights`、行間は`lineHeights`、影は`shadows`、アニメーションの時間は`durations`、イージングは`easings`、線幅は`borderWidths`です。アイコンと操作領域の寸法は`sizes.icon`と`sizes.control`の独立したスケールとして保持します。具体値は文書へ複製しません。

PandaのSDK・Native Specには余白Tokenの負の派生値も含まれます。これはアプリケーションUI向けの選択肢ではありません。アプリケーションUIからSDKのTokenを直接参照する経路は設けず、Recipe・Patternの公開propsは用途ごとの選択肢に限定します。

ページ全体の重なり順は`tokens/semantic/z-index.ts`の`navigation`・`scrollbar`・`overlay`・`toast`で定義します。数値のPrimitiveスケールは作らず、通常コンテンツには原則として`z-index`を付けません。Layer内の背景・装飾・内容は独立した重なりの範囲を作り、その中だけで順序を管理します。

Recipeはスロット・variant・状態へ適用するスタイルを定義し、DOMの組み立てと操作処理はReact実装が担当します。

### CSS・フォント・全体への適用

CSSは`@animic/styled-system/styles.css`から一度読み込みます。このエントリーポイントで生成されたフォントCSSとPanda CSSを読み込み、React固有のCSSエントリーポイントは設けません。TanStack Startでは`src/routes/__root.tsx`がこのCSSを`?url`で解決し、`head().links`へstylesheetとして渡します。SSRから同じCSSを保持し、開発時にもクライアント側のCSS挿入・SSR用CSS撤去によってフォント定義を作り直しません。`vite.config.ts`では不要になった開発用CSS収集を`dev.ssrStyles.enabled: false`で無効にします。採用フォント・フォールバックフォント・太さ・正体と斜体・用途はデザインシステムのTypography TokenとText Styleに定義します。非公開の`font-assets.ts`はフォントTokenとFontsourceパッケージだけを対応付けます。リポジトリの生成処理がText Styleから必要なフォント・太さ・`fontStyle`を導出し、styled-systemが依存するFontsource CSSへのimportを`generated/fonts.css`へ出力します。`fontStyle`の省略時は`normal`とし、斜体は実際のitalicアセットを使います。Fontsourceのface定義・`unicode-range`・`font-display: swap`をそのまま利用し、フォント取得中も代替書体で文字を表示します。日本語の代替書体は、採用書体に近い全角字幅を持つOS書体を明示し、汎用sans-serifの選択による折り返しの変化を抑えます。初回の遅い通信では書体の切り替えが起こり得ます。画面全体の表示をフォント読み込み待ちにせず、通常のブラウザキャッシュを利用します。フォントバイナリや文字の範囲を独自に再生成しません。

ホームのキャッチコピーだけは、本文より前に登録したMutationObserverでHeadingの追加を検出し、初回描画前に実際の書体と文字列を確認します。本文の途中に同期スクリプトを挟まず、HTMLの解析を分断しません。必要なフォントが未取得なら文字と下線を一組で待機させ、取得後に一度フェード表示します。確認時点でフォントが取得済みの場合とreduced motionではフェードしません。待機に入った場合は、Paint Timing APIの結果にかかわらずフェードします。待機時間には上限を設け、取得失敗でも表示を復帰します。この演出はホームのVisualが所有し、本文・ナビ・ボタンのフォント表示には適用しません。

フォントのデザイン判断・アセット解決・配信を分けた比較と判断変更は、[フォントの責務分割の設計事例](design-system/case-studies/font-ownership.md)を参照してください。

利用側はAnimicのUIを構成する範囲に`data-animic-root`を付けます。`preflight: false`とし、CSSの読み込みだけで`html`・`body`全体を変更しません。`global.ts`がこの範囲へ基礎のText Style・文字色・背景・`font-synthesis`を適用し、対象要素・子孫とそれぞれの疑似要素を`border-box`にします。適用範囲の外に描画されるDialog・Popover・ToastのPortalには、Recipe側で必要なText Style・`font-synthesis`・`box-sizing`を適用します。

文書全体を構成する場合は`Page`を使えます。`Page`は基礎設定の適用範囲と文書用の`data-animic-page`を付け、`body`の既定の余白を消します。`scroll="sections"`を指定した場合だけ、文書にCSS Scroll Snapを適用します。スクロールの所有者は文書のままとし、ホイール・タッチ・慣性スクロールをJavaScriptで置き換えません。ページ内へUIの一部を埋め込む用途には`Page`を使いません。

アプリ全体を`UIProvider`（`/ui-provider`）で一度包み、SSRの`head`には同じサブパスの`UIScript`を配置します。Providerは文書内とPortalの操作方法を追跡し、文書のオーバーレイスクロールバーを管理します。スクリプトは初回描画前にネイティブバーの表示を切り替え、本文の幅を後から変更しません。JavaScript無効時・起動失敗時とforced-colorsではネイティブ表示を使います。スクリプトが変更する`html`の属性だけはhydrationの比較対象から外します。余白の予約やDialogごとの横位置補正は行いません。

### Reactの公開API

Panda JSX Componentsは公開・使用しません。Textの`wrap="balance"`は短い説明の行長を揃え、語句のまとまりを保って折り返します。

| サブパス                                                   | 公開するComponent・操作                                            | 主な契約                                                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `text`                                                     | `Text`                                                             | Text Styleの`variant`、意味に応じた`tone`、強調の`emphasis`、`span`または`p`             |
| `heading`                                                  | `Heading`                                                          | HTMLの見出しレベル`level`と表示サイズ`size`は両方必須                                    |
| `button`、`icon-button`、`link`                            | `Button`、`IconButton`、`Link`・`ButtonLink`                       | 操作・遷移。IconButtonは読み上げ用の`label`を必須とする                                  |
| `surface`、`badge`、`separator`                            | `Surface`、`Badge`、`Separator`                                    | 面・状態の補足・区切り。Surfaceは影や角丸を直接選ばせない                                |
| `notice`                                                   | `Notice`                                                           | アイコン・見出し・説明・任意の操作をまとめる案内。処理や自動読み上げは持たない           |
| `output-panel`                                             | `OutputPanel`・`OutputTags`                                        | 見出し付きの出力欄と、ラベル・値・強調状態を持つ読み取り専用のタグ群                     |
| `data-table`                                               | `DataTable`・`DataTableColumn`                                     | 行データ・列見出し・セル表示・安定した行キー。表のセマンティクスと横スクロールを管理する |
| `status-label`                                             | `StatusLabel`                                                      | 状態の文言と識別用の丸。判定と人数などの内容は利用側が持つ                               |
| `field`、`input`、`textarea`                               | `Field`、`Input`、`Textarea`                                       | Fieldがラベル・説明・エラーを関連付け、コントロールを子として組み合わせる                |
| `segmented-control`                                        | `SegmentedControl`                                                 | 値と表示名の選択肢、選択値、値だけを渡す変更通知                                         |
| `dialog`                                                   | `Dialog`                                                           | 開閉状態、開閉の変更通知、見出し・説明・内容、`presentation`・`size`・`titleAlign`       |
| `toast`                                                    | `ToastProvider`、`useToast`                                        | 通知の表示と時間による消去。新しい通知は前の通知を置き換える。Arkのストアは公開しない    |
| `avatar`、`progress`、`spinner`                            | `Avatar`、`Progress`、`Spinner`                                    | 画像失敗時の代替、進捗率またはindeterminate状態、文言を伴う処理中表示                    |
| `stack`、`cluster`、`container`、`center`、`grid`、`split` | 同名のPatternのReact Component                                     | 意味のある配置だけを公開し、Containerの`size`、Gridの`columns`、Splitの`layout`は必須    |
| `code-input`                                               | `CodeInput`                                                        | 単一の入力欄と文字ごとの表示枠。ラベル・説明・エラーはFieldと組み合わせる                |
| `popover`                                                  | `Popover`                                                          | 操作で開閉する補足情報。トリガーの内容、読み上げ名、見出し、開閉状態を受ける             |
| `meter`                                                    | `Meter`                                                            | 確定した評価値などの0〜100の量と読み上げ用の値。処理の進行にはProgressを使う             |
| `carousel`                                                 | `Carousel`、`CarouselViewport`、`CarouselItem`、`CarouselControls` | 選択位置・件数・変更通知、表示領域と操作領域。自動再生はしない                           |
| `navigation-bar`                                           | `NavigationBar`、`NavigationBarLabel`                              | 固定ナビゲーションのリンク・ブランド・操作領域。現在位置と遷移先は利用側が判断する       |
| `page`、`section`、`action-group`、`image-pair`            | 同名のPatternのReact Component                                     | 文書全体、セクション、操作の組、比較する画像の2列配置                                    |
| `media-object`                                             | `MediaObject`                                                      | 画像・アイコンと本文を横並び・縦並びに配置する                                           |
| `section-navigation`                                       | `SectionNavigation`                                                | ページ内リンクと現在位置。移動先とスクロール処理は利用側が持つ                           |
| `layer`                                                    | `Layer`、`LayerItem`                                               | 背景・装飾・内容の重なりと縦並び。装飾の内容や座標は持たない                             |

画面を構成するComponentも、それぞれの公開サブパスから使います。

| サブパス                                                 | 公開するComponent                                                                                        | 主な契約                                                                                                      |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `app-frame`、`focus-layout`、`document-layout`           | AppFrame・AppFrameWideContent・FocusLayout・FocusLayoutBrand・DocumentLayout                             | ヘッダー、操作、本文、装飾などの配置。画面名や遷移先は持たない                                                |
| `workspace`、`composer`                                  | Workspace・Composer                                                                                      | 編集領域とプレビュー、入力のまとまり。Workspaceは狭い画面で編集領域を開閉し、短い画面では通常の流れに配置する |
| `comparison`、`comparison-stage`                         | Comparison・ComparisonStage                                                                              | 比較する2つの内容、補助情報、履歴・操作の配置                                                                 |
| `media`                                                  | Media・MediaPlaceholder                                                                                  | 画像・比率・キャプション・未表示状態・拡大の操作通知                                                          |
| `tile-collection`、`record-list`、`stat-group`、`podium` | TileCollection・Tile・RecordList・RecordItem・StatGroup・Podium                                          | 項目・記録・集計値・順位の表示。値の算出は利用側の責務                                                        |
| `avatar-group`、`readout`、`progress-list`               | AvatarGroup・Readout・ProgressList                                                                       | 名前と状態の組、強調する値、グループ化した処理手順と現在位置                                                  |
| `provider-button`、`switch`、`file-button`               | ProviderButton・Switch・FileButton                                                                       | 認証サービスの外観を持つ操作、二値選択、ファイル選択。認証・保存・画像加工は行わない                          |
| `token-input`                                            | TokenInput・AdjustableToken                                                                              | 候補付き文字入力、確定・削除・重み変更の通知。辞書とプロンプト構文は持たない                                  |
| `collection-browser`、`choice-card`、`thumbnail-list`    | CollectionBrowser・ChoiceCard・ThumbnailList                                                             | 検索・カテゴリの配置、候補の選択状態、画像履歴の単一選択                                                      |
| `code-display`、`qr-code`                                | CodeDisplay・QrCode                                                                                      | コードとコピー操作、URLのQR表示。招待URLの作成は利用側が行う                                                  |
| `article`、`footer`、`action-bar`                        | Article・ArticleSection・ArticleParagraph・ArticleList・ArticleTable・TableOfContents・Footer・ActionBar | 長文・目次・フッター・狭い画面で下端に置く操作と要約                                                          |

Textの`eyebrow.strong`は強い小見出し、`label.display`は大きく見せる短いラベルです。`emphasis="outline"`は文字の輪郭を残し、forced-colorsでは塗り文字に戻します。SegmentedControlは選択肢だけでなく、グループの読み上げ名と表示ラベルを管理します。既定ではラベルを視覚的に隠し、`labelVisibility="visible"`で表示します。`labelPlacement="inline"`はラベル列と選択肢列を揃え、配置領域が狭い場合は縦に積みます。`appearance="pill"`の選択肢は利用可能幅を等分し、`density="compact"`は編集ツールなどの小さな選択操作に使います。選択肢の`label`は名前、`leadingIcon`は装飾アイコン、`markerTone`は識別用の丸の配色、`detail`は件数などの補足表示を受けます。アイコンや色だけで選択肢を識別させず、値・文言・集計は利用側が決めます。

Progressは`presentation="track"`でも読み上げ名と進捗率を保ち、文字を併記しない表示を選べます。`tone`による配色と`striped`による縞の動きを独立して指定します。割合は小数を保持し、縞とグラデーションを縮めず表示範囲だけを切り取ります。Meterは確定値の測定、ProgressListは手順ごとの状態を表し、処理や評価の計算は持ちません。Readoutは短いラベルと値をまとめ、`presentation="stamp"`は傾けた輪郭の強調に切り替えます。`format="clock"`は数字と区切りの幅を固定し、読み上げには分割前の値を使います。ProgressとReadoutの`emphasis="urgent"`は視覚的な強調を表し、reduced motionでは点滅・脈動を止めます。配色や強調を切り替える条件、時間の計算は利用側に置きます。AvatarButton（`/avatar`）はアバターを選択・編集する操作で、読み上げ名を必須とします。`selected`を指定した場合は選択状態を外周と`aria-pressed`で示します。AvatarとAvatarButtonの`size="fill"`は親の幅に合わせて正方形を保ち、`fluid`は表示領域に応じた寸法を使います。Avatarの`status`と任意の`badge`は同じ位置を使うため、同時に指定しません。FileButtonは単一選択の`onFile`と、`multiple`を有効にした複数選択の`onFiles`を区別します。選択後に同じファイルを選び直せるよう入力をリセットし、ファイルの検証・変換・保存は利用側へ渡します。Dialogの`footer`は下部の補足・操作を区切り線とともに配置し、`headerActions`は見出しと並ぶ補助操作を受けます。`headerMedia`は見出しより前の画像などを受けます。指定した場合は閉じる操作と重ならない余白を画像の上に確保し、見出しの幅を狭めません。見出しと説明のARIA関連付けは維持し、画像の内容・読み上げ名は利用側が指定します。

`Lead`（`/lead`）は導入文と結びの文を組み合わせ、狭い画面では縦の色帯と語句の強調を加えます。`span`による語句のまとまり、`strong`と`mark`の強調をRecipeで扱います。文言と区切りは利用側が持ちます。

`Overlay`（`/overlay`）は画面全体の非対話的な演出をPortalに描画します。全画面の配置とSemantic Tokenによる積層はPattern、Portalと読み上げ・操作対象からの除外はReact実装、描画内容とMotionは利用側のVisualが担当します。入力や操作を含む表示にはDialogを使います。全画面の演出に操作を重ねる場合は`presentation="fullscreen"`と`appearance="transparent"`を組み合わせ、`footer`へ操作を渡します。内容側に見出しを表示する場合は`titleVisibility="hidden"`で視覚的な重複を避け、Dialogの読み上げ名とフォーカスの管理を維持します。全画面でも内容が画面を超えた場合はスクロールでき、装飾のはみ出しはVisual内で切り取ります。

Text・HeadingのTypographyは`styles/text.ts`のText Styleが所有します。TextのRecipeはvariant・色・文字揃え・強調、HeadingのRecipeは各サイズをText Styleへ対応付け、`outlined`による文字の縁取りを加えます。HTML要素の既定の`margin`を消し、外側の余白はPatternに任せます。Headingの内容が画像またはSVGだけの場合はブロックとして配置し、文字のベースラインに由来する隙間を作りません。フォントの個別props、任意のDOM要素への置き換え、`className`・`style`・`asChild`は公開しません。入力用のrefやARIA属性は許可したDOMへ渡し、型を迂回した余分なstyling propsも実装内部で除外します。

Containerは既定で左右のページ余白を持ちます。外側ですでに余白を確保している場合は`gutter="none"`で重複を避け、最大幅の制約を維持します。

AppFrameはブランドだけのヘッダーで本文幅が制限されている場合、広い画面ではブランドと本文を同じ行へ置きます。左右に同じ幅を確保して本文の中央を保ち、余裕がない幅ではヘッダーと本文を縦に積みます。画面名による分岐や利用側の位置補正は持ちません。

FocusLayoutとDocumentLayoutは、内部のLayoutHeaderと`layout-header` Recipeで戻る操作・コンパクト見出しの配置を共有します。画面端からの距離、ヘッダーの高さ、左右対称の見出し領域、safe-areaはこの定義が所有します。FocusLayoutは背景に重ね、DocumentLayoutは狭い画面で本文に追従する帯として表示します。戻る先・履歴操作・ラベルは利用側で判断し、アプリのPageBackButtonで文字付きの戻る操作を揃えます。

Textの`variant="inherit"`は親の書体・大きさ・太さ・行間などを引き継ぎ、`tone`と`emphasis`で指定した部分だけを変更します。見出し内の一部を強調するときにも、本文のText Styleへ戻しません。Headingの`size="fluid"`は画面に応じて大きさを調整する表示用見出しです。本文の大きさや表示・非表示には影響しません。`size="statement"`は短い結論や結果を大きく伝える表示用見出しで、手順の番号に使う`ordinal`とは区別します。

Field内ではFieldがInput・Textarea・CodeInputの`id`とラベル・説明・エラーのARIA関連付けを管理します。固定IDが必要な場合はFieldの`id`へ指定し、子のコントロールでは上書きしません。Fieldの外ではコントロール自身の`id`・ARIA属性を使用できます。

CodeInputは単一の入力欄を使い、文字ごとの枠は表示だけを担当します。文字数、値、変更通知、不正な文字の位置を受け、コードの正規化・使用可能文字・送信可否は利用側が判断します。既定の`editing="selection"`は途中の文字選択と編集に対応します。`editing="append"`は入力・クリック・再フォーカス時に末尾へ揃え、矢印キーによる入力位置の移動を止めます。全選択からの置き換えと貼り付けは維持します。現在の入力位置はセルの枠とキャレットで示し、キーボードで移動したときだけ補助のリングを加えます。入力全体への外枠とは重ねません。CodeInputとCodeDisplayの1文字枠は内部の`code-character`定義で書体・行間・字間と中央配置を共有します。寸法・入力状態・確定演出はそれぞれのRecipeが持ちます。CodeDisplayは`presentation`で幅に応じた切り替え・常時枠付き・文中表示を選び、ルームコードは各画面でこの部品を使います。`settledCount`は順に確定する値の表示を受け、コードの発行や確定の時刻は利用側が持ちます。

ButtonとButtonLink（`/link`）は同じRecipeとアイコン・ラベル構造を使います。Buttonは操作、ButtonLinkは`href`を必須とする遷移です。`appearance`で役割、`size`で寸法、`shape`で輪郭、`prominence`で影を指定します。Dialog内では共通の非公開CSS変数で装飾の外縁と影を抑え、キーボードフォーカスやsecondaryの輪郭とは分けて扱います。標準の`primary`は明るいピンクと白文字、`secondary`は白い面と輪郭、`inverse`は濃い面と白文字、`soft`は淡い面、`quiet`は背景を持たない補助操作です。`outlined`は控えめな輪郭の補助操作で、`aria-pressed`による選択を反転色で示します。`overlay`はアートワーク上の半透明の操作で、ホバーとキーボードフォーカスを背景の濃さで示します。小さな補助操作には`size="xs"`を使います。役割・寸法・輪郭・影を独立して指定し、その組み合わせのデザイン定義はRecipeが所有します。`size="hero"`は表示領域に応じて寸法を調整し、色・形・装飾の選択は維持します。`compactLabel`は表示する短いラベルを受けます。読み上げ名が変わらないよう、必要なら`aria-label`を指定します。`leadingIcon`・`trailingIcon`は装飾用で、操作名は文字ラベルが担います。アイコンと文字は一組として中央に配置し、文字の領域だけを余った幅へ引き伸ばしません。

コントラストの許容範囲と検査の扱いは[デザイン原則](design.md#コントラストの扱い)に従います。`feedback="press"`はクリック時の短い縮小アニメーションで、reduced motionでは再生しません。Linkの`inverse`は濃い背景のコンパクトな遷移操作です。

Surfaceの`card`・`illustrated`は共通の面の定義を使い、内側余白を外観とは独立して指定します。`content`・`section`・`frame`などの余白の選択肢は、それぞれの配置密度を表します。`adaptive`の条件による扱いは[レスポンシブ](#レスポンシブ)を参照してください。Mediaの`captioned`は画像上のぼかした説明帯と寸法制約を持ち、文言や難易度の判断は利用側が組み立てます。`appearance`は通常・白枠・強調枠、`size="preview"`は確認用の小さい画像を表し、比率とは独立して指定します。MediaPlaceholderの`footer`には進行などの補足を配置できます。ChoiceCardのプレビューには画像URLの`src`か、画像未登録の案内など非対話的な内容の`media`を指定し、両方は指定しません。選択状態は`selected`で受け、輪郭・チェックと`aria-pressed`で示します。プレビューの内容と選択の意味は利用側が持ちます。Spinnerは寸法と配色を独立して選び、`labelVisibility="hidden"`でも読み上げ名を保持します。Badgeの`glass`は画像上の透過ラベル、`sticker`は傾けた強調、`stamp`は押印状の強調、`translucent`は濃い背景上の補足を表します。これらの固有の配色へ`tone`を重ねず、状態に応じた色は標準外観の`tone`で指定します。配置方向は親のPatternに従います。Badgeの`annotation`は画像上の対象などへ付ける、等幅書体の短い注釈です。Badgeは状態の補足に使い、`shape="rounded"`は浅い角丸、`highlight`は黄色の強調を選びます。StatusLabelは丸と文言を横に揃え、`appearance="badge"`では背景付きの補足として表示します。丸は文字グリフを使わず、状態の文字色と識別色を別のSemantic Tokenで持ちます。状態の判定は利用側の責務です。Avatarの代替文字は表示用書体で揃え、代替文字・補足アイコン・配色・外周の強調は公開propsで指定し、名前や認証サービスとの対応付けは利用側が担当します。`status`は待機・処理中・完了・未完了の視覚表現を受け、実際の状態判定と状態を説明する文言は利用側に置きます。AvatarGroupの`expanded`は横にスクロールできる状態一覧、既定の`compact`はヘッダーなどの短い一覧です。compactの名前と状態は一覧自身の利用可能幅に応じて省略し、expandedでは維持します。一覧自身もキーボードフォーカスを受け、横にはみ出した項目へ移動できます。項目の`state`は待機・処理中・完了、`value`は数値、`marker`は短い補足を受けます。人数や並べ替え、進行の判定は持ちません。

SegmentedControlの`appearance`は選択肢の形、`enclosure`は選択肢全体を包む面と輪郭を選びます。`enclosure="outlined"`は白い面と輪郭を持ち、選択肢自身の選択状態とは独立しています。StatGroupは集計値専用のText Styleで数値を表示し、幅に応じて項目の列数を減らします。順位の短い表記にはTextの`numeric.rank`を使います。

Fieldの`messageAlign`は説明とエラーの文字揃えを指定します。`messageLayout="status"`は入力中の短い案内とエラーを同じ場所で切り替え、空の説明にも1行分の高さを確保します。エラーを説明より優先し、接頭辞などの文言は自動で足しません。既定の`stacked`では説明とエラーを併記できます。Dialogの小型カード（`size="compact"`）は見出しと説明を既定で中央に揃えます。標準サイズと拡張サイズでは開始端に揃え、`titleAlign`は意図的に既定と異なる配置にする場合だけ指定します。中央揃えでは閉じるボタンの有無に応じて左右の余白を対称に保ちます。Dialogは既定で閉じるボタンを表示し、本文に閉じる操作を配置する場合は`closeButton={false}`を指定できます。Escapeとフォーカスの復帰は維持します。

Fieldの`labelVisibility`とDialog・Popoverの`titleVisibility`は、近接する説明や内容に同じ名前がある場合に視覚的な重複を避けます。`hidden`でも読み上げ名との関連付けを保ちます。Dialogでは見出しだけを視覚的に隠し、`headerActions`の入力や操作は隠しません。`size`はカードの寸法を指定するため、`presentation="fullscreen"`とは組み合わせません。

Carouselは重ねたスライドをtransformで配置するため、スクロール位置とsnapを管理するArk Carouselは組み込みません。両者の移動処理を重ねず、非表示項目のinert・ARIAと操作をReact実装で管理します。Carouselは表示中の要素だけを操作・読み上げの対象にし、循環する前後操作、キーボード、横方向のスワイプを提供します。縦方向のスクロールは妨げません。`preview`は隣接する項目の一部を表示し、その項目をクリックしても選択できます。CarouselViewportの`transition="replace"`は横移動なしで内容を切り替え、画像自体の演出と組み合わせられます。CarouselControlsの`placement="sides"`は広い画面で前後の操作を表示領域の両側へ置きます。内容や業務状態の切り替えは利用側が持ち、遷移時間とreduced motion時の表示はRecipeで定義します。

Comparisonは画像とキャプションを別の行として揃え、説明の長さで画像の位置をずらしません。画像自身が比率を持ち、比較欄は画像の比率や説明の高さを仮定して寸法を逆算しません。内容で高さが決まる領域にサイズ包含を使いません。Workspaceは自身の幅と文字サイズに応じて編集・比較領域を横並びから縦並びへ切り替えます。ヘッダーと本文は、横に並べるために必要な幅を同じコンテナ条件で判定します。短い横長画面では、本文が成立する幅を確保したうえで編集・比較領域を横に並べます。ロゴの縮小は、本文の段組みとは別に狭い幅や低い高さに応じて行います。狭く高さのある画面では比較欄の内容に必要な高さを確保し、その下の領域へ編集欄を配置します。編集欄を本文の上へ重ねたり、その高さを余白で補いません。短い画面や内容が収まらない場合は文書の流れでスクロールでき、固定高の外へ内容だけをはみ出させません。ComparisonStageは自身の利用可能な幅に応じて、2つの比較対象の間に本文を置く構成から、比較対象を上段・本文を下段へ置く構成に切り替えます。Podiumは項目が1つや2つでも先頭を中央に保ち、次点を左・右へ配置します。MediaとPodium、RecordList、ThumbnailListの各項目は`entering`を指定したときだけ登場を再生します。新しく追加された項目か、再読み込みで復元した項目かの判断は利用側が持ちます。RecordListの登場は待機時間を持たず、結果発表の待ち時間と各行の開始順序は機能側のVisualが所有します。ThumbnailListは用途を固定せず、一覧とスクロール領域の読み上げ名を`label`で受けます。

Button・IconButton・ProviderButton・FileButtonの`loading`は処理待ちを表し、通常の色・影・フォーカスを維持したまま再実行を止めます。`disabled`は入力条件不足や権限などによる操作不可を表し、無効色とnative disabledを使います。処理待ちを`disabled`へ混ぜず、両方指定された場合は操作不可を優先します。認証ボタンのように別の操作を待つ場合も`aria-busy`で共通の待機処理を使えます。待機の開始・終了は利用側、クリック・キーボード・送信の抑止と状態のARIA表現は共通部品が担当します。

Noticeは説明・任意の`title`・`icon`と`actions`をまとめます。短い通知は見出しなしで示せます。`tone`は通常の案内・補足・成功・失敗、`density`は情報の密度を選びます。操作が本文を圧迫する幅では、その操作を次の行へ配置します。保存・認証などの状態判断、文言、遷移先は利用側が持ちます。

DataTableは列見出しと行データを表として関連付け、`rowHeader`を指定した列を行見出しにします。幅が足りない場合は表自身をキーボードでも横スクロールでき、ページ全体をはみ出させません。データの取得・並べ替え・操作の意味は利用側が持ちます。

OutputPanelは濃い背景の見出しと内容を分け、長い出力をキーボードでもスクロールできる領域へ収めます。OutputTagsはタグ群を利用可能な幅に応じて並べ、ラベル・値・強調状態を受けます。値の計算や逐次表示の時刻は利用側が持ちます。Meterの`appearance="inverse"`は濃い背景に合わせた外観を選びます。

TokenInputはArk Comboboxで候補の開閉・ハイライト・画面内への追従・ARIAを管理します。Enterと前進するTabは表示中の候補を確定し、Shift+Tabは前の操作へ移動します。候補がなければEnterで入力の確定を通知します。Escapeで閉じた後は再入力で開きます。IME変換中のEnterは入力の確定・候補の選択・送信として扱いません。変換中に前進するTabで候補を選んだ場合は、変換終了を待って候補の採用を通知します。確定済みの語句・重み・辞書・構文は利用側が持ち、AdjustableTokenは編集と増減を通知します。TagsInputの値管理は持ち込みません。`commitOnBlur`を指定した場合はフォーカスを離れると入力の確定を通知します。`onSubmitShortcut`は修飾キー付きEnterを候補選択と分けて通知し、実際の送信可否は利用側で判断します。候補の読み上げ名は文字列の`label`で保ち、表示の強調や補足は`labelContent`・`detail`で受けます。`font`は通常書体とコード書体を選び、AdjustableTokenの`valueLabel`は値の読み上げ表現を受けます。

### Ark UIとの対応

Animic側でスロット名を定義し、React実装で対応するArk UIの要素へスタイルを適用します。

| AnimicのSlot Recipe | Ark UIの内部利用       | 対応付け                                                                                                                         |
| ------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `field`             | Field                  | `description`へHelperText、`error`へErrorText。Input・Textarea・CodeInputは同じFieldのコンテキストを利用                         |
| `dialog`            | Dialog・Portal         | `scrim`へBackdrop、`body`へ内容領域、`close`へCloseTrigger                                                                       |
| `segmented-control` | SegmentGroup           | `label`へItemText、`control`へItemControl。非表示のラジオボタンでフォームとキーボード操作を維持                                  |
| `popover`           | Popover・Portal        | Trigger・Positioner・Content・Titleへ対応し、読み上げ名とフォーカスの復帰を管理する                                              |
| `avatar`            | Avatar                 | 画像の読み込みと代替表示の切り替え                                                                                               |
| `progress`          | Progress               | `fill`へgetRangePropsの状態属性、`value`へValueText。描画面を縮めずclip-pathで割合を表し、縞とグラデーションの寸法はRecipeが保持 |
| `token-input`       | Combobox               | 入力と候補の状態・選択・読み上げ。確定済み語句の管理は利用側に残す                                                               |
| `toast`             | Toaster・Toast・Portal | `viewport`へToaster。内部の位置情報をAnimicのCSS変数へ対応付け、重なり順はSemantic Tokenを優先                                   |

ArkのAnatomy・型・状態変更の詳細情報を公開APIにしません。Toastの配置余白と重なり順もRecipeに置き、safe-areaと余白の大きい方を使用します。Toastは画面下の中央に置きます。React実装はPortalの書字方向に応じて下端（block-end）に当たる物理方向のsafe-areaを対応付け、祖先の方向指定の変更にも追従します。ToastではArkのインラインスタイルによる位置・z-index指定を除外します。Popoverの位置計算はArkを使い、z-indexはSemantic Tokenを優先します。

### UIからの利用

#### 通常UI

`src/routes/`・`src/features/`などのアプリケーションUIは、Panda、デザインシステム内部の定義、styled-systemのJS/TS API、Ark UIを直接利用しません。任意のCSS、インラインスタイル、自由な`className`の上書きでデザインシステムを迂回しません。生成CSSの単一のエントリーポイントを読み込むことは、このJS/TS APIの制約と分けて扱います。

`@animic/react`は自由なCSS propsを公開せず、用途ごとのvariant・配置ルールを公開します。TypographyはText Styleを通して選び、フォント・文字サイズ・太さを個別に組み合わせません。進捗率などの実行時の値は意味のあるpropsで受け、必要なCSS変数への変換をReact実装の内部で行います。

共通UIの視覚表現と状態ごとのスタイルは`packages/design-system/src/`に置きます。DOMと操作は`packages/react/src/`、業務状態の判断と画面の組み立ては`src/routes/`・`src/features/`が担当します。機能固有のアートワーク・演出は次項のVisual領域で扱います。表現の追加・共通化は[デザイン原則](design.md#新しい表現は既存の定義から組み立てる)に従い、新しいデザイン判断は実装前に承認を得ます。

#### 機能固有のVisual

`src/features/<feature>/visuals/`を、固有のアートワーク・Motionのための限定領域とします。各機能の通常UIからこの領域の表現を利用できますが、通常UIへ低レベルのスタイリングAPIを再公開しません。

この領域では`@animic/styled-system/css`の`css()`で、`transform`、`opacity`、`clip-path`、`mask`、`filter`、`mix-blend-mode`、装飾配置、アートワークの合成、画面遷移などを扱えます。Token化に意味のない、その表現に固有の位置・寸法の値は、`top: "[-5px]"`のようなPandaのarbitrary value構文で指定します。`strictTokens`・`strictPropertyValues`は維持し、余白Tokenやその負の派生値は流用しません。装飾は可能な限り非対話的にします。

画面に応じたアートワークの配置変更には、`conditions.ts`の`artworkConditions`に定義した条件を使います。`css()`の`_artworkCompact`・`_artworkNarrow`・`_artworkMedium`・`_artworkPortrait`・`_artworkVertical`内でも、同じVisualのプロパティ制限を適用します。未登録の条件、任意のメディアクエリ、Keyframes内の条件分岐は許可しません。Grid・Dialogなど別の用途の条件を、Visualへ自動的に開放しません。

`className`には検査済みの`css({...})`を直接指定するか、同一ファイルの単純な`const artwork = css({...})`を指定します。任意のクラス文字列、テンプレートリテラル、条件合成、インポートしたクラス、未知の関数の戻り値は受け付けません。`css`関数自体の代入・受け渡し・再公開も許可しません。`import { css as draw }`のように、import宣言で指定するaliasは利用できます。

Visualの`transitionDelay`は、機能固有の演出を順に再生するために使用できます。通常UIの余白や操作状態を定義する用途には使いません。ホームの区画はSSRで内容を表示し、初期表示の内容に登場演出を掛け直しません。起動時点で画面より下にある区画だけを登場演出の対象にします。

ホームのロゴと小さな背景SVGは、元のアセットを`?raw`で読み込み、SVG画像のdata URLとしてSSRのHTMLに含めます。追加の画像リクエストによる初期装飾の遅れを防ぎ、SVG文書内のIDはページ内の別のSVGと分離します。大きなキャラクター画像・ギャラリー画像は通常の画像アセットとして配信します。

共通Motionはデザインシステムに置き、機能固有のアートワーク・演出・MotionはVisualに置きます。固有Keyframesは同じ`/css`エントリーポイントの`keyframes()`を使い、静的なフレーム定義を同一ファイルの`const`へ格納します。フレーム内にもVisualのプロパティ制限を適用します。生成名は検査済み`css()`の``animationName: `[${sparkle}]` ``として参照します。これは生成名をPandaのarbitrary valueとして渡すための形式です。任意文字列によるアニメーション名の共有、生成名の再公開、`keyframes`関数の代入・受け渡しは許可しません。`css()`内へ`@keyframes`を直接記述しません。

Button・Input・Card・Dialogなどの通常UI、色・Typography・余白の体系、角丸・影、操作状態のスタイルはこの領域へ実装しません。Panda本体やArk UIへの直接依存も許可しません。

#### 境界の検査

パッケージの`exports`が公開エントリーポイントを定め、`scripts/design-guardrails.mjs`がそれをimportできる場所を検査します。`/css`はReact実装と許可されたVisual、`/recipes`・`/patterns`はフレームワーク実装から利用します。スクリプトはインポート・再エクスポート・動的インポート・JSXを構文解析し、通常UIの`style`要素とスタイルシートを読み込む`link`も拒否します。JSX spreadはTypeScriptで解決した閉じたprops型を許可し、禁止するstyling props・`any`・index signatureを持つ型を拒否します。通常のpropsの組み合わせを一律には禁止しません。通常UIのコントロール・Typographyは公開Componentで表現します。Visualのクラス・Keyframesは前項の局所的な形式だけを検査し、関数の戻り値や別ファイルをたどる値追跡は行いません。Surfaceの`padding`は公開variantとして扱い、任意のCSSの`padding`指定とは区別します。

移行前の画面CSSに対する例外はありません。生成コードを除き、ディレクトリ全体を検査対象外にはしません。これはコードの契約検査であり、任意のJavaScriptを隔離するセキュリティ機構ではありません。

Visualで許可する形式を定めた比較・検証・判断変更は、[Visual / Guardrailの設計事例](design-system/case-studies/visual-guardrails.md)を参照してください。

### レスポンシブと操作状態

#### レスポンシブ

レスポンシブデザインの`base`は条件のない既定値です。特定の端末を意味しません。ブレークポイントの追加・変更もデザイン判断として扱い、アプリケーションUIで任意のメディアクエリを追加しません。

Containerの`summary`は記録・集計・関連操作などをまとめる幅で、短いフォームの`narrow`、本文の`reading`、広い構成の`wide`と使い分けます。

GridとSplitは、内部の外側要素をクエリコンテナ、内側要素を配置領域として利用可能な幅を測ります。Dialogはビューポート全体を占める`positioner`をクエリコンテナとし、`adaptive`では下端表示と中央表示を切り替え、`centered`では中央表示を維持します。操作ボタンの配置はDialogの責務に含めず、呼び出し側がPatternで組み合わせます。

ImagePairは狭い領域でも比較用の2列を維持し、自身の幅に応じて列間の余白を切り替えます。ImagePairItemは画像と、その左上に重ねるラベルを受けます。`sizing="intrinsic"`では画像本来の寸法と縦横比を保って中央に並べ、利用可能な幅を超える場合だけ縮めます。ActionGroupの`confirm`は補助操作と主操作を1対1.5の比率で並べます。その他は内容に応じて折り返し、`adaptive`を指定した場合は狭い画面でも横並びを維持します。`fill`は各操作を横並びのまま伸ばします。`responsive`は操作ごとの必要幅を保って折り返し、狭い画面では各操作を一行ずつ配置します。Sectionは画面の高さを最低寸法とする用途と、内容の高さで配置する用途を持ち、内容を切り取る固定高にはしません。`align="stretch"`では内側の構成へ余った高さを渡します。`snap`は区切りへの停止を指定し、ページでsnapを使わない場合は`none`を選べます。フッターの面と内側余白はFooterが担当し、Sectionは配置だけを持ちます。Sectionの横余白・縦余白と、フッターを端まで広げるための相殺量は同じ非公開変数から導出し、個別の補正値を重ねません。

Page・Sectionの`decoration`は非対話的な背景を受け、内容の背後へ配置します。Sectionの`footer`は下端の独立した帯、`navigation`は次の区切りへの案内を受けます。これらの内容や遷移先は利用側が組み立てます。

Gridの`collapse="single"`は中間の2列配置を挟まず、広い領域で指定列数、それより狭い領域で1列にします。`collapse="none"`はアバターなど小さな選択項目の列数を維持し、`space="compact"`は項目間の間隔を詰めます。Splitの`header`は左側の見出しと本文、右側の画像を組み合わせるために使います。`collapseOrder="reverse"`は縦並びで画像側を先に置き、見出しがあれば先頭に維持します。読み上げとキーボードの順序はDOM順のため、対話的な要素同士の順序を入れ替える用途には使いません。MediaObjectは画像・アイコンと本文の組を扱い、`adaptive`では利用可能な幅に応じて縦並びから横並びへ切り替えます。任意の`actions`は十分な幅では本文の末尾側、狭い横並びでは本文の下へ配置し、画像との関係を保ちます。`stacked`は幅にかかわらず縦並びを維持します。Stackの`spacious`は広い画面でまとまりの間隔を広げ、`fluid`は表示領域の高さに応じて間隔を調整します。`fill`は親から渡された高さを最低寸法として使い、`justify`で余った高さの中へ内容を配置します。内容が増えたときは上下を切らずに伸びます。Splitの`content-media`は文章と大きな挿絵を組み合わせる比率です。画面幅が900pxを超え、配置領域にも32em以上ある場合に横並びにします。カルーセルで隣のカードを見せる幅と、カード内の列構成を両立させるため、画面幅と配置領域の両方を確認します。`content-intrinsic`は画像に必要な幅を右列へ割り当て、残りを左列に使います。左右に並べるには配置領域が49.5emを超えることが必要で、狭い場合は見出し・画像・情報の順に縦に並べられます。横並びでは文章の最低幅を確保し、画像は列内へ収めます。Clusterの`layout="adaptive"`は狭い画面で中央揃えの縦並びに切り替え、フッターなどの情報をまとめます。

Layerは背景・装飾を内容の背後へ重ねます。`layout="adaptive"`では、狭い画面や縦長の画面で装飾をDOM順に配置し、余った高さを割り当てます。LayerItemの`background`・`artwork`は読み上げと操作の対象にせず、見出し・本文・操作は`content`へ置きます。アートワークの大きさ・傾きや画面固有の構成は利用側が持ちます。縦並びの装飾領域はサイズを測れるContainerとして扱い、Visualから残りの幅・高さに応じて画像の寸法を決められます。サイズ包含によって装飾領域が0にならないよう最低高さを持ち、狭い横長画面では小さく、縦長画面では大きく確保します。本文の高さを削らず、全体が収まらない場合はページをスクロールします。

NavigationBarの現在位置の下線は、利用側が指定した`aria-current`のリンク位置を測定し、共通のバーを移動させます。初回はSSRの選択状態に従ってリンク自身の下線を最初から表示し、フェードしません。測定後に同じ位置の共有バーへ引き継ぎます。表示中の選択変更だけ位置と幅を遷移させます。サイズ変更・フォント読み込み・非表示からの復帰は現在の配置へ即時反映し、隠れていた座標から移動させません。下線はリンク列を基準に配置し、進行中の選択変更は描画中の位置から引き継ぎます。ホームの移動操作では行き先を直ちに選択し、移動途中のセクションで選択を変えません。手動スクロール・操作の中断・履歴移動との切り替えは`use-section-navigation.ts`が担当します。現在位置に対応するリンクがない場合はバーを非表示にします。NavigationBarは狭い画面でリンク列を隠し、ブランドと操作領域を表示します。`primaryActions`に主要操作、`actions`にアカウントなどの補助操作を置き、画面幅ごとの操作の複製は作りません。利用可能な幅と実際の内容を測り、1行・通常ラベル、1行・短縮ラベル、2行・通常ラベル、2行・短縮ラベルの順で収まる配置を選びます。文字拡大などで最後の候補にも収まらない場合はグループ内の折り返しを許します。短縮文言はButtonの`compactLabel`を使い、ナビが表示するラベルを決めます。NavigationBarLabelは狭い画面でラベルを隠すため、親のLink・Buttonにはラベルを省略しても意味が伝わる読み上げ名を指定します。`compactHidden`による表示の切り替えは利用側が判断します。広い画面のブランドは左上へ配置し、`brandHidden`で表示を切り替えます。ブランドを表示する場合はその幅をメニューと分けて確保し、リンクとの重なりを防ぎます。SectionNavigationは広い画面の右端で現在位置を示します。

ホームの表示位置と上部・側面のナビの現在地は、同じURLのハッシュとセクション状態で管理します。`src/features/home/initial-section.ts`をホームルートのheadから実行し、HTMLの解析中に両ナビの`aria-current`と初期位置を揃えます。ハッシュ直アクセスでは対象セクションへ即時移動し、起動時に先頭からの移動演出を再生しません。デザインシステムはURLを解釈せず、指定された現在地の表示とナビの寸法測定だけを担当します。ハッシュなしは先頭、既知のハッシュは対応する区画を初期位置とし、ルーターの座標復元はホーム以外に適用します。ナビのクリックは履歴を追加し、手動スクロールのsnapが確定したときは現在の履歴のハッシュを置き換えます。スクロール中の現在位置表示と、確定後のURL更新を分けます。履歴の更新にはルーターを使います。

Surfaceの`appearance="adaptive"`は、狭い画面で内容を白い面にまとめる表現です。560px以下では選択した内側余白と角丸を使い、それより広い画面では背景を付けません。余白は外観とは独立しており、狭い画面だけに付ける場合は`padding="narrow-only"`を組み合わせます。`Text`の`label.fluid`は画面幅に応じて変わる太字ラベルで、本文や補助ラベルとは使い分けます。

Page内では1つのNavigationBarを配置します。headのUIScriptがナビの追加を検出して内容の解析中に監視を開始し、初回描画から配置と実際の高さをPage内の非公開CSS変数へ反映します。本文の途中に同期スクリプトを挟みません。初期表示と起動後で同じ計測関数を使い、Reactへの引き継ぎ時に初期監視を解除します。本文を表示してからhydrationによって上余白が増えることを防ぎます。スクリプトに利用側の文字列や状態は埋め込みません。起動後はNavigationBarのResizeObserverが高さの変化を反映し、Sectionの`inset="navigation"`はナビより下に内容を配置します。文字拡大などでナビが折り返す場合も、その高さを考慮します。`navigation-wide`は狭い画面でナビを表示しないセクションに使います。

条件は`conditions.ts`で利用先ごとに所有します。共有する値はこれらのPattern・Componentで成立を確認した条件であり、すべてのComponentに適用するブレークポイントではありません。新しい幅による配置変更を追加する場合、そのComponent・Patternが成立する条件を確認してから既存条件を再利用します。`equal` Splitも利用可能幅に応じて縦並びと等幅の2列を切り替えます。`balanced`は比較画像と詳細情報など、両側にまとまった幅が必要な構成を少し異なる比率で並べ、`equal`より広い配置領域で2列に切り替えます。

幅条件と文字拡大時の組み合わせを判断した経緯は、[Responsive / Typographyの設計事例](design-system/case-studies/responsive-typography.md)を参照してください。

#### フォーカス

フォーカスの表示条件は`conditions.ts`、表示方法は`recipes/control.ts`と各Recipeで定義します。`UIProvider`がポインター操作とTab・矢印・ページ移動・キーによる操作を文書単位で追跡します。`:focus-visible`だけでは入力欄やクリック後のフォーカス復帰にもリングが付くため、直前がポインター操作の場合はキーボード用の強調を出しません。フォーカスそのものを外す処理は入れず、Dialogのトラップ・Escape・元の操作への復帰を維持します。Providerのない埋め込みではブラウザの`:focus-visible`を使います。

通常のButton・画像や選択カードにはキーボード用の輪郭を使い、テキストリンクには下線を使います。Input・Textareaは入力中の内側境界で位置を示し、エラーの境界線を置き換えません。SegmentedControlとSwitchは実際のフォーカス対象である子の入力要素を判定します。Dialog内のButtonは下線、IconButtonは下線と面の変化を使い、外周リングを重ねません。具体的な値と状態の優先関係はRecipeが所有します。

#### スクロールバー

バーの外観・太さ・操作状態・forced-colorsは`recipes/slots/scrollbar.ts`、文書と登録されたスクロール領域のネイティブバー表示は`global.ts`で定義します。React実装の`use-scroll-viewport.tsx`で対象を明示的に登録し、`scrollbar.tsx`が操作とARIAを管理し、`observe-scrollbars.ts`が範囲・位置・祖先による切り取り・リサイズ・登場時の移動を測ります。全DOMからスクロール領域を自動発見する監視は行いません。Dialog・Popoverのバーはフォーカス境界の内側に置きます。一覧・編集領域は既存のスクロール要素を保持し、固定高のアプリ全体用ラッパーへ置き換えません。

文書のトラックはCSSで画面端へ固定し、上下の余白を付けません。VisualViewportが拡大やソフトウェアキーボードで変わる場合だけ、その位置と寸法を反映します。内部領域では祖先の拡縮を含む座標を変換し、両軸がある場合はLTR・RTLに応じて同じ角を空けます。つまみはトラックの中心へ配置し、スクロール中はReactの再描画やトラックの再測定を行わず、transformとARIAの現在値を同期します。

バーはレイアウト幅を消費せず、通常時も細い位置表示を残します。ホバー・フォーカス・ドラッグで強調します。マウスでは表示トラックを操作範囲とし、タッチでは内側へ操作範囲だけを広げ、つまみの表示位置と本文幅は変えません。トラッククリックは前後1ページ、つまみは連続移動、キーボードは方向キー・PageUp/Down・Home/End・Space/Shift+Spaceに対応します。読み上げ名・`aria-controls`・向き・範囲・現在値を付け、Tabでも操作できます。つまみのドラッグ中だけ対象のsnapを止め、終了・キャンセルで戻します。本文のスクロールとキーボード操作はネイティブのまま維持します。

状態の重なりやPortal・テキスト方向（LTR・RTL）を含む検証と修正の経緯は、[Interaction / Environmentの設計事例](design-system/case-studies/interaction-environment.md)を参照してください。

### 生成と開発支援

Pandaのcodegenで型付きSDKとNative Specを、cssgenでCSSを生成します。

`packages/styled-system/package.json`とCSSエントリーポイントの`styles.css`はGit管理し、`generated/`は管理しません。生成コードは手で編集せず、手順は[CONTRIBUTING.md](../CONTRIBUTING.md#デザインシステムの生成と検証)に従います。

Panda Native Specは、デザインシステムの定義から生成する機械向けの一覧情報です。定義全体の再構築は要求せず、含まれない詳細は`packages/design-system/src/`を確認します。全体を別の独自スキーマ・JSONで再定義しません。Panda MCPは定義済みのToken・Recipe・Pattern等、Ark UI MCPは内部利用する操作APIを調べる開発支援です。AIはPanda MCPで既存の定義を調べ、不足する詳細をソースコードで確認します。`panda analyze`は実際の利用状況を調べます。MCPとanalyzeはUIの実行・ビルドに必要な依存ではありません。

## 検索とSNS共有

検索と共有の対象は[ゲーム仕様](product.md#検索とsns共有)に従います。トップ固有のcanonicalとOGPは`src/routes/index.tsx`で設定します。robots.txtとsitemap.xmlは`public/`に置き、サイトマップには公開する正規URLだけを記載します。`src/server.ts`では`animic.party`のトップだけを検索対象とし、それ以外のホスト・パスのページ・APIレスポンスに`X-Robots-Tag: noindex`を付けます。一般公開する説明ページを追加する際は、検索対象の判定とサイトマップを合わせて更新します。画像・CSS・JavaScriptなどの静的アセットは取得を許可し、トップの表示と共有に利用できるようにします。robots.txtでクロールを禁止するだけでは検索除外を保証できず、非公開情報の保護には認証・認可が必要です。

## 画面とAPIの構成

画面の要件は[ゲーム仕様](product.md#対象範囲)に従い、ルートは`src/routes/`で定義します。認証・ルーム・対戦のServer Functions、D1スキーマ、DOは画面の表示から独立させます。ブラウザ側のWebSocket接続・再接続は`src/features/room/room-connection.ts`に置きます。`use-room-connection.ts`は配信のバージョンと受信時刻を同じSnapshotに保持し、Reactの購読へ渡します。古いloaderの応答で新しい配信を上書きせず、表示は呼び出し側に委ねます。

公開アプリはトップページ`/`、ルーム作成`/start`、ルーム`/rooms/$code`、マイページ`/mypage`、戦績の詳細`/mypage/matches/$battleId`、規約`/terms`・`/privacy`で構成します。`/admin`配下はお題・対戦条件・よく使う表現・画像生成・採点ワーカー・採点ジョブ・バックアップの管理画面です。トップの参加コード入力はサーバーへ存在を確認し、見つからない場合は入力欄のエラーとして扱います。ルームURLの直接アクセスではloaderが形式・正規化・存在・本人の参加状態を確認し、存在しない場合は404にします。ルームに参加していない場合はRoomEntryで表示名を入力し、作成・参加のServer Functionを呼びます。作成前にはGoogleまたはDiscordでログインし、招待からの参加では任意のログインまたは匿名セッションを使います。作成要求の再送には同じ要求IDを使います。名前・役割・画面段階はクエリパラメータや端末内の参加者IDから決めません。

RoomPageはloaderの初期状態を受け取り、`use-room-connection.ts`を通してWebSocket配信を購読します。ルーム参加者・ホスト・準備・設定はサーバーのSnapshotから表示し、開始・設定変更・準備・退出はServer Functionsへ渡します。ロビーの設定変更は`use-room-settings.ts`が即時に表示し、入力順に保存します。保存したバージョンへ配信が追いついたらサーバーの値を使い、保存失敗は呼び出し元へ返して後続の操作を妨げないようにします。難易度・生成時間・画像選択の猶予を設定し、接続中の参加者が2人以上のときに対戦を開始します。結果は2人なら勝ち負け、3人以上なら順位で表示します。`battle-screen.ts`は本人の参加資格と対戦状態から待機・生成中・生成完了待ち・画像選択・提出後の待機・結果を判定します。採点中も提出後の表示を維持します。途中参加者は次の対戦を待ちます。再接続ではサーバーの状態を復元し、接続資格を失った場合は終了案内を表示します。

対戦画面のプロンプト入力は`src/features/image-generation/`の`PromptComposer`が組み立て、語句・重みの操作とプロンプトの構築は`prompt-blocks.ts`、候補と検索に使う辞書は`prompt-dictionary.ts`が担当します。入力部品は`@animic/react`を使い、辞書やプロンプトの構文を共通部品へ持ち込みません。

BattlePageは本人へ配信された生成履歴を表示し、画像IDで選択・提出します。提出確認の対象はDialogを開いた時点のIDに固定し、後から生成が完了しても対象を置き換えません。残り時間は`use-remaining-ms.ts`がサーバー時刻と期限、受信後の経過時間から求めます。画面の切り替え中も表示対象のSnapshotと受信時刻を一緒に保持し、演出の待機で期限を延ばしません。表示する秒数の丸めを残量の計算へ流用しません。提出の確定や未提出の判定はサーバーの状態を使います。ResultPageは`battle-outcome.ts`で勝敗・引き分け・勝負不成立と公開可能な画像・スコアを求めます。配信されない採点内訳や相手の生成履歴を補いません。再戦の操作では同じルームの待機画面へ戻り、ホストが新しい対戦を開始します。

画面遷移は`PageTransitionProvider`が覆う・内容を更新する・開く、の順序を管理します。ルート移動と同一ルームの画面切り替えで同じ処理を使います。ルーム作成・参加ではサーバー処理の完了を待ち、作成された実際のコードを表示してから移動します。遷移先のDOMを描画してから退場へ進み、ページ全体のフォント取得完了を待ちません。スキップはサーバー処理と遷移先の更新を保ち、演出用の待機だけを解除します。URLの遷移と履歴のスクロール復元はRouterが管理します。同じルームURL内の画面切り替えではRoomPageが新しい画面の初回描画前に文書の先頭へ戻し、同じ画面の状態更新では位置を変更しません。

マイページと戦績の詳細の要件は[ゲーム仕様](product.md#マイページと戦績)に従います。マイページ（`src/features/account/mypage-page.tsx`）のloaderは`getCurrentParticipant`と`battle`の`getMyBattleHistory`を呼び、戦績の詳細（`src/features/battle/match-detail-page.tsx`）のloaderは`getMyBattleDetail`を呼びます。どちらのServer Functionもログインしていない参加者には`null`を返し、画面はログインを案内します。戦績の詳細は、`battle_record`にその対戦と本人の組がある場合だけ返し、ログインしている参加者に`null`を返したときは404にします。画面へ返す順位の一覧には参加者IDを含めず、ほかの参加者の提出画像は保存した`scores`にある人の分だけにします。指標ごとの点は、`scoring`の`getScoringMetrics`が本人の採点ジョブの`raw_result`から読みます。トップのナビにはマイページへのリンクだけを置き、トップのHTMLに参加者の情報を含めません。

表示名はBetter Authの`user.name`、アイコンは`user.icon`（Better Authの`additionalFields`、認証APIからの入力は受け付けない）に保存し、`account`のServer Function（`src/features/account/account.functions.ts`）でログインしている本人だけが変更します。アイコンの値は`color:<色>`か`illustration:<番号>`で、選べる値と画像の対応は`src/features/account/account-icon.ts`、イラストの画像は`public/images/account-icons/`にあります。`createRoom`・`joinRoom`は、そのときのアイコンをルームのDOの参加者の記録に渡し、ロビー・対戦・結果のAvatarはその記録から表示します。後からアイコンや表示名を変えても、参加済みのルームの記録は変えません。

APIの結合検証は画面のレイアウトやフォームに依存させません。E2E専用クライアントからServer FunctionsとWebSocketを呼び出し、通常のビルドには検証用クライアントを含めません。検証手順は[CONTRIBUTING.md](../CONTRIBUTING.md#セットアップと検証)を参照してください。

## データと入力検証

入力検証はValibotに統一します。自分たちが管理するコードではZodを使用せず、直接依存にも追加しません。外部ライブラリが内部で使用するZodの間接依存は許容します。

リレーショナルデータの永続化にはCloudflare D1、ルーム内の操作と状態の管理にはDurable Objects（以下DO）、DBスキーマとクエリの管理にはDrizzleを採用します。

### ルームと対戦の管理

1ルームを1つのDurable Objectで管理します。ルームと対戦の識別子は分け、同じルームで行う各対戦を区別します。

ルームコードは[ゲーム仕様](product.md#参加方法)の形式でサーバーが生成します。クライアントは作成操作ごとにランダムな要求IDを発行し、同じ入力の再送では同じIDを使います。サーバーは認証済み参加者ID・要求ID・衝突時の試行番号からSHA-256でコード候補を生成します。DOには作成者・要求ID・表示名を初期状態と一緒に保存し、同じ要求なら既存ルームを返します。同じ要求IDで表示名を変更した場合は拒否し、別の要求とのコード衝突では次の候補を試します。作成要求の情報は状態配信に含めず、既存のルームを上書きしません。コードはルームを指定するために使い、参加者本人の確認やホスト権限の判定には使いません。

| 管理対象                                                                | 管理先         |
| ----------------------------------------------------------------------- | -------------- |
| 参加者のユーザー・連携したアカウント・認証セッション・認証APIの回数制限 | D1             |
| お題の情報・難易度・公開状態・画像の参照先                              | D1             |
| お題の画像（管理画面で登録したもの）                                    | R2             |
| 生成画像                                                                | R2             |
| ロビーで選べる対戦条件の候補・よく使う表現                              | D1             |
| 運営者が選んだ画像生成のモデル                                          | 生成キューのDO |
| ルームの参加者・ホスト・準備状態・次の対戦の設定                        | ルームのDO     |
| 対戦の開始時刻・生成終了時刻・生成履歴の情報・生成回数・提出・採点状態  | ルームのDO     |
| 確定した対戦結果の保存・共有用の参照・参加者ごとの戦績                  | D1             |
| 採点ワーカー・リンクコード・採点ジョブ・採点結果                        | D1             |

DOの状態はSQLiteストレージに永続化し、再起動・再接続後にも復元します。対戦中の状態はDOで管理し、同じ状態をD1側で独立して更新しません。確定結果は対戦IDで識別してD1へ保存します。保存待ちの情報をDOに保持し、再試行しても結果が重複しないようにします。対戦の確定と保存待ちの記録をDO内の同じトランザクションで保存し、D1の`battle_result`へ対戦IDを主キーとして挿入します。同じバッチで、保存する結果から求めた参加者ごとの戦績（順位・最終スコア・提出画像）を`battle_record`へ挿入し、マイページの一覧と成績は保存済みのJSONを読まずに求めます。D1への通信前に次の再試行を予約し、保存済みの対戦IDは上書きしません。ルームが閉じた後も保存待ちの記録は再試行の対象にします。

ルームや進行中の対戦に関わる操作は、Server Functionsから対象ルームのDOへ渡します。DOで参加資格・対戦状態・操作が可能な時間・提出済みかどうかを確認して状態を更新します。時間の判定にはサーバー側の時刻を使い、Alarmの起動時刻だけに依存しません。提出の再送やAlarmの再実行で、確定済みの状態が変わらないようにします。

生成の受付と提出の受付を分けて管理します。生成終了時刻を過ぎたら新たな生成を拒否し、画像選択の期限まで未提出者の提出を受け付けます。時間内に受け付けた生成がすべて終了したら、生成終了時刻と最後の処理終了時刻の遅い方を起点に選択期限を確定してDOへ保存します。処理完了の重複通知や再接続で選択期限を延ばしません。期限切れの参加者は未提出として確定し、画像を自動提出しません。生成終了時刻を過ぎて成功した画像も生成中の画像もない参加者は、選択期限を待たずに、生成終了時刻と本人の最後の処理終了時刻の遅い方を確定時刻として未提出にします。提出要求でも期限を確認し、Alarmが遅れても締切後の提出を受け付けません。提出時刻はサーバー側で記録し、`scoring`が時間内の提出かどうかを判定できるようにします。画面の切り替えだけで生成を制限しません。

生成要求を受け付ける際は、DOで生成できるかどうかを確認し、対戦ID・参加者ID・処理ID・サーバー側の受付時刻を記録してから外部サービスを呼び出します。同じ要求の再送を新しい生成として扱わないようにします。処理IDに対応する参加者と入力のハッシュを保存し、同じIDで別の参加者や内容へ差し替えられた要求は拒否します。受付済みなら外部サービスを再度呼び出しません。時間内に受け付けた処理の完了は生成終了時刻後も反映し、未提出者の提出候補に含めます。

生成の期限とタイムアウトは[ゲーム仕様](product.md#対戦の流れ)に従い、`battle-state.ts`で判断します。`reconcileBattle`は、受付時刻から1分を過ぎた生成中の処理を、受付時刻の1分後に終わった失敗として記録します。この記録は選択期限の計算より前に行い、結果の確定後も行います。`finishGeneration`は先にタイムアウトを反映し、タイムアウトした処理の完了を無視します。`acceptGeneration`は同じ処理IDの確認の後に、タイムアウトを反映した状態で、本人の生成中の処理が残っていれば拒否します。ルームのDOは生成中の処理の期限でもAlarmを予約します。

画像生成・AI採点などの外部通信中に、ルーム全体の処理をロックしません。結果を反映するときに対戦ID・処理ID・現在の状態を検証し、遅れて届いた結果や重複通知が別の対戦や確定済みの提出を変更しないようにします。生成の受付・処理中・成功・失敗を区別し、受付記録だけで生成完了とは扱いません。

生成の試行記録とスコア用の生成回数は区別します。試行記録には失敗も残し、スコア用の回数は[ゲーム仕様](product.md#対戦の流れ)に従って成功した生成から算出します。同じ処理の完了通知を重複して受けても二重に数えません。提出を確定するときに、その時点の成功回数・提出時刻・速度加点の対象かどうかを保存します。提出後に生成が完了しても、この記録を変更しません。

### 採点

採点は、運営者のPCで動くdesktop-comfyui-serverを採点ワーカーとして登録して実行します。採点ワーカーがAnimicへ採点ジョブを取りに来るため、採点ジョブと採点ワーカーはD1で管理します。構成は[採点の設計](scoring.md)、実行先とキューの方式を選んだ理由は[ADR 0004](decisions/0004-scoring-workers.md)を参照してください。

提出を受け付けたら、`battle`が採点エントリーを追加します。ルームのDOは採点待ちの間、Alarmで`scoring`のサーバー処理を呼び、採点ジョブを登録して状態と結果を取得し、対戦へ反映します。採点ジョブの状態は`scoring`がD1で管理し、ルームのDOが持つ対戦の採点状態とは分けます。結果を反映するときは対戦IDと採点ジョブのIDを照合し、確定済みの結果を変更しません。

リンクコードの発行、採点ワーカーの一覧と失効、採点ジョブの一覧は、[運営者の認証](#運営者の認証)を通した管理画面で行います。採点ワーカーへ渡す画像のうち、このアプリが配信するお題の画像と生成画像は、自分のURLへ通信せずR2から読みます。Workerから自分の公開URLへ通信すると、workers.devでは失敗し、Custom Domainでは自分のWorkerをもう一度通るためです。

採点ワーカー向けAPIは、`src/server.ts`でTanStack Startより前に振り分けます。TanStack StartのCSRF対策は、`Origin`などを持たない非GETの要求を拒否するためです。採点ワーカーはCookieを使わず、リンク時に発行した秘密情報をBearerで送るため、ブラウザ向けのCSRF対策の対象外とします。

## ファイル配置と役割

| 配置            | 役割                                             |
| --------------- | ------------------------------------------------ |
| `src/routes/`   | ルート定義、loader、画面の組み立て               |
| `src/features/` | 機能固有のUI、Visual、Server Functions、業務処理 |
| `src/lib/`      | 参加者の識別・DB接続など、複数の機能で使う処理   |

### 各featureの役割

| 配置                             | 役割                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/features/room/`             | ルーム作成・招待・参加者・ホスト・準備状態・次の対戦の設定・対戦条件の候補                   |
| `src/features/battle/`           | お題の管理と選定・対戦開始・生成終了・画像選択と提出・勝敗の確定・結果表示・戦績の保存と表示 |
| `src/features/image-generation/` | よく使う表現・生成サービスの呼び出し・生成要求と履歴                                         |
| `src/features/home/`             | トップページ・参加コード入力・セクション間の案内                                             |
| `src/features/account/`          | マイページ・表示名とアイコンの変更・ログイン導線に使うアートワーク                           |
| `src/features/legal/`            | 規約・プライバシーポリシー・目次                                                             |
| `src/features/navigation/`       | 画面遷移の演出とルーターへの接続                                                             |
| `src/features/scoring/`          | 再現度評価・提出速度と生成回数を含む総合スコア計算                                           |
| `src/features/admin/`            | 管理画面の構成・バックアップの書き出しと読み込み                                             |

`battle`は対戦中に生成・提出できるかどうかを判断し、スコアに使う生成回数を確定します。`image-generation`は生成処理と履歴を扱い、`scoring`は確定した提出と評価条件からスコアを算出します。生成・採点処理が独立して対戦の進行状態を変更することはありません。

ルームのDOは`room`に配置します。DOは永続化・排他制御・状態配信を担当し、対戦ルールの判断は`battle`の業務処理を呼び出して行います。生成と採点の処理結果は呼び出し側が受け取り、ルームのDOを通して対戦へ反映します。生成は`image-generation`のServer Function（`generateImage`）、採点はルームのDOが呼び出し側です。DOクラスへ各featureの業務処理を集めず、生成キューのDOと採点の処理からルームのDOを呼び出すコードも作りません。`scoring`は採点ワーカーへ生成画像を渡すため、`image-generation`の`generated-images.server.ts`を使います。

この分割はコードの役割によるものです。featureごとにWorkerやDOを分割することは要求しません。結果画面は`battle`、招待リンクのコピーとQR表示は`room`に含めます。

`admin`は管理画面の表示とバックアップの手順を担当し、データの読み書きは担当するfeatureのServer Functionsとサーバー処理を使います。お題の管理用のServer Functionsは`battle`、対戦条件の候補は`room`、よく使う表現と画像生成のモデルは`image-generation`に置きます。

## 依存関係とクライアント・サーバーの分離

- `src/routes/`から各featureのUIや処理を呼び出し、各featureから共通のUIや処理を利用します。
- 共通のコードから特定のfeatureをimportせず、循環依存も避けます。
- 画面の組み立ては`src/routes/`で行い、業務処理の連携はサーバー側で扱います。
- 通常のデータ取得・操作には`createServerFn`で定義したServer Functionsを使い、サーバー専用のコードをクライアントのバンドルに含めないようにします。ファイルの命名は[実装規約](conventions.md#クライアントとサーバーの分離)に従います。
- 入力検証・認証・認可はサーバー側で行います。画面側の遷移制御だけに依存しません。

画像生成サービスは`image-generation`のサーバー専用処理から呼び出します。Animicが管理する認証情報はサーバー側の秘密情報として保管し、クライアントのコード・レスポンス・ログには含めません。参加者の識別情報と生成サービスの認証情報を分けて扱います。

参加者の生成は、`generateImage`（`src/features/image-generation/image-generation.functions.ts`）が受け付けます。入力（プロンプトだけ、1000文字まで）を`generation-input.ts`のスキーマで検証し、正規化した入力のSHA-256（`inputHash`）を付けて、ルームのDOの`acceptGeneration`に渡します。ルームのDOは受付時刻を返し、生成の期限はこの受付時刻から1分で数えます。Server Functionの時計で数えると、ルームのDOではタイムアウトした生成をNovelAIへ送ることがあるためです。同じ要求の再送なら、NovelAIを呼ばずに返します。受け付けたら、生成キューのDOの`generate`にプロンプトと期限を渡し、成功したらWebPをR2に保存して、ルームのDOの`finishGeneration`に画像のURLを渡します。失敗したら失敗を渡します。`generateImage`は生成の結果を返さず、結果は状態配信で本人に届きます。この処理は`waitUntil`（`cloudflare:workers`）に登録してから待つため、参加者が通信を切っても、Workersの上限（切断から30秒）までは続きます。それを過ぎて止まった生成は、タイムアウトで失敗になります。NovelAIの接続先は`wrangler.jsonc`の`vars`の`NOVELAI_API_URL`です。

NovelAIは1アカウントで同時に1件しか生成できないため、生成キューのDO（`NovelAiQueue`、`src/features/image-generation/novelai.server.ts`）の1つのインスタンスが、全ルームの生成を受付順の1つの待ち行列に並べ、`NOVELAI_API_TOKEN`にカンマ区切りで登録したトークンごとに同時1件までNovelAIへ送ります。順番が来た生成は、空いているトークンのうち最も長く使っていないものに割り当てます（`src/features/image-generation/novelai-tokens.ts`）。トークンが1つなら全ルームの生成を1件ずつ送り、トークンの数だけ同時に生成できる件数が増えます。429は同じトークンで送り直します。401・402を返したトークンは、生成キューのDOが再起動する（デプロイや設定の変更）まで使いません。使えるトークンがなくなった場合は、トークンがない場合と同じく生成を失敗にします。ログにはトークンそのものではなく、1始まりの番号を残します。順番が来たら、運営者が選んだモデルをこのDOのストレージから読み、Workerの環境変数`NOVELAI_STYLE_PROMPT`の規定の絵柄を参加者のプロンプトと品質タグの間に加えます。絵柄と品質タグはNovelAIの`v4_prompt`にだけ入れ、`input`には参加者のプロンプトをそのまま送ります。モデルをこのDOに置くのは、生成のたびにD1を読まないためです。モデルごとの品質タグ・ネガティブプロンプト・パラメーターは`src/features/image-generation/novelai.ts`にあります。

NovelAIはPNGのtEXtチャンクと、アルファ値の最下位ビット（`stealth_pngcomp`）に生成の条件を埋め込みます。生成キューのDOは、受け取ったPNGの画素を`src/features/image-generation/generated-image.ts`で取り出してアルファを捨て、libwebpのWASM（`@jsquash/webp`）で品質90の非可逆のWebPに書き出します。Workersは実行時にWASMをコンパイルできないため、`.wasm`はCloudflare Vite pluginでコンパイル済みのモジュールとして読み込みます。変換は1枚あたり約0.4秒のCPU時間を使うため、Workers Freeでも1リクエストあたり30秒まで使えるDOで行い、NovelAIの順番待ちの外に置いて次の生成の通信と重ねます。選定理由は[ADR 0008](decisions/0008-generated-image-webp.md)を参照してください。

生成画像は、R2のバケット（binding `GENERATED_IMAGES`）の`generations/<対戦ID>/<処理ID>`に、生成キューのDOが返したWebPのまま保存します。キーに対戦IDを含め、別の対戦で同じ処理IDが使われても上書きしません。保存と配信は`src/features/image-generation/generated-images.server.ts`、配信のServer Routeは`src/routes/generated-images.$battleId.$generationId.ts`です。配信ではセッションを確かめず、`Cache-Control: private, max-age=31536000, immutable`を付けます。URLは推測できないUUIDで、結果の確定前は本人にだけ配信するため、確定前に相手の画像のURLを知る手段はありません。対戦の状態には`BETTER_AUTH_URL`を基にした絶対URLを記録します。お題の画像とはバケットを分け、バックアップの対象にせず、古い画像も消しません。選定理由は[ADR 0011](decisions/0011-generated-image-storage.md)を参照してください。

### 匿名参加のセッション

アカウントへログインしない参加者も、サーバーが発行したセッションで識別します。セッションの秘密情報と画面に公開する参加者IDは分け、表示名・ルームコード・IPアドレスだけで同じ参加者と判断しません。セッションの発行・検証・失効にはBetter Authのanonymousプラグインを使い、ユーザーとセッションをD1へ保存します。Better AuthのユーザーIDを参加者の識別に使い、DBアクセスはDrizzleアダプターを通します。接続と認証設定はリクエスト内で生成します。

認証専用の`/api/auth/$`はTanStack StartのServer Routeにマウントします。ゲームの操作はServer Functionsを使い、認証用のHTTP APIへ混在させません。画面へ返す参加者情報はIDと匿名参加かどうか、ログイン済みの場合はアカウントの名前と使用したサービスに絞り、Better Authのセッション全体をルートのデータへ渡しません。SSRでのCookie更新には`tanstackStartCookies`を使います。選定理由は[ADR 0003](decisions/0003-anonymous-sessions.md)を参照してください。

セッションはCookieで送受信し、URLやlocalStorageには保存しません。本番では`HttpOnly`・`Secure`・`SameSite=Lax`・`Path=/`を指定し、`Domain`を設定せず、`__Host-`で始まるCookie名を使います。セッションを含むレスポンスや参加者固有の画面は、共有キャッシュに保存しません。

セッションの有効期限と失効状態をサーバー側で確認します。Cookieの削除だけで失効したとは扱いません。Better AuthのCookieキャッシュは使わず、D1上の状態を確認します。セッションの有効期間と更新間隔はBetter Authの標準設定に従います。匿名ユーザーの自動削除は無効にし、対戦結果の保存とは別に扱います。ルームを閉じる期限とセッションの有効期限は別に管理します。ルームの参加資格・ホスト権限はDOの現在の状態から判定し、Cookieに保存した権限を信用しません。

状態を変更するServer FunctionsはPOSTを使い、`src/start.ts`でTanStack StartのCSRF対策を明示的に設定します。認証のPOSTにも適用し、Cookieを持たない初回の匿名参加を含めて別Originからの操作を拒否します。認証APIの回数制限はD1で管理し、Cloudflareが設定する`CF-Connecting-IP`を使います。WebSocketの接続時も許可したOrigin・セッション・参加資格を確認し、セッションの期限切れや失効後は配信を止めます。

### 参加者のログイン

ログインの要件は[ゲーム仕様](product.md#ログイン)に従います。Better Authの`socialProviders`でGoogleとDiscordを使い、OAuthクライアントのIDと秘密情報の両方を設定したサービスだけを有効にします。取得の範囲（scope）は各サービスの既定値（Googleは`openid`・`email`・`profile`、Discordは`identify`・`email`）です。Googleにログイン済みのブラウザでも別のアカウントを選べるよう、Googleには`prompt=select_account`を指定します。コールバックURLは`<BETTER_AUTH_URL>/api/auth/callback/<google|discord>`です。ログインで発行するセッションは匿名参加と同じD1のセッションで、Cookieの保護・失効の確認・WebSocketの扱いも[匿名参加のセッション](#匿名参加のセッション)と同じです。

同じメールアドレスのアカウントの連携はBetter Authの既定に従います。サービスが確認済みのメールアドレスを返し、既存のユーザーのメールアドレスも確認済みの場合だけ、同じユーザーに連携します。

匿名のセッションを持ったままログインすると、anonymousプラグインが新しいユーザーのセッションに切り替えます。匿名ユーザーは削除せず、`onLinkAccount`でそのユーザーのセッションをすべて失効させます。同じブラウザのほかのタブのWebSocketは、ルームのDOが状態を配信する前の確認で閉じます。ルームのDOの参加記録は書き換えません。ログアウトはBetter Authの`signOut`で、そのブラウザのセッションをD1から削除してからCookieを消します。

`getCurrentParticipant`は、ログイン済みの場合だけ、アカウントの名前（マイページの表示名）と最後にログインに使ったサービス、保存したアイコンの値を返します。サービスは、ログインのたびにBetter Authが更新するアカウントの更新日時から判定します。ルームの作成（`createRoom`）は、ログインしていない参加者を拒否します。参加者がログインしても、管理画面は使えません。

ログイン方法の選択・表示名の入力・ログアウトは、`src/features/room/room-entry.tsx`で`/start`と`/rooms/$code`（参加前）に表示します。トップの「スタート」は押したときにログインの状態を確かめ、ログインしていなければ移動せずにログインのダイアログ（`src/features/room/login-dialog.tsx`）を開き、ログインの後は`/start`へ戻します。トップのHTMLに参加者の情報を含めないよう、表示の時点では確かめません。ボタンは設定の有無にかかわらず2つのサービスを出し、設定のないサービスでは開始に失敗した理由を表示します。認証の後と失敗したときは元の画面へ戻し、失敗の理由はBetter Authが付ける`?error=`から表示して、URLから取り除きます。ログイン中は方法の選択を省き、アカウントの名前の先頭20文字を表示名の欄に入れておきます。選定理由は[ADR 0006](decisions/0006-participant-login.md)を参照してください。

### 運営者の認証

運営者向けの管理画面（`/admin`）と管理用のServer Functionsは、Workerの秘密情報`ADMIN_PASSWORD`と一致するパスワードでログインした場合だけ使えます。参加者のセッション（Better Auth）とは分け、ログインに成功したら、有効期限と署名（`BETTER_AUTH_SECRET`とパスワードから作るHMAC）をHttpOnly・SameSite=StrictのCookieに保存します。サーバー側にはセッションを保存しないため、ログアウトではCookieを削除し、期限内のCookieを無効にする場合はパスワードを変えます。管理用のServer Functionsは毎回サーバー側でCookieを検証し、画面の表示だけに頼りません。`/admin`配下の画面は、ログインしていなければパスワードの入力だけを表示し、管理用のデータを読み込みません。管理画面と管理用の応答には`Cache-Control: private, no-store`を付けます。選定理由は[ADR 0005](decisions/0005-operator-password.md)を参照してください。

### 管理画面

管理画面は`src/routes/admin/route.tsx`の枠（左のメニュー）の中に、お題・対戦条件・よく使う表現・画像生成・採点ワーカー・採点ジョブ・バックアップの画面を並べます。仕様は[ゲーム仕様](product.md#管理画面)、画像の保存先とバックアップの方式を選んだ理由は[ADR 0007](decisions/0007-topic-images-and-backup.md)を参照してください。

お題の画像はR2のバケット（binding `TOPIC_IMAGES`）の`topics/<お題ID>/<画像ID>`に保存し、`src/routes/topic-images.$topicId.$imageId.ts`のServer Routeで配信します。配信ではセッションを確かめず、`Cache-Control: public, max-age=31536000, immutable`を付けます。画像を差し替えると画像IDを変えて新しいURLにし、古い画像は過去の対戦結果のために消しません。`topic.image_url`には`BETTER_AUTH_URL`を基にした配信URLを保存し、対戦の状態と採点が絶対URLを使えるようにします。

画像のメタデータは管理画面で消します。ブラウザーで画像を白で塗ったcanvasに描き直してWebPにし、Server FunctionへFormDataで送ります。サーバーは`src/features/battle/topic-images.ts`でWebPのチャンクを確かめ、EXIF・XMP・アニメーションがあれば保存しません。お題の画像はWorkersでは変換しません。

画像生成の画面は、`image-generation`のServer Function（`src/features/image-generation/image-generation-admin.functions.ts`）から生成キューのDOを呼び、モデルを読み書きします。値はValibotの`picklist`で検証し、V5 CuratedとV4.5 Curated以外は保存しません。

バックアップのZIP（`backup.json`と`topic-images/`の画像）は、ブラウザーで`fflate`を使って作成・展開します。書き出しではServer Functionから`backup.json`の内容を受け取り、画像は配信URLから読みます。読み込みでは、ZIPを検証して件数を表示し、画像を1枚ずつ保存してから、グループ・表現・お題・対戦条件の候補を20件ずつServer Functionへ送ります。D1の1回の呼び出しで使えるクエリ数に収めるためです。書き込みはIDで上書きまたは追加するため、途中で失敗しても同じZIPを読み込み直せば同じ状態になります。

### 処理の呼び出し順序

| 用途                       | 呼び出し順序                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| ルーム操作・提出           | UI → 担当featureのServer Function → DOのRPC → 業務処理                                                        |
| 画像の生成                 | 対戦画面 → `image-generation`のServer Function → ルームのDO（受付）→ 生成キューのDO → R2 → ルームのDO（完了） |
| お題・保存済み結果の取得   | loaderまたはUI → 担当featureのServer Function → D1                                                            |
| 表示名・アイコンの変更     | マイページ → `account`のServer Function → D1                                                                  |
| お題の画像の登録           | 管理画面（ブラウザーでWebPに変換）→ `battle`のServer Function → R2・D1                                        |
| バックアップ               | 管理画面（ブラウザーでZIPを作成・展開）→ 担当featureのServer Function → D1・R2                                |
| 画像生成のモデルの切り替え | 管理画面 → `image-generation`のServer Function → 生成キューのDO                                               |
| ルーム・対戦状態の配信     | ルームのDO → WebSocket → UI                                                                                   |
| 採点ジョブの受け渡し       | 採点ワーカー → `src/server.ts` → `scoring`のサーバー処理 → D1・R2                                             |
| 採点結果の反映             | ルームのDOのAlarm → `scoring`のサーバー処理 → D1 → `battle`の業務処理                                         |

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

サーバーに接続するゲーム画面では、同じルームURL上で待機・対戦・画像選択・結果の表示を切り替え、サーバーが確定した状態を表示します。画面とAPIの責務は[画面とAPIの構成](#画面とapiの構成)を参照してください。フォームの入力値や提出前に選んでいる画像は画面側で保持します。プロンプトのすべての欄の語句・重み・書きかけ・入力方法と選んでいる欄は`PromptComposer`が持ち、このタブの`sessionStorage`（`animic-prompt:<対戦ID>`）にも保存します。再接続や再読み込みで画面を作り直したときは同じ対戦の保存から戻し、対戦が変わると別の対戦の保存は使わずに初期状態へ戻します。前の対戦の保存は、次の対戦で入力を保存するときに消します。読み書きできない環境では保存せずに入力を続けられます。「生成する」は要求ごとに処理IDを作り、送れなかった要求を同じ入力で送り直すときは同じ処理IDを使います。「確認なしですぐ提出」の設定はこの端末の`localStorage`（`animic-quick-submit`）に保存し、読み書きできない環境ではオフとして扱います。相手の生成状態と生成回数は配信しないため、画面にも出しません。提出の確定・締切・勝敗はサーバー側の状態で判断します。残り時間は配信時のサーバー時刻と期限を基準に表示し、受信後の経過時間にはブラウザーの単調増加時計を使います。端末の時計設定を締切判定に使わず、表示が0秒になったことだけで提出状態を確定しません。

### DBアクセスの配置

`src/lib/`にはD1接続など、複数の機能で使う処理を置き、機能固有のDrizzleスキーマ・クエリは担当するfeature内に置きます。お題と保存済み結果は`battle`、DO内のルームと対戦の永続化は`room`、採点ワーカー・採点ジョブ・採点結果は`scoring`が担当します。DBクライアントと業務処理を一律の共通repository層に集約しません。

`src/server.ts`では、通常のリクエストをTanStack Startに渡し、採点ワーカー向けAPIを`scoring`に渡し、WebSocket接続をDOに転送し、DOクラスをexportします。アプリをフロントエンドと独立した業務APIサーバーへ分割しません。

## 参加者と対戦の関係

ルームには複数の参加者と、そのルームで行った対戦を紐づけます。ルームの現在の参加者と、個々の対戦への参加記録は分けます。途中参加ではルームの参加者だけを追加し、開始済みの対戦への参加記録は追加しません。再接続時はサーバーで確認した参加者情報から既存の対戦への参加記録を取得します。退出や次の対戦への参加によって、過去の対戦の参加記録・提出・結果が変わらないようにします。

準備状態と次の対戦の設定はルーム側で管理します。開始時にはDOで接続中のルーム参加者を取得し、[ゲーム仕様](product.md#対象範囲)の人数条件を確認して、参加者・お題・対戦条件・開始時刻・生成終了時刻をその対戦の記録として確定します。人数条件は開始時の業務ルールとして扱い、保存スキーマは2人に固定しません。ルーム側の設定変更が進行中・終了済みの対戦へ遡って適用されないようにします。開始要求には直前の対戦ID（初回はnull）を含めます。DOで現在の対戦と結果の確定を確認してから新しい対戦を作成し、再送で二重作成したり、古い画面から進行中の対戦を置き換えたりしないようにします。設定変更にも同じ対戦IDの確認を適用します。再戦では現在接続中のルーム参加者を対象に新たな対戦ID・履歴・締切を作り、前の結果とD1への保存待ちの記録を保持します。準備状態は開始時にリセットします。

お題はD1の公開中の画像から、指定した難易度に一致するものをランダムに選びます。該当するお題がない場合は開始しません。D1からのお題取得後、DOでホスト権限・参加人数・対戦状態・設定を再確認して開始を確定します。取得中にホストや設定が変わった場合は、古い要求で開始しません。

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
