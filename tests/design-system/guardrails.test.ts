import { readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";
import { inspectSource } from "../../scripts/design-guardrails.mjs";

describe("Design Systemの利用境界", () => {
  it.each([
    'import { css } from "@animic/styled-system/css";',
    'export { Dialog } from "@ark-ui/react/dialog";',
    'const unsafe = import("@pandacss/dev");',
    'import { button } from "../../packages/design-system/src/recipes/button";',
    'import "./screen.css";',
    'const screen = <Button style={{color:"red"}}/>;',
    'const screen = <Button className="override"/>;',
    "const screen = <Button {...props}/>;",
    "const screen = <button>独自Control</button>;",
  ])("通常UIの迂回経路を拒否する: %s", (source) => {
    expect(inspectSource("src/routes/example.tsx", source).length).toBeGreaterThan(0);
  });
  it("public Componentの組み合わせを許可する", () => {
    expect(
      inspectSource(
        "src/features/example/view.tsx",
        'import { Button } from "@animic/react/button"; const screen = <Button size="sm">保存</Button>;',
      ),
    ).toEqual([]);
  });
  it.each([
    'import { Input, type InputProps } from "@animic/react/input"; export function View(inputProps: InputProps) { return <Input {...inputProps}/>; }',
    'import { Input } from "@animic/react/input"; const inputProps = { name: "name", disabled: true }; const view = <Input {...inputProps}/>;',
    'import { Surface as Panel, type SurfaceProps } from "@animic/react/surface"; export function View(props: SurfaceProps) { return <Panel {...props}/>; }',
    'import { Input, type InputProps } from "@animic/react/input"; export function View(props: InputProps) { const { disabled, ...rest } = props; return <Input {...rest} disabled={disabled}/>; }',
  ])("閉じたprops型のcompositionを許可する: %s", (source) => {
    expect(inspectSource("src/features/example/view.tsx", source)).toEqual([]);
  });
  it.each([
    'const props = { name: "name", className: "override" }; const view = <Input {...props}/>;',
    '<Input {...{ name: "name", className: "override" }}/>;',
    '<Input {...({ style: { color: "red" } })}/>;',

    'const props = { style: { color: "red" } }; const view = <Input {...props}/>;',
    'const props = { css: { color: "red" } }; const view = <Input {...props}/>;',
    "export function View(props: any) { return <Input {...props}/>; }",
    "export function View(props: Record<string, unknown>) { return <Input {...props}/>; }",
    "export function View(props: { name: string } | { className: string }) { return <Input {...props}/>; }",
    "export function View<T extends { name: string }>(props: T) { return <Input {...props}/>; }",
    'import { Surface, type SurfaceProps } from "@animic/react/surface"; export function View(props: SurfaceProps & { style: object }) { return <Surface {...props}/>; }',
  ])("Stylingを含むspread・keyを確定できないspreadを拒否する: %s", (source) => {
    expect(inspectSource("src/features/example/view.tsx", source).length).toBeGreaterThan(0);
  });
  it("Surfaceが所有するpadding variantをCSS propertyと混同しない", () => {
    expect(
      inspectSource(
        "src/features/example/view.tsx",
        'import { Surface as Panel } from "@animic/react/surface"; const screen = <Panel padding="compact"/>;',
      ),
    ).toEqual([]);
    expect(
      inspectSource("src/features/example/view.tsx", 'const screen = <div padding="compact"/>;')
        .length,
    ).toBeGreaterThan(0);
  });
  it("Visualのgeometryだけを許可する", () => {
    expect(
      inspectSource(
        "src/features/example/visuals/effect.tsx",
        'import { css } from "@animic/styled-system/css"; const effect = css({top:"[-5px]",transform:"rotate(12deg)",opacity:0.5,_motionReduce:{transform:"none"}});',
      ),
    ).toEqual([]);
  });
  it.each([
    'import { css } from "@pandacss/dev";',
    'import { Dialog } from "@ark-ui/react/dialog";',
    'import { css } from "@animic/styled-system/css"; css({color:"accent.primary"});',
    'import { css } from "@animic/styled-system/css"; css({padding:"5"});',
    'import { css } from "@animic/styled-system/css"; css({...arbitrary});',
    "const control=<input/>;",
    'import { css as draw } from "@animic/styled-system/css"; draw({display:"flex"});',
    'export { css } from "@animic/styled-system/css";',
    'import { cva } from "@animic/styled-system/css";',
    'import { css } from "@animic/styled-system/css"; css({top:"-5"});',
    'import { css } from "@animic/styled-system/css"; css({inset:-5});',
    'import { css } from "@animic/styled-system/css"; css({transform:"translateX(token(spacing.-5))"});',
    'import { css } from "@animic/styled-system/css"; css({top:"var(--animic-spacing--5)"});',
    'import { css } from "@animic/styled-system/css"; const value="-5"; css({top:value});',
    'import { token } from "@animic/styled-system/tokens";',
  ])("Visualで通常UIを実装できない: %s", (source) => {
    expect(inspectSource("src/features/example/visuals/effect.tsx", source).length).toBeGreaterThan(
      0,
    );
  });
  it.each([
    '<style>{"div { color: red; }"}</style>',
    '<link rel="stylesheet" href="/custom.css"/>',
    '<link rel={"alternate stylesheet"} href="/custom.css"/>',
    '<link rel={unknownRel} href="/custom.css"/>',
    '<link {...{ rel: "stylesheet", href: "/custom.css" }}/> ',
  ])("stylesheet要素の迂回を拒否する: %s", (source) => {
    expect(inspectSource("src/features/example/view.tsx", source).length).toBeGreaterThan(0);
  });
  it.each([
    '<link rel="icon" href="/favicon.ico"/>',
    '<link rel={"preload"} as="font" href="/font.woff2"/>',
    'const props = { href: "/favicon.ico" }; const view = <link {...props} rel="icon"/>;',
    '<link {...{ href: "/favicon.ico" }} rel="icon"/>',
  ])("stylesheet以外のlinkは許可する: %s", (source) => {
    expect(inspectSource("src/features/example/view.tsx", source)).toEqual([]);
  });
  it("型・Panda・browserで利用する同じVisual Storyを検査する", () => {
    const source = readFileSync(
      new URL("../../stories/visuals.stories.tsx", import.meta.url),
      "utf8",
    );
    expect(inspectSource("src/features/example/visuals/effect.tsx", source)).toEqual([]);
  });
  it.each([
    'const view = <div className={css({top:"[-5px]"})}/>;',
    'const art = css({top:"[-5px]"}); const view = <div className={art}/>;',
  ])("cssの直接利用・単純なconstを許可する: %s", (source) => {
    expect(
      inspectSource(
        "src/features/example/visuals/effect.tsx",
        'import {css} from "@animic/styled-system/css";' + source,
      ),
    ).toEqual([]);
  });
  it("importのlocal renameは直接確認する", () => {
    expect(
      inspectSource(
        "src/features/example/visuals/effect.tsx",
        'import {css as draw, keyframes as frames} from "@animic/styled-system/css"; const fade=frames({from:{opacity:0},to:{opacity:1}}); const art=draw({animationName:`[${fade}]`}); const view=<div className={art}/>;',
      ),
    ).toEqual([]);
  });
  it.each([
    'const view=<div className="animic-surface"/>;',
    "const view=<div className={`some-${value}`}/>;",
    'const draw=css; draw({p:"5"});',
    "someFunction(css);",
    "const view=<div className={unknownFunction()}/>;",
    'import { importedClassName } from "./classes"; const view=<div className={importedClassName}/>;',
    'const art=css({opacity:0.5}); const view=<div className={active ? art : ""}/>;',
    "let art=css({opacity:0.5}); const view=<div className={art}/>;",
    "const art=css({opacity:0.5}); function Other(art: string) { return <div className={art}/>; }",
    "const art=css({opacity:0.5}); const alias=art; const view=<div className={alias}/>;",
    "export const art=css({opacity:0.5});",
    "const art=css({opacity:0.5}); export {art};",
    'css.raw({top:"[-5px]"});',
    "const frames=keyframes;",
    "someFunction(keyframes);",
    'const fade=keyframes({from:{color:"red"},to:{opacity:1}});',
    'const fade=keyframes({from:{padding:"5"},to:{opacity:1}});',
    'const fade=keyframes({from:{top:"-5"},to:{opacity:1}});',
    "const fade=keyframes({...otherFrames});",
    'const art=css({"@keyframes fade":{from:{opacity:0},to:{opacity:1}}});',
    'const art=css({animationName:"shared-animation"});',
    'import { fade } from "./frames"; const art=css({animationName:`[${fade}]`});',
    "const fade=keyframes({from:{opacity:0},to:{opacity:1}}); export {fade};",
    "const fade=keyframes({from:{opacity:0},to:{opacity:1}}); const copy=fade;",
    "const fade=keyframes({from:{opacity:0},to:{opacity:1}}); const art=css({animationName:`prefix-${fade}`});",
  ])("Visualの生成元・geometry・frame境界を拒否する: %s", (source) => {
    expect(
      inspectSource(
        "src/features/example/visuals/effect.tsx",
        'import {css,keyframes} from "@animic/styled-system/css";' + source,
      ).length,
    ).toBeGreaterThan(0);
  });
  it("keyframesの局所定義を通常UI・React実装へ広げない", () => {
    const source = 'import {keyframes} from "@animic/styled-system/css";';
    for (const file of ["src/features/example/view.tsx", "packages/react/src/example.tsx"])
      expect(inspectSource(file, source).length).toBeGreaterThan(0);
  });
  it("packageの依存方向を維持する", () => {
    expect(
      inspectSource(
        "packages/design-system/src/example.ts",
        'import { Dialog } from "@ark-ui/react/dialog";',
      ).length,
    ).toBeGreaterThan(0);
    expect(
      inspectSource(
        "packages/react/src/example.ts",
        'import { animicPreset } from "@animic/design-system/preset";',
      ).length,
    ).toBeGreaterThan(0);
  });
});
