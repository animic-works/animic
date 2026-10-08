# 0010: Panda CSS v2を採用する

- 状態: 承認済み
- 決定日: 2026-10-04
- 関連: [デザイン定義とUIの分離](0009-design-system.md)、[アーキテクチャ](../architecture.md#design-system)

## 背景

AnimicではDesign SystemのためにPanda CSSを新規導入する。維持する必要があるv1の実装・設定・独自拡張は存在しない。Token・Style・Recipe・Patternの定義と、型付きSDK・CSSの生成に使用するメジャーバージョンを決める必要がある。

## 判断基準

現在のNode.js・ESM環境で動作し、Animicで必要なDesign Systemを定義できることを重視する。その定義から型付きSDKとCSSを生成でき、型検査とブラウザ表示まで検証できることを確認する。

## 決定

Panda CSS v2を採用する。具体的な依存パッケージのバージョンはpackage.jsonとpnpm-lock.yamlで管理し、このADRではパッチバージョンを固定しない。

## 理由

v2が要求するNode.js 22以上・ESMに対し、AnimicはNode.js 24とESMを使用している。v1から引き継ぐ設定や拡張がないため、新規導入でv1を選んでから移行する必要がない。

導入時の2.0.1で、PresetにPrimitive・Semantic Tokens、Text・Layer・Animation Styles、Recipe・Slot Recipe、Pattern・Conditionsを定義し、型付きSDKとCSSを生成できることを確認した。現在利用している`strictTokens`・`strictPropertyValues`の設定でも、Animicの定義を使った型検査とStorybookのビルドが成立することを確認した。ブラウザでの状態・操作・アクセシビリティ・画像比較も検証対象にしている。

開発支援として、Native Specの生成、Panda MCPへの問い合わせ、analyzeによる利用解析が利用できることも追加で確認した。これらの役割と定義との関係は[アーキテクチャ](../architecture.md#生成と開発支援)にまとめる。MCP・analyzeをUIの実行やビルドの要件にはしない。

## 影響

Panda関連パッケージのバージョンを揃え、更新時には生成物・型・CSS・ブラウザ表示を再検証する。生成・検証の手順は[CONTRIBUTING.md](../../CONTRIBUTING.md#design-systemの生成と検証)にまとめる。

## 見直す条件

必要な定義や生成結果を維持できない不具合、実行環境の要件との不整合、メジャーバージョン変更が生じた場合は再検討する。

## 根拠

2026-10-04に以下の公式情報と、リポジトリで指定する2.0.1の実装・生成結果を確認した。

- [Panda CSS v2発表](https://panda-css.com/blog/panda-css-v2)
- [v2 upgrade guide](https://panda-css.com/docs/get-started/upgrading-to-v2)
- [導入時の2.0.1のリリース](https://github.com/chakra-ui/panda/releases/tag/%40pandacss%2Fdev%402.0.1)
