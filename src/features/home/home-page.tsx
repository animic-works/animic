import { useSectionNavigation } from "./use-section-navigation";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { getCurrentParticipant } from "../../lib/auth.functions";
import { LoginDialog } from "../room/login-dialog";
import { Button } from "@animic/react/button";
import { ActionGroup } from "@animic/react/action-group";
import { SectionNavigation } from "@animic/react/section-navigation";
import { Heading } from "@animic/react/heading";
import { Link } from "@animic/react/link";
import { NavigationBar, NavigationBarLabel } from "@animic/react/navigation-bar";
import { Page } from "@animic/react/page";
import { Section } from "@animic/react/section";
import { Layer, LayerItem } from "@animic/react/layer";
import { Stack } from "@animic/react/stack";
import { Lead } from "@animic/react/lead";
import { usePageTransition } from "../navigation/page-transition-provider";
import { AccountIcon } from "../shared/icons";
import { steps } from "./home-content";
import { matches } from "./home-samples";
import { Gallery, HowToPlay, Scoring } from "./home-sections";
import { JoinRoomDialog } from "./join-room-dialog";
import { StartIcon, JoinIcon, ActionStartIcon, ActionJoinIcon, ArrowIcon } from "./home-icons";
import {
  HeroArtwork,
  HeroBackdrop,
  PageBackdrop,
  HeroTitle,
  HeroTitleFontScript,
  Logo,
} from "./visuals/home-artwork";

const sections = [
  { id: "top", label: "ホーム" },
  { id: "how", label: "遊び方" },
  { id: "score", label: "採点方法" },
  { id: "gallery", label: "ギャラリー" },
] as const;

const sectionIds = sections.map((section) => section.id);

