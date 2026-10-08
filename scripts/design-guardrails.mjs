import { readFile, readdir } from "node:fs/promises";
import nodePath from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { parseSync } from "@babel/core";

const repository = fileURLToPath(new URL("../", import.meta.url));

function walk(node, visit) {
  if (!node || typeof node !== "object") return;
  if (typeof node.type === "string") visit(node);
  for (const [key, value] of Object.entries(node)) {
    if (["loc", "start", "end", "extra", "comments", "tokens"].includes(key)) continue;
    if (Array.isArray(value)) value.forEach((child) => walk(child, visit));
    else if (value && typeof value === "object") walk(value, visit);
  }
}

export function inspectSource(filename, source) {
  const name = filename.replaceAll("\\", "/");
  const design = name.startsWith("packages/design-system/");
  const react = name.startsWith("packages/react/");
  if ((!design && !react) || !/\.[cm]?[jt]sx?$/.test(name)) return [];
  const messages = [];
  const report = (node, message) =>
    messages.push(`${name}:${node?.loc?.start.line ?? 1}: ${message}`);
  const ast = parseSync(source, {
    filename: name,
    babelrc: false,
    configFile: false,
    parserOpts: { plugins: ["typescript", "jsx"] },
  });
  function inspectImport(specifier, node) {
    const resolved = specifier.startsWith(".")
      ? nodePath.posix.normalize(nodePath.posix.join(nodePath.posix.dirname(name), specifier))
      : specifier;
    if (resolved.startsWith("src/"))
      report(node, "共通パッケージからアプリケーションへ依存できません。");
    if (
      design &&
      (/^(@animic\/(react|styled-system)(?:\/|$)|@ark-ui\/|react(?:-dom)?(?:\/|$))/.test(
        specifier,
      ) ||
        /^packages\/(react|styled-system)\//.test(resolved))
    )
      report(node, "Design Systemの依存方向に反しています。");
    if (
      react &&
      (/^(@pandacss\/|@animic\/design-system(?:\/|$))/.test(specifier) ||
        resolved.startsWith("packages/design-system/"))
    )
      report(node, "React実装は生成SDKを利用してください。");
    if (
      react &&
      specifier === "@animic/styled-system/css" &&
      node.specifiers?.some(
        (binding) => binding.type !== "ImportSpecifier" || binding.imported?.name === "keyframes",
      )
    )
      report(
        node,
        "共通MotionはDesign Systemへ定義し、React実装でkeyframesを定義しないでください。",
      );
  }
  walk(ast, (node) => {
    if (
      ["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(node.type) &&
      node.source
    )
      inspectImport(node.source.value, node);
    if (
      node.type === "CallExpression" &&
      (node.callee.type === "Import" || node.callee.name === "require")
    ) {
      if (node.arguments[0]?.type === "StringLiteral") inspectImport(node.arguments[0].value, node);
      else report(node, "パッケージの依存先を静的に確認できる形で指定してください。");
    }
    if (node.type === "ImportExpression") {
      if (node.source.type === "StringLiteral") inspectImport(node.source.value, node);
      else report(node, "パッケージの依存先を静的に確認できる形で指定してください。");
    }
  });
  return messages;
}

async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = nodePath.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await files(filename)));
    else result.push(filename);
  }
  return result;
}
export async function checkRepository({ root = repository } = {}) {
  const issues = [];
  for (const folder of ["packages/design-system/src", "packages/react/src"])
    for (const file of await files(nodePath.join(root, folder)))
      issues.push(...inspectSource(nodePath.relative(root, file), await readFile(file, "utf8")));
  return issues;
}
if (process.argv[1] && nodePath.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({ options: { root: { type: "string", default: repository } } });
  const issues = await checkRepository({ root: values.root });
  if (issues.length) {
    console.error(issues.join("\n"));
    process.exitCode = 1;
  } else console.log("Design Systemのパッケージ依存を確認しました。");
}
