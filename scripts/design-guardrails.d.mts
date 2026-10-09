export interface InspectionOptions {
  root?: string;
}
export function inspectSource(
  filename: string,
  source: string,
  options?: InspectionOptions,
): string[];
export function checkRepository(options?: InspectionOptions): Promise<string[]>;
