export interface LegalDocument {
  title: string;
  eyebrow: string;
  date: string;
  intro: string;
  sections: readonly {
    id: string;
    title: string;
    toc: string;
    blocks: readonly (
      | { kind: "paragraph"; text: string }
      | { kind: "list"; ordered: boolean; items: readonly string[] }
      | { kind: "table"; rows: readonly { label: string; value: string }[] }
    )[];
  }[];
}
