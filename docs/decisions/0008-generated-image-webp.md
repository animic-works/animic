# 0008: 生成画像をDOでデコードし、libwebpのWASMでWebPに書き出す

- 状態: 承認済み
- 決定日: 2026-10-08
- 関連: [ゲーム仕様](../product.md#画像生成)、[アーキテクチャ](../architecture.md#依存関係とクライアントサーバーの分離)、[ADR 0007](0007-topic-images-and-backup.md)、Issue #24

## 背景

NovelAIが返すPNGは8bitのRGBAで、tEXtチャンク（`Comment`など）にプロンプト・`v4_prompt`・シードなどの生成の条件が入っている。アルファは255と254だけで、その最下位ビットにも同じ内容が`stealth_pngcomp`として埋め込まれている。`image_format: "webp"`を指定すると可逆圧縮（VP8L）のWebPが届くが、EXIFに同じ内容が入り、アルファもVP8Lのデータの中に残る。生成画像をそのまま配信すると、対戦の相手が画像からプロンプトと規定の絵柄を読める。

お題の画像はブラウザーのcanvasで描き直している（ADR 0007）が、生成画像はNovelAIからサーバーへ届くため、ブラウザーで変換できない。参加者が変換した画像を受け取ると、生成していない画像を提出できてしまう。

## 判断基準

- テキストのメタデータとアルファの両方から、生成の条件を読めなくすること。
- 配信する画像をWebPにすること。
- 追加の料金と、件数による生成の失敗がないこと。
- Workers Freeの制限に収まること。ローカルとE2Eでも本番と同じ変換になること。

## 検討した選択肢

| 選択肢                                             | 利点                                        | 欠点・制約                                                                                      |
| -------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| DOでPNGをデコードし、libwebpのWASMでWebPに書き出す | 追加の料金がない。ローカル・E2Eでも同じ動き | 依存パッケージが増える。1枚あたり約0.4秒のCPU時間を使う                                         |
| Images bindingでPNGからWebPに変換する              | コードが短い。WorkerのCPU時間を使わない     | Workers Freeでは月5,000件を超えると変換が失敗する。ローカルは簡易版で、透過の扱いが確かめにくい |
| NovelAIの可逆WebPからEXIFのチャンクだけを消す      | デコードせずにチャンクの操作だけで済む      | アルファに埋め込まれた生成の条件が残る                                                          |

## 決定

- NovelAIからはPNGで受け取る。
- 生成キューのDOで、PNGの画素を取り出してアルファを捨て、`@jsquash/webp` 1.5.0（libwebpのWASM、SIMD版）で品質90の非可逆のWebPに書き出す。品質はお題の画像と同じにする。
- PNGのデコードは自前の処理（`DecompressionStream`とフィルターの復元）で行い、8bitのRGB・RGBAでインターレースのないPNGだけを扱う。

## 理由

アルファを捨てるには画素のデコードと書き出し直しが要り、チャンクの操作だけでは足りない。Images bindingは件数の上限を超えると生成そのものが失敗し、ゲームを続けられなくなる。SQLiteのDOは1リクエストあたり30秒のCPU時間を使えるため、Workers Freeでも約0.4秒の変換を行える。非可逆にするとファイルが約1/10（1.4MBから約0.13MB）になり、保存と配信が軽くなる。お題の画像も品質90の非可逆のWebPのため、採点で比べる2枚の条件もそろう。

## 影響

- `@jsquash/webp`を依存パッケージに加える。`.wasm`はCloudflare Vite pluginがコンパイル済みのモジュールとして読み込む。
- 生成キューのDOは成功時にWebPを返す。保存と配信は`image/webp`で扱う。
- 非可逆の書き出しで、NovelAIの画像より細部がわずかに変わる（品質90でPSNR約42dB）。
- 変換の時間だけ、生成の完了が遅れる。NovelAIの順番待ちの外で変換し、次の生成の通信と重ねる。

## 見直す条件

NovelAIがメタデータを埋め込まない形式を選べるようになった場合、Workers Paidへ移ってImages bindingの件数の制約が問題にならなくなった場合、変換のCPU時間が生成の待ち時間に響く場合に再検討する。

## 根拠

2026-10-08に、V5 Curated・V4.5 Curatedで生成したPNGとWebPを調べ、tEXt・EXIFとアルファの最下位ビットから生成の条件を復元できることを確かめた。変換後のWebPはVP8のチャンクだけで、Pillowで読むとRGB（アルファなし）だった。画素の取り出しはPillowのデコード結果と一致した。Node 24（V8）での変換は1枚あたり約0.4秒、`vp dev`のDOでも変換できた。Cloudflareの資料（[Durable Objectsの制限](https://developers.cloudflare.com/durable-objects/platform/limits/)、[Workersの制限](https://developers.cloudflare.com/workers/platform/limits/)、[Images bindingの料金](https://developers.cloudflare.com/images/pricing/)）を確認した。
