# 0001: Vite+とcommitlintでGit運用を検証する

- 状態: 承認済み
- 決定日: 2026-09-22
- 関連: [CONTRIBUTING.md](../../CONTRIBUTING.md)

## 背景

AIエージェントと人間が同じ手順で変更を提案・検証できるよう、旧リポジトリの日本語テンプレートと厳格なlintを引き継ぎ、ローカル検証・CI・レビューをつなぐ必要がある。

## 判断基準

- コードとコミット形式を機械的に検証できること。
- hooks管理を重複させず、Vite+のツールチェーンを活用できること。
- ローカル設定だけに依存せず、取り込み前に検証できること。
- 個々の変更とリリースを区別し、mainとdevelopの履歴を保てること。

## 検討した選択肢

| 選択肢                  | 利点                                             | 欠点・制約                                             |
| ----------------------- | ------------------------------------------------ | ------------------------------------------------------ |
| Vite+ hooksとcommitlint | 既存のツールチェーンと形式検証を組み合わせられる | cloneごとにhooksの有効化が必要                         |
| LefthookやHuskyを併用   | hooksを管理できる                                | Vite+と役割が重複する                                  |
| テンプレートだけで案内  | 導入が容易                                       | 形式を検証できない                                     |
| ローカルhooksだけで検証 | 問題を早期に発見できる                           | 無効化でき、マージ前に検証が行われたことを保証できない |

## 決定

Vite+ hooksとcommitlintを採用し、CIでも検証する。main・develop・トピックブランチで運用する。トピック→developはSquash merge、develop→mainはMerge commitとする。保護要件、命名、実行手順は[CONTRIBUTING.md](../../CONTRIBUTING.md)で管理する。

## 理由

Vite+でhooks・コード検査を扱い、専用のcommitlintでメッセージ形式を検証すれば、役割を重複させずに検証できる。CIとPRレビューをマージの条件にすることで、ローカルhooksの実行状況に依存しない。

トピックの変更はPR単位にまとめ、リリース時は共通の履歴を保持する。developからmainへのマージにもSquashを使うと、元のコミットがmainの履歴に残らないため、マージ先に応じて方式を分ける。

## 影響

各cloneでhooksとコミットテンプレートの設定が必要になる。日本語として説明が適切か、Issueなしの作業が認められているかは、形式検証だけでは判定できずレビューで確認する。

## 見直す条件

ツールチェーンやブランチ運用を変更する場合は、hooks・CI・保護要件の整合を見直す。依存更新時はpeerDependenciesのバージョン条件と各検査の動作を確認する。

## 根拠

2026-09-22に公式資料とnpmメタデータを確認した。Vite+はRC版1.0.0-rc.0に対して通常リリース0.3.3を選び、同梱Vite 8.3.0との組み合わせを検証した。Viteの代わりに指定するVite+のパッケージバージョンがpeerDependenciesの判定に使われるため、検証した0.3.3だけを許容するように設定した。

- [Vite+ Commit Hooks](https://viteplus.dev/guide/commit-hooks)
- [Vite+ Check](https://viteplus.dev/guide/check)
- [Vite+ CI](https://viteplus.dev/guide/ci)
- [commitlint Configuration](https://commitlint.js.org/reference/configuration.html)
