import { FileButton } from "@animic/react/file-button";
import { createRef } from "react";
import { Lead } from "@animic/react/lead";
import { DataTable, type DataTableColumn } from "@animic/react/data-table";
import { Overlay } from "@animic/react/overlay";
import { Avatar, AvatarButton } from "@animic/react/avatar";
import { Badge } from "@animic/react/badge";
import { SectionNavigation } from "@animic/react/section-navigation";
import { MediaObject } from "@animic/react/media-object";
import { Heading } from "@animic/react/heading";
import { Text } from "@animic/react/text";
import { StatGroup } from "@animic/react/stat-group";
import { Surface } from "@animic/react/surface";
import { Stack } from "@animic/react/stack";
import { Container } from "@animic/react/container";
import { Grid } from "@animic/react/grid";
import { Split } from "@animic/react/split";
import { Button } from "@animic/react/button";
import { SegmentedControl } from "@animic/react/segmented-control";
import { Dialog } from "@animic/react/dialog";
import { CodeInput } from "@animic/react/code-input";
import { Popover } from "@animic/react/popover";
import { Carousel } from "@animic/react/carousel";
import { Meter } from "@animic/react/meter";
import { Section } from "@animic/react/section";
import { ActionGroup } from "@animic/react/action-group";
import { Layer, LayerItem } from "@animic/react/layer";
import { ImagePair } from "@animic/react/image-pair";
import { grid, stack } from "@animic/styled-system/patterns";

<Heading level={1} size="display">
  表示
</Heading>;
<Text as="p" variant="body.prose" tone="muted">
  説明
</Text>;
<Heading level={2} size="fluid">
  <Text variant="inherit" tone="primary">
    比較
  </Text>
</Heading>;
<Section align="stretch" inset="navigation-wide">
  <Layer layout="adaptive">
    <LayerItem placement="content">内容</LayerItem>
  </Layer>
</Section>;
<Button
  appearance="primary"
  size="hero"
  shape="pill"
  prominence="raised"

  trailingIcon={<svg />}
>
  進む
</Button>;
// @ts-expect-error 重なり順の任意指定を公開しない。
<Layer zIndex={999} />;
// @ts-expect-error 配置には用途を指定する。
<LayerItem />;
// @ts-expect-error 見出しの画面条件は利用側から変更しない。
<Heading level={1} size="fluid" breakpoint="800px" />;
<Container size="reading">
  <Grid columns={2}>
    <Split layout="equal" />
  </Grid>
</Container>;
// @ts-expect-error 文書構造上の見出しレベルは必須。
<Heading size="lg" />;
// @ts-expect-error 視覚的な見出しサイズは必須。
<Heading level={2} />;
// @ts-expect-error Containerの幅用途は必須。
<Container />;
// @ts-expect-error Gridの列数は必須。
<Grid />;
// @ts-expect-error Splitの配置は必須。
<Split />;
// @ts-expect-error 任意列数を公開しない。
<Grid columns={5} />;
// @ts-expect-error 任意のDOM要素を公開しない。
<Text as="h1" />;
// @ts-expect-error Typographyの個別の値を公開しない。
<Text fontSize="4" />;
// @ts-expect-error インラインスタイルを公開しない。
<Button style={{ color: "red" }} />;
// @ts-expect-error classNameを公開しない。
<Button className="override" />;
// @ts-expect-error Arkの要素合成用APIを公開しない。
<Button asChild />;
// @ts-expect-error Arkの状態機械設定を公開しない。
<Dialog open onOpenChange={() => {}} title="確認" trapFocus={false}>
  内容
</Dialog>;
// @ts-expect-error コードの正規化をArkの設定として公開しない。
<CodeInput length={8} value="" onChange={() => {}} mask />;
<Popover
  open
  onOpenChange={() => {}}
  label="開く"
  title="情報"
  trigger="A"
  // @ts-expect-error Popoverから位置指定を自由選択させない。
  positioning={{ placement: "left" }}
>
  内容
</Popover>;
// @ts-expect-error CarouselからArkのstoreを公開しない。
<Carousel label="画像" count={2} index={0} onIndexChange={() => {}} store={{}}>
  内容
