# Animic

お題のイラストをAI画像生成で再現し、再現度・提出速度・生成回数を競う対戦ゲームです。

## 開発

セットアップ・検証コマンド・Git運用は[CONTRIBUTING.md](CONTRIBUTING.md)を参照してください。

## 仕様と設計

- [ゲーム仕様](docs/product.md)
- [アーキテクチャ](docs/architecture.md)
- [採点の設計](docs/scoring.md)
- [実装規約](docs/conventions.md)
- [デザイン原則](docs/design.md)
- [Git hooksとCIの選定理由](docs/decisions/0001-git-workflow.md)
- [アプリ構成の決定](docs/decisions/0002-application-foundation.md)
- [採点の実行先とキュー方式の決定](docs/decisions/0004-scoring-workers.md)
- [運営者の管理画面の認証方式の決定](docs/decisions/0005-operator-password.md)
- [お題の画像の保存先とバックアップの方式の決定](docs/decisions/0007-topic-images-and-backup.md)
- [生成画像のメタデータと透過を消す方式の決定](docs/decisions/0008-generated-image-webp.md)
- [デザイン定義とUIの分離](docs/decisions/0009-design-system.md)
- [Panda CSS v2の採用理由](docs/decisions/0010-panda-css-v2.md)
- [生成画像の保存先と配信方法の決定](docs/decisions/0011-generated-image-storage.md)
- [デザインシステムの設計資料](docs/design-system/README.md): 設計で得た判断材料と、比較・検証・判断変更の事例

文書の役割とテンプレートの使い方は[CONTRIBUTING.md](CONTRIBUTING.md#文書の管理)にまとめています。
