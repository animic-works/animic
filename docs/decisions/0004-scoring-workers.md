# 0004: 採点を運営者のPCの採点ワーカーで実行し、ジョブをD1で管理する

- 状態: 承認済み
- 決定日: 2026-09-24
- 関連: [採点の設計](../scoring.md)、[アーキテクチャ](../architecture.md#採点)、[ゲーム仕様](../product.md#対戦の流れ)

## 背景

提出画像の再現度は、CCIP・WD14 tagger v3・DreamSim・SigLIP 2・DINOv2・Depth Anything V2で評価する。これらのモデルはGPUで動かす必要があり、Workersの中では実行できない。PoCでは、運営者のPCで動く[desktop-comfyui-server](https://github.com/mintani/desktop-comfyui-server)がジョブサーバーへ採点ジョブを取りに来て、ComfyUIのワークフローで評価した結果を返せることを確認した。1回の採点は、モデルのダウンロード後で10〜30秒だった。

desktop-comfyui-serverは、決まったURLへ独自の秘密情報を付けてジョブを要求し、完了・失敗を報告する。ジョブを渡す側は、この通信仕様に合わせてAnimicのHTTP APIの後ろに置く必要がある。

## 判断基準

- desktop-comfyui-serverの通信仕様を変えずに接続できること。
- 同じジョブを2台の採点ワーカーへ割り当てないこと。
- 採点ワーカーが応答しなくなっても、ジョブと対戦が止まったままにならないこと。
- 運営者がジョブの状態を確認しやすく、既存のD1・Drizzleの運用に乗ること。

## 検討した選択肢

| 選択肢                                  | 利点                                                                                            | 欠点・制約                                                                                                                              |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| D1のテーブルをキューにする              | 1文の`UPDATE … RETURNING`で割り当てられる。SQLで状態を確認でき、Drizzleのマイグレーションに乗る | Alarmがないため、割り当ての期限切れは次のジョブ要求のときに処理する                                                                     |
| 専用のDurable Objectをキューにする      | Cloudflareが排他や調整の処理に勧める部品で、Alarmで期限切れを処理できる                         | DOクラスとWranglerのmigrationが増え、スキーマを手書きで管理する                                                                         |
| Cloudflare Queues（HTTPで取り出す方式） | 再試行や配信の仕組みを任せられる                                                                | 外部から取り出すにはアカウント単位のAPIトークンが必要で、desktop-comfyui-serverの通信仕様も変える必要がある。ジョブの結果は別に保存する |
| Cloudflare Workflows                    | 多段の処理と待機を任せられる                                                                    | Workersの中で処理を進める仕組みで、外部のマシンが取りに来るキューではない                                                               |

## 決定

採点は、運営者のPCで動くdesktop-comfyui-serverを「採点ワーカー」として登録して実行する。採点ジョブ・採点ワーカー・リンクコード・採点結果はD1のテーブルで管理する。採点ワーカー向けAPIは`src/server.ts`でTanStack Startより前に振り分け、`scoring`で処理する。

## 理由

D1は1つのDBでクエリを1件ずつ処理するため、待機中で最も古いジョブを1文の`UPDATE … RETURNING`で割り当てれば、同じジョブを2台へ渡さない。採点ワーカーの台数とジョブの量は、この方式で扱える範囲に収まる。割り当ての期限切れはジョブ要求のときに処理し、対戦全体の採点期限はルームのDOのAlarmで確かめるため、キュー側にAlarmがなくても対戦が止まったままにならない。

専用のDOはAlarmを使える点で優れるが、この規模では得られる差が小さく、DOクラスとスキーマの管理が増える。Cloudflare QueuesとWorkflowsは、desktop-comfyui-serverが取りに来る方式に合わない。

## 影響

採点ワーカーを動かす運営者のPCが必要になる。採点ワーカーが1台も動いていない間は採点できず、対戦は採点期限の後に勝負不成立になる。

ジョブの登録と結果の取得のため、採点待ちの間はルームのDOが一定間隔でD1へ問い合わせる。採点ワーカーからの定期的なジョブ要求とheartbeatも、WorkerとD1への要求になる。

## 見直す条件

採点ワーカーやジョブが増えて、D1への問い合わせが性能・費用の制約になる場合、採点をクラウドのGPUで実行する場合、またはdesktop-comfyui-serverの通信仕様が変わる場合に再検討する。

## 根拠

2026-09-24に、desktop-comfyui-server 0.4.0の実装・README、PoCのジョブサーバー、Cloudflareの公式資料を確認した。

- [desktop-comfyui-server](https://github.com/mintani/desktop-comfyui-server)
- [Cloudflare D1: Limits](https://developers.cloudflare.com/d1/platform/limits/)
- [Cloudflare: Choose a data or storage product](https://developers.cloudflare.com/workers/platform/storage-options/)
- [Cloudflare Queues: Pull consumers](https://developers.cloudflare.com/queues/configuration/pull-consumers/)
- [Durable Objectsの設計原則](https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/)
