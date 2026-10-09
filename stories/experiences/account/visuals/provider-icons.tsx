import { ProviderIcon } from "../../../../src/features/account/visuals/provider-icon";

export function ProviderIcons() {
  return (
    <svg width="42" height="24" viewBox="0 0 42 24" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="white" />
      <g transform="translate(5 5)">
        <ProviderIcon provider="Google" />
      </g>
      <circle cx="30" cy="12" r="12" fill="white" />
      <g transform="translate(23 5)">
        <ProviderIcon provider="Discord" />
      </g>
    </svg>
  );
}
