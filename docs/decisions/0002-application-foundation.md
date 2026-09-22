# 0002: TanStack Startの構成を必要なパッケージから組み立てる

- 状態: 承認済み
- 決定日: 2026-09-23
- 関連: [アーキテクチャ](../architecture.md)、[実装規約](../conventions.md)

## 背景

Better T Stackによる一括生成では、採用しないUIや設定まで含まれ、依存パッケージの選定とディレクトリ構成を自分たちの設計に合わせにくい。変更の速いTanStack StartとCloudflareについて、生成ツールの既定値に依存せず、互換性を確認して構成する必要がある。

## 決定

TanStack Startのフルスタック構成をCloudflare Vite pluginでWorkers上に構築する。公式の最小構成を基に、パッケージ・設定・コードを個別に追加する。通常の業務APIにはServer Functionsを使い、関連する実装はfeature単位に配置する。

UIはBase UIとCSS Modulesを採用する。React CompilerをVite+のクライアントビルドに組み込み、Knipで不要な依存パッケージやコードを検出する。ディレクトリは必要なコードを書く際に追加する。

バージョンは公式資料・リリース情報・peerDependenciesの条件を確認して選び、package.jsonとpnpm-lock.yamlで固定する。更新手順は[CONTRIBUTING.md](../../CONTRIBUTING.md#依存関係とgitで管理するファイル)に従う。

## 理由

Startのルーティング・SSR・Server Functionsを一つのアプリで扱い、Cloudflare Vite pluginを通してローカルでもWorkersランタイムで検証できる。Base UIの操作・アクセシビリティの実装を利用しながら、見た目はCSS Modulesで設計できる。

一括生成より初期設定の確認は増えるが、必要なパッケージを選んで構成し、セットアップ手順とCIで再現性を維持できる。React CompilerはReactプラグインの公式プリセットを使い、Vite+が利用するRolldownの変換処理に合わせる。

## 影響

フレームワークの更新時には型検査だけでなく、Workersでの起動・ビルド・SSRとブラウザ操作を検証する。UIの見た目とデザイントークンはプロジェクトで管理する。生成ルートやWorkers型など、フレームワークが必要とする生成物は用途に応じて管理する。

## 見直す条件

デプロイ先、UIの方針、Vite+のビルド構成を変更する場合、またはフレームワークの更新で公式の統合方法が変わる場合に再検討する。

## 根拠

2026-09-23に公式資料と採用したバージョンのプラグイン実装を確認した。

- [TanStack Start: Build from Scratch](https://tanstack.com/start/latest/docs/framework/react/build-from-scratch)
- [Cloudflare: TanStack Start](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/)
- [React Compiler: Installation](https://react.dev/learn/react-compiler/installation)
- [Base UI](https://base-ui.com/react/overview/quick-start)
- [Knip: Vite+](https://knip.dev/reference/plugins/vite-plus)