</Carousel>;
// @ts-expect-error Meterの塗りを任意CSSで上書きしない。
<Meter label="評価" value={50} style={{ background: "red" }} />;
// @ts-expect-error Sectionから任意の高さを指定しない。
<Section height="80vh" />;
// @ts-expect-error ActionGroupから余白の数値を自由選択させない。
<ActionGroup gap="3" />;
// @ts-expect-error 低レベルの余白を公開しない。
<Stack gap="5" />;
// @ts-expect-error Surfaceから影を自由選択させない。
<Surface shadow="solid.2" />;
// @ts-expect-error 内部Layer Styleは汎用Surfaceへ公開しない。
<Surface appearance="floating" />;
// @ts-expect-error 余白のPrimitive TokenをPatternから自由選択させない。
stack({ space: "5" });
// @ts-expect-error Patternは任意のCSS指定を受け付けるものではない。
grid({ columns: "2", gridTemplateColumns: "1fr 2fr" });
// @ts-expect-error 自動生成された負の余白Tokenも公開しない。
<Stack space="-5" />;
// @ts-expect-error Recipeから余白Tokenを自由選択させない。
<Surface padding="-5" />;
// @ts-expect-error 任意のコンテナ条件を公開しない。
<Grid columns={2} breakpoint="40em" />;
// @ts-expect-error presentationは定義した選択肢だけ。
<Dialog open onOpenChange={() => {}} title="確認" presentation="bottom">
  内容
</Dialog>;

// @ts-expect-error 全画面表示にカードの寸法を組み合わせない。
<Dialog open onOpenChange={() => {}} title="進行状況" presentation="fullscreen" size="compact">
  処理中
</Dialog>;
// @ts-expect-error 固有の配色を持つBadgeへ状態の色を混在させない。
<Badge appearance="glass" tone="danger">
  処理中
</Badge>;
// @ts-expect-error Surfaceの同じ外観に別名を残さない。
<Surface appearance="media" />;

// @ts-expect-error アバターの色は定義済みの配色から選ぶ。
<Avatar name="参加者" palette="#ff0000" />;
// @ts-expect-error 状態表示と任意の補足アイコンは同時に指定しない。
<Avatar name="参加者" status="complete" badge="!" />;
// @ts-expect-error 画像と本文の配置は任意CSSを受け付けない。
<MediaObject media="画像" gap="20px" />;
// @ts-expect-error ページ内ナビの位置は任意CSSを受け付けない。
<SectionNavigation label="案内" items={[]} current="" style={{ right: 0 }} />;

<Lead conclusion={<mark>結びの文</mark>}>
  <span>導入文</span>
  <strong>強調</strong>
</Lead>;
<Overlay>
  <svg aria-hidden="true" />
</Overlay>;
<Stack fill justify="between" space="fluid" />;
<Surface appearance="illustrated" padding="inset" />;
<Surface appearance="adaptive" padding="compact" />;
<Text variant="label.fluid">合計</Text>;
<Split layout="content-intrinsic" collapseOrder="reverse" />;
<ImagePair sizing="intrinsic" />;
// @ts-expect-error 画像の配置から任意寸法を指定させない。
<ImagePair sizing="320px" />;
<Button feedback="press" appearance="quiet">
  補助操作
</Button>;
// @ts-expect-error 演出用の積層を任意の数値へ変更しない。
<Overlay zIndex={100}>
  <svg />
</Overlay>;
// @ts-expect-error 導入文のTypographyを任意CSSへ置き換えない。
<Lead style={{ fontSize: 30 }}>導入文</Lead>;

// ボタン型リンクは同じ外観を持つが、操作ではなく遷移として扱う。
import { ButtonLink } from "@animic/react/link";
import { ThumbnailList } from "@animic/react/thumbnail-list";
import { TokenInput } from "@animic/react/token-input";
<ButtonLink href="/" appearance="primary" size="hero" shape="pill" prominence="raised">
  ホームへ
</ButtonLink>;
// @ts-expect-error 遷移先を省略しない。
<ButtonLink>ホームへ</ButtonLink>;
// @ts-expect-error anchorにbutton固有の送信処理を持たせない。
<ButtonLink href="/" type="submit">
  送信
