import { readFile, readdir } from "node:fs/promises";
import nodePath from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { parseSync, traverse } from "@babel/core";
import { API, TypeFlags } from "typescript/unstable/sync";
import { isJsxSpreadAttribute } from "typescript/unstable/ast/is";
import { artworkConditions } from "../packages/design-system/src/conditions.ts";

const repository = fileURLToPath(new URL("../", import.meta.url));
const visualConditions = new Set(Object.keys(artworkConditions).map((name) => `_${name}`));
const ordinaryControls = new Set([
  "button",
  "input",
  "textarea",
  "select",
  "dialog",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "a",
]);
const stylingProps = new Set([
  "className",
  "style",
  "css",
  "sx",
  "asChild",
  "dangerouslySetInnerHTML",
  "fontSize",
  "fontFamily",
  "fontWeight",
  "lineHeight",
  "letterSpacing",
  "color",
  "bg",
  "background",
  "gap",
  "padding",
  "margin",
  "borderRadius",
  "boxShadow",
  "zIndex",
]);
const geometry = new Set([
  "transform",
  "transformOrigin",
  "translate",
  "rotate",
  "scale",
  "opacity",
  "filter",
  "mixBlendMode",
  "clipPath",
  "mask",
  "maskImage",
  "maskSize",
  "maskPosition",
  "maskRepeat",
  "position",
  "inset",
  "insetInline",
  "insetBlock",
  "insetInlineStart",
  "insetInlineEnd",
  "insetBlockStart",
  "insetBlockEnd",
  "top",
  "right",
  "bottom",
  "left",
  "width",
  "height",
  "overflow",
  "pointerEvents",
  "animationName",
  "animationDuration",
  "animationTimingFunction",
  "animationIterationCount",
  "animationFillMode",
  "animationDelay",
  "transitionProperty",
  "transitionDuration",
  "transitionDelay",
  "transitionTimingFunction",
  "_motionReduce",
]);
const spacingGeometry =
  /^(?:inset(?:Inline|Block)?(?:Start|End)?|top|right|bottom|left|translate(?:X|Y)?)$/;

function walk(node, visit) {
  if (!node || typeof node !== "object") return;
  if (typeof node.type === "string") visit(node);
  for (const [key, value] of Object.entries(node)) {
    if (["loc", "start", "end", "extra", "comments", "tokens"].includes(key)) continue;
    if (Array.isArray(value)) value.forEach((child) => walk(child, visit));
    else if (value && typeof value === "object") walk(value, visit);
  }
}
function spreadInspector(filename, source, root) {
  // 検査対象をメモリ上で同じTypeScript設定へ接続し、インポートされた公開props型も解決する。
  const file = nodePath.resolve(root, filename);
  const config = nodePath.join(root, "tsconfig.design-guardrails.virtual.json");
  const virtual = new Map([
    [file, source],
    [config, JSON.stringify({ extends: "./tsconfig.json", files: [file], include: [] })],
  ]);
  const api = new API({
    cwd: root,
    fs: {
      readFile: (name) => virtual.get(name),
      fileExists: (name) => (virtual.has(name) ? true : undefined),
    },
  });
  const snapshot = api.updateSnapshot({ openProjects: [config] });
  const project = snapshot.getProject(config);
  const checker = project?.checker;
  const expressions = new Map();
  function collectSpreads(node) {
    if (isJsxSpreadAttribute(node)) expressions.set(node.end, node.expression);
    node.forEachChild(collectSpreads);
  }
  const syntax = project?.program.getSourceFile(file);
  if (syntax) collectSpreads(syntax);
  function inspect(type, allowPadding) {
    if (!checker || !type || type.isErrorType() || type.flags & (TypeFlags.Any | TypeFlags.Unknown))
      return "JSX spreadの型を安全な閉じたprops型として確認できません。";
    if (type.isUnionType()) {
      for (const member of type.getTypes()) {
        const issue = inspect(member, allowPadding);
        if (issue) return issue;
      }
      return undefined;
    }
    if (type.flags & (TypeFlags.Undefined | TypeFlags.Null | TypeFlags.BooleanLiteral))
      return undefined;
    if (type.isTypeParameter() || checker.getIndexInfosOfType(type).length)
      return "JSX spreadの任意keyを許す型からはStyling propertyを除外できません。";
    if (!type.isObjectType() && !type.isIntersectionType())
      return "JSX spreadには閉じたprops型を指定してください。";
    const forbidden = checker
      .getPropertiesOfType(type)
      .map((property) => property.name)
      .filter((key) => stylingProps.has(key) && !(allowPadding && key === "padding"));
    if (forbidden.length)
      return `JSX spreadに禁止Styling propertyが含まれます: ${forbidden.join(", ")}`;
    return undefined;
  }
  return {
    inspect: (end, allowPadding) => {
      const expression = expressions.get(end);
      return inspect(expression && checker?.getTypeAtLocation(expression), allowPadding);
    },
    close: () => api.close(),
  };
}
function localConst(path) {
  if (!path?.isIdentifier()) return undefined;
  const binding = path.scope.getBinding(path.node.name);
  if (
    !binding?.constant ||
    !binding.path.isVariableDeclarator() ||
    !binding.path.get("id").isIdentifier() ||
    binding.path.parent.kind !== "const"
  )
    return undefined;
  return binding;
}
function isClassAttribute(path) {
  return (
    path.parentPath?.isJSXExpressionContainer() &&
    path.parentPath.parentPath?.isJSXAttribute() &&
    path.parentPath.parentPath.node.name.name === "className"
  );
}

