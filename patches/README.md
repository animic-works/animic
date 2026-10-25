# Discord Embedded App SDKのZod 4移行

@discord/embedded-app-sdk@2.5.0が依存するZod 3には、GHSA-mrhx-c7xc-m3w5の修正版がありません。
SDKはZodをoutput/lib/zod/にも同梱しているため、依存関係のoverrideだけでは実行コードを修正できません。

このディレクトリのpnpmパッチは、SDKをZod 4.6.7に移行した出力へ置き換えます。
pnpm-workspace.yamlのoverrideとpatchedDependenciesを併用し、lockfileのハッシュで復元時の適用内容を固定します。
auditの除外・重大度の緩和は行いません。

## 変更内容

- SDK内の古いZodバンドルを削除し、宣言済みの依存パッケージを通常のimport/requireで読み込みます。
- scopeのenum取得に公開APIのunwrap()とenumを使います。
- 未知のscope・不正な外部リンク応答のフォールバックを維持し、既定値はschema.parse(undefined)で取得します。
- Zod 4の型に合わせてイベント・コマンドの型を修正し、ESM・CommonJSと型宣言を再生成します。コマンド名と応答データの検証は維持します。

生成元はDiscord公式リポジトリのv2.5.0、コミット14264eccbf9e68d5d58c1aadbc7579e003e0dce6です。
レビュー用のソース差分はdiscord-embedded-app-sdk-zod4-source.diffにあります。
配布ファイルのパッチは再生成した型宣言と古いZodの削除を含むため、ソース差分より大きくなっています。
生成にはTypeScript 5.9.3、Rollup 4.65.0、@rollup/plugin-typescript 12.3.1、@rollup/plugin-node-resolve 16.0.3、@rollup/plugin-commonjs 28.0.9、@rollup/plugin-json 6.1.0を使用しています。

## 検証と更新

元のSDKソースへソース差分を適用して型チェックと公式テスト28件を実行しました。
アプリ側のsrc/lib/discord-sdk.test.tsで、scope・応答の互換性と、上限超過の配列を要素の同期・非同期検証より前に拒否することを検証します。
Discord ActivityのE2Eは実SDKを使い、DiscordクライアントとのpostMessageだけを模擬して認証・招待まで確認します。本物のDiscordクライアントとの接続確認を代替するものではありません。

SDKの公式リリースが修正版Zodへ移行したら、同じ検証を通してパッチ・ソース差分・専用overrideを削除します。
Zod 4パッケージのzod/v3を使う置き換えは、古い実装を残すため採用しません。

参考:

- [GitHub Advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
- [Zodの上流修正](https://github.com/colinhacks/zod/pull/6652)
- [Zod 4移行ガイド](https://zod.dev/v4/changelog)
- [Discord SDK v2.5.0](https://github.com/discord/embedded-app-sdk/tree/v2.5.0)
