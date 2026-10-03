import type { Meta, StoryObj } from "@storybook/react-vite";

import { BackLink, DocList, DocPage, DocParagraph, DocTable, PageDeco } from "./page";

const meta = { title: "Screens/DocPage", parameters: { layout: "fullscreen" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

// 規約・ポリシーなどの文書ページ
export const Terms: Story = {
  render: () => (
    <>
      <PageDeco variant="terms" />
      <BackLink href="#top">戻る</BackLink>
      <DocPage
        eyebrow="TERMS OF SERVICE"
        title="利用規約"
        meta="制定日：2026年9月23日"
        draftNote="この文面はデザイン確認用の仮のものです。公開前に内容の確認が必要です。"
        intro={
          <DocParagraph>
            この利用規約（以下「本規約」）は、本サービスの利用条件を定めるものです。
          </DocParagraph>
        }
        sections={[
          {
            id: "t1",
            title: "第1条（適用）",
            body: (
              <DocParagraph>
                本規約は、ユーザーと運営との間の本サービスの利用に関わるすべての関係に適用されます。
              </DocParagraph>
            ),
          },
          {
            id: "t2",
            title: "第2条（アカウントとゲスト利用）",
            body: (
              <DocList
                ordered
                items={[
                  "ログインするか、ゲストとして利用できます。",
                  "表示名に他人の氏名・商標を使用してはなりません。",
                ]}
              />
            ),
          },
          {
            id: "t3",
            title: "取得する情報",
            body: (
              <DocTable
                rows={[
                  ["ログインした場合", "ユーザーID、アカウント名、プロフィール画像"],
                  ["ゲストの場合", "端末ごとに発行する匿名の識別子"],
                ]}
              />
            ),
          },
        ]}
        footLink={{ href: "#privacy", label: "プライバシーポリシーを見る →" }}
        footNote="Animic運営"
        showToTop
        onToTop={() => {}}
        onBack={() => {}}
      />
    </>
  ),
};
