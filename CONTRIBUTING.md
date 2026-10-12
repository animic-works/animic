# 開発・運用ガイド

| 目的                                         | 読む章                                  |
| -------------------------------------------- | --------------------------------------- |
| 初めて起動する・ローカル設定を揃える         | [環境を用意する](#環境を用意する)       |
| コード・デザイン・文書を変更する             | [変更を実装する](#変更を実装する)       |
| 変更に合った検査を実行し、結果を確認する     | [変更を検証する](#変更を検証する)       |
| ブランチ・コミット・レビューの規則を確認する | [PRを出す](#prを出す)                   |
| 公開する・外部サービスや管理画面を設定する   | [リリース・運用する](#リリース運用する) |

文書全体の入口は[文書案内](docs/README.md)です。プロダクトの要件は[ゲーム仕様](docs/product.md)、構成と責務は[アーキテクチャ](docs/architecture.md)、コードの判断基準は[実装規約](docs/conventions.md)を参照してください。UIの変更では[デザイン原則](docs/design.md)、設計判断の事例・根拠を調べる場合は[デザインシステムの設計資料](docs/design-system/README.md)も確認します。

## 環境を用意する

### 前提と初回セットアップ

コマンドはリポジトリルートで実行します。Vite+ CLIを用意し、Nodeは[.node-version](.node-version)、pnpmは[package.json](package.json)の指定に合わせます。ローカル起動・検証にCloudflareへのログインは不要です。

1. 依存パッケージをインストールし、Git hooksを有効にします。

   ```sh
   vp install --frozen-lockfile
   vp hooks enable
   ```

2. [.env.example](.env.example)を`.env`へコピーし、[ローカルの環境変数](#ローカルの環境変数)を設定します。`BETTER_AUTH_SECRET`は次のコマンドで生成できます。

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

3. Workersの型を生成し、ローカルD1へmigrationを適用します。

   ```sh
   vp run typegen
   vp run db:migrate:local
   ```

4. 初回の検証を行います。Linuxでブラウザのシステムライブラリが不足する場合は、Playwrightの[環境構築手順](https://playwright.dev/docs/browsers#install-system-dependencies)に従います。

   ```sh
   vp run test
   vp run test:design-system
   vp exec playwright install --no-shell chromium
   vp run test:e2e
   vp run check
   ```

5. `vp run dev`で開発サーバーを起動し、`http://localhost:3000`を開きます。サーバー処理はCloudflare Vite pluginを通じ、ローカルのWorkersランタイムで実行します。

### ローカルの環境変数

ローカル設定は`.env`に統一し、優先して読み込まれる`.dev.vars`とは併用しません。`.env`と秘密情報の値はGitに含めません。

| 変数                                         | 設定する値・用途                                                                                             |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `BETTER_AUTH_URL`                            | 利用するアプリのURL。通常は`http://localhost:3000`                                                           |
| `BETTER_AUTH_SECRET`                         | この環境専用に生成した鍵                                                                                     |
| `NOVELAI_API_TOKEN`                          | 画像生成に使う永続APIトークン（`pst-`で始まる値）。未設定でも起動できるが、生成は失敗する                    |
| `NOVELAI_STYLE_PROMPT`                       | 運営が決めた規定の絵柄のタグ。未設定の場合はWranglerが警告し、絵柄を付けずに生成する                         |
| `ADMIN_PASSWORD`                             | `/admin`に入るための12文字以上のパスワード。`#`や`$`を含む値は`ADMIN_PASSWORD='...'`のように単一引用符で囲む |
| `GOOGLE_CLIENT_ID`・`GOOGLE_CLIENT_SECRET`   | Googleログイン用の開発用OAuthアプリの値                                                                      |
| `DISCORD_CLIENT_ID`・`DISCORD_CLIENT_SECRET` | Discordログイン用の開発用OAuthアプリの値                                                                     |
| `DISCORD_BOT_TOKEN`                          | [Discord Activities](#discord-activitiesの設定)を使うときだけ設定するBot token                               |

画面でルームを作るにはログインが必要です。[ログインのOAuthアプリ](#ログインのoauthアプリ)に従って設定してください。E2Eだけを実行する場合はテスト用の値が設定されるため、`.env`は不要です。

NovelAIのトークンはアカウント設定から発行します。複数アカウントの値を`NOVELAI_API_TOKEN=pst-…,pst-…`のようにカンマで区切ると、トークンの数だけ並列に生成できます。プランによってAnlasを消費するため、各アカウントのプランを確認します。値はサーバー側の生成キューのDOだけで読み、ブラウザへのレスポンスやログには含めません。

### Git hooksとコミット用テンプレート

| 操作                                            | コマンド                                         |
| ----------------------------------------------- | ------------------------------------------------ |
| hooksの有効化                                   | `vp hooks enable`                                |
| hooksの確認                                     | `vp hooks status`                                |
| コミット用テンプレートの設定（任意・cloneごと） | `git config --local commit.template .gitmessage` |

`pre-commit`は`vp staged`で対象ファイルを検査・自動修正し、`commit-msg`はcommitlintでメッセージを検証します。hooksとは別に、PR前に[静的検査と変更に関連する検証](#変更を検証する)を行います。

[.gitmessage](.gitmessage)は`git commit`でエディターを開くと表示されます。`git commit -m`には適用されません。

## 変更を実装する

### 作業の流れ

1. 対応するIssueとコメントを確認します。新規の機能追加・変更は[仕様テンプレート](.github/ISSUE_TEMPLATE/spec.md)、不具合は[バグテンプレート](.github/ISSUE_TEMPLATE/bug.md)で起票します。不明な要件は推測で埋めず、確認事項として示します。
2. 仕様の承認を得てから実装します。承認はIssueコメントまたは依頼時の合意で確認し、仕様変更があればIssueも更新します。
3. developからトピックブランチを作成します。原則は1 Issue・1トピックブランチ・1 PRとし、大きな作業は分割します。
4. 実装と関連文書の更新を行い、検証します。コミットは論理的な変更単位にまとめます。
5. [PRテンプレート](.github/pull_request_template.md)を使ってdevelop向けのPRを作成し、`Refs #番号`でIssueを関連付けます。
6. developへマージされ、受け入れ条件を満たしていることを確認したら、マージ済みPRへのリンクと完了理由をIssueに残して閉じます。

個別に指定された作業範囲・手順を優先します。AIエージェントの操作権限は[AGENTS.md](AGENTS.md#操作の権限)に従います。

### DB・Workers設定・生成ファイルの更新

| 変更対象                         | 実施すること                                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Drizzleスキーマ                  | `vp run db:generate --name <変更名>`で生成し、`migrations/`のSQLとスナップショットを確認して一緒に管理する |
| ローカルD1                       | `vp run db:migrate:local`でSQLを適用する。適用済みSQLは書き換えず、追加のmigrationで変更する               |
| [wrangler.jsonc](wrangler.jsonc) | 変更後に`vp run typegen`を実行する。`worker-configuration.d.ts`はGitに含めない                             |
| ルート                           | 開発・ビルド時に生成される`src/routeTree.gen.ts`をルートの変更と合わせてGitで管理する。手で編集しない      |

リモートDBの準備は[本番デプロイ](#本番デプロイ)、デザインシステムの生成は[生成と検証](#デザインシステムの生成と検証)を参照してください。

### デザインシステムの変更判断

必要なUIを既存のデザインシステムで表現できない場合も、拡張を前提にせず、次の順で判断します。

1. [デザイン原則](docs/design.md)、[アーキテクチャ](docs/architecture.md#デザインシステム)、既存のデザイン定義を確認し、表現できない内容・状態・操作・利用条件を具体化します。
2. Panda MCPで既存のToken・Style・Recipe・Patternを調べ、詳細は必要に応じて`packages/design-system/src/`を確認します。React Componentの公開APIと、その組み合わせも確認します。
3. 不足しているものを、下表の責務に分けます。既存の公開APIの組み合わせで成立するなら、利用側の構成を変更し、デザインシステムは変更しません。
4. 通常UIの不足を、任意CSS、`style`、自由な`className`、styled-systemの低レベルAPI、Visual領域による迂回で解決しません。
5. 新しいToken・Style・Recipe・Pattern・Component・variant・Responsive条件・公開API等が必要なら、既存定義で不足する理由、変更先、選択肢と影響を示し、新しいDesign判断として実装前に承認を得ます。
6. 承認後、[各層の責務](docs/architecture.md#デザインシステム)に従って変更します。デザイン定義、DOM・操作、利用側の構成を混同しません。
7. [生成と検証](#デザインシステムの生成と検証)から、変更に必要な生成結果・型・Guardrail・Storybook・ブラウザ操作・アクセシビリティ・画像比較等を選び、目的が成立したか確認します。
8. 現在の仕様・構成・手順が変わった場合は、対応する現行文書も同じ変更で更新します。

| 不足の種類                                                           | 判断すること                                                                                        |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 既存APIの組み合わせで表現できる                                      | 利用側の構成を変更し、デザインシステムは維持する                                                    |
| 通常UIに共通する意味・状態・操作・アクセシビリティ上の表現が足りない | デザインシステムの変更候補として、共通の責務と影響範囲を確認する                                    |
| 画面・機能固有の業務上の構成が必要                                   | アプリケーション側で既存のComponent・Patternを組み立てる                                            |
| 固有のアートワーク・特殊な配置・演出・Motionが必要                   | [Visualの責務](docs/architecture.md#機能固有のvisual)に該当するか確認し、許可された範囲・形式で扱う |

デザインシステムを変更しないことも正式な選択肢です。責務の切り分けに迷う場合は、[設計ガイド](docs/design-system/design-guide.md#既存定義で表現できない場合の判断)を判断材料にします。

### アイコンの更新

1. 原本を更新します。faviconは`public/favicon.svg`、既定のOGP画像用ロゴは`public/animic-logo.svg`です。faviconは絵柄を保持し、正方形のviewBoxで外側の余白を詰めます。
2. セットアップ済みのChromiumで`vp run icons:generate`を実行します。生成処理は[scripts/generate-icons.mjs](scripts/generate-icons.mjs)にあり、追加の画像変換パッケージは不要です。
3. タブのアイコンを更新した場合は、`src/routes/__root.tsx`のfavicon URLの`v`も増やし、旧画像のキャッシュを更新します。ホーム画面用アイコンの参照は`public/site.webmanifest`で管理します。
4. 明暗両方の背景で小さいアイコンの見え方と各URLの配信を確認し、生成したファイルもコミットします。

| 生成物                | 寸法・背景                                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| ブラウザ用ICO         | 16・32・48pxの透過画像を格納                                                                        |
| Apple Touch Icon      | 180px・白背景                                                                                       |
| Manifest用PNG         | 192・512px・白背景                                                                                  |
| maskable版            | 512px・余白付き。マークが[安全領域](https://web.dev/articles/maskable-icon)に収まらなければ生成失敗 |
| `public/og-image.png` | 1200×630px・白背景。幅900pxのロゴを縦横比を保って中央に配置                                         |

OGP画像の参照は`src/features/home/share-meta.ts`で生成します。管理画面でOGP画像を登録していない場合に、上記の既定画像を使います。Manifestの表示モードは`browser`とし、オフライン動作やService Workerは追加しません。

### 文書の管理

#### 文書ごとの責務

| 文書                                                                       | 所有するもの                                                             |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| README.md                                                                  | 概要と開発・設計文書への入口                                             |
| docs/README.md                                                             | 目的別の文書案内と設計判断の記録への入口                                 |
| docs/product.md                                                            | 現在のプロダクト要件                                                     |
| docs/design.md                                                             | 現在承認されているデザイン原則                                           |
| docs/architecture.md                                                       | 現在の構成・責務・依存関係・公開境界・利用形式                           |
| docs/conventions.md                                                        | 現在コードを書く際の配置・命名・分割・共通化の規則                       |
| CONTRIBUTING.md                                                            | 現在の開発・生成・検証・Git運用と文書管理の手順                          |
| AGENTS.md                                                                  | 参照先とAIエージェントへの指示                                           |
| ADR                                                                        | 重要な設計判断の背景・判断基準・決定・理由・影響・見直す条件             |
| ソースコード / テスト                                                      | 現在の具体的なAPI・値・実装・自動検証                                    |
| docs/design-system/README.md                                               | 設計資料の目的・読み方と、作成済みの文書への入口                         |
| [デザインシステムの設計ガイド](docs/design-system/design-guide.md)         | 再利用可能な問い・前提・選択肢・判断基準・トレードオフ・適用条件         |
| デザインシステムの設計事例                                                 | 実際の前提・比較・失敗・検証・判断変更・適用範囲                         |
| デザインシステムの検証記録                                                 | 設計事例を裏付ける入力・環境・観測結果と、証明できること・できないこと   |
| [デザインシステムの設計レビューガイド](docs/design-system/review-guide.md) | レビュー方法・証拠の扱い・判断と実装の区別・AI利用時の判断の偏りへの対処 |

#### 現行資料と設計資料の更新

規則の本文を置く場所を一つに決め、他の文書からは参照します。現行資料にあたる要件・原則・構成・実装規則・手順とソースコード・テストは、現在の仕様・実装へ追従させます。仕様・設計・手順の変更時は、対応する現行資料も同じ変更で更新します。実装方法を知るために過去の設計事例を読むことは要求しません。

[デザインシステムの設計資料](docs/design-system/README.md)は、現在の仕様を複製せず、別のデザインシステムでも使える判断材料を残します。設計ガイドと設計レビューガイドは新しい知見に応じて更新できます。設計事例は当時の前提・比較・判断変更を、検証記録は当時の観測事実を保持します。現在の設計や推奨が変わっても過去を現行仕様へ書き換えず、事実誤認があれば訂正します。現在のAPI・Token値・利用規則は現行資料へリンクし、重要な決定と見直す条件はADRが所有します。

#### 記録する内容と検証の限界

会話ログ、進捗メモ、検討中の案はリポジトリ外の一時ファイルに置きます。これらをそのまま保存することと、検証済みの事実・実際に比較した選択肢・承認された判断変更を検証記録や設計事例へ編集して残すことは区別します。不採用案は当時比較された案として扱い、決定と混同しません。観測事実・当時の提案・決定・後からの解釈を分け、何を入力し、どの環境で何を観測したかを記載します。

限界は、それを書かなければ読者が結論の強さ・適用範囲・検証範囲を誤解する場合にだけ残します。例えば、別々の入力による検査を一貫したE2Eと扱わないこと、8文字コードの成功をnumeric全般へ広げないこと、forced-colorsの模擬環境を全OS・支援技術の保証にしないことは明記します。結論の解釈に影響しない調査上の不足や、作業者が確認できなかった事項の一覧は残しません。

独立した検証記録は、設計事例の重要な観測事実を本文と分けて保存する必要がある場合に作ります。すべての事例に要求せず、作成自体を品質条件にしません。作る場合は、事例から安定して参照できる識別子を使います。生ログやリポジトリ外の一時ファイル名に依存せず、必要な入力・観測結果を文書内に残し、現在参照できる実装・テスト等へ接続します。リポジトリ内へのリンクには相対パスを使います。

#### テンプレートとADR

- 機能やサブシステムの設計には[設計テンプレート](docs/templates/design.md)を使い、必要な節を選びます。
- 後から選定理由を確認する必要がある判断には[ADRテンプレート](docs/decisions/template.md)を使います。日常的な実装判断すべてにADRを要求しません。
- ADRは`docs/decisions/NNNN-短い英語名.md`として保存します。草案はリポジトリ外の一時ファイルで作成し、承認された決定を記録します。
- 記録済みの決定を変更する場合は変更の理由を別のADRに記録し、旧ADRの状態とリンクを更新します。現在の設計文書も変更後の内容に合わせます。
- 見出し・説明・記入例は自然な日本語を使い、識別子・技術用語・標準構文は無理に翻訳しません。

### 依存関係とGitで管理するファイル

直接使うパッケージのバージョンはpackage.jsonで完全固定し、間接依存を含むインストール対象はpnpm-lock.yamlに記録します。CIは`--frozen-lockfile`で復元します。更新時は最新の公式情報・変更点・peerDependenciesのバージョン条件を確認し、関連する依存を揃えて検証してからpackage.jsonとpnpm-lock.yamlを一緒に変更します。

`catalog:`は複数パッケージにまたがるバージョン指定の集約に使えます。採用してもpnpm-lock.yamlと更新時の検証は維持します。

秘密情報・キャッシュ・ビルド出力は[.gitignore](.gitignore)で除外します。pnpm-lock.yamlや環境の再現に必要な設定はGitで管理し、改行の扱いは[.gitattributes](.gitattributes)に従います。ツール選定の理由は[ADR 0001](docs/decisions/0001-git-workflow.md)を参照してください。

## 変更を検証する

### 検証コマンドの選び方

| 確認したいこと                                   | コマンド・参照先                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| 静的検査                                         | `vp run check`                                                                    |
| 時刻・入力・状態遷移などの業務ルール             | `vp run test`                                                                     |
| デザインシステムの生成・契約                     | `vp run test:design-system`                                                       |
| 共通UIのブラウザ操作・アクセシビリティ・画像比較 | `vp run test:design-system:browser`（[詳細](#storybookアクセシビリティ画像比較)） |
| Workers上のD1・DO・R2との結合、アプリ画面の操作  | `vp run test:e2e`（[詳細](#e2eの実行環境と結果の確認)）                           |
| クライアント・Workerのビルド                     | `vp run build`                                                                    |
| ビルドしたアプリのローカル起動                   | `vp run preview`                                                                  |
| フォーマット修正                                 | `vp fmt`                                                                          |
| 未使用コードだけの調査                           | `vp run knip`                                                                     |
| コミットメッセージ                               | `vp exec commitlint --edit <ファイル>`                                            |

`vp run check`はデザインシステムの生成、import境界・styling propsの検査、フォーマット・lint、`tsc --noEmit`、Knipを実行します。`vp check`だけではプロジェクト全体の型チェックとKnipを含みません。

`vp run test`はVite+内蔵のVitestで`src/**/*.test.ts`を実行します。Workersランタイムを必要とする処理はE2Eで確認します。PRには実行したコマンド・操作と結果を記録し、未実施・適用外の理由、ビルドと起動確認を区別します。

### E2Eの実行環境と結果の確認

[playwright.config.ts](playwright.config.ts)がテスト用のビルド・DB初期化・プレビュー起動を行います。

| 対象           | 実行時の扱い                                                                                                         |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| データ         | 実行ごとに`.wrangler/e2e/`を初期化する。開発用の`.wrangler/state/`とは分離する                                       |
| 並列実行       | SQLite更新の競合を避けるため1 workerで順に実行する。複数人の同時操作は各テスト内の複数ブラウザコンテキストで確認する |
| 認証・秘密情報 | テスト用の値を使う。実際のNovelAIトークンやOAuthクライアントは使用しない                                             |
| NovelAI        | [偽のAPI](tests/e2e/fake-novelai.ts)を`http://127.0.0.1:4174`で起動する                                              |
| Discord        | [偽のAPI](tests/e2e/fake-discord.ts)を4175番で起動する                                                               |
| ログイン       | E2E専用のBetter Authプラグインでログイン状態を作る。実際のOAuthは通さず、ローカル以外の`BETTER_AUTH_URL`は拒否する   |

偽のAPIは[global-setup.ts](tests/e2e/global-setup.ts)が起動します。外部APIの接続先はビルド後に上書きできないため、`ANIMIC_E2E=true`のビルドでだけ[vite.config.ts](vite.config.ts)がテスト用の接続先を反映します。同じビルドにだけE2E専用クライアントと認証プラグインを含めます。**E2Eのビルド成果物はデプロイせず、公開用には`ANIMIC_E2E`を指定せずにビルドし直します。**

検証範囲と個別のケースは[tests/e2e/](tests/e2e/)を参照してください。

| 検証範囲                                   | 確認方法                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| 公開ページ・対戦画面・マイページ・管理画面 | ブラウザ操作、SSR・画像・レスポンス・アクセシビリティの確認                                                        |
| 認証・ルーム・対戦の状態と永続化           | [APIクライアント](tests/fixtures/api-client.ts)からServer FunctionsとWebSocketを呼び、ローカルD1・DOと組み合わせる |
| 画像生成・保存・配信                       | 偽のNovelAIから生成し、R2への保存と配信、失敗・再送・公開範囲を確認する                                            |
| 採点と結果                                 | Playwrightの`request`から採点ワーカー向けAPIを呼び、ジョブ・結果保存・画面への反映を確認する                       |
| 秘密情報の非公開                           | 配信するファイルとトップのHTMLにテスト用トークンやOAuthの秘密情報が含まれないことを確認する                        |

IMEは変換イベントの模擬検証であり、実際のIMEとの接続確認ではありません。外部APIの模擬検証も本番サービスとの接続確認とは区別し、Discordクライアントでの確認は[公開前の確認](#discordクライアントでの公開前の確認)に従います。

失敗時は次の順で確認します。

1. ローカルの`test-results/e2e/`、またはCIの`e2e-failure-traces-<分割番号>` artifact（保存期間7日）からtraceを取得します。
2. `vp exec playwright show-trace <trace.zipのパス>`で操作・通信・画面を確認します。
3. CIの特定の分割を再現する場合は、`vp run test:e2e --shard=1/4 --reporter=list`の分割番号を指定します。同じ作業ディレクトリで複数の分割を同時に起動しません。

Cloudflare Vite pluginはプレビュー用の値を`dist/server/.dev.vars`へ出力します。秘密情報を含むため、`dist/`全体を共有用artifactにしません。

### 静的検査の設定

コマンドとKnipの設定は[package.json](package.json)、lint・format・staged設定は[vite.config.ts](vite.config.ts)で管理します。検出結果への対応と例外の判断は[実装規約](docs/conventions.md#react-compilerと未使用コード)に従います。

Knipでは、デザインシステム用に次の例外とentryを設定しています。

- 生成CSSの`@import`からフォント依存を追跡しないため、`packages/styled-system`のFontsource依存だけを明示的に除外します。対応するCSSの解決は[フォント生成とStorybookのビルド](#デザインシステムの生成と検証)で検証します。
- 検査・生成スクリプトのJSに対応する型宣言は、TypeScriptでの利用を解析するentryとして指定します。

参考: [KnipのVite+対応](https://knip.dev/reference/plugins/vite-plus)。

### デザインシステムの生成と検証

依存パッケージはワークスペース全体でインストールします。[panda.config.ts](panda.config.ts)が`@animic/design-system/preset`を読み、`packages/styled-system/generated/`へ生成します。

| 目的                                     | コマンド・結果                                                  |
| ---------------------------------------- | --------------------------------------------------------------- |
| SDK・Native Spec・CSS・フォントCSSの生成 | `vp run design-system:generate`                                 |
| 生成結果と公開契約の検証                 | `vp run test:design-system`                                     |
| 使用状況の解析                           | `vp run design-system:analyze`。`generated/analysis.json`へ出力 |
| 操作・アクセシビリティ・画像比較         | `vp run test:design-system:browser`（次項）                     |
| 型・利用境界を含む静的検査               | `vp run check`                                                  |

生成は`panda codegen --spec`、`panda cssgen`、`scripts/generate-fonts.mjs`の順に実行します。

| 生成物                               | 内容・確認時の注意                                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| 型付きSDK                            | 定義から生成するスタイリングAPI                                                                                |
| `generated/specs/design-system.json` | Native Spec。直接値を持つSemantic Tokenは`semantic`フラグが省略されるため、分類はMCPとソースコードでも確認する |
| `generated/styles.css`               | Panda CSS                                                                                                      |
| `generated/fonts.css`                | Text Styleからフォント・太さ・正体と斜体を求め、styled-systemの依存から解決したFontsource CSSへの参照          |

定義やReact内のスタイル指定を変えたら、表示確認の前に生成し直します。生成物を削除しても同じコマンドで復元できます。`dev`・`build`・`typecheck`・`check`・`test:design-system`も先に生成します。アプリの`dev`・`build`・`preview`は`-C .`でルートパッケージを明示し、ワークスペース全体の選択と区別します。

`test:design-system`はToken参照・CSS変数・非公開サブパス・コントラスト・フォント・JSX spreadの契約を検証します。禁止する値の型検証は[strict-types.ts](tests/design-system/strict-types.ts)と[public-types.tsx](tests/design-system/public-types.tsx)にあり、`check`の型チェックで確認します。analyzeで未使用になったことだけを理由に、承認済みの定義を削除しません。

生成物はGit管理せず、手で編集したり整形・lintの修正対象に含めたりしません。各パッケージの`package.json`、CSSエントリーポイント、生成設定・生成スクリプト・検証コードをGit管理します。

別のReactアプリケーションには`node scripts/design-guardrails.mjs --root /path/to/application`を使います。指定先の`src/`と`tsconfig.json`を使い、JSX spreadの型もそのアプリケーションの依存関係から解決します。Animicの共通CSSは`src/routes/__root.tsx`で読み込み、通常UIにCSSの例外は設けません。

#### Storybook・アクセシビリティ・画像比較

`vp run storybook`は`http://localhost:6006`でComponentと状態を確認するStorybookを起動します。`vp run storybook:build`で静的出力を作り、`vp run storybook:preview`で確認できます。アプリ用のCloudflare・ルーティング設定は読み込まず、React Compilerと同じワークスペース内のパッケージを使用します。フォントはローカルの依存パッケージから配信し、外部フォントサーバーへ依存しません。

`vp run test:design-system:browser`はStorybookのビルド・起動とPlaywrightを実行します。既存のローカルサーバーは開発時だけ再利用し、CIでは必ずビルドから実行します。ARIAの関連付け、キーボード操作、Dialogのフォーカストラップ・フォーカスの復帰、Toastの配置・置き換え・時間による消去、reduced motion設定、文字拡大を検証します。axeによるWCAG A・AAの自動検査を含みますが、スクリーンリーダーによる確認や人間の使いやすさの評価を置き換えません。承認済みの配色は[コントラストの扱い](docs/design.md#コントラストの扱い)に従い、`expectAccessible`で判定します。許容した検出結果は`accepted-text-contrast`添付に残るため、テストの成功をWCAG適合と読み替えません。Storybookのアクセシビリティパネルには元の検出結果を表示します。

画像比較テストのベースライン画像は`tests/design-system/browser/snapshots/linux/`で管理します。Playwrightが指定するChrome for Testingを`channel: "chromium"`で起動し、ビューポート・ロケールを固定してフォントの読み込みを待ちます。Headless Shellとは文字描画が異なるため混用しません。画像比較はLinux上で実行・更新し、CIでも必ず実行します。Linux以外では画像比較だけをスキップし、操作・アクセシビリティ等のテストは実行します。更新時は意図した表示変更であることを画像で確認します。差分を消すためだけにベースライン画像を更新しません。

画像比較の環境は[CIのUbuntu環境](.github/workflows/checks.yml)に合わせ、次のコマンドでブラウザとシステム依存をインストールします。JetBrains Monoに含まれない日本語はシステムフォントへフォールバックするため、IPA Gothicを含むPlaywrightのフォント依存も必要です。個人のフォントやfontconfig設定が優先される環境では、CIと同じフォールバックになることを確認してから比較・更新します。

```sh
vp exec playwright install --with-deps --no-shell chromium
vp run test:design-system:browser --update-snapshots
```

失敗時のトレース・実画像・画像差分は`test-results/design-system/`に保存し、CIの`design-system-failures`という名前のartifactから取得できます。アプリのE2Eとは設定と出力先を分けます。`Layout boundaries`のストーリーでは、同じ内容の列数・縦並びを比較し、利用可能な幅と文字サイズによる成立条件を確認できます。

#### AIからの問い合わせ

Panda MCPは既存のデザイン定義、Ark UI MCPは内部利用するUIのAPIを調べる開発支援です。固定した開発依存から起動するプロジェクト設定をリポジトリで管理しています。エージェントの接続方法は[AGENTS.md](AGENTS.md#mcpへの接続)を参照してください。

MCPはデザインシステムの定義元ではありません。実際の定義は`packages/design-system/src/`、責務と利用境界は[アーキテクチャ](docs/architecture.md#デザインシステム)で確認します。MCPへの接続はUIの実行・ビルドの要件ではありません。

## PRを出す

### ブランチ運用

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

### コミットとPRの書式

Issue・PRのタイトルとコミットの件名は`type(scope): 日本語の説明`とします。typeは上表の分類、scopeは変更対象の機能・領域です。PRタイトルとコミット件名は72文字以内にします。日本語での説明はレビューで確認し、機械的な形式検証は[.commitlintrc.yml](.commitlintrc.yml)に従います。

コミットの本文には、件名だけでは伝わらない変更理由や補足を必要に応じて記載します。詳しい要件・設計・検証結果はIssue・PR・関連文書へ記録します。

### CIとレビュー

[Checks](.github/workflows/checks.yml)はPRの作成・更新・再オープン時と手動実行時に起動します。pushを起点にした重複実行は行いません。

| ジョブ                                               | 検証内容                                                                                                   |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `Static checks and unit tests`                       | Workers型生成、静的検査、業務ルール・デザインシステムの契約検証                                            |
| `Design system browser`                              | Storybookのブラウザ・画像比較検証                                                                          |
| `E2E`（4分割）                                       | テスト用ビルド、ローカルD1・DOでの検証、生成ルートの差分確認                                               |
| `Quality`                                            | 上記の結果を集約する必須チェック。全ジョブ・全分割が成功した場合だけ成功し、失敗やスキップを成功扱いしない |
| [Commit policy](.github/workflows/commit-policy.yml) | PRのブランチ名・取り込み先・タイトル・コミット形式                                                         |

静的検査・デザインシステムのブラウザ検証・E2Eは並列に実行します。E2EはPlaywrightの`--shard=<分割番号>/4`でファイル単位に分割し、各ジョブがビルド・DB初期化・偽のAPI起動を行います。ランナー間でDBやポートは共有せず、各ジョブ内は1 workerでファイル内の実行順を維持します。1分割が失敗しても残りを打ち切りません。traceの取得と分割の再現は[E2Eの結果確認](#e2eの実行環境と結果の確認)を参照してください。

静的検査のジョブは、変更に応じて次も実行します。手動実行では両方を検査します。

| 変更対象     | 追加の検査                                                                |
| ------------ | ------------------------------------------------------------------------- |
| ワークフロー | バージョンと配布バイナリのSHA-256を固定したactionlint                     |
| 依存関係     | `vp pm audit -- --audit-level high`。開発用も含めHigh・Criticalで失敗する |

依存関係を変更しないPRではauditを実行しないため、新たに公表された脆弱性を継続監視するものではありません。テスト・ビルド対象を増やす場合は、対応する検証もCIへ組み込みます。

main・developへの取り込みには、PR経由、1名以上の承認、必須のCIチェックの成功、レビューの未解決スレッドなしが必要です。force push・削除は禁止します。必須チェックには実際のCIジョブを指定し、ローカルhooksの通過だけを取り込み条件にはしません。

## リリース・運用する

### マージとリリース

| 経路             | 方式         | 理由                            |
| ---------------- | ------------ | ------------------------------- |
| トピック→develop | Squash merge | PR単位で変更をまとめる          |
| develop→main     | Merge commit | mainとdevelopの共通の履歴を保つ |

リポジトリのマージ設定では両方式を許可し、PRの取り込み先に応じて使い分けます。Squash後の件名はPRタイトルを使います。

開発Issueの完了とリリースは分けて管理します。develop→mainのリリースPRには対象の変更と検証結果をまとめ、リリースノートには変更内容と利用上の注意を記載します。リリースPRは複数の開発Issue・PRを含められます。

### 本番デプロイ

Cloudflare Workers Buildsの設定は次のとおりです。Nodeは[.node-version](.node-version)、pnpmは[package.json](package.json)の指定に合わせ、Vite+とWranglerはリポジトリの依存パッケージから実行します。

| 設定               | 値                          |
| ------------------ | --------------------------- |
| Worker名           | `animic`                    |
| 本番ブランチ       | `main`                      |
| ルートディレクトリ | リポジトリルート            |
| ビルドコマンド     | `pnpm run build`            |
| デプロイコマンド   | `pnpm exec wrangler deploy` |

#### 初回の環境準備

1. 本番D1を作成・確認し、[wrangler.jsonc](wrangler.jsonc)の`DB` bindingに対象の`database_id`を設定します。SQLの適用は`vp exec wrangler d1 migrations apply DB --remote`で行います。Discordアカウントの一意制約を追加する場合は、[migration前の確認](#discordのmigration前の確認)も行います。
2. R2バケットを作成します。

   ```sh
   vp exec wrangler r2 bucket create animic-topic-images
   vp exec wrangler r2 bucket create animic-generated-images
   vp exec wrangler r2 bucket create animic-phrase-images
   vp exec wrangler r2 bucket create animic-site-images
   ```

3. Workerの秘密情報に、次の本番用の値を設定します。`wrangler.jsonc`の`secrets.required`で必須のため、未設定ではデプロイが失敗します。

   | 変数                                         | 本番の値                               |
   | -------------------------------------------- | -------------------------------------- |
   | `BETTER_AUTH_SECRET`                         | 本番専用の鍵。ローカルの鍵を流用しない |
   | `BETTER_AUTH_URL`                            | `https://animic.party`                 |
   | `NOVELAI_API_TOKEN`                          | 永続APIトークン。複数ならカンマ区切り  |
   | `NOVELAI_STYLE_PROMPT`                       | 規定の絵柄のタグ                       |
   | `ADMIN_PASSWORD`                             | ローカルとは別の12文字以上のパスワード |
   | `GOOGLE_CLIENT_ID`・`GOOGLE_CLIENT_SECRET`   | 本番用Google OAuthアプリの値           |
   | `DISCORD_CLIENT_ID`・`DISCORD_CLIENT_SECRET` | 本番用Discord Applicationの値          |

   Activitiesを使う場合は、これらに加えて[Discord Activitiesの設定](#discord-activitiesの設定)を行います。DOのクラス登録は`wrangler.jsonc`のmigrationによってデプロイ時に行われます。

4. Custom Domainに`animic.party`を設定します。`www`を使う場合は正規ホストへ恒久リダイレクトします。

開発環境を公開する場合は、Accessによる閲覧制限と、本番から独立したD1・DO・認証情報を設定します。

#### 公開時の確認

1. [リリースPR](#マージとリリース)の変更が`main`へ取り込まれていることと、Cloudflareがビルドするコミットを確認します。
2. 公開後にHTTPS、トップページ、アイコン・OGP画像、robots.txt、sitemap.xml、存在しないページの404を確認します。

#### Search Consoleとサイトマップ

1. `animic.party`のドメインプロパティを追加し、指定されたDNS TXTレコードで所有権を確認します。コンテンツやサイト公開は前提ではなく、TXTは確認後も維持します。
2. サイトマップの公開を確認してSearch Consoleへ送信し、robots.txtの`Sitemap:`にも同じURLを指定します。
3. 公開ページを追加したら同じURLのサイトマップを更新し、URL検査で取得・登録状況を確認します。所有権確認だけで検索掲載が保証されるわけではありません。

### ログインのOAuthアプリ

参加者のログイン（[アーキテクチャ](docs/architecture.md#参加者のログイン)）には、GoogleとDiscordのOAuthアプリを使います。開発用と本番用でアプリを分け、リダイレクトURIには`<BETTER_AUTH_URL>/api/auth/callback/google`と`<BETTER_AUTH_URL>/api/auth/callback/discord`を登録します。ローカルでは`http://localhost:3000/api/auth/callback/google`のようになります。

| サービス | 作成する場所                                                              | 設定                                                                                                                                                            |
| -------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google   | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) | 種類が「ウェブ アプリケーション」のOAuthクライアントを作成し、リダイレクトURIを登録します。IDと秘密情報を`GOOGLE_CLIENT_ID`・`GOOGLE_CLIENT_SECRET`に設定します |
| Discord  | [Discord Developer Portal](https://discord.com/developers/applications)   | アプリケーションを作成し、OAuth2のRedirectsにURIを登録します。Client IDとClient Secretを`DISCORD_CLIENT_ID`・`DISCORD_CLIENT_SECRET`に設定します                |

ローカルでは`.env`、本番ではWorkerの秘密情報に設定します。IDと秘密情報のどちらかが未設定のサービスは無効になり、ログインを始めると`PROVIDER_NOT_FOUND`で失敗します。ほかの機能はそのまま使えます。Googleの同意画面の公開ステータスが「テスト」の間は、登録したテストユーザーだけがログインできます。

### Discord Activitiesの設定

WebのDiscordログインと同じDiscord Applicationを使います。実装の接続方法は[アーキテクチャ](docs/architecture.md#discord-activities)、参加方法は[ゲーム仕様](docs/product.md#discord-activities)を参照してください。

1. [Discord Developer Portal](https://discord.com/developers/applications)で対象ApplicationのActivitiesを有効にし、URL Mappingの`/`をアプリのHTTPSホストへ向けます。`/activity`だけでなく、`/api/auth`・Server Functions・画像・`/rooms/<code>/connection`も同じマッピングを通します。ルートに起動された場合もアプリが`/activity`へ転送します。
2. `DISCORD_CLIENT_ID`・`DISCORD_CLIENT_SECRET`に同じApplicationの値、`DISCORD_BOT_TOKEN`にそのApplicationのBot tokenを設定します。ローカルでは`.env`、公開環境ではWorkerのsecretに保存します。Bot tokenはActivity Instance APIによる参加確認に使用し、BotのGateway接続は不要です。Webだけの環境ではBot tokenは不要です。
3. Web用OAuthのリダイレクトURIは[ログインのOAuthアプリ](#ログインのoauthアプリ)の設定を維持します。`BETTER_AUTH_URL`もWeb版のURLを使い、Discordのproxy URLへ置き換えません。
4. 開発時はHTTPSトンネルをURL Mappingへ登録し、Discordの開発者モードとテスト可能なチームメンバーのアカウントで起動します。対象プラットフォームとLaunchの設定は[公式の起動手順](https://docs.discord.com/developers/activities/building-an-activity)に従います。一般ユーザーへの公開・Discoveryは[公開設定](https://docs.discord.com/developers/discovery/enabling-discovery)で別に確認します。

#### Discordのmigration前の確認

通常の型生成・D1 migration・DO migrationを適用します。`0012_discord-account-identity.sql`は既存accountのproviderとprovider側IDの組を一意にします。適用前に対象DBで`SELECT provider_id, account_id, COUNT(*) FROM account GROUP BY provider_id, account_id HAVING COUNT(*) > 1`を確認し、重複があれば所有ユーザーと戦績の扱いを確認してから適用します。自動でユーザーを結合・削除しません。

#### Discord APIの模擬検証

`vp run test:e2e tests/e2e/discord-activity.spec.ts`は偽のDiscord API（`tests/e2e/fake-discord.ts`、4175番）を使い、コード交換・PKCE・参加確認・既存Webアカウントとの一致・Cookie属性・不正なOrigin・並行入室・Webとの混在・同じルームでの再戦と戦績を検証します。`ANIMIC_E2E=true`のビルドだけ、Discord APIの接続先とBot tokenをテスト用の値にします。実際のDiscordへは通信しません。

#### Discordクライアントでの公開前の確認

PC・モバイルの両方で、次を確認します。APIの模擬検証だけでは埋め込み環境や公開設定を確認したことにはなりません。

| 場面     | 確認すること                                        |
| -------- | --------------------------------------------------- |
| 初回起動 | 起動・初回同意、埋め込みCookieの維持                |
| 通信     | 画像とWebSocketがproxy経由で利用できる              |
| 参加     | 同じActivityからの複数人参加、Web招待からの混在対戦 |
| 継続利用 | 切断・再起動、同じルームでの3戦目以降の再戦         |
| 共有     | Discordの招待と外部共有                             |

### お題の登録

1. `/admin`へ`ADMIN_PASSWORD`でログインし、「お題」の「お題を追加」を開きます。
2. PNG・WebP・JPEG（1枚10MB以下、1回20件まで）と難易度を選んで追加します。ブラウザでメタデータと透過のないWebPに変換してからR2へ保存するため、WebPを書き出せるブラウザ（Chromeなど）を使います。
3. 追加したお題は非公開です。一覧から題名・備考を入力し、「公開する」で出題の対象にします。

| ほかに編集したい内容                 | 管理画面のメニュー |
| ------------------------------------ | ------------------ |
| 制限時間・画像選択の猶予の候補       | 対戦条件           |
| プロンプトの入力候補・検索に出す表現 | 表現の辞書         |

ローカルD1・R2の保存先は`.wrangler/state/`です。E2Eは専用DBへテスト用のお題を登録し、画像の配信先もテスト内で差し替えるため、開発用データは不要です。

### 管理画面のバックアップ

管理画面の「バックアップ」で、次の項目をZIP（`animic-backup-<日時>.zip`）として移せます。

| 対象     | 内容                                                                                           |
| -------- | ---------------------------------------------------------------------------------------------- |
| 含む     | お題と画像、対戦条件の候補、表現の辞書と挿絵                                                   |
| 含まない | 採点ワーカー・採点ジョブ・対戦結果・参加者の情報・生成画像・画像生成の設定・トップページの内容 |

本番の対象データを変えたら「書き出す」で保存し、ZIPはリポジトリ外に保管します。復元・別環境への移行は次の手順です。

1. ZIPを選び、読み込む項目と追加・上書きされる件数を確認します。
2. 「読み込む」を押します。お題・辞書は同じIDを上書きし、なければ追加します。ZIPにないものは削除しません。対戦条件の候補はZIPの内容へ置き換えます。選ばなかった項目は変更しません。
3. 途中で失敗したら、同じZIP・同じ項目で読み込み直します。画像は読み込んだ環境のR2に保存されます。

### 画像生成のモデル

NovelAIで生成するモデルは、管理画面（`/admin`）の「画像生成」で選びます。ふだんは既定のV5 Curatedを使い、V5 Curatedの使用料が足りなくなったらV4.5 Curatedに切り替えます。コードの変更やデプロイは要りません。保存した後にNovelAIへ送る生成から、選んだモデルを使います。選んだモデルは環境ごとの生成キューのDOに保存されるため、ローカルと本番では別々に選びます。

### 採点ワーカーの準備

採点は、運営者のPCで動く[desktop-comfyui-server](https://github.com/mintani/desktop-comfyui-server)を採点ワーカーとして登録して実行します。構成は[採点の設計](docs/scoring.md)を参照してください。

1. PCにdesktop-comfyui-serverとComfyUIを用意し、ComfyUIの`custom_nodes`にcomfyui-illust-similarityの0.2.0以降を配置して依存パッケージを入れます。PixAI Taggerは1枚の処理に時間がかかるため、ComfyUIはGPUで動かします。
2. 初回の採点でモデル（約4GB）をダウンロードするため、登録の前に一度評価を実行しておきます。ダウンロード中はAnimicの割り当ての期限（2分）に間に合いません。
3. 管理画面（`/admin`）に`ADMIN_PASSWORD`でログインし、メニューの「採点ワーカー」の「リンクコードの発行」で採点ワーカーの名前を入力して、リンクコードを発行します。コードは10分間有効で、1回だけ使えます。
4. desktop-comfyui-serverのサーバー設定にAnimicのURLを追加し、リンクコードを入力してリンクします。ローカルでは`vp run dev`の`http://localhost:3000`を指定できます。

採点ワーカーを止める場合は、管理画面の「採点ワーカー」で「失効させる」を押します。以後その採点ワーカーの要求は拒否されます。採点ジョブの状態は、管理画面の「採点ジョブ」で新しい順に最大100件を確認できます。
