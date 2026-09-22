# 0003: 匿名参加のセッションをBetter AuthとD1で管理する

- 状態: 承認済み
- 決定日: 2026-09-23
- 関連: [アーキテクチャ](../architecture.md#匿名参加のセッション)

## 背景

アカウントへのログインを要求せずに、ルームへの再接続や画像の提出を同じ参加者の操作として扱う必要がある。Cookieの保持だけでなく、サーバー側で有効期限と失効を確認できることを重視する。

## 決定

Better Authのanonymousプラグインを使い、DrizzleアダプターでD1へユーザーとセッションを保存する。D1に合わせてアダプターの対話的トランザクションを無効にする。認証のHTTPハンドラーだけをTanStack StartのServer Routeに置き、ゲームの操作はServer Functionsを使う。

Cookieキャッシュを使わず、セッションをD1で確認する。Cookieの保護、CSRF対策、DOでの権限確認は[アーキテクチャ](../architecture.md#匿名参加のセッション)に従う。

## 理由

暗号化したCookieだけで状態を持つ方式より、失効をDBに反映して以後の認証を拒否しやすい。独自の認証処理を作らず、セッションの発行・検証とTanStack StartへのCookie反映をライブラリに任せられる。

Better Authは内部でZodを使用するが、アプリ側の入力検証はValibotに統一できる。リクエスト時に必要なDrizzleアダプターを直接指定し、`better-auth/minimal`から初期化する。

## 影響

認証にD1へのアクセスとスキーマ管理が必要になる。Better Authの基本スキーマに加え、匿名ユーザーの属性と認証APIの回数制限を保存する。匿名参加者にも内部的なメールアドレスが作られるが、参加者によるメール入力やメール認証は要求しない。

セッションの失効だけでは接続済みWebSocketは閉じない。ルームの接続管理でも期限と失効を確認する必要がある。参加者IDを持っていることだけではルーム操作を許可せず、DOの参加記録と権限を確認する。

## 見直す条件

アカウント連携、別端末への復帰、認証基盤の変更を導入する場合、またはD1への認証クエリが性能・費用の制約になる場合に再検討する。

## 根拠

2026-09-23に公式資料とBetter Auth 1.7.5、Drizzle ORM 0.45.3の実装を確認した。

- [Better Auth: Anonymous](https://better-auth.com/docs/plugins/anonymous)
- [Better Auth: TanStack Start](https://better-auth.com/docs/integrations/tanstack)
- [Better Auth: Drizzle](https://better-auth.com/docs/adapters/drizzle)
- [Better Auth: Sessions](https://better-auth.com/docs/concepts/session-management)
- [Drizzle: Cloudflare D1](https://orm.drizzle.team/docs/sqlite/connect-cloudflare-d1)
