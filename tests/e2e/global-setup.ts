import fakeNovelAi from "./fake-novelai";
import fakeDiscord from "./fake-discord";

export default async function setup() {
  const stopNovelAi = await fakeNovelAi();
  const stopDiscord = await fakeDiscord();
  return async () => {
    await Promise.all([stopNovelAi(), stopDiscord()]);
  };
}
