# 実装規約

## ファイル配置と分割

[architecture.md](architecture.md)で定めた役割に従い、機能固有のUI・スタイル・処理は近くに配置します。CSS Modulesは対応するUIに隣接させます。

分割は処理の役割、変更理由、読みやすさ、再利用性、テストのしやすさで判断します。必要なファイルやドキュメントは作成します。

- 機能追加のたびにUI・CSS・Server Functions・サーバー専用実装を一式生成しません。
- 小さい処理は同じファイルに書けます。役割の異なる処理は必要に応じて分割します。
- コードを共通化するかどうかは、利用箇所の数だけでなく、特定の機能の仕様に依存しているかも考慮して判断します。
- 一律のbarrelファイルやservice・repository階層を義務付けません。

## 命名

プロダクト名の表記は「Animic」に統一します。パッケージ名・URL・リポジトリ名などの技術的な識別子は、それぞれの命名規則に従います。

ユーザーが使う用語とその意味を整理してからコードの命名を決めます。featureの名前など設計に関わる命名は、役割と命名理由を示して合意を得ます。未承認の候補を決定事項として記載しません。

## クライアントとサーバーの分離

ファイルを分ける場合は、Server Functionsの定義を`*.functions.ts`、サーバー専用の処理を`*.server.ts`に置きます。フォルダー名だけでサーバー専用と判断せず、TanStack Startの仕組みでクライアントへの読み込みを防ぎます。

## 静的検査

- 型情報を使う厳格なlintを維持します。型チェック、テスト、ビルドと合わせて変更に適した検証を実施します。
- lint例外は必要性を説明できる範囲に限定します。設定は[vite.config.ts](../vite.config.ts)、検証手順は[CONTRIBUTING.md](../CONTRIBUTING.md#セットアップと検証)を参照してください。

## React Compilerと未使用コード

React CompilerをVite+のビルド処理に組み込みます。`@vitejs/plugin-react` 6系では、`reactCompilerPreset`と`@rolldown/plugin-babel`を使います。古い`react({ babel: ... })`設定は使いません。Compilerの設定が、使用するReactのバージョンに対応していることを確認します。

Knipで検出されたファイルを機械的に削除したり、広範囲のignoreで隠したりせず、実際のエントリーポイントやフレームワークからの利用を確認します。フレームワークの導入・更新時にはKnipがルートと生成コードの利用を正しく判定することを確認します。`cloudflare:workers`はWorkersが提供する仮想モジュールのため、package.jsonのKnip設定で`cloudflare`の依存検査を除外します。npmパッケージとして追加しません。

参考: [React Compiler公式のVite設定](https://react.dev/learn/react-compiler/installation)、[KnipのVite+対応](https://knip.dev/reference/plugins/vite-plus)。
