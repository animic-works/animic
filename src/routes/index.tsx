import { Button } from "@animic/react/button";
import { CodeInput, CODE_LENGTH } from "@animic/react/code";
import { Dialog, DialogClose } from "@animic/react/dialog";
import { Icon } from "@animic/react/icon";
import { GalleryCarousel, GallerySection, SiteFooter } from "@animic/react/landing/gallery";
import { Hero } from "@animic/react/landing/hero";
import { AppBar, CornerLogo, LandingNav, NavCta, NavLogin, Pager } from "@animic/react/landing/nav";
import {
  ScoreCardBody,
  ScoreCardItem,
  ScoreCardList,
  ScoreHead,
  ScoreSection,
  ScoreTotal,
} from "@animic/react/landing/score-cards";
import { LandingScreen, Reveal, SectionHead } from "@animic/react/landing/screen";
import { StepCarousel, StepSection } from "@animic/react/landing/step-carousel";
import type { GalleryHandle, GalleryMatch } from "@animic/react/landing/gallery";
import type { ScoreCard } from "@animic/react/landing/score-cards";
import type { Step, StepCarouselHandle } from "@animic/react/landing/step-carousel";
import { toast } from "@animic/react/toast";
import { useWipe } from "@animic/react/transition";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, MouseEvent } from "react";

const DESCRIPTION =
  "お題のイラストを、プロンプトだけでAIに再現させよう。より近い1枚を作ったほうが勝ち！ 友だちと2人で遊べる画像生成の対戦ゲームです。";

// JavaScriptが動く場合は読み込み時に html へ属性を付け、CSSの条件（scrolling）を切り替える
const MODE_SCRIPT =
  '(function(){try{document.documentElement.setAttribute("data-scroll","")}catch(e){}})()';

export const Route = createFileRoute("/")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://animic.party/" }],
    scripts: [{ children: MODE_SCRIPT }],
    meta: [
      { name: "description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Animic" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:site_name", content: "Animic" },
      { property: "og:locale", content: "ja_JP" },
      { property: "og:url", content: "https://animic.party/" },
      { property: "og:image", content: "https://animic.party/og-image.png" },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Animic" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Animic" },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: "https://animic.party/og-image.png" },
      { name: "twitter:image:alt", content: "Animic" },
    ],
  }),
  component: Home,
});

const SCREENS = [
  { id: "top", label: "ホーム" },
  { id: "how", label: "遊び方" },
  { id: "score", label: "採点方法" },
  { id: "gallery", label: "ギャラリー" },
] as const;
const STEPS: Step[] = [
  {
    title: "ルームに集まる",
    description:
      "「スタート」でルームを作って、相手を招待できます。ルーム作成画面で難易度と制限時間を設定することができます。",
    image: { src: "/how-step-1.webp", width: 1600, height: 1095 },
    tint: "cyan",
  },
  {
    title: "お題が公開される",
    description: "ゲームを開始すると、難易度に応じてお題のイラストが公開されます。",
    icon: "image",
    tint: "pink",
  },
  {
    title: "プロンプトで生成",
    description:
      "日本語の文章でOK。よく使う表現は選択肢から、慣れたらDanbooruタグでも。時間内なら何度でも生成できます。",
    icon: "prompt",
    tint: "yellow",
  },
  {
    title: "1枚を提出して勝負",
    description:
      "生成した中からいちばん似ている1枚を提出。AIが採点して、最終スコアの高いほうが勝ちです。",
    icon: "trophy",
    tint: "cyan",
  },
];
const SCORE_CARDS: ScoreCard[] = [
  {
    title: "再現度",
    description: "お題にどれだけ近いかをAIが評価します。スコアのいちばん大きな要素です。",
    icon: "target",
    tint: "pink",
  },
  {
    title: "提出速度",
    description: "制限時間内に早く提出するほど加点されます。時間切れ後の提出は加点なし。",
    icon: "stopwatch",
    tint: "cyan",
  },
  {
    title: "生成回数",
    description: "提出までに成功した生成の回数。少ない回数で仕上げるほど有利です。",
    icon: "refresh",
    tint: "yellow",
  },
];
// ギャラリーの対戦（画像と対戦結果はモック）
const MATCHES: GalleryMatch[] = [
  { level: "かんたん", rule: "背景なし・1キャラクター", similarity: 92, tints: ["cyan", "pink"] },
  { level: "ふつう", rule: "背景あり・1キャラクター", similarity: 85, tints: ["yellow", "cyan"] },
  {
    level: "むずかしい",
    rule: "背景あり・2キャラクター",
    similarity: 78,
    tints: ["pink", "yellow"],
  },
  { level: "かんたん", rule: "背景なし・1キャラクター", similarity: 88, tints: ["green", "pink"] },
  { level: "ふつう", rule: "背景あり・1キャラクター", similarity: 81, tints: ["purple", "cyan"] },
];

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
// ログインは任意。ログインの機能は未決定のため、準備中であることを知らせる（docs/architecture.md）
const login = () => toast("ログインは準備中です");
// 中身が現れる順番
const DELAYS = ["0", "1", "2", "3", "4", "5"] as const;
const indexOfScreen = (id: string) => SCREENS.findIndex((screen) => screen.id === id);