</ButtonLink>;
// @ts-expect-error 低レベルの外観上書きを公開しない。
<ButtonLink href="/" style={{ color: "red" }}>
  ホームへ
</ButtonLink>;
// @ts-expect-error 色指定に寸法変更を混ぜるAPIは公開しない。
<Button compactAppearance="primary">続ける</Button>;
<Heading level={1} size="statement">
  完了
</Heading>;
<Container size="summary">概要</Container>;
<Badge appearance="annotation">area · selected</Badge>;
// @ts-expect-error 注釈の定義済み配色へ別の配色を重ねない。
<Badge appearance="annotation" tone="neutral">
  対象
</Badge>;
<ThumbnailList label="画像" items={[]} empty="ありません" onValueChange={() => {}} />;
// @ts-expect-error 一覧の用途と読み上げ名は利用側が指定する。
<ThumbnailList items={[]} empty="ありません" onValueChange={() => {}} />;
<TokenInput
  label="語句"
  value=""
  suggestions={[]}
  onValueChange={() => {}}
  onCommit={() => {}}
  onSuggestion={() => {}}
>
  語句
</TokenInput>;
<TokenInput
  label="語句"
  value=""
  suggestions={[]}
  onValueChange={() => {}}
  onCommit={() => {}}
  onSuggestion={() => {}}
  // @ts-expect-error Arkのcollectionや操作設定を公開しない。
  collection={[]}
>
  語句
</TokenInput>;

<Grid columns={4} collapse="none" space="compact">
  <AvatarButton name="参加者" label="参加者を選択" size="fill" selected onClick={() => {}} />
</Grid>;
<Avatar name="参加者" size="fluid" />;
<Split layout="balanced" collapseOrder="reverse" />;
<MediaObject media={<Avatar name="参加者" />} actions={<Button>編集</Button>}>
  <Text>参加者の説明</Text>
</MediaObject>;
<SegmentedControl
  label="表示する期間"
  appearance="pill"
  enclosure="outlined"
  options={[{ value: "all", label: "すべて" }]}
/>;
<StatGroup items={[{ label: "件数", value: 124 }]} />;
<Text variant="numeric.rank">1st</Text>;
// @ts-expect-error 選択状態は操作を持つAvatarButtonで扱う。
<Avatar name="参加者" selected />;
// @ts-expect-error 任意の外枠の色を公開しない。
<SegmentedControl label="期間" options={[]} enclosure="#ffffff" />;

const tableColumns: DataTableColumn<{ id: string; count: number }>[] = [
  { id: "id", header: "ID", rowHeader: true, cell: (row) => row.id },
  { id: "count", header: "件数", cell: (row) => row.count },
];
<DataTable
  label="記録"
  columns={tableColumns}
  rows={[{ id: "one", count: 1 }]}
  getRowKey={(row) => row.id}
  empty="記録なし"
/>;
<DataTable
  label="記録"
  columns={tableColumns}
  // @ts-expect-error 列定義と行データの型を一致させる。
  rows={[{ id: "one", count: "1" }]}
  getRowKey={(row) => row.id}
  empty="記録なし"
/>;
// @ts-expect-error 行データのキーを明示する。
<DataTable label="記録" columns={tableColumns} rows={[]} empty="記録なし" />;
<DataTable
  label="記録"
  columns={tableColumns}
  rows={[]}
  getRowKey={(row) => row.id}
  empty="記録なし"
  // @ts-expect-error 任意の寸法は公開しない。
  width="1000px"
/>;

<AvatarButton
  ref={createRef<HTMLButtonElement>()}
  name="参加者"
  label="編集"
  aria-describedby="profile-description"
  onClick={() => {}}
/>;

<FileButton label="画像" accept="image/*" onFile={(file) => void file.name} />;
<FileButton label="画像" accept="image/*" multiple onFiles={(files) => void files.length} />;
// @ts-expect-error 複数選択にはファイル一覧を受け取るハンドラーが必要。
<FileButton label="画像" accept="image/*" multiple onFile={(_file: File) => {}} />;
// @ts-expect-error 単一選択と複数選択のハンドラーは併用しない。
<FileButton
  label="画像"
  accept="image/*"
  multiple
  onFiles={(_files: File[]) => {}}
  onFile={(_file: File) => {}}
/>;
