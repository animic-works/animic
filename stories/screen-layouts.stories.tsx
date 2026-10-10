import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Page } from "@animic/react/page";
import { AppFrame, AppFrameWideContent } from "@animic/react/app-frame";
import { FocusLayout, FocusLayoutBrand } from "@animic/react/focus-layout";
import { DocumentLayout } from "@animic/react/document-layout";
import { Workspace } from "@animic/react/workspace";
import { Comparison } from "@animic/react/comparison";
import { ComparisonStage } from "@animic/react/comparison-stage";
import {
  Article,
  ArticleSection,
  ArticleParagraph,
  ArticleList,
  ArticleTable,
  TableOfContents,
} from "@animic/react/article";
import { Footer } from "@animic/react/footer";
import { ActionBar } from "@animic/react/action-bar";
import { Avatar } from "@animic/react/avatar";
import { AvatarGroup } from "@animic/react/avatar-group";
import { ProviderButton } from "@animic/react/provider-button";
import { Button } from "@animic/react/button";
import { ButtonLink, Link } from "@animic/react/link";
import { Heading } from "@animic/react/heading";
import { Media, MediaPlaceholder } from "@animic/react/media";
import { Progress } from "@animic/react/progress";
import { Stack } from "@animic/react/stack";
import { Text } from "@animic/react/text";
import { Surface } from "@animic/react/surface";
import { Field } from "@animic/react/field";
import { Input } from "@animic/react/input";

