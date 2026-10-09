import type { Meta, StoryObj } from "@storybook/react-vite";
import { ToastProvider } from "@animic/react/toast";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  useRouter,
  useLocation,
} from "@tanstack/react-router";
import { createContext, useContext, useState, type ReactNode } from "react";
import { PageTransitionProvider } from "../src/features/navigation/page-transition-provider";
import { writeBrowserState } from "./experiences/browser-store";
import { RoomPage } from "./experiences/room/room-page";
import type { LobbyModel } from "./experiences/room/room-presentation";
import { createPreviewRoom, participant } from "./experiences/room/room-preview-store";
import { initialResult, resultHistory } from "./experiences/battle/result-preview";
import { keepBattleResult } from "./experiences/battle/result-storage";
import { LoginPage } from "./experiences/account/login-page";
import { MyPage } from "./experiences/account/mypage-page";
import { MatchPage } from "./experiences/account/match-page";
import { historyFixtures } from "./experiences/account/history-fixtures";
import { saveAccount, saveHistory, keepPendingResult } from "./experiences/account/account-preview";
import { LegalPage } from "../src/features/legal/legal-page";
import { termsContent } from "../src/features/legal/terms-content";
import { privacyContent } from "../src/features/legal/privacy-content";

function ExperienceRoot() {
  const router = useRouter();
  return (
    <ToastProvider>
      <PageTransitionProvider>
        <div
          onClickCapture={(event) => {
            if (
              event.defaultPrevented ||
              event.button !== 0 ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            )
              return;
            const anchor = event.target instanceof Element ? event.target.closest("a") : null;
            const href = anchor?.getAttribute("href");
            if (!href?.startsWith("/") || href.startsWith("//") || anchor?.target === "_blank")
              return;
            event.preventDefault();
            void router.navigate({ href });
          }}
        >
          <Outlet />
        </div>
      </PageTransitionProvider>
    </ToastProvider>
  );
}
const ExperienceContent = createContext<ReactNode>(null);
const experienceRoot = createRootRoute({
  component: ExperienceRoot,
});
const experienceRoute = createRoute({
  getParentRoute: () => experienceRoot,
  path: "/",
  component: ExperienceScreen,
});
const accountRoute = createRoute({
  getParentRoute: () => experienceRoot,
  path: "/login",
  validateSearch: (search: Record<string, unknown>) => ({
    next: search.next === "login" || search.next === "save" ? search.next : "create",
    back:
      typeof search.back === "string" &&
      /^\/(?:mypage|match|rooms\/[A-Z0-9]{8})(?:\?[^#]*)?$/.test(search.back)
        ? search.back
        : "/",
  }),
  component: AccountScreen,
});
function AccountScreen() {
  const searchText = useLocation({ select: (location) => location.searchStr });
  const params = new URLSearchParams(searchText);
  const search = { next: params.get("next"), back: params.get("back") ?? "/" };
  return (
    <LoginPage
      intent={
        search.next === "login" || search.next === "save"
          ? { kind: search.next, returnTo: search.back }
          : { kind: "create" }
      }
    />
  );
}
const profileRoute = createRoute({
  getParentRoute: () => experienceRoot,
  path: "/mypage",
  component: MyPage,
});
const matchRoute = createRoute({
  getParentRoute: () => experienceRoot,
  path: "/match",
  validateSearch: (search: Record<string, unknown>) => ({
    key: typeof search.key === "string" ? search.key : "",
  }),
  component: MatchScreen,
});
function MatchScreen() {
  const search = useLocation({ select: (location) => location.searchStr });
  return <MatchPage entryKey={new URLSearchParams(search).get("key") ?? ""} />;
}
const roomRoute = createRoute({
  getParentRoute: () => experienceRoot,
  path: "/rooms/$code",
  component: RoomScreen,
});
function RoomScreen() {
  const pathname = useLocation({ select: (location) => location.pathname });
  return <RoomPage code={pathname.split("/").at(-1) ?? ""} />;
}
const termsRoute = createRoute({
  getParentRoute: () => experienceRoot,
  path: "/terms",
  component: TermsScreen,
});
function TermsScreen() {
  return <LegalPage document={termsContent} other="privacy" />;
}
const privacyRoute = createRoute({
  getParentRoute: () => experienceRoot,
  path: "/privacy",
  component: PrivacyScreen,
});
function PrivacyScreen() {
  return <LegalPage document={privacyContent} other="terms" />;
}
const experienceTree = experienceRoot.addChildren([
  experienceRoute,
  accountRoute,
  profileRoute,
  matchRoute,
  roomRoute,
  termsRoute,
  privacyRoute,
]);
function ExperienceScreen() {
  return useContext(ExperienceContent);
}
function ExperienceRouter({ children }: { children: ReactNode }) {
  const [router] = useState(() =>
    createRouter({
      routeTree: experienceTree,
      history: createMemoryHistory({ initialEntries: ["/"] }),
    }),
  );
  return (
    <ExperienceContent value={children}>
      <RouterProvider router={router} />
    </ExperienceContent>
  );
}

type Stage = "lobby" | "battle" | "judging" | "result";
function prepareExperience(stage: Stage, playerCount: number) {
  const room = createPreviewRoom("ねこぜ");
  const me = participant()!;
  const names = ["ぴよ丸", "ぴくせる侍", "プロンプト職人", "いろは", "すみれ", "あお", "こはく"];
  const members = [
    { ...me, ready: true },
    ...names
      .slice(0, playerCount - 1)
      .map((name, index) => ({ id: `visitor-${index}`, name, ready: true })),
  ];
  const model: LobbyModel = {
    code: room.code,
    hostId: me.id,
    isHost: true,
    countdown: null,
    rules: room.rules,
    players: members.map((member) => ({ ...member, isMe: member.id === me.id })),
  };
  const result = initialResult(model);
  writeBrowserState(`animic-experience-room:${room.code}`, {
    ...room,
    members,
    battle:
      stage === "lobby"
        ? null
        : {
            id: result.id,
            startedAt: Date.now(),
            rules: room.rules,
            members,
            finished: stage !== "battle",
          },
  });
  if (stage === "judging" || stage === "result") keepBattleResult(result, stage === "result");
  return { code: room.code, result };
}

const meta = {
  title: "Experiences/Application",
  parameters: {
    ownsMain: true,
    docs: {
      description: {
        component:
          "ログイン、戦績保存、複数人対戦、生成回数上限、詳細な採点内訳を持つ画面と演出の検討用です。ローカルの表示用状態で操作でき、公開アプリケーションのルートや対戦 API には接続しません。",
      },
    },
  },
  decorators: [
    (Story) => (
      <ExperienceRouter>
        <Story />
      </ExperienceRouter>
    ),
  ],
  render: (_args, { loaded }) => {
    const code: unknown = loaded.code;
    if (typeof code !== "string") throw new Error("ルームの表示用データがありません。");
    return <RoomPage code={code} />;
  },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Lobby: Story = { loaders: [() => prepareExperience("lobby", 4)] };
export const EightPlayers: Story = { loaders: [() => prepareExperience("lobby", 8)] };
export const Generating: Story = { loaders: [() => prepareExperience("battle", 4)] };
export const DetailedScoring: Story = { loaders: [() => prepareExperience("judging", 4)] };
export const Results: Story = { loaders: [() => prepareExperience("result", 4)] };

function resetAccount() {
  for (const key of Object.keys(localStorage)) {
    if (
      key.startsWith("animic-experience-account") ||
      key.startsWith("animic-experience-history:") ||
      key === "animic-experience-name"
    )
      localStorage.removeItem(key);
  }
  sessionStorage.removeItem("animic-experience-pending-result");
}
function prepareAccount() {
  resetAccount();
  saveAccount({ name: "ねこぜ", provider: "Google" });
  const now = Date.now();
  historyFixtures
    .map((entry, index) => ({
      ...entry,
      at: now - [2 * 3600000, 7 * 3600000, 86400000, 3 * 86400000, 5 * 86400000][index],
    }))
    .toReversed()
    .forEach(saveHistory);
  return {};
}
export const AccountLogin: Story = {
  loaders: [
    () => {
      resetAccount();
      return {};
    },
  ],
  render: () => <LoginPage intent={{ kind: "login", returnTo: "/mypage" }} />,
};
export const ResultSaving: Story = {
  loaders: [
    () => {
      resetAccount();
      const value = prepareExperience("result", 4);
      keepPendingResult(resultHistory(value.result, Date.now()));
      return value;
    },
  ],
  render: (_args, { loaded }) => {
    const code: unknown = loaded.code;
    if (typeof code !== "string") throw new Error("ルームの表示用データがありません。");
    return <LoginPage intent={{ kind: "save", returnTo: `/rooms/${code}` }} />;
  },
};
export const Profile: Story = { loaders: [prepareAccount], render: () => <MyPage /> };
export const MatchDetail: Story = {
  loaders: [prepareAccount],
  render: () => <MatchPage entryKey="s1" />,
};
