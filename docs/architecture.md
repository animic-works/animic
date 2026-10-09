# アーキテクチャ

## 基本方針

TanStack Startのフルスタック構成で、機能単位で関連するコードをまとめます。アプリ内の業務APIはServer Functionsを使います。

各機能の役割と依存関係に合わせてコードを配置します。ゲームUIは[画面の部品](#画面の部品)のとおり、Ark UIとCSS Modulesで構築します。Cloudflareにデプロイする構成とし、依存パッケージのバージョン管理は[CONTRIBUTING.md](../CONTRIBUTING.md#依存関係とgitで管理するファイル)に従います。

## 検索とSNS共有

検索と共有の対象は[ゲーム仕様](product.md#検索とsns共有)に従います。トップ固有のcanonical・説明文・OGPは`src/routes/index.tsx`で設定します。robots.txtとsitemap.xmlは`public/`に置き、サイトマップには公開する正規URLだけを記載します。`src/server.ts`では`animic.party`のトップだけを検索対象とし、それ以外のホスト・パスのページ・APIレスポンスに`X-Robots-Tag: noindex`を付けます。一般公開する説明ページを追加する際は、検索対象の判定とサイトマップを合わせて更新します。画像・CSS・JavaScriptなどの静的アセットは取得を許可し、トップの表示と共有に利用できるようにします。robots.txtでクロールを禁止するだけでは検索除外を保証できず、非公開情報の保護には認証・認可が必要です。

## 画面とAPIの構成

画面の要件は[ゲーム仕様](product.md#対象範囲)に従い、ルートは`src/routes/`で定義します。認証・ルーム・対戦のServer Functions、D1スキーマ、DOは画面の表示から独立させます。ブラウザ側のWebSocket接続・再接続・状態のバージョン比較は`src/features/room/room-connection.ts`に置き、表示は呼び出し側に委ねます。

| パス                 | 画面                                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `/`                  | トップ（ホーム・遊び方・スコアの決まり方・ギャラリー）、ルームコードの入力、ログイン                              |
| `/start`             | ログイン、表示名の入力とルームの作成                                                                              |
| `/rooms/$code`       | 参加前はログインの選択と表示名の入力、参加後はロビー・対戦・結果（状態で切り替え）                                |
| `/terms`・`/privacy` | 利用規約・プライバシーポリシー                                                                                    |
| `/admin`配下         | [管理画面](#管理画面)（ログイン、お題・対戦条件・よく使う表現・画像生成・採点ワーカー・採点ジョブ・バックアップ） |

### 画面の部品

ボタン・ダイアログ・入力欄・トースト・画面遷移の演出など、機能に依存しない部品は`src/components/`に置きます。トップの各節は`src/routes/-home/`、ロビー・対戦・結果の部品は`src/features/room/`・`src/features/battle/`、管理画面の部品は`src/features/admin/`に置きます。対戦画面のプロンプト入力の部品（`prompt-composer.tsx`・`prompt-field.tsx`・`prompt-search-dialog.tsx`）と、語句の操作・表現の辞書の処理（`prompt-blocks.ts`・`prompt-dictionary.ts`）は`src/features/image-generation/`に置き、`battle`の対戦画面から使います。スタイルはCSS Modulesで部品に隣接させ、色・書体・余白などは`src/styles/tokens.css`のCSS変数を使います。部品のスタイルは`@layer`（`recipes.base`・`recipes.slots`・`recipes.variants`など）に入れます。部品のCSSは別のファイルに分かれて全体のCSSより先に読み込まれることがあるため、層の順序は`vite.config.ts`ですべてのCSSの先頭に宣言します。リセット・全体の土台・書体の読み込み（Fontsource）は`src/styles/global.css`にまとめ、`src/routes/__root.tsx`で最初に読み込みます。画面遷移の演出は`src/components/transition.tsx`で、ルートの外側で1つだけ持ち、ページの移動とルームの状態による画面の切り替えの両方で使います。

#### 暫定対応と解消条件

デザインシステム（Issue #13）を導入するまで、画面の見た目はデザイン（Figmaの`draft`ページ）に合わせたスタイルをCSS Modulesで持ちます。トークン名と`@layer`の構成はPanda CSSの出力と同じにしています。[ADR 0002](decisions/0002-application-foundation.md)のBase UIではなく、デザインシステムと同じArk UIを使います。

デザインシステムを導入したら、画面をデザインシステムの部品で作り直し、`src/components/`のうち置き換えた部品、`src/styles/tokens.css`、この節を削除します。

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
| ロビーで選べる対戦条件の候補・よく使う表現                              | D1             |
| 運営者が選んだ画像生成のモデル                                          | 生成キューのDO |
| ルームの参加者・ホスト・準備状態・次の対戦の設定                        | ルームのDO     |
| 対戦の開始時刻・生成終了時刻・生成履歴の情報・生成回数・提出・採点状態  | ルームのDO     |
| 確定した対戦結果の保存・共有用の参照                                    | D1             |
| 採点ワーカー・リンクコード・採点ジョブ・採点結果                        | D1             |

DOの状態はSQLiteストレージに永続化し、再起動・再接続後にも復元します。対戦中の状態はDOで管理し、同じ状態をD1側で独立して更新しません。確定結果は対戦IDで識別してD1へ保存します。保存待ちの情報をDOに保持し、再試行しても結果が重複しないようにします。対戦の確定と保存待ちの記録をDO内の同じトランザクションで保存し、D1の`battle_result`へ対戦IDを主キーとして挿入します。D1への通信前に次の再試行を予約し、保存済みの対戦IDは上書きしません。ルームが閉じた後も保存待ちの記録は再試行の対象にします。

ルームや進行中の対戦に関わる操作は、Server Functionsから対象ルームのDOへ渡します。DOで参加資格・対戦状態・操作が可能な時間・提出済みかどうかを確認して状態を更新します。時間の判定にはサーバー側の時刻を使い、Alarmの起動時刻だけに依存しません。提出の再送やAlarmの再実行で、確定済みの状態が変わらないようにします。

生成の受付と提出の受付を分けて管理します。生成終了時刻を過ぎたら新たな生成を拒否し、画像選択の期限まで未提出者の提出を受け付けます。時間内に受け付けた生成がすべて終了したら、生成終了時刻と最後の処理終了時刻の遅い方を起点に選択期限を確定してDOへ保存します。処理完了の重複通知や再接続で選択期限を延ばしません。期限切れの参加者は未提出として確定し、画像を自動提出しません。生成終了時刻を過ぎて成功した画像も生成中の画像もない参加者は、選択期限を待たずに、生成終了時刻と本人の最後の処理終了時刻の遅い方を確定時刻として未提出にします。提出要求でも期限を確認し、Alarmが遅れても締切後の提出を受け付けません。提出時刻はサーバー側で記録し、`scoring`が時間内の提出かどうかを判定できるようにします。画面の切り替えだけで生成を制限しません。

生成要求を受け付ける際は、DOで生成できるかどうかを確認し、対戦ID・参加者ID・処理ID・サーバー側の受付時刻を記録してから外部サービスを呼び出します。同じ要求の再送を新しい生成として扱わないようにします。処理IDに対応する参加者と入力のハッシュを保存し、同じIDで別の参加者や内容へ差し替えられた要求は拒否します。受付済みなら外部サービスを再度呼び出しません。時間内に受け付けた処理の完了は生成終了時刻後も反映し、未提出者の提出候補に含めます。

画像生成・AI採点などの外部通信中に、ルーム全体の処理をロックしません。結果を反映するときに対戦ID・処理ID・現在の状態を検証し、遅れて届いた結果や重複通知が別の対戦や確定済みの提出を変更しないようにします。生成の受付・処理中・成功・失敗を区別し、受付記録だけで生成完了とは扱いません。

生成の試行記録とスコア用の生成回数は区別します。試行記録には失敗も残し、スコア用の回数は[ゲーム仕様](product.md#対戦の流れ)に従って成功した生成から算出します。同じ処理の完了通知を重複して受けても二重に数えません。提出を確定するときに、その時点の成功回数・提出時刻・速度加点の対象かどうかを保存します。提出後に生成が完了しても、この記録を変更しません。

### 採点

採点は、運営者のPCで動くdesktop-comfyui-serverを採点ワーカーとして登録して実行します。採点ワーカーがAnimicへ採点ジョブを取りに来るため、採点ジョブと採点ワーカーはD1で管理します。構成は[採点の設計](scoring.md)、実行先とキューの方式を選んだ理由は[ADR 0004](decisions/0004-scoring-workers.md)を参照してください。

提出を受け付けたら、`battle`が採点エントリーを追加します。ルームのDOは採点待ちの間、Alarmで`scoring`のサーバー処理を呼び、採点ジョブを登録して状態と結果を取得し、対戦へ反映します。採点ジョブの状態は`scoring`がD1で管理し、ルームのDOが持つ対戦の採点状態とは分けます。結果を反映するときは対戦IDと採点ジョブのIDを照合し、確定済みの結果を変更しません。

リンクコードの発行、採点ワーカーの一覧と失効、採点ジョブの一覧は、[運営者の認証](#運営者の認証)を通した管理画面で行います。採点ワーカーへ渡す画像のうち、このアプリが配信するお題の画像は、自分のURLへ通信せずR2から読みます。

採点ワーカー向けAPIは、`src/server.ts`でTanStack Startより前に振り分けます。TanStack StartのCSRF対策は、`Origin`などを持たない非GETの要求を拒否するためです。採点ワーカーはCookieを使わず、リンク時に発行した秘密情報をBearerで送るため、ブラウザ向けのCSRF対策の対象外とします。

## ファイル配置と役割

| 配置              | 役割                                               |
| ----------------- | -------------------------------------------------- |
| `src/routes/`     | ルート定義、loader、画面の組み立て                 |
| `src/features/`   | 機能固有のUI、スタイル、Server Functions、業務処理 |
| `src/components/` | 機能に依存しない共有UI                             |
| `src/lib/`        | 参加者の識別・DB接続など、複数の機能で使う処理     |
| `src/styles/`     | グローバルCSS、デザイントークン                    |

### 各featureの役割

| 配置                             | 役割                                                                       |
| -------------------------------- | -------------------------------------------------------------------------- |
| `src/features/room/`             | ルーム作成・招待・参加者・ホスト・準備状態・次の対戦の設定・対戦条件の候補 |
| `src/features/battle/`           | お題の管理と選定・対戦開始・生成終了・画像選択と提出・勝敗の確定・結果表示 |
| `src/features/image-generation/` | プロンプト入力・よく使う表現・生成サービスの呼び出し・生成履歴             |
| `src/features/scoring/`          | 再現度評価・提出速度と生成回数を含む総合スコア計算                         |
| `src/features/admin/`            | 管理画面の枠と各画面・バックアップの書き出しと読み込み                     |

`battle`は対戦中に生成・提出できるかどうかを判断し、スコアに使う生成回数を確定します。`image-generation`は生成処理と履歴を扱い、`scoring`は確定した提出と評価条件からスコアを算出します。生成・採点処理が独立して対戦の進行状態を変更することはありません。

ルームのDOは`room`に配置します。DOは永続化・排他制御・状態配信を担当し、対戦ルールの判断は`battle`の業務処理を呼び出して行います。`battle`から`image-generation`・`scoring`のサーバー処理を利用し、処理結果を呼び出し側が受け取って対戦へ反映します。DOクラスへ各featureの業務処理を集めず、生成・採点処理からDOを呼び出すコードも作りません。

この分割はコードの役割によるものです。featureごとにWorkerやDOを分割することは要求しません。結果画面は`battle`、招待リンクのコピーとQR表示は`room`に含めます。

`admin`は管理画面の表示とバックアップの手順を担当し、データの読み書きは担当するfeatureのServer Functionsとサーバー処理を使います。お題の管理用のServer Functionsは`battle`、対戦条件の候補は`room`、よく使う表現と画像生成のモデルは`image-generation`に置きます。

## 依存関係とクライアント・サーバーの分離

- `src/routes/`から各featureのUIや処理を呼び出し、各featureから共通のUIや処理を利用します。
- 共通のコードから特定のfeatureをimportせず、循環依存も避けます。
- 画面の組み立ては`src/routes/`で行い、業務処理の連携はサーバー側で扱います。
- 通常のデータ取得・操作には`createServerFn`で定義したServer Functionsを使い、サーバー専用のコードをクライアントのバンドルに含めないようにします。ファイルの命名は[実装規約](conventions.md#クライアントとサーバーの分離)に従います。
- 入力検証・認証・認可はサーバー側で行います。画面側の遷移制御だけに依存しません。

画像生成サービスは`image-generation`のサーバー専用処理から呼び出します。Animicが管理する認証情報はサーバー側の秘密情報として保管し、クライアントのコード・レスポンス・ログには含めません。参加者の識別情報と生成サービスの認証情報を分けて扱います。

NovelAIは1アカウントで同時に1件しか生成できないため、生成キューのDO（`NovelAiQueue`、`src/features/image-generation/novelai.server.ts`）の1つのインスタンスが、全ルームの生成を受付順に1件ずつ送ります。順番が来たら、運営者が選んだモデルをこのDOのストレージから読み、Workerの環境変数`NOVELAI_STYLE_PROMPT`の規定の絵柄を参加者のプロンプトと品質タグの間に加えます。絵柄と品質タグはNovelAIの`v4_prompt`にだけ入れ、`input`には参加者のプロンプトをそのまま送ります。モデルをこのDOに置くのは、生成のたびにD1を読まないためです。モデルごとの品質タグ・ネガティブプロンプト・パラメーターは`src/features/image-generation/novelai.ts`にあります。

NovelAIはPNGのtEXtチャンクと、アルファ値の最下位ビット（`stealth_pngcomp`）に生成の条件を埋め込みます。生成キューのDOは、受け取ったPNGの画素を`src/features/image-generation/generated-image.ts`で取り出してアルファを捨て、libwebpのWASM（`@jsquash/webp`）で品質90の非可逆のWebPに書き出します。Workersは実行時にWASMをコンパイルできないため、`.wasm`はCloudflare Vite pluginでコンパイル済みのモジュールとして読み込みます。変換は1枚あたり約0.4秒のCPU時間を使うため、Workers Freeでも1リクエストあたり30秒まで使えるDOで行い、NovelAIの順番待ちの外に置いて次の生成の通信と重ねます。選定理由は[ADR 0008](decisions/0008-generated-image-webp.md)を参照してください。

### 匿名参加のセッション

アカウントへログインしない参加者も、サーバーが発行したセッションで識別します。セッションの秘密情報と画面に公開する参加者IDは分け、表示名・ルームコード・IPアドレスだけで同じ参加者と判断しません。セッションの発行・検証・失効にはBetter Authのanonymousプラグインを使い、ユーザーとセッションをD1へ保存します。Better AuthのユーザーIDを参加者の識別に使い、DBアクセスはDrizzleアダプターを通します。接続と認証設定はリクエスト内で生成します。

認証専用の`/api/auth/$`はTanStack StartのServer Routeにマウントします。ゲームの操作はServer Functionsを使い、認証用のHTTP APIへ混在させません。画面へ返す参加者情報は、ID・匿名参加かどうか・[ログイン](#参加者のログイン)したアカウントの名前とサービスに絞り、Better Authのセッション全体をルートのデータへ渡しません。SSRでのCookie更新には`tanstackStartCookies`を使います。選定理由は[ADR 0003](decisions/0003-anonymous-sessions.md)を参照してください。

セッションはCookieで送受信し、URLやlocalStorageには保存しません。本番では`HttpOnly`・`Secure`・`SameSite=Lax`・`Path=/`を指定し、`Domain`を設定せず、`__Host-`で始まるCookie名を使います。セッションを含むレスポンスや参加者固有の画面は、共有キャッシュに保存しません。

セッションの有効期限と失効状態をサーバー側で確認します。Cookieの削除だけで失効したとは扱いません。Better AuthのCookieキャッシュは使わず、D1上の状態を確認します。セッションの有効期間と更新間隔はBetter Authの標準設定に従います。匿名ユーザーの自動削除は無効にし、対戦結果の保存とは別に扱います。ルームを閉じる期限とセッションの有効期限は別に管理します。ルームの参加資格・ホスト権限はDOの現在の状態から判定し、Cookieに保存した権限を信用しません。

状態を変更するServer FunctionsはPOSTを使い、`src/start.ts`でTanStack StartのCSRF対策を明示的に設定します。認証のPOSTにも適用し、Cookieを持たない初回の匿名参加を含めて別Originからの操作を拒否します。認証APIの回数制限はD1で管理し、Cloudflareが設定する`CF-Connecting-IP`を使います。WebSocketの接続時も許可したOrigin・セッション・参加資格を確認し、セッションの期限切れや失効後は配信を止めます。

### 参加者のログイン

ログインの要件は[ゲーム仕様](product.md#ログイン)に従います。Better Authの`socialProviders`でGoogleとDiscordを使い、OAuthクライアントのIDと秘密情報の両方を設定したサービスだけを有効にします。取得の範囲（scope）は各サービスの既定値（Googleは`openid`・`email`・`profile`、Discordは`identify`・`email`）です。Googleにログイン済みのブラウザでも別のアカウントを選べるよう、Googleには`prompt=select_account`を指定します。コールバックURLは`<BETTER_AUTH_URL>/api/auth/callback/<google|discord>`です。ログインで発行するセッションは匿名参加と同じD1のセッションで、Cookieの保護・失効の確認・WebSocketの扱いも[匿名参加のセッション](#匿名参加のセッション)と同じです。

同じメールアドレスのアカウントの連携はBetter Authの既定に従います。サービスが確認済みのメールアドレスを返し、既存のユーザーのメールアドレスも確認済みの場合だけ、同じユーザーに連携します。

匿名のセッションを持ったままログインすると、anonymousプラグインが新しいユーザーのセッションに切り替えます。匿名ユーザーは削除せず、`onLinkAccount`でそのユーザーのセッションをすべて失効させます。同じブラウザのほかのタブのWebSocketは、ルームのDOが状態を配信する前の確認で閉じます。ルームのDOの参加記録は書き換えません。ログアウトはBetter Authの`signOut`で、そのブラウザのセッションをD1から削除してからCookieを消します。

`getCurrentParticipant`は、ログイン済みの場合だけ、アカウントの名前と最後にログインに使ったサービスを返します。サービスは、ログインのたびにBetter Authが更新するアカウントの更新日時から判定します。ルームの作成（`createRoom`）は、ログインしていない参加者を拒否します。参加者がログインしても、管理画面は使えません。

ログイン方法の選択・表示名の入力・ログアウトは、`src/features/room/entry-flow.tsx`で`/start`と`/rooms/$code`（参加前）に表示します。トップの「スタート」は押したときにログインの状態を確かめ、ログインしていなければ移動せずにログインのダイアログ（`src/features/room/login-dialog.tsx`）を開き、ログインの後は`/start`へ戻します。トップのHTMLに参加者の情報を含めないよう、表示の時点では確かめません。ボタンは設定の有無にかかわらず2つのサービスを出し、設定のないサービスでは開始に失敗した理由を表示します。認証の後と失敗したときは元の画面へ戻し、失敗の理由はBetter Authが付ける`?error=`から表示して、URLから取り除きます。ログイン中は方法の選択を省き、アカウントの名前の先頭20文字を表示名の欄に入れておきます。選定理由は[ADR 0006](decisions/0006-participant-login.md)を参照してください。

### 運営者の認証

運営者向けの管理画面（`/admin`）と管理用のServer Functionsは、Workerの秘密情報`ADMIN_PASSWORD`と一致するパスワードでログインした場合だけ使えます。参加者のセッション（Better Auth）とは分け、ログインに成功したら、有効期限と署名（`BETTER_AUTH_SECRET`とパスワードから作るHMAC）をHttpOnly・SameSite=StrictのCookieに保存します。サーバー側にはセッションを保存しないため、ログアウトではCookieを削除し、期限内のCookieを無効にする場合はパスワードを変えます。管理用のServer Functionsは毎回サーバー側でCookieを検証し、画面の表示だけに頼りません。`/admin`配下の画面は、ログインしていなければパスワードの入力だけを表示し、管理用のデータを読み込みません。管理画面と管理用の応答には`Cache-Control: private, no-store`を付けます。選定理由は[ADR 0005](decisions/0005-operator-password.md)を参照してください。

### 管理画面

管理画面は`src/routes/admin/route.tsx`の枠（左のメニュー）の中に、お題・対戦条件・よく使う表現・画像生成・採点ワーカー・採点ジョブ・バックアップの画面を並べます。仕様は[ゲーム仕様](product.md#管理画面)、画像の保存先とバックアップの方式を選んだ理由は[ADR 0007](decisions/0007-topic-images-and-backup.md)を参照してください。

お題の画像はR2のバケット（binding `TOPIC_IMAGES`）の`topics/<お題ID>/<画像ID>`に保存し、`src/routes/topic-images.$topicId.$imageId.ts`のServer Routeで配信します。配信ではセッションを確かめず、`Cache-Control: public, max-age=31536000, immutable`を付けます。画像を差し替えると画像IDを変えて新しいURLにし、古い画像は過去の対戦結果のために消しません。`topic.image_url`には`BETTER_AUTH_URL`を基にした配信URLを保存し、対戦の状態と採点が絶対URLを使えるようにします。

画像のメタデータは管理画面で消します。ブラウザーで画像を白で塗ったcanvasに描き直してWebPにし、Server FunctionへFormDataで送ります。サーバーは`src/features/battle/topic-images.ts`でWebPのチャンクを確かめ、EXIF・XMP・アニメーションがあれば保存しません。お題の画像はWorkersでは変換しません。

画像生成の画面は、`image-generation`のServer Function（`src/features/image-generation/image-generation-admin.functions.ts`）から生成キューのDOを呼び、モデルを読み書きします。値はValibotの`picklist`で検証し、V5 CuratedとV4.5 Curated以外は保存しません。

バックアップのZIP（`backup.json`と`topic-images/`の画像）は、ブラウザーで`fflate`を使って作成・展開します。書き出しではServer Functionから`backup.json`の内容を受け取り、画像は配信URLから読みます。読み込みでは、ZIPを検証して件数を表示し、画像を1枚ずつ保存してから、グループ・表現・お題・対戦条件の候補を20件ずつServer Functionへ送ります。D1の1回の呼び出しで使えるクエリ数に収めるためです。書き込みはIDで上書きまたは追加するため、途中で失敗しても同じZIPを読み込み直せば同じ状態になります。

### 処理の呼び出し順序

| 用途                       | 呼び出し順序                                                                   |
| -------------------------- | ------------------------------------------------------------------------------ |
| ルーム操作・生成要求・提出 | UI → 担当featureのServer Function → DOのRPC → 業務処理                         |
| お題・保存済み結果の取得   | loaderまたはUI → 担当featureのServer Function → D1                             |
| お題の画像の登録           | 管理画面（ブラウザーでWebPに変換）→ `battle`のServer Function → R2・D1         |
| バックアップ               | 管理画面（ブラウザーでZIPを作成・展開）→ 担当featureのServer Function → D1・R2 |
| 画像生成のモデルの切り替え | 管理画面 → `image-generation`のServer Function → 生成キューのDO                |
| ルーム・対戦状態の配信     | ルームのDO → WebSocket → UI                                                    |
| 採点ジョブの受け渡し       | 採点ワーカー → `src/server.ts` → `scoring`のサーバー処理 → D1                  |
| 採点結果の反映             | ルームのDOのAlarm → `scoring`のサーバー処理 → D1 → `battle`の業務処理          |

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

ゲーム画面は、同じルームURL上で待機・対戦・画像選択・結果の表示を切り替えます。`src/routes/`で`room`・`battle`・`image-generation`のUIを組み立て、サーバーが確定した状態を表示します。表示する画面は`src/features/battle/battle-screen.ts`で、結果の見出しと参加者ごとの提出画像・最終スコアは`src/features/battle/battle-outcome.ts`で、対戦の状態から決めます。結果を閉じた対戦は、その参加者の画面だけロビーに戻し、次の対戦の開始に使います。フォームの入力値や提出前に選んでいる画像は画面側で保持します。プロンプトの語句・重み・入力方法は`PromptComposer`が持ち、対戦が変わると初期状態に戻します。「確認なしですぐ提出」の設定はこの端末の`localStorage`（`animic-quick-submit`）に保存し、読み書きできない環境ではオフとして扱います。相手の生成状態と生成回数は配信しないため、画面にも出しません。提出の確定・締切・勝敗はサーバー側の状態で判断します。 残り時間は配信時のサーバー時刻と期限を基準に表示し、受信後の経過時間にはブラウザーの単調増加時計を使います。端末の時計設定を締切判定に使わず、表示が0秒になったことだけで提出状態を確定しません。

### DBアクセスの配置

`src/lib/`にはD1接続など、複数の機能で使う処理を置き、機能固有のDrizzleスキーマ・クエリは担当するfeature内に置きます。お題（R2の画像を含む）と保存済み結果は`battle`、DO内のルームと対戦の永続化と対戦条件の候補は`room`、よく使う表現は`image-generation`、採点ワーカー・採点ジョブ・採点結果は`scoring`が担当します。DBクライアントと業務処理を一律の共通repository層に集約しません。

`src/server.ts`では、通常のリクエストをTanStack Startに渡し、採点ワーカー向けAPIを`scoring`に渡し、WebSocket接続をDOに転送し、DOクラスをexportします。アプリをフロントエンドと独立した業務APIサーバーへ分割しません。

## 参加者と対戦の関係

ルームには複数の参加者と、そのルームで行った対戦を紐づけます。ルームの現在の参加者と、個々の対戦への参加記録は分けます。途中参加ではルームの参加者だけを追加し、開始済みの対戦への参加記録は追加しません。再接続時はサーバーで確認した参加者情報から既存の対戦への参加記録を取得します。退出や次の対戦への参加によって、過去の対戦の参加記録・提出・結果が変わらないようにします。

準備状態と次の対戦の設定はルーム側で管理します。開始時にはDOで接続中のルーム参加者を取得し、[ゲーム仕様](product.md#対象範囲)の人数条件を確認して、参加者・お題・対戦条件・開始時刻・生成終了時刻をその対戦の記録として確定します。人数条件は開始時の業務ルールとして扱い、保存スキーマは2人に固定しません。ルーム側の設定変更が進行中・終了済みの対戦へ遡って適用されないようにします。開始要求には直前の対戦ID（初回はnull）を含めます。DOで現在の対戦と結果の確定を確認してから新しい対戦を作成し、再送で二重作成したり、古い画面から進行中の対戦を置き換えたりしないようにします。設定変更にも同じ対戦IDの確認を適用します。再戦では現在接続中のルーム参加者を対象に新たな対戦ID・履歴・締切を作り、前の結果とD1への保存待ちの記録を保持します。準備状態は開始時にリセットします。

お題はD1に事前登録した公開中の画像から、指定した難易度に一致するものをランダムに選びます。該当するお題がない場合は開始しません。D1からのお題取得後、DOでホスト権限・参加人数・対戦状態・設定を再確認して開始を確定します。取得中にホストや設定が変わった場合は、古い要求で開始しません。

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