const meta = { title: "Screen layouts", parameters: { ownsMain: true } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
const image =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='380'%3E%3Cpath fill='%2300b4fc' d='M0 0h260v380H0z'/%3E%3Ccircle fill='%23fddb13' cx='130' cy='150' r='65'/%3E%3C/svg%3E";
const members = ["あおい", "さくら", "長い表示名の参加者", "ひなた"].map((name, i) => ({
  id: String(i),
  name,
  detail: i ? "作業中" : "完了",
  current: i === 0,
  avatar: <Avatar name={name} size="compact" status={i ? "busy" : "complete"} />,
}));
export const Focus: Story = {
  render: () => (
    <Page>
      <FocusLayout
        back={
          <Link href="#" appearance="back">
            戻る
          </Link>
        }
        compactTitle="アカウント"
      >
        <Stack align="center">
          <FocusLayoutBrand>
            <Heading level={1} size="section">
              アカウント
            </Heading>
          </FocusLayoutBrand>
          <Surface appearance="card" padding="content">
            <Stack>
              <ProviderButton provider="google" icon={<span aria-hidden="true">G</span>}>
                Googleで続ける
              </ProviderButton>
              <ProviderButton provider="discord" icon={<span aria-hidden="true">D</span>}>
                Discordで続ける
              </ProviderButton>
              <ProviderButton provider="google" icon={<span aria-hidden="true">G</span>} loading>
                接続中
              </ProviderButton>
              <ProviderButton provider="discord" icon={<span aria-hidden="true">D</span>} disabled>
                利用できません
              </ProviderButton>
              <Text variant="caption">内容を確認してから続けてください。</Text>
            </Stack>
          </Surface>
        </Stack>
      </FocusLayout>
    </Page>
  ),
};
export const Document: Story = {
  render: () => (
    <Page>
      <DocumentLayout
        title="ご利用案内"
        back={
          <Link appearance="back" href="#">
            戻る
          </Link>
        }
        scrollToTop={<Link href="#top">先頭へ</Link>}
      >
        <Article
          title="ご利用案内"
          eyebrow={<Text variant="eyebrow">GUIDE</Text>}
          meta={<Text>更新日：2026年10月1日</Text>}
          footer={<Text>お問い合わせは窓口までお願いします。</Text>}
        >
          <TableOfContents
            items={[
              { id: "overview", title: "概要" },
              { id: "details", title: "詳細" },
            ]}
          />
          <ArticleSection id="overview" title="概要">
            <ArticleParagraph>
              見出しと本文を読みやすい幅に収め、内容が増えた場合は文書全体をスクロールします。
            </ArticleParagraph>
            <ArticleList items={["情報を確認する", "必要な操作を選ぶ"]} ordered />
          </ArticleSection>
          <ArticleSection id="details" title="詳細">
            <ArticleTable
              rows={[
                { label: "表示", value: "画面幅に応じて配置します。" },
                { label: "操作", value: "キーボードでも移動できます。" },
              ]}
            />
          </ArticleSection>
        </Article>
        <Footer>
          <Text variant="caption">© Animic</Text>
        </Footer>
      </DocumentLayout>
    </Page>
  ),
};
export const Frame: Story = {
  render: () => (
    <Page>
      <AppFrame
        brand={<Link href="#">Animic</Link>}
        context={<Text>作品一覧</Text>}
        actions={<Button size="sm">設定</Button>}
        width="reading"
        bottomAction
        footer={
          <ActionBar summary={<Text>選択済み 2件</Text>} tone="success">
            <Button size="lg" shape="pill">
              続ける
            </Button>
          </ActionBar>
        }
      >
        <Stack>
          <Heading level={1} size="section">
            作品を選ぶ
          </Heading>
          <Text>本文の幅と、幅いっぱいの内容を組み合わせます。</Text>
          <AppFrameWideContent>
            <Surface appearance="tinted" padding="content">
              <Text>広い内容領域</Text>
            </Surface>
          </AppFrameWideContent>
          <ButtonLink href="#" size="lg" shape="pill" prominence="raised">
            詳細へ
          </ButtonLink>
        </Stack>
      </AppFrame>
    </Page>
  ),
};
function WorkspaceExample() {
  const [expanded, setExpanded] = useState(true);
  return (
    <Page>
      <Workspace
        headerStart={<Text variant="label">Animic</Text>}
        headerDetail={<Text>編集画面</Text>}
        headerCenter={<Text variant="numeric">1:20</Text>}
        headerEnd={<AvatarGroup label="参加者" members={members} />}
        progress={
          <Progress value={75} label="残り時間" tone="gradient" presentation="track" striped />
        }
        editorLabel="編集"
        expanded={expanded}
        onExpandedChange={setExpanded}
        collapsedEditor={<Text>編集を開く</Text>}
        editor={
          <Stack>
            <Heading level={1} size="panel">
              編集
            </Heading>
            <Field label="説明">
              <Input placeholder="内容を入力" />
            </Field>
            <Text>内容は表示領域に応じて折り返します。</Text>
            <Button>反映する</Button>
          </Stack>
        }
      >
        <Comparison
          first={<Media src={image} alt="比較元" aspect="portrait" />}
          second={
            <MediaPlaceholder label="編集結果" description="ここに表示されます">
              <Text>準備中</Text>
            </MediaPlaceholder>
          }
          firstCaption={<Text>比較元</Text>}
          secondCaption={<Text>編集結果</Text>}
          description={<Text variant="caption">画像の比率を保ちます。</Text>}
          history={<Text>履歴はまだありません</Text>}
          historyHeading={
            <Heading level={2} size="sm">
              履歴
            </Heading>
          }
          actions={<Button disabled>決定する</Button>}
        />
      </Workspace>
    </Page>
  );
}
export const Editing: Story = { render: () => <WorkspaceExample /> };
export const Comparing: Story = {
  render: () => (
    <Page>
      <AppFrame brand={<Text>Animic</Text>} width="full">
        <Stack>
          <ComparisonStage
            first={<Media src={image} alt="比較元" aspect="portrait" />}
            second={<Media src={image} alt="比較先" aspect="portrait" />}
          >
            <Surface appearance="card" padding="content">
              <Stack>
                <Heading level={1} size="panel">
                  比較する
                </Heading>
                <Progress label="解析" value={45} />
                <Text>左右の画像と説明を一緒に表示します。</Text>
              </Stack>
            </Surface>
          </ComparisonStage>
          <AvatarGroup
            label="進行状況"
            presentation="expanded"
            members={members.map((member, i) => ({
              ...member,
              state: i === 0 ? "complete" : i === 1 ? "active" : "pending",
              value: i === 0 ? "98.5" : undefined,
            }))}
          />
        </Stack>
      </AppFrame>
    </Page>
  ),
};
