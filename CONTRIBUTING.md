# 開発手順

## 参照文書

- [ゲーム仕様](docs/product.md): プロダクトの要件
- [アーキテクチャ](docs/architecture.md): 構成と各機能の役割
- [実装規約](docs/conventions.md): コードを書く際の判断基準

## セットアップと検証

リポジトリルートで実行します。Vite+ CLIを用意し、Nodeは[.node-version](.node-version)、pnpmは[package.json](package.json)の指定に合わせます。

ローカル起動・検証にCloudflareへのログインは不要です。開発用には`.env.example`を`.env`へコピーし、`BETTER_AUTH_SECRET`を設定します。鍵は次のコマンドで生成できます。

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

`BETTER_AUTH_URL`は利用するアプリのURLに合わせます。`.env`はGitに含めません。環境変数で値を上書きできるよう、ローカル設定は`.env`に統一し、優先して読み込まれる`.dev.vars`とは併用しません。

NovelAIで画像を生成する場合は、NovelAIのアカウント設定で発行した永続APIトークン（`pst-`で始まる値）を`NOVELAI_API_TOKEN`に設定します。未設定でも起動できますが、画像の生成は失敗します。トークンはサーバー側の生成キューのDOだけで読み、ブラウザへのレスポンスやログには含めません。

全員の生成に付ける規定の絵柄は、運営が決めたタグ（アーティストタグなど）を`NOVELAI_STYLE_PROMPT`に設定します。値はリポジトリに含めません。未設定でも起動でき、Wranglerが未設定の警告を出して、絵柄を付けずに生成します。

管理画面（`/admin`）を使う場合は、12文字以上のパスワードを`ADMIN_PASSWORD`に設定します。`#`や`$`を含む場合は`ADMIN_PASSWORD='...'`のように単一引用符で囲みます。囲まないと`#`以降がコメントとして扱われます。

