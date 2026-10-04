# AIエージェント向け指示

## 作業前の確認

作業前に[CONTRIBUTING.md](CONTRIBUTING.md)、[docs/architecture.md](docs/architecture.md)、[docs/conventions.md](docs/conventions.md)を読み、プロダクトの変更では[docs/product.md](docs/product.md)も確認してください。

UI・Design Systemの変更では[デザイン原則](docs/design.md)と[Design Systemの利用境界](docs/architecture.md#design-system)を確認してください。実装前にPanda MCPへ既存の語彙を問い合わせ、詳細が不足する場合は`packages/design-system/src/`を読んでください。Ark UIを内部利用する場合はArk UI MCPでAPIを確認してください。接続できない場合は未確認の内容を推測で補わず、接続状況を報告してください。

既存定義で必要なUIを表現できない場合は、[Design Systemの変更判断](CONTRIBUTING.md#design-systemの変更判断)に従ってください。任意CSSやVisualへ勝手に逃がさず、新しいDesign判断が必要な箇所は実装で既成事実にせず、人間へ論点と選択肢を返してください。

UI・Design Systemの判断理由を調べる際は、[Design Systemの設計資料](docs/design-system/README.md)に関連する設計事例や設計ガイドがあれば参照してください。過去の事例や一般化した判断方法を現在の仕様として扱わず、現在の利用形式はアーキテクチャ文書・実装・テストで確認してください。

Design Systemの生成と契約検証は`vp run test:design-system`、ブラウザ・アクセシビリティ・画像比較は`vp run test:design-system:browser`、使用状況の解析は`vp run design-system:analyze`です。生成手順は[CONTRIBUTING.md](CONTRIBUTING.md#design-systemの生成と検証)に従い、`packages/styled-system/generated/`を手で編集しないでください。

セットアップと検証は[CONTRIBUTING.md](CONTRIBUTING.md#セットアップと検証)に従います。静的検査はリポジトリルートで`vp run check`を実行します。`vp check`だけではプロジェクト全体の型チェックとKnipを含みません。業務ルールの単体テストは`vp run test`、Workers上のD1・DOとブラウザを含む検証は`vp run test:e2e`です。E2Eは専用のローカルDBを初期化してビルドから実行します。コマンドを変更したら、このファイルの案内も合わせて更新してください。

favicon・OGP用ロゴを変更したら[アイコンの更新](CONTRIBUTING.md#アイコンの更新)に従い、`vp run icons:generate`で派生画像を再生成してください。

Issueに基づく作業では本文とコメントを確認してください。ブランチ名は[ブランチ運用](CONTRIBUTING.md#ブランチ運用)に従い、エージェントやツールの既定値をそのまま使わないでください。

## MCPへの接続

Codex用のプロジェクト設定は[.codex/config.toml](.codex/config.toml)です。信頼済みのプロジェクトとしてリポジトリルートで接続し、Panda MCPには`panda.config.ts`から同じPresetを読み込ませてください。クライアントがプロジェクト設定を読めない場合は、次のコマンドを標準入出力（stdio）を使うサーバーとして登録してください。

```sh
pnpm --silent run mcp:panda
pnpm --silent run mcp:ark-ui
```

設定を変更した後は再接続し、ツール一覧と実際の問い合わせを確認してください。個人のユーザー設定へリポジトリ固有の絶対パスを保存しないでください。接続できない場合の扱いは[作業前の確認](#作業前の確認)に従ってください。

設定形式は[公式MCPドキュメント](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)、各サーバーの利用方法は[Panda MCP](https://panda-css.com/docs/get-started/mcp-server)・[Ark UI MCP](https://ark-ui.com/docs/ai/mcp-server)を参照してください。

## 操作の権限

- 依頼で指定された範囲・制約を優先してください。承認済みの実装範囲では、ブランチ作成・実装・検証・文書更新を進められます。
- コミット・pushは明示的な依頼や事前承認に含まれていなければ確認してください。承認済みの操作は再確認しないでください。
- Issue・PR（ドラフトを含む）・Discussion・Milestone・Projectの作成、ワークフローの手動実行は、対象・内容・範囲が明確な依頼または明示的な承認がある場合だけ行ってください。テスト目的でも同様です。
- マージ・リリース公開・デプロイも依頼や承認の範囲内で行ってください。運用方法への合意を、マージ・リリース・デプロイの許可と解釈しないでください。
- 権限不足で必要な情報・操作へアクセスできない場合は、代替手段で勝手に進めず、できなかった内容を報告して中断してください。

## 判断と報告

フレームワークのAPI・設定・バージョンは、リポジトリで指定しているバージョンと実装を確認し、必要に応じて公式資料・ソースで確かめてください。他のフレームワークの慣習をそのまま当てはめないでください。未確定の仕様・命名・技術選定を決定事項として扱わないでください。仕様上の判断が必要な場合は、論点と推奨案を示してください。実行した検証と、その結果・限界を正確に報告してください。

## 文書の編集

- 文書ごとの責務と保存・更新ルールは[CONTRIBUTING.mdの文書の管理](CONTRIBUTING.md#文書の管理)に従ってください。生の会話ログ、その作業だけの例外、進捗メモ、未承認の提案はリポジトリ外に置いてください。確認済みの検証記録、承認された判断変更を扱う設計事例、再利用可能な設計ガイド、設計レビューガイドは、整理した知識として正式な文書へ保存できます。
- 編集前に対象文書を通読し、関連文書・実装・設定を確認してください。単語検索だけで全文の精査を済ませたと判断しないでください。
- 既存の説明へ統合し、不要・重複・矛盾する記述を削除してください。追記で辻褄を合わせず、関連する参照先も整合させてください。
- 規則の本文は一か所に置き、他の文書から参照してください。AGENTS.mdには参照先とAIエージェントへの指示を日本語で記載してください。独自の用語や曖昧な比喩を避け、対象のファイル名や処理を具体的に書いてください。
- 構成・コマンド・手順の変更時は対応する文書も更新してください。サブディレクトリ固有の指示が必要な場合だけ、そのディレクトリにAGENTS.mdを追加してください。
