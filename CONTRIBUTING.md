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

`vp run check`はフォーマット・lint・型チェック・Knipを実行します。`vp check`はVite+の組み込みコマンドで、Knipを含みません。コマンドの定義は[package.json](package.json)、lint・format・staged設定は[vite.config.ts](vite.config.ts)を参照してください。

E2Eは[playwright.config.ts](playwright.config.ts)がビルド・DBの初期化・プレビュー起動を行います。テストごとではなく実行ごとに`.wrangler/e2e/`を初期化し、開発用の`.wrangler/state/`とは分けます。Wranglerによるテストデータ操作と他のテストが同じSQLiteを同時に更新しないよう、E2Eは1 workerで順に実行します。複数人の同時操作は各テスト内で複数のブラウザコンテキストを使って確認します。認証URLと鍵はテスト用に設定するため、E2Eだけなら`.env`の用意は不要です。

`vp run test`はVite+内蔵のVitestで`src/**/*.test.ts`を実行します。期限やホストの引き継ぎなど、時刻を指定して確認する業務ルールを対象とします。Workersランタイムが必要な処理はE2Eで実際のD1・DOと組み合わせて確認します。

E2EにはSSR表示、ブラウザ操作、404応答、匿名セッションの復元・失効、CSRF対策、ルームへの参加と状態同期、複数タブ、ホストの退出・切断、WebSocketの認証、対戦開始・再戦・復帰・途中参加・提出期限による未提出・勝負不成立の確定と、D1への結果保存に失敗した場合の再試行を含めます。失敗時のtraceは`test-results/`に保存され、CIでは`e2e-failure-traces` artifactから7日間取得できます。展開したtraceは`vp exec playwright show-trace <trace.zipのパス>`で確認します。

Drizzleスキーマを変更したら`vp run db:generate --name <変更名>`でSQLを生成し、`migrations/`のSQLとスナップショットを確認して一緒に管理します。ローカルへの適用には`vp run db:migrate:local`を使います。適用済みのSQLは書き換えず、追加のmigrationで変更します。

`wrangler.jsonc`のD1設定は`DB` bindingを使います。リモート環境を用意する際は対象DBを作成・確認し、その`database_id`を設定してからmigrationを適用します。`BETTER_AUTH_URL`には公開URL、`BETTER_AUTH_SECRET`には環境固有の鍵を設定します。ローカルの鍵を本番へ流用しません。Cloudflare Vite pluginはプレビュー用の値を`dist/server/.dev.vars`へ出力するため、`dist/`全体を共有用artifactにしません。

Workers設定は[wrangler.jsonc](wrangler.jsonc)で管理し、変更後は`vp run typegen`を実行します。生成された`worker-configuration.d.ts`はGitに含めません。`src/routeTree.gen.ts`はTanStack Startが開発・ビルド時に生成するルートと型の定義で、Gitで管理します。手で編集せず、ルートの変更と合わせて更新します。

ローカルではVite+のhooksを使用します。`pre-commit`は`vp staged`で対象ファイルを検査・自動修正し、`commit-msg`はcommitlintでメッセージを検証します。hooksとは別に、PR前に静的検査と変更に関連するテスト・動作確認を行います。

[.gitmessage](.gitmessage)を使う場合は、cloneごとに設定します。

```sh
git config --local commit.template .gitmessage
```

テンプレートは`git commit`でエディターを開くと表示されます。`git commit -m`には適用されません。

## お題の登録

自前で生成した画像を配信できるURLに配置し、D1の`topic`テーブルへID・難易度・画像URLを登録します。難易度は`easy`（かんたん）、`normal`（ふつう）、`hard`（むずかしい）です。画像のバイナリはD1に保存しません。

登録用SQLの例です。画像URLは実際の配信先に置き換えます。

```sql
INSERT INTO topic (id, difficulty, image_url)
VALUES ('easy-001', 'easy', 'https://example.com/topics/easy-001.webp');
```

ローカルD1には、SQLを保存したファイルを指定して適用します。

```sh
vp exec wrangler d1 execute DB --local --file /path/to/topics.sql
```

E2Eは専用DBへテスト用のお題を登録するため、開発用データを必要としません。画像の配信先はテスト内で差し替えます。

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

- [Checks](.github/workflows/checks.yml)の`Quality`でWorkers型生成、単体テスト、E2Eに含まれるビルドとローカルD1・DOでの検証、生成ルートの差分確認、静的検査を実行します。
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
