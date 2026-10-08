// E2Eのビルドへ渡すOAuthクライアント。開発者の.envにある値を使わず、実際のサービスへは通信しない。
export const e2eOAuthClients = {
  google: { id: "e2e-google-client", secret: "e2e-google-secret" },
  discord: { id: "e2e-discord-client", secret: "e2e-discord-secret" },
};