// Visualでは直接呼び出しと、その結果を持つ同一ファイルのconstだけを確認する。
function inspectVisual(ast, report) {
  const apis = new Map();
  const checkedCss = new Map();
  const checkedFrames = new Map();
  const frameReferences = new Set();
  const localResults = new Map();
  traverse(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value !== "@animic/styled-system/css") return;
      for (const specifier of path.node.specifiers) {
        if (
          specifier.type === "ImportSpecifier" &&
          ["css", "keyframes"].includes(specifier.imported.name)
        )
          apis.set(path.scope.getBinding(specifier.local.name), specifier.imported.name);
      }
    },
  });
  function apiCall(path, api) {
    return (
      path?.isCallExpression() &&
      path.get("callee").isIdentifier() &&
      apis.get(path.scope.getBinding(path.node.callee.name)) === api
    );
  }
  function checkFrameName(path) {
    if (
      !path.isTemplateLiteral() ||
      path.node.expressions.length !== 1 ||
      path.node.quasis[0].value.cooked !== "[" ||
      path.node.quasis[1].value.cooked !== "]"
    )
      return false;
    const reference = path.get("expressions")[0];
    const binding = localConst(reference);
    if (
      !binding ||
      !apiCall(binding.path.get("init"), "keyframes") ||
      !checkFrames(binding.path.get("init"))
    )
      return false;
    frameReferences.add(reference.node);
    return true;
  }
  function checkStyle(path, frames = false) {
    if (!path.isObjectExpression()) {
      report(path.node, "Visualには静的なgeometryオブジェクトを指定してください。");
      return false;
    }
    let valid = true;
    for (const property of path.get("properties")) {
      const key = property.node.key?.name ?? property.node.key?.value;
      if (!property.isObjectProperty() || property.node.computed || typeof key !== "string") {
        report(property.node, "Visualのstyle spread・method・computed keyは許可されていません。");
        valid = false;
        continue;
      }
      const value = property.get("value");
      if (
        !frames &&
        (key === "_motionReduce" || visualConditions.has(key) || key.startsWith("&"))
      ) {
        valid = checkStyle(value) && valid;
        continue;
      }
      if (!geometry.has(key) || key === "_motionReduce") {
        report(property.node, "Visualで許可されていないstyle propertyです。");
        valid = false;
        continue;
      }
      if (key === "animationName") {
        if (
          !frames &&
          ((value.isStringLiteral() && ["none", "[none]"].includes(value.node.value)) ||
            checkFrameName(value))
        )
          continue;
        report(
          value.node,
          "animationNameは同一Visualのkeyframes生成名を `[${name}]` で参照してください。",
        );
        valid = false;
        continue;
      }
      const literal =
        value.isStringLiteral() || value.isNumericLiteral()
          ? value.node.value
          : value.isUnaryExpression({ operator: "-" }) && value.get("argument").isNumericLiteral()
            ? -value.node.argument.value
            : undefined;
      if (literal === undefined) {
        report(value.node, "Visualのgeometry値は静的なlocal valueで指定してください。");
        valid = false;
      } else if (
        /(?:token\(\s*spacing\.|--animic-spacing-|\{spacing\.)/.test(String(literal)) ||
        (spacingGeometry.test(key) && /^-?(?:[1-9]|1[0-2])$/.test(String(literal)))
      ) {
        report(value.node, "VisualのgeometryにDesign spacingのToken・自動派生値を流用できません。");
        valid = false;
      }
    }
    return valid;
  }
  function checkFrames(path) {
    if (checkedFrames.has(path.node)) return checkedFrames.get(path.node);
    checkedFrames.set(path.node, false);
    const args = path.get("arguments");
    let valid = args.length === 1 && args[0].isObjectExpression();
    if (!valid) report(path.node, "keyframesには静的なframeオブジェクトを一つ指定してください。");
    else
      for (const frame of args[0].get("properties")) {
        const key = frame.node.key?.name ?? frame.node.key?.value;
        if (
          !frame.isObjectProperty() ||
          frame.node.computed ||
          !/^(?:from|to|\d+(?:\.\d+)?%)(?:,\s*(?:from|to|\d+(?:\.\d+)?%))*$/.test(key ?? "")
        ) {
          report(frame.node, "keyframesのframeはfrom・to・percentageで静的に指定してください。");
          valid = false;
        } else valid = checkStyle(frame.get("value"), true) && valid;
      }
    checkedFrames.set(path.node, valid);
    return valid;
  }
  function checkCss(path) {
    if (checkedCss.has(path.node)) return checkedCss.get(path.node);
    const args = path.get("arguments");
    const valid = args.length === 1 && checkStyle(args[0]);
    if (args.length !== 1)
      report(path.node, "cssには静的なgeometryオブジェクトを一つ指定してください。");
    checkedCss.set(path.node, valid);
    return valid;
  }
  for (const [binding, api] of apis) {
    if (!binding) continue;
    for (const reference of binding.referencePaths) {
      const call = reference.parentPath;
      if (!call.isCallExpression() || call.get("callee").node !== reference.node) {
        report(
          reference.node,
          "VisualのStyling関数は直接呼び出し専用です。代入・受け渡し・再公開できません。",
        );
        continue;
      }
      if (api === "css") checkCss(call);
      else checkFrames(call);
      const declarator = call.parentPath;
      if (declarator.isVariableDeclarator() && declarator.get("init").node === call.node) {
        const result = localConst(declarator.get("id"));
        if (result) {
          localResults.set(result, api);
          continue;
        }
      }
      if (api === "css" && isClassAttribute(call)) continue;
      report(
        call.node,
        "Visualの生成結果はclassNameへの直接指定、または単純なconst初期値に限定します。",
      );
    }
  }
  traverse(ast, {
    JSXAttribute(path) {
      if (path.node.name.name !== "className") return;
      const value = path.get("value");
      const expression = value.isJSXExpressionContainer() ? value.get("expression") : undefined;
      const binding = localConst(expression);
      if (apiCall(expression, "css") && checkCss(expression)) return;
      if (binding && apiCall(binding.path.get("init"), "css") && checkCss(binding.path.get("init")))
        return;
      report(
        path.node,
        "VisualのclassNameは検査済みcss呼び出し、またはその結果を持つ同一ファイルのconstだけを指定できます。",
      );
    },
  });
  for (const [binding, api] of localResults) {
    if (binding.path.parentPath.parentPath.isExportNamedDeclaration())
      report(binding.path.node, "Visualのclass・animation nameを再公開できません。");
    for (const reference of binding.referencePaths) {
      if (api === "css" ? isClassAttribute(reference) : frameReferences.has(reference.node))
        continue;
      report(
        reference.node,
        "Visualの生成結果は同一ファイルのclassName・animationNameからだけ局所的に参照できます。",
      );
    }
  }
}

export function inspectSource(filename, source, { root = repository } = {}) {
  root = nodePath.resolve(root);
  const name = filename.replaceAll("\\", "/");
  const messages = [];
  const report = (node, message) =>
    messages.push(`${name}:${node?.loc?.start.line ?? 1}: ${message}`);
  const ui = name.startsWith("src/");
  const visual = /^src\/features\/[^/]+\/visuals\//.test(name);
  const design = name.startsWith("packages/design-system/");
  const react = name.startsWith("packages/react/");
  if (ui && /\.(css|scss|sass|less)$/.test(name)) {
    report(null, "通常UIのstylesheetを追加せずデザインシステムを利用してください。");
    return messages;
  }
  if (!/\.[cm]?[jt]sx?$/.test(name)) return messages;
  const ast = parseSync(source, {
    filename: name,
    babelrc: false,
    configFile: false,
    parserOpts: { plugins: ["typescript", "jsx"] },
  });
  const surfaces = new Set();
  let spreads;
  try {
    walk(ast, (node) => {
      if (node.type !== "ImportDeclaration" || node.source.value !== "@animic/react/surface")
        return;
      for (const binding of node.specifiers) {
        if (binding.type === "ImportSpecifier" && binding.imported.name === "Surface")
          surfaces.add(binding.local.name);
      }
    });
    function inspectImport(specifier, node) {
      if (visual && specifier === "@animic/styled-system/css") {
        if (node.type !== "ImportDeclaration")
          report(node, "VisualからStyling APIを再公開できません。");
        for (const binding of node.specifiers ?? []) {
          if (
            binding.type !== "ImportSpecifier" ||
            !["css", "keyframes"].includes(binding.imported.name)
          )
            report(node, "Visualで利用できるStyling APIはcss・keyframesだけです。");
        }
      }
      if (
        react &&
        specifier === "@animic/styled-system/css" &&
        node.specifiers?.some(
          (binding) => binding.type !== "ImportSpecifier" || binding.imported?.name === "keyframes",
        )
      )
        report(
          node,
          "keyframesの局所定義はFeature Visualでのみ利用できます。共通Motionはデザインシステムへ定義してください。",
        );
      const resolved = specifier.startsWith(".")
        ? nodePath.posix.normalize(nodePath.posix.join(nodePath.posix.dirname(name), specifier))
        : specifier;
      const low =
        /^@(?:pandacss|ark-ui)\//.test(specifier) ||
        /^@animic\/(design-system|styled-system)(?:\/|$)/.test(specifier) ||
        /^packages\/(design-system|styled-system|react)\//.test(resolved);
      const cssEntry =
        specifier === "@animic/styled-system/styles.css" ||
        specifier === "@animic/styled-system/styles.css?url";
      if (ui && cssEntry && name !== "src/routes/__root.tsx")
        report(node, "生成CSSはsrc/routes/__root.tsxから読み込んでください。");
      if (ui && low && !(visual && specifier === "@animic/styled-system/css") && !cssEntry)
        report(
          node,
          "アプリケーションUIから低レベルStyling・Ark・package内部を直接参照できません。",
        );
      if (ui && /\.(css|scss|sass|less)(?:\?|$)/.test(specifier) && !cssEntry)
        report(node, "通常UIのCSS importは許可されていません。");
      if (visual && cssEntry)
        report(node, "Visual領域から通常UIのstylesheetを定義・差し替えできません。");
      if (
        design &&
        (/^(@animic\/(react|styled-system)|@ark-ui\/|react(?:-dom)?(?:\/|$))/.test(specifier) ||
          /^packages\/(react|styled-system)\//.test(resolved))
      )
        report(node, "デザインシステムの依存方向に反しています。");
      if (
        react &&
        (/^(@pandacss\/|@animic\/design-system)/.test(specifier) ||
          resolved.startsWith("packages/design-system/"))
      )
        report(node, "React実装は生成SDKを利用してください。");
    }
    walk(ast, (node) => {
      if (
        ["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(
          node.type,
        ) &&
        node.source
      )
        inspectImport(node.source.value, node);
      if (
        node.type === "CallExpression" &&
        (node.callee.type === "Import" || node.callee.name === "require")
      ) {
        if (node.arguments[0]?.type === "StringLiteral")
          inspectImport(node.arguments[0].value, node);
        else if (ui) report(node, "動的なimport先でUI境界を迂回できません。");
      }
      if (node.type === "ImportExpression") {
        if (node.source.type === "StringLiteral") inspectImport(node.source.value, node);
        else if (ui) report(node, "動的なimport先でUI境界を迂回できません。");
      }
      if (ui && node.type === "JSXOpeningElement") {
        const tag = node.name.name;
        if (tag === "style") report(node, "通常UIへstyle要素からCSSを追加できません。");
        if (tag === "link") {
          const relIndex = node.attributes.findLastIndex(
            (attribute) => attribute.name?.name === "rel",
          );
          const rel = node.attributes[relIndex]?.value;
          const literal =
            rel?.type === "StringLiteral"
              ? rel.value
              : rel?.type === "JSXExpressionContainer" && rel.expression.type === "StringLiteral"
                ? rel.expression.value
                : undefined;
          if (
            (rel && literal === undefined) ||
            /(?:^|\s)stylesheet(?:\s|$)/i.test(literal ?? "") ||
            node.attributes.some(
              (attribute, index) => attribute.type === "JSXSpreadAttribute" && index > relIndex,
            )
          )
            report(node, "通常UIのlinkはstylesheet以外のrelを明示してください。");
        }
        if (ordinaryControls.has(tag))
          report(node, "通常のControl・Typographyは@animic/reactで表現してください。");
        for (const attribute of node.attributes) {
          if (attribute.type === "JSXSpreadAttribute") {
            spreads ??= spreadInspector(name, source, root);
            const issue = spreads.inspect(attribute.end, surfaces.has(tag));
            if (issue) report(attribute, issue);
          }
          const key = attribute.name?.name;
          if (
            stylingProps.has(key) &&
            !(visual && key === "className") &&
            !(key === "padding" && surfaces.has(tag))
          )
            report(attribute, "アプリケーションUIにStyling escape hatchを追加できません。");
        }
      }
    });
    if (ui)
      traverse(ast, {
        CallExpression(path) {
          const callee = path.get("callee");
          const factories = ["createElement", "cloneElement"];
          if (callee.isIdentifier()) {
            const binding = callee.scope.getBinding(callee.node.name);
            const imported = binding?.path;
            const importedFactory =
              imported?.isImportSpecifier() &&
              imported.parent.source.value === "react" &&
              factories.includes(imported.node.imported.name ?? imported.node.imported.value);
            if (factories.includes(callee.node.name) || importedFactory)
              report(path.node, "JSXで公開Componentとpropsを明示してください。");
          } else if (
            callee.isMemberExpression() &&
            !callee.node.computed &&
            factories.includes(callee.node.property.name)
          ) {
            // ファイル保存・画像変換で使うネイティブDOMはReactの要素生成ではない。
            const object = callee.get("object");
            const nativeDocument =
              object.isIdentifier({ name: "document" }) && !object.scope.getBinding("document");
            if (!nativeDocument) report(path.node, "JSXで公開Componentとpropsを明示してください。");
          }
        },
      });
    if (visual) inspectVisual(ast, report);
  } finally {
    spreads?.close();
  }
  return messages;
}
async function files(directory, optional = false) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (optional && error instanceof Error && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
  const result = [];
  for (const entry of entries) {
    if (["node_modules", "generated"].includes(entry.name)) continue;
    const filename = nodePath.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await files(filename)));
    else result.push(filename);
  }
  return result;
}
export async function checkRepository({ root = repository } = {}) {
  root = nodePath.resolve(root);
  const issues = [];
  for (const folder of ["src", "packages/design-system/src", "packages/react/src"]) {
    for (const file of await files(nodePath.join(root, folder), folder !== "src"))
      issues.push(
        ...inspectSource(nodePath.relative(root, file), await readFile(file, "utf8"), { root }),
      );
  }
  return issues;
}
if (process.argv[1] && nodePath.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { root: { type: "string", default: repository } } });
  const issues = await checkRepository({ root: values.root });
  if (issues.length) {
    console.error(issues.join("\n"));
    process.exitCode = 1;
  } else console.log("デザインシステムのimport・Styling境界を確認しました。");
}
