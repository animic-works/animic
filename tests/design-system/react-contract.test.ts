import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vite-plus/test";
import { Button } from "@animic/react/button";
import { Heading } from "@animic/react/heading";
import { Text } from "@animic/react/text";
import { Container } from "@animic/react/container";
import { Grid } from "@animic/react/grid";
import { Split } from "@animic/react/split";

describe("React public contract", () => {
  it("JSの余分なpropsからもescape hatchを通さない", () => {
    const input = {
      children: "保存",
      id: "save",
      className: "override",
      style: { color: "red" },
      asChild: true,
    };
    const markup = renderToStaticMarkup(createElement(Button, input));
    expect(markup).toContain('id="save"');
    expect(markup).not.toContain("override");
    expect(markup).not.toContain("style=");
    expect(markup).not.toContain("asChild");
  });
  it("Headingのdocument semanticsとvisual hierarchyを独立してSSRできる", () => {
    const markup = renderToStaticMarkup(
      createElement(Heading, { level: 3, size: "display" }, "見出し"),
    );
    expect(markup).toMatch(/^<h3 /);
    expect(markup).toContain("display");
  });
  it("Textの既定はspanで、段落は明示する", () => {
    expect(renderToStaticMarkup(createElement(Text, null, "本文"))).toMatch(/^<span /);
    expect(renderToStaticMarkup(createElement(Text, { as: "p" }, "本文"))).toMatch(/^<p /);
  });
  it("アプリケーションの画面に依存せずPatternのReact ComponentをSSRできる", () => {
    const markup = renderToStaticMarkup(
      createElement(
        Container,
        { size: "reading" },
        createElement(Grid, { columns: 2 }, createElement(Split, { layout: "equal" }, "内容")),
      ),
    );
    expect(markup).toContain("内容");
    expect(markup).not.toContain("undefined");
  });
  it("root barrelと内部実装をpackage exportしない", () => {
    expect(() => import.meta.resolve("@animic/react")).toThrow();
    expect(() => import.meta.resolve("@animic/react/src/dom")).toThrow();
    expect(import.meta.resolve("@animic/react/text")).toContain("/src/text.tsx");
  });
});