ルームを作るにはログインが必要なため、開発サーバーの画面でルームを作る場合も、[ログインのOAuthアプリ](#ログインのoauthアプリ)に従って`GOOGLE_CLIENT_ID`・`GOOGLE_CLIENT_SECRET`・`DISCORD_CLIENT_ID`・`DISCORD_CLIENT_SECRET`を設定します。

初回は次の順序で実行します。

```sh
vp install --frozen-lockfile
vp hooks enable
vp run typegen
vp run db:migrate:local
vp run test
vp exec playwright install --no-shell chromium
vp run test:e2e
vp run check
vp dev
```

開発サーバーは`http://localhost:3000`です。Cloudflare Vite pluginを通じてサーバー処理をローカルのWorkersランタイムで実行します。Linuxでブラウザのシステムライブラリが不足している場合は、Playwrightの[環境構築手順](https://playwright.dev/docs/browsers#install-system-dependencies)に従います。

| 操作                         | コマンド                               |
| ---------------------------- | -------------------------------------- |
| 依存パッケージのインストール | `vp install --frozen-lockfile`         |
| Git hooksの有効化            | `vp hooks enable`                      |
| Git hooksの確認              | `vp hooks status`                      |
| 開発サーバー                 | `vp dev`                               |
| DB変更のSQL生成              | `vp run db:generate --name <変更名>`   |
| ローカルD1へのSQL適用        | `vp run db:migrate:local`              |
| Workers型の生成              | `vp run typegen`                       |
| クライアント・Workerのビルド | `vp run build`                         |
| ビルド成果物のローカル起動   | `vp preview`                           |
| 業務ルールの単体テスト       | `vp run test`                          |
| ブラウザでのE2E検証          | `vp run test:e2e`                      |
| 静的検査                     | `vp run check`                         |
| フォーマット修正             | `vp fmt`                               |
| 未使用コードの検査           | `vp run knip`                          |
| コミットメッセージの検証     | `vp exec commitlint --edit <ファイル>` |

`vp run check`はフォーマット・lint・型チェック・Knipを実行します。`vp check`ではフォーマットと型情報を使うlintを実行し、プロジェクト全体の型チェックは`tsc --noEmit`、未使用コードの検査はKnipが担当します。コマンドの定義は[package.json](package.json)、lint・format・staged設定は[vite.config.ts](vite.config.ts)を参照してください。

E2Eは[playwright.config.ts](playwright.config.ts)がビルド・DBの初期化・プレビュー起動を行います。テストごとではなく実行ごとに`.wrangler/e2e/`を初期化し、開発用の`.wrangler/state/`とは分けます。Wranglerによるテストデータ操作と他のテストが同じSQLiteを同時に更新しないよう、E2Eは1 workerで順に実行します。複数人の同時操作は各テスト内で複数のブラウザコンテキストを使って確認します。認証URLと鍵、NovelAIのトークン、管理画面のパスワード、OAuthクライアントはテスト用の値を設定するため、E2Eだけなら`.env`の用意は不要です。E2Eのビルドには実際のNovelAIのトークンとOAuthクライアントを含めず、ブラウザへ配信するファイルとトップページのHTMLに、テスト用のNovelAIのトークンとOAuthの秘密情報が含まれないことを確認します。

E2E専用クライアントは`ANIMIC_E2E=true`のビルドにだけ含め、共通ルートのクライアントコードから読み込みます。通常のビルドや開発サーバーにはこの読み込みを追加しません。ログインした状態は、同じビルドにだけ含めるBetter Authのプラグイン（`src/lib/auth-e2e.server.ts`の`/api/auth/sign-in/e2e`）で作り、実際のOAuthは通しません。ルームを作るテストでは、このプラグインでホストをログインさせてから作ります。このプラグインは、`BETTER_AUTH_URL`がローカルのURLでなければ拒否します。E2Eのビルド成果物はデプロイせず、公開用にはこの環境変数を指定せずにビルドし直します。

`vp run test`はVite+内蔵のVitestで`src/**/*.test.ts`を実行します。期限やホストの引き継ぎなど、時刻を指定して確認する業務ルールを対象とします。Workersランタイムが必要な処理はE2Eで実際のD1・DOと組み合わせて確認します。

E2Eでは、トップページのSSR表示・説明文・画像の読み込み・狭い画面での表示・404応答・検索対象の判定をブラウザで確認します。画面の操作は`tests/e2e/ui.spec.ts`で、トップの「スタート」からのログインのダイアログと認証画面への移動・認証の失敗の表示・ログイン中の表示名の初期値とログアウト・ルームの作成・URLとルームコードからの参加・準備完了・対戦の条件の反映・開始できない理由・対戦の開始から勝負不成立と再戦・招待・退出とホストの引き継ぎ・別のタブでの退出・途中参加・画面遷移の演出のスキップ・遊び方の切り替え・利用規約とプライバシーポリシーを確認します。画面の選択肢より短い制限時間は、検証用クライアントで保存してから画面で開始します。対戦画面のプロンプト入力（語句・重み・入力候補・検索）、お題の拡大、確認なしですぐ提出の設定と、配信を差し替えて時間切れで提出できる画像がないときの表示は`tests/e2e/battle-ui.spec.ts`で確認します。`tests/e2e/battle-input.spec.ts`では、IMEの変換イベントを送って確定前の入力を保持することと、生成履歴の配信を差し替えて提出確認中の画像が変わらないことを確認します。これらは実際のIMEや画像生成サービスとの接続を確認するものではありません。画像生成の接続が未実装のため、実際の生成から選択・提出までを通す検証は接続後に行い、スコアで決まる結果の表示は単体テストで確認します。認証・ルーム・対戦の処理は、`tests/fixtures/api-client.ts`をブラウザで読み込んで実際のServer FunctionsとWebSocketを呼び出し、画面を経由せずに検証します。匿名セッションの復元・失効、ログインの開始で各サービスの認証URLを返すこと、ログイン中の参加者情報、匿名の参加者がログインしたときの参加者IDの切り替え、ログインしていない参加者のルームの作成の拒否、CSRF対策、ルームへの参加と状態同期、複数タブ、ホストの退出・切断、WebSocketの認証、対戦開始・再戦・復帰・途中参加・提出期限や提出できる画像がないことによる未提出・勝負不成立の確定と、D1への結果保存に失敗した場合の再試行を含めます。採点ワーカー向けAPIは、ブラウザを使わずPlaywrightの`request`から採点ワーカーとして要求を送り、リンク・heartbeat・採点ジョブの割り当て・完了・差し戻しと、D1に保存される状態を確認します。管理画面は、ログイン前の表示と管理用の操作の拒否、ログイン後のリンクコードの発行から採点ワーカーのリンク・一覧・失効、採点ジョブの一覧、ログアウトまでを確認します。画像生成のモデルは、切り替えた後の表示と開き直したときの表示、対応していないモデルをServer Functionへ直接送ると拒否されることを確認します。お題は、プロンプトを埋め込んだ半透明のPNGを追加して、配信される画像にメタデータと透過が残らないこと、非公開のお題を出題せず公開すると出題すること、削除後も画像の配信を続けることを確かめ、メタデータの残ったWebPをServer Functionへ直接送ると拒否されることも確認します。あわせて、対戦条件の候補の検証とロビーへの反映、よく使う表現の追加・並べ替え・削除、書き出したZIPを読み込むと消したお題と画像・対戦条件・表現が戻ることを確認します。失敗時のtraceは`test-results/`に保存され、CIでは`e2e-failure-traces` artifactから7日間取得できます。展開したtraceは`vp exec playwright show-trace <trace.zipのパス>`で確認します。

Drizzleスキーマを変更したら`vp run db:generate --name <変更名>`でSQLを生成し、`migrations/`のSQLとスナップショットを確認して一緒に管理します。ローカルへの適用には`vp run db:migrate:local`を使います。適用済みのSQLは書き換えず、追加のmigrationで変更します。

`wrangler.jsonc`のD1設定は`DB` bindingを使います。リモート環境を用意する際は対象DBを作成・確認し、その`database_id`を設定してからmigrationを適用します。`BETTER_AUTH_URL`には公開URL、`BETTER_AUTH_SECRET`には環境固有の鍵を設定します。ローカルの鍵を本番へ流用しません。Cloudflare Vite pluginはプレビュー用の値を`dist/server/.dev.vars`へ出力するため、`dist/`全体を共有用artifactにしません。

Workers設定は[wrangler.jsonc](wrangler.jsonc)で管理し、変更後は`vp run typegen`を実行します。生成された`worker-configuration.d.ts`はGitに含めません。`src/routeTree.gen.ts`はTanStack Startが開発・ビルド時に生成するルートと型の定義で、Gitで管理します。手で編集せず、ルートの変更と合わせて更新します。

ローカルではVite+のhooksを使用します。`pre-commit`は`vp staged`で対象ファイルを検査・自動修正し、`commit-msg`はcommitlintでメッセージを検証します。hooksとは別に、PR前に静的検査と変更に関連するテスト・動作確認を行います。

[.gitmessage](.gitmessage)を使う場合は、cloneごとに設定します。

```sh
git config --local commit.template .gitmessage
```

テンプレートは`git commit`でエディターを開くと表示されます。`git commit -m`には適用されません。

## 本番デプロイ

Cloudflare Workers Buildsは次の設定で通常のアプリをビルド・デプロイします。Vite+とWranglerはリポジトリの依存パッケージから実行します。

| 設定               | 値                          |
| ------------------ | --------------------------- |
| Worker名           | `animic`                    |
| 本番ブランチ       | `main`                      |
| ルートディレクトリ | リポジトリルート            |
| ビルドコマンド     | `pnpm run build`            |
| デプロイコマンド   | `pnpm exec wrangler deploy` |

Node.jsは`.node-version`、pnpmは`package.json`の指定に合わせます。初回は本番D1を作成・確認し、`wrangler.jsonc`の`database_id`を設定してから`vp exec wrangler d1 migrations apply DB --remote`でSQLを適用します。お題の画像を保存するR2のバケットは、`vp exec wrangler r2 bucket create animic-topic-images`で作成します。Workerの秘密情報として`BETTER_AUTH_SECRET`に本番専用の鍵、`BETTER_AUTH_URL`に`https://animic.party`、`NOVELAI_API_TOKEN`にNovelAIの永続APIトークン、`NOVELAI_STYLE_PROMPT`に規定の絵柄のタグ、`ADMIN_PASSWORD`に管理画面のパスワード（ローカルとは別の12文字以上の値）、`GOOGLE_CLIENT_ID`・`GOOGLE_CLIENT_SECRET`・`DISCORD_CLIENT_ID`・`DISCORD_CLIENT_SECRET`に本番用のOAuthアプリの値を設定します。これらは`wrangler.jsonc`の`secrets.required`で必須にしているため、設定していないとデプロイが失敗します。DOのクラス登録は`wrangler.jsonc`のmigrationによってデプロイ時に行います。

Custom Domainに`animic.party`を設定します。公開前に変更が`main`へ取り込まれていることと、Cloudflareがビルドするコミットを確認します。公開後はHTTPS、トップページ、アイコン・OGP画像、robots.txt、sitemap.xml、存在しないページの404を確認します。`www`を使う場合は正規ホストへ恒久リダイレクトします。開発環境を公開する場合は、Accessによる閲覧制限と、本番から独立したD1・DO・認証情報を設定します。

Search Consoleは`animic.party`のドメインプロパティを追加し、指定されたDNS TXTレコードで所有権を確認します。コンテンツやサイト公開は所有権確認の前提ではありません。TXTは確認後も維持します。サイトマップの公開を確認したらSearch Consoleに送信し、robots.txtにも`Sitemap:`でそのURLを指定します。公開するページを追加した際は同じURLのサイトマップを更新し、URL検査で取得・登録状況を確認します。所有権確認だけで検索掲載が保証されるわけではありません。

## アイコンの更新

`public/favicon.svg`を原本とし、ブラウザ用のICO、Apple Touch Icon、Manifest用のPNGを生成します。SVGは絵柄を保持し、正方形のviewBoxで外側の余白を詰めています。SVGを更新したら、セットアップ済みのChromiumで次のコマンドを実行し、生成したファイルもコミットします。追加の画像変換パッケージは不要です。

```sh
vp run icons:generate
```

生成処理は`scripts/generate-icons.mjs`にあります。ICOには16・32・48pxの透過画像を格納し、Apple Touch Iconは180px、Manifest用は192・512pxの白背景にします。maskable版は512pxで余白を取り、マークが[安全領域](https://web.dev/articles/maskable-icon)に収まらなければ生成を失敗させます。

同じ生成コマンドで`public/animic-logo.svg`から1200×630pxの白背景の`public/og-image.png`も作ります。ロゴは横幅900pxで縦横比を保ち、中央に配置します。OGPの参照は`src/routes/index.tsx`にあります。

HTMLの参照は`src/routes/__root.tsx`、ホーム画面用アイコンの参照は`public/site.webmanifest`で管理します。タブのアイコン更新時はHTMLのfavicon URLの`v`も増やし、ブラウザに残った旧画像のキャッシュを更新します。Manifestの表示モードは`browser`とし、オフライン動作やService Workerは追加しません。更新時は明暗両方の背景で小さいアイコンの見え方と、各URLの配信を確認してください。

## お題の登録

お題は管理画面（`/admin`）の「お題」で登録します。「お題を追加」で画像（PNG・WebP・JPEG、10MB以下、1回に20件まで）と難易度を選んで追加します。画像はブラウザーでメタデータと透過のないWebPに変換してからR2へ保存するため、WebPを書き出せるブラウザー（Chromeなど）を使います。追加したお題は非公開です。一覧から開いて題名・備考を入力し、「公開する」で出題の対象にします。ロビーで選べる制限時間・画像選択の猶予の候補は「対戦条件」、プロンプト入力の選択肢は「よく使う表現」で登録します。

ローカルのD1とR2は`vp dev`の保存先（`.wrangler/state/`）に入ります。E2Eは専用DBへテスト用のお題を登録するため、開発用データを必要としません。画像の配信先はテスト内で差し替えます。

## 管理画面のバックアップ

管理画面の「バックアップ」で「書き出す」を押すと、お題（画像を含む）・対戦条件の候補・よく使う表現を1つのZIP（`animic-backup-<日時>.zip`）に書き出します。採点ワーカー・採点ジョブ・対戦結果・参加者の情報・生成した画像・画像生成のモデルは含みません。本番の内容を変えたら書き出し、ZIPはリポジトリの外に保管します。

戻すときは、同じ画面でZIPを選び、追加・上書きされる件数を確かめてから「読み込む」を押します。同じIDのものは上書きし、ないものは追加します。ZIPにないものは削除しません。途中で失敗したら、同じZIPをもう一度読み込みます。ローカルと本番の間でデータを移すときも同じ手順を使い、画像は読み込んだ環境のR2に保存されます。

## 画像生成のモデル

NovelAIで生成するモデルは、管理画面（`/admin`）の「画像生成」で選びます。ふだんは既定のV5 Curatedを使い、V5 Curatedの使用料が足りなくなったらV4.5 Curatedに切り替えます。コードの変更やデプロイは要りません。保存した後にNovelAIへ送る生成から、選んだモデルを使います。選んだモデルは環境ごとの生成キューのDOに保存されるため、ローカルと本番では別々に選びます。

## 採点ワーカーの準備

採点は、運営者のPCで動く[desktop-comfyui-server](https://github.com/mintani/desktop-comfyui-server)を採点ワーカーとして登録して実行します。構成は[採点の設計](docs/scoring.md)を参照してください。

1. PCにdesktop-comfyui-serverとComfyUIを用意し、ComfyUIの`custom_nodes`にcomfyui-illust-similarityの0.2.0以降を配置して依存パッケージを入れます。PixAI Taggerは1枚の処理に時間がかかるため、ComfyUIはGPUで動かします。
2. 初回の採点でモデル（約4GB）をダウンロードするため、登録の前に一度評価を実行しておきます。ダウンロード中はAnimicの割り当ての期限（2分）に間に合いません。
3. 管理画面（`/admin`）に`ADMIN_PASSWORD`でログインし、メニューの「採点ワーカー」の「リンクコードの発行」で採点ワーカーの名前を入力して、リンクコードを発行します。コードは10分間有効で、1回だけ使えます。
4. desktop-comfyui-serverのサーバー設定にAnimicのURLを追加し、リンクコードを入力してリンクします。ローカルでは`vp dev`の`http://localhost:3000`を指定できます。

採点ワーカーを止める場合は、管理画面の「採点ワーカー」で「失効させる」を押します。以後その採点ワーカーの要求は拒否されます。採点ジョブの状態は、管理画面の「採点ジョブ」で新しい順に最大100件を確認できます。

## ログインのOAuthアプリ

参加者のログイン（[アーキテクチャ](docs/architecture.md#参加者のログイン)）には、GoogleとDiscordのOAuthアプリを使います。開発用と本番用でアプリを分け、リダイレクトURIには`<BETTER_AUTH_URL>/api/auth/callback/google`と`<BETTER_AUTH_URL>/api/auth/callback/discord`を登録します。ローカルでは`http://localhost:3000/api/auth/callback/google`のようになります。

| サービス | 作成する場所                                                              | 設定                                                                                                                                                            |
| -------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google   | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) | 種類が「ウェブ アプリケーション」のOAuthクライアントを作成し、リダイレクトURIを登録します。IDと秘密情報を`GOOGLE_CLIENT_ID`・`GOOGLE_CLIENT_SECRET`に設定します |
| Discord  | [Discord Developer Portal](https://discord.com/developers/applications)   | アプリケーションを作成し、OAuth2のRedirectsにURIを登録します。Client IDとClient Secretを`DISCORD_CLIENT_ID`・`DISCORD_CLIENT_SECRET`に設定します                |

ローカルでは`.env`、本番ではWorkerの秘密情報に設定します。IDと秘密情報のどちらかが未設定のサービスは無効になり、ログインを始めると`PROVIDER_NOT_FOUND`で失敗します。ほかの機能はそのまま使えます。Googleの同意画面の公開ステータスが「テスト」の間は、登録したテストユーザーだけがログインできます。

## 作業の流れ

1. 対応するIssueとコメントを確認します。新規の機能追加・変更は[仕様テンプレート](.github/ISSUE_TEMPLATE/spec.md)、不具合は[バグテンプレート](.github/ISSUE_TEMPLATE/bug.md)で起票します。不明な要件は推測で埋めず、確認事項として示します。
2. 仕様の承認を得てから実装します。承認はIssueコメントまたは依頼時の合意で確認し、仕様変更があればIssueも更新します。
3. developからトピックブランチを作成します。原則は1 Issue・1トピックブランチ・1 PRとし、大きな作業は分割します。
4. 実装と関連文書の更新を行い、検証します。コミットは論理的な変更単位にまとめます。
5. [PRテンプレート](.github/pull_request_template.md)を使ってdevelop向けのPRを作成し、`Refs #番号`でIssueを関連付けます。
6. developへマージされ、受け入れ条件を満たしていることを確認したら、マージ済みPRへのリンクと完了理由をIssueに残して閉じます。

個別に指定された作業範囲・手順を優先します。AIエージェントの操作権限は[AGENTS.md](AGENTS.md#操作の権限)に従います。

## ブランチ運用

| ブランチ         | 役割               | 分岐元・取り込み先               |
| ---------------- | ------------------ | -------------------------------- |
| main             | リリースする安定版 | developからPRで取り込む          |
| develop          | 開発内容の統合     | トピックブランチからPRで取り込む |
| トピックブランチ | 個別の変更         | developから作成し、developへ戻す |

トピックブランチ名は`type/<Issue番号>-<短い英語の説明>`とし、説明には小文字のkebab-caseを使います。

| プレフィックス | 用途                       | 例                             |
| -------------- | -------------------------- | ------------------------------ |
| `feat/`        | 機能追加                   | `feat/12-invite-link`          |
| `fix/`         | 不具合修正                 | `fix/13-submit-deadline`       |
| `refactor/`    | 振る舞いを変えない構造改善 | `refactor/14-session-check`    |
| `perf/`        | 性能改善                   | `perf/15-image-loading`        |
| `docs/`        | 文書                       | `docs/16-development-guide`    |
| `test/`        | テスト                     | `test/17-submit-validation`    |
| `build/`       | ビルド・依存関係           | `build/18-update-vite-plus`    |
| `ci/`          | CI設定                     | `ci/19-commit-policy`          |
| `style/`       | コードの書式変更           | `style/20-format-config`       |
| `revert/`      | 変更の取り消し             | `revert/21-undo-config-change` |
| `chore/`       | 上記に当てはまらない保守   | `chore/22-ignore-local-cache`  |

Issueなしの作業が明示的に認められた場合だけ、番号を省略した`type/<説明>`を使います。CIは番号の有無を許容するため、この例外の適用はレビューで確認します。

許可するプレフィックスは上表に限定します。`codex/`・`claude/`などのエージェント名や作業者名は禁止します。この分類はConventional Commitsのtypeをブランチ名にも揃えるプロジェクト規約です。

## コミットとPRの書式

Issue・PRのタイトルとコミットの件名は`type(scope): 日本語の説明`とします。typeは上表の分類、scopeは変更対象の機能・領域です。PRタイトルとコミット件名は72文字以内にします。日本語での説明はレビューで確認し、機械的な形式検証は[.commitlintrc.yml](.commitlintrc.yml)に従います。

コミットの本文には、件名だけでは伝わらない変更理由や補足を必要に応じて記載します。詳しい要件・設計・検証結果はIssue・PR・関連文書へ記録します。

## CIとレビュー

- [Checks](.github/workflows/checks.yml)はPRの作成・更新・再オープン時と手動実行時に起動します。pushを起点にした重複実行は行いません。`Quality`でWorkers型生成、単体テスト、E2Eに含まれるビルドとローカルD1・DOでの検証、生成ルートの差分確認、静的検査を実行します。
- `Quality`ではワークフローの変更時にactionlint、依存関係の変更時に`vp pm audit -- --audit-level high`も実行します。手動実行では両方を検査します。脆弱性検査は開発用の依存関係も含め、High・Criticalを失敗条件にします。依存関係を変更しないPRでは実行しないため、新たに公表された脆弱性を継続監視するものではありません。actionlintはバージョンと配布バイナリのSHA-256を固定します。
- [Commit policy](.github/workflows/commit-policy.yml)でPRのブランチ名・取り込み先・タイトル・コミット形式を検証します。
- テスト・ビルド対象を追加する変更では、それに対応する検証もCIに組み込みます。
- PRには実行したコマンド・操作と結果を記録します。未実施・適用外は理由を明記し、ビルドと起動確認を区別します。

main・developの保護要件は、PR経由、1名以上の承認、必須のCIチェックの成功、レビューの未解決スレッドなし、force push・削除禁止です。必須チェックには実際のCIジョブを指定します。ローカルhooksの通過だけを取り込み条件にはしません。

## マージとリリース

| 経路             | 方式         | 理由                            |
| ---------------- | ------------ | ------------------------------- |
| トピック→develop | Squash merge | PR単位で変更をまとめる          |
| develop→main     | Merge commit | mainとdevelopの共通の履歴を保つ |

リポジトリのマージ設定では両方式を許可し、PRの取り込み先に応じて使い分けます。Squash後の件名はPRタイトルを使います。

開発Issueの完了とリリースは分けて管理します。develop→mainのリリースPRには対象の変更と検証結果をまとめ、リリースノートには変更内容と利用上の注意を記載します。リリースPRは複数の開発Issue・PRを含められます。

## 文書の管理

| 文書                 | 記載する内容                             |
| -------------------- | ---------------------------------------- |
| README.md            | 概要と開発・設計文書へのリンク           |
| docs/product.md      | プロダクトの要件                         |
| docs/architecture.md | 構成・各機能の役割・依存関係             |
| docs/conventions.md  | 配置・命名・コード分割・共通化の判断基準 |
| CONTRIBUTING.md      | 開発・検証・Git運用の手順                |
| AGENTS.md            | 参照先とAIエージェントへの指示           |
| ADR                  | 重要な設計判断の背景・決定・理由・影響   |

規則の本文を置く場所を一つに決め、他の文書からは参照します。仕様・設計・手順の変更時は、対応する文書も同じ変更で更新します。会話ログ、進捗メモ、検討中の案はリポジトリ外の一時ファイルに置きます。

- 機能やサブシステムの設計には[設計テンプレート](docs/templates/design.md)を使い、必要な節を選びます。
- 後から選定理由を確認する必要がある判断には[ADRテンプレート](docs/decisions/template.md)を使います。日常的な実装判断すべてにADRを要求しません。
- ADRは`docs/decisions/NNNN-短い英語名.md`として保存します。草案はリポジトリ外の一時ファイルで作成し、承認された決定を記録します。
- 記録済みの決定を変更する場合は変更の理由を別のADRに記録し、旧ADRの状態とリンクを更新します。現在の設計文書も変更後の内容に合わせます。
- 見出し・説明・記入例は自然な日本語を使い、識別子・技術用語・標準構文は無理に翻訳しません。

## 依存関係とGitで管理するファイル

直接使うパッケージのバージョンはpackage.jsonで完全固定し、間接依存を含むインストール対象はpnpm-lock.yamlに記録します。CIは`--frozen-lockfile`で復元します。更新時は最新の公式情報・変更点・peerDependenciesのバージョン条件を確認し、関連する依存を揃えて検証してからpackage.jsonとpnpm-lock.yamlを一緒に変更します。

`catalog:`は複数パッケージにまたがるバージョン指定の集約に使えます。採用してもpnpm-lock.yamlと更新時の検証は維持します。

秘密情報・キャッシュ・ビルド出力は[.gitignore](.gitignore)で除外します。pnpm-lock.yamlや環境の再現に必要な設定はGitで管理し、改行の扱いは[.gitattributes](.gitattributes)に従います。ツール選定の理由は[ADR 0001](docs/decisions/0001-git-workflow.md)を参照してください。