// トップ: ホーム・遊び方・採点方法・ギャラリーを縦に並べ、スクロールすると画面ごとに吸い付く。
// 画面の中央にあるセクションを「表示中」として、ヘッダーの下線・右端の位置・左上のロゴ・スマホの上のバーを合わせる
function Home() {
  const navigate = useNavigate();
  const wipe = useWipe();
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState<ReadonlySet<number>>(new Set([0]));
  const [joinOpen, setJoinOpen] = useState(false);
  const [code, setCode] = useState("");
  const [pressed, setPressed] = useState<"start" | "join" | null>(null);
  const screens = useRef<(HTMLElement | null)[]>([]);
  const carousel = useRef<StepCarouselHandle>(null);
  const galleryCarousel = useRef<GalleryHandle>(null);
  // リンクからの移動中はスクロール位置の監視による更新を止める（この時刻まで）
  const scrollingUntil = useRef(0);
  // 入力の処理は最新の状態を参照する（リスナーを張り直さない）
  const latest = useRef({ current, busy: false });
  useEffect(() => {
    latest.current = { current, busy: joinOpen || wipe.active };
  });

  const render = useCallback((index: number) => {
    setCurrent(index);
    const screen = SCREENS[index];
    // 開いた直後のホームにはURLの # を付けない（ほかの画面から戻ったときは #top にする）
    if (screen && (index > 0 || location.hash)) history.replaceState(null, "", `#${screen.id}`);
  }, []);

  // 表示中にしてから該当のセクションまでスクロールする。
  // 途中で通り過ぎるセクションに表示中が移らないよう、しばらく監視による更新を止める
  const go = useCallback(
    (target: number) => {
      const index = Math.max(0, Math.min(SCREENS.length - 1, target));
      render(index);
      scrollingUntil.current = Date.now() + 1200;
      screens.current[index]?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" });
    },
    [render],
  );

  // 読み込み時: URLの # に対応する画面から始める
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const startIndex = Math.max(0, indexOfScreen(location.hash.slice(1)));
      render(startIndex);
      if (startIndex > 0) {
        scrollingUntil.current = Date.now() + 1200;
        screens.current[startIndex]?.scrollIntoView();
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [render]);

  // 遊び方・ギャラリーでは左右キーでカードを送る。それ以外のキーはブラウザ本来のスクロールに任せる
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (latest.current.busy || target?.closest("input, textarea, select")) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const dir = event.key === "ArrowLeft" ? -1 : 1;
      const id = SCREENS[latest.current.current]?.id;
      if (id === "how") {
        event.preventDefault();
        carousel.current?.slide(dir);
      } else if (id === "gallery") {
        event.preventDefault();
        galleryCarousel.current?.slide(dir);
      }
    };
    addEventListener("keydown", onKeyDown);
    return () => removeEventListener("keydown", onKeyDown);
  }, []);

  // 画面の中央にあるセクションを「表示中」とし、画面に入った（通り過ぎた）セクションの中身を出す
  useEffect(() => {
    const centered = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting || Date.now() < scrollingUntil.current) return;
          const index = screens.current.findIndex((el) => el === entry.target);
          if (index >= 0) render(index);
        }),
      { rootMargin: "-45% 0px -45% 0px" },
    );
    const reveal = () => {
      setRevealed((previous) => {
        const next = new Set(previous);
        screens.current.forEach((el, index) => {
          if (el && el.getBoundingClientRect().top < innerHeight * 0.85) next.add(index);
        });
        return next.size === previous.size ? previous : next;
      });
    };
    addEventListener("scroll", reveal, { passive: true });
    addEventListener("resize", reveal);
    const frame = requestAnimationFrame(reveal);
    screens.current.forEach((el) => el && centered.observe(el));
    return () => {
      cancelAnimationFrame(frame);
      centered.disconnect();
      removeEventListener("scroll", reveal);
      removeEventListener("resize", reveal);
    };
  }, [render]);

  const currentScreen = SCREENS[current] ?? SCREENS[0];
  const isActive = (index: number) => revealed.has(index) || index === current;
  const jumpTo = (id: string) => go(indexOfScreen(id));
  const home = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    jumpTo("top");
  };

  function openJoin() {
    setCode("");
    setJoinOpen(true);
  }
  function start() {
    setPressed("start");
    void wipe.wipeTo(() => navigate({ to: "/rooms/new" })).finally(() => setPressed(null));
  }
  function submitJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.length !== CODE_LENGTH) return;
    setJoinOpen(false);
    setPressed("join");
    void wipe
      .wipeTo(() => navigate({ to: "/rooms/$code", params: { code } }))
      .finally(() => setPressed(null));
  }

  return (
    <>
      <LandingNav
        items={SCREENS.map((screen) => ({ id: screen.id, label: screen.label }))}
        currentId={currentScreen.id}
        onSelect={jumpTo}
        actions={
          <>
            <NavCta
              kind="start"
              href="/rooms/new"
              icon={<Icon name="play" size="xs" />}
              onClick={(event) => {
                event.preventDefault();
                start();
              }}
            >
              スタート
            </NavCta>
            <NavCta
              kind="join"
              href="#join"
              icon={<Icon name="enter" size="md" />}
              onClick={(event) => {
                event.preventDefault();
                openJoin();
              }}
            >
              ルームに参加
            </NavCta>
          </>
        }
        account={<NavLogin onClick={login} />}
      />
      <CornerLogo
        src="/animic-logo.svg"
        href="#top"
        shown={currentScreen.id !== "top"}
        onClick={home}
      />
      <Pager labels={SCREENS.map((screen) => screen.label)} current={current} onSelect={go} />
      <AppBar
        logoSrc="/animic-logo.svg"
        shown={currentScreen.id !== "top"}
        onHome={home}
        onStart={start}
        onJoin={openJoin}
        account={<NavLogin compact onClick={login} />}
      />

      <main>
        <LandingScreen
          ref={(el) => {
            screens.current[0] = el;
          }}
          id="top"
          kind="hero"
          active={isActive(0)}
          aria-label="ホーム"
        >
          <Hero
            logoSrc="/animic-logo.svg"
            characterSrc="/hero-character.webp"
            title={
              <>
                <span>
                  その<b>一枚</b>に、
                </span>
                <span>
                  どこまで<em>近づける</em>？
                </span>
              </>
            }
            lead={
              <>
                <span>お題のイラストを、</span>
                <span>プロンプトだけで</span>
                <span>AIに再現させよう。</span>
                <br />
                <span>より近い1枚を</span>
                <span>作ったほうが勝ち！</span>
              </>
            }
            onStart={start}
            onJoin={openJoin}
            onNext={() => go(current + 1)}
            pressed={pressed}
          />
        </LandingScreen>

        <LandingScreen
          ref={(el) => {
            screens.current[1] = el;
          }}
          id="how"
          kind="how"
          active={isActive(1)}
          aria-labelledby="how-title"
        >
          <StepSection>
            <StepCarousel
              ref={carousel}
              steps={STEPS}
              titleId="how-title"
              head={
                <Reveal delay="0">
                  <SectionHead eyebrow="HOW TO PLAY" title="遊び方" titleId="how-title" />
                </Reveal>
              }
            />
          </StepSection>
        </LandingScreen>

        <LandingScreen
          ref={(el) => {
            screens.current[2] = el;
          }}
          id="score"
          kind="score"
          active={isActive(2)}
          aria-labelledby="score-title"
        >
          <ScoreSection>
            <ScoreHead>
              <Reveal delay="0">
                <SectionHead
                  eyebrow="SCORE"
                  title="採点方法"
                  titleId="score-title"
                  description="3つの要素を合わせた最終スコアで勝敗が決まります。"
                />
              </Reveal>
            </ScoreHead>
            <ScoreCardList>
              {SCORE_CARDS.map((card, index) => (
                <ScoreCardItem key={card.title} card={card}>
                  <Reveal delay={DELAYS[index + 1]}>
                    <ScoreCardBody card={card} />
                  </Reveal>
                </ScoreCardItem>
              ))}
            </ScoreCardList>
            <Reveal delay="4">
              <ScoreTotal terms={["再現度", "提出速度", "生成回数"]} result="最終スコア" />
            </Reveal>
          </ScoreSection>
        </LandingScreen>

        <LandingScreen
          ref={(el) => {
            screens.current[3] = el;
          }}
          id="gallery"
          kind="gallery"
          active={isActive(3)}
          aria-labelledby="gallery-title"
        >
          <GallerySection>
            <GalleryCarousel
              ref={galleryCarousel}
              matches={MATCHES}
              head={
                <Reveal delay="0">
                  <SectionHead
                    eyebrow="GALLERY"
                    title="ギャラリー"
                    titleId="gallery-title"
                    description="みんなの対戦をのぞいてみよう。お題と提出された1枚を並べて見られます。"
                  />
                </Reveal>
              }
            />
            <SiteFooter
              logoSrc="/animic-logo.svg"
              links={[
                { href: "/terms", label: "利用規約" },
                { href: "/privacy", label: "プライバシーポリシー" },
              ]}
              copyright="© 2026 Animic"
            />
          </GallerySection>
        </LandingScreen>
      </main>

      <Dialog
        open={joinOpen}
        onOpenChange={setJoinOpen}
        density="compact"
        title="ルームに参加"
        description="英数字8文字のルームコードを入力してください"
        footer={
          <>
            <DialogClose>
              <Button variant="secondary" size="md">
                やめる
              </Button>
            </DialogClose>
            <Button type="submit" form="join-form" size="md" disabled={code.length !== CODE_LENGTH}>
              参加する
            </Button>
          </>
        }
      >
        <form id="join-form" onSubmit={submitJoin} noValidate>
          <CodeInput value={code} onValueChange={setCode} autoFocus />
        </form>
      </Dialog>
    </>
  );
}
