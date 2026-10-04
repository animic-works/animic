import { Heading } from "@animic/react/heading";
import { Text } from "@animic/react/text";
import { Surface } from "@animic/react/surface";
import { Stack } from "@animic/react/stack";
import { Container } from "@animic/react/container";
import { Grid } from "@animic/react/grid";
import { Split } from "@animic/react/split";
import { Button } from "@animic/react/button";
import { Dialog } from "@animic/react/dialog";
import { grid, stack } from "@animic/styled-system/patterns";

<Heading level={1} size="display">
  表示
</Heading>;
<Text as="p" variant="body.prose" tone="muted">
  説明
</Text>;
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
// @ts-expect-error presentationは承認した2種類だけ。
<Dialog open onOpenChange={() => {}} title="確認" presentation="bottom">
  内容
</Dialog>;
