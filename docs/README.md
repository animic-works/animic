# 文書案内

## 現在の仕様・実装を調べる

| 目的                                     | 文書                                   |
| ---------------------------------------- | -------------------------------------- |
| ゲームのルール・参加方法・画面の要件     | [ゲーム仕様](product.md)               |
| 構成・機能ごとの責務・データ・公開API    | [アーキテクチャ](architecture.md)      |
| 採点ジョブ・重み・ボーナス・結果反映     | [採点の設計](scoring.md)               |
| UIを判断する原則                         | [デザイン原則](design.md)              |
| コードの配置・命名・分割・静的検査の方針 | [実装規約](conventions.md)             |
| セットアップ・実装・検証・PR・運用       | [開発・運用ガイド](../CONTRIBUTING.md) |
| AIエージェントの作業指示                 | [AGENTS.md](../AGENTS.md)              |

## 判断の理由・比較・検証を調べる

重要な決定は以下のADR、デザインシステムの比較・判断変更・検証記録は[デザインシステムの設計資料](design-system/README.md)から参照できます。現在の利用形式は上の仕様・実装文書とコードで確認します。

- [0001: Vite+とcommitlintでGit運用を検証する](decisions/0001-git-workflow.md)
- [0002: TanStack Startの構成を必要なパッケージから組み立てる](decisions/0002-application-foundation.md)
- [0003: 匿名参加のセッションをBetter AuthとD1で管理する](decisions/0003-anonymous-sessions.md)
- [0004: 採点を運営者のPCの採点ワーカーで実行し、ジョブをD1で管理する](decisions/0004-scoring-workers.md)
- [0005: 運営者の管理画面を共通のパスワードで保護する](decisions/0005-operator-password.md)
- [0006: 参加者のログインをGoogle・DiscordのOAuthで提供する](decisions/0006-participant-login.md)
- [0007: お題の画像をR2に保存し、管理画面のデータをZIPで書き出す](decisions/0007-topic-images-and-backup.md)
- [0008: 生成画像をDOでデコードし、libwebpのWASMでWebPに書き出す](decisions/0008-generated-image-webp.md)
- [0009: デザイン定義とUIの実装を分離する](decisions/0009-design-system.md)
- [0010: Panda CSS v2を採用する](decisions/0010-panda-css-v2.md)
- [0011: 生成画像を専用のR2バケットに保存し、URLを知っていれば取得できる形で配信する](decisions/0011-generated-image-storage.md)
- [0012: 生成キューのDOが生成画像の保存とルームのDOへの完了の通知まで行う](decisions/0012-generation-completion-in-queue.md)

## 文書を書く・更新する

保存先と更新方法は[文書の管理](../CONTRIBUTING.md#文書の管理)に従います。

| 作成したいもの                   | 参照先                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------ |
| 機能・サブシステムの設計         | [設計テンプレート](templates/design.md)                                                          |
| 重要な設計判断の記録             | [ADRテンプレート](decisions/template.md)                                                         |
| デザインシステムの設計・レビュー | [設計ガイド](design-system/design-guide.md)、[設計レビューガイド](design-system/review-guide.md) |