export function HomePage() {
  const { navigate } = usePageTransition();
  const { current: activeSection, navigate: scrollToSection } = useSectionNavigation(sectionIds);
  const [stepIndex, setStepIndex] = useState(0);
  const [matchIndex, setMatchIndex] = useState(0);
  const [joinOpen, setJoinOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginPurpose, setLoginPurpose] = useState<"start" | "mypage">("start");
  const [checkingLogin, setCheckingLogin] = useState(false);
  const starting = useRef(false);
  async function start() {
    if (starting.current) return;
    starting.current = true;
    setCheckingLogin(true);
    try {
      const participant = await getCurrentParticipant().catch(() => undefined);
      if (participant !== undefined && !participant?.account) {
        setLoginPurpose("start");
        setLoginOpen(true);
      } else navigate("/start");
    } finally {
      starting.current = false;
      setCheckingLogin(false);
    }
  }
  // ログインしていなければ、マイページへ移る前にログインを求める。
  async function openMypage(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    if (starting.current) return;
    starting.current = true;
    try {
      const participant = await getCurrentParticipant().catch(() => undefined);
      if (participant !== undefined && !participant?.account) {
        setLoginPurpose("mypage");
        setLoginOpen(true);
      } else navigate("/mypage");
    } finally {
      starting.current = false;
    }
  }
  const [joinVisit, setJoinVisit] = useState(0);
  function openJoin() {
    if (starting.current) return;
    setJoinVisit((visit) => visit + 1);
    setJoinOpen(true);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        joinOpen ||
        loginOpen ||
        (event.target instanceof Element &&
          event.target.closest(
            'button, a, input, textarea, select, [contenteditable=true], [role="dialog"]',
          ))
      )
        return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const direction = event.key === "ArrowLeft" ? -1 : 1;
      if (activeSection === "how") {
        event.preventDefault();
        setStepIndex((index) => (index + direction + steps.length) % steps.length);
      } else if (activeSection === "gallery") {
        event.preventDefault();
        setMatchIndex((index) => (index + direction + matches.length) % matches.length);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeSection, joinOpen, loginOpen]);

  return (
    <Page scroll="sections" decoration={<PageBackdrop />}>
      <HeroTitleFontScript />
      <NavigationBar
        label="メインメニュー"
        brandHidden={activeSection === "top"}
        compactHidden={activeSection === "top"}
        brand={
          <Link
            appearance="navigation"
            href="/"
            aria-label="ホーム"
            onClick={(event) => {
              if (
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              )
                return;
              event.preventDefault();
              scrollToSection("top");
            }}
          >
            <Logo size="navigation" />
          </Link>
        }

        primaryActions={
          <>
            <Button
              size="nav"
              shape="pill"
              prominence="lifted"
              appearance="primary"
              feedback="press"
              loading={checkingLogin}
              onClick={() => void start()}
            >
              <StartIcon />
              スタート
            </Button>
            <Button
              size="nav"
              shape="pill"
              appearance="secondary"
              aria-label="ルームに参加"
              compactLabel="参加"
              leadingIcon={<JoinIcon />}
              loading={checkingLogin}
              onClick={openJoin}
            >
              ルームに参加
            </Button>
          </>
        }
        actions={
          <Link
            appearance="subtle"
            href="/mypage"
            aria-label="マイページ"
            onClick={(event) => void openMypage(event)}
          >
            <AccountIcon />
            <NavigationBarLabel>マイページ</NavigationBarLabel>
          </Link>
        }
      >
        {sections.map((section) => (
          <Link
            key={section.id}
            appearance="navigation"
            href={section.id === "top" ? "/" : `#${section.id}`}
            aria-current={activeSection === section.id ? "location" : undefined}
            onClick={(event) => {
              if (
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              )
                return;
              event.preventDefault();
              scrollToSection(section.id);
            }}
          >
            {section.label}
          </Link>
        ))}
      </NavigationBar>
      <SectionNavigation
        label="ページ内の移動"
        items={sections.map((section) => ({
          ...section,
          href: section.id === "top" ? "/" : `#${section.id}`,
        }))}
        current={activeSection}
        onNavigate={scrollToSection}
      />
      <main>
        <Section
          id="top"
          aria-label="ホーム"
          align="stretch"
          inset="navigation-wide"
          decoration={<HeroBackdrop />}
          navigation={
            <Link
              appearance="scroll"
              href="#how"
              onClick={(event) => {
                if (
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return;
                event.preventDefault();
                scrollToSection("how");
              }}
            >
              SCROLL
            </Link>
          }
        >
          <Layer layout="adaptive">
            <LayerItem placement="content">
              <Heading level={1} size="display">
                <Logo />
              </Heading>
            </LayerItem>
            <LayerItem placement="artwork">
              <HeroArtwork />
            </LayerItem>
            <LayerItem placement="content">
              <Stack space="section">
                <HeroTitle />
                <Lead
                  conclusion={
                    <>
                      より近い1枚を<mark>作ったほうが勝ち！</mark>
                    </>
                  }
                >
                  <span>お題のイラストを、</span>
                  <span>
                    <strong>プロンプトだけで</strong>
                  </span>
                  <span>AIに再現させよう。</span>
                </Lead>
                <ActionGroup layout="adaptive">
                  <Button
                    appearance="primary"
                    size="hero"
                    shape="pill"
                    prominence="raised"
                    leadingIcon={<ActionStartIcon />}
                    trailingIcon={<ArrowIcon />}
                    feedback="press"
                    loading={checkingLogin}
                    onClick={() => void start()}
                  >
                    スタート
                  </Button>
                  <Button
                    appearance="secondary"
                    size="hero"
                    shape="pill"
                    leadingIcon={<ActionJoinIcon />}
                    trailingIcon={<ArrowIcon />}
                    loading={checkingLogin}
                    onClick={openJoin}
                  >
                    ルームに参加する
                  </Button>
                </ActionGroup>
              </Stack>
            </LayerItem>
          </Layer>
        </Section>
        <HowToPlay index={stepIndex} onIndexChange={setStepIndex} />
        <Scoring />
        <Gallery index={matchIndex} onIndexChange={setMatchIndex} />
      </main>
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} purpose={loginPurpose} />
      <JoinRoomDialog
        key={joinVisit}
        open={joinOpen}
        onOpenChange={setJoinOpen}
        onNavigate={navigate}
      />
    </Page>
  );
}
