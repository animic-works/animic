export function fontImports(
  styles?: Record<
    string,
    { value: { fontFamily?: unknown; fontWeight?: unknown; fontStyle?: unknown } }
  >,
  families?: Record<string, { value: string }>,
  weights?: Record<string, { value: number }>,
  assets?: Record<string, string>,
): string[];
export function fontCss(): string;
