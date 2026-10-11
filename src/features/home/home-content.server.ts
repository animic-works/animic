import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

import { loadScoringWeights } from "../scoring/scoring-weights.server";
import { howSteps, mergeHomeItems, scoringSteps, siteImagePath } from "./home-content";
import type { GalleryItem, HomeContent } from "./home-content";
import { galleryItem, homeItem, siteSetting } from "./home-content.schema";

export const ogImageKey = "og_image";

/** トップページに出す内容を読む。採点方法の重みのグラフとボーナスの点には、今の値を出す。 */
export async function loadHomeContent(db: D1Database): Promise<HomeContent> {
  const client = drizzle(db);
  const [items, gallery, [og], { weights, bonus }] = await Promise.all([
    client.select().from(homeItem),
    client.select().from(galleryItem).orderBy(asc(galleryItem.sortOrder), asc(galleryItem.id)),
    client.select().from(siteSetting).where(eq(siteSetting.key, ogImageKey)),
    loadScoringWeights(db),
  ]);
  const saved = items.map(({ imageId, ...item }) => ({
    ...item,
    image: imageId ? siteImagePath(imageId) : null,
  }));
  return {
    howSteps: mergeHomeItems(howSteps, saved),
    scoringSteps: mergeHomeItems(scoringSteps, saved),
    weights,
    bonus,
    gallery: gallery.map(toGalleryItem),
    ogImage: og ? siteImagePath(og.value) : null,
  };
}

function toGalleryItem(row: typeof galleryItem.$inferSelect): GalleryItem {
  const { ccip, pixai, siglip2, dinov2, depth, sortOrder: _sortOrder, ...item } = row;
  return { ...item, metrics: { ccip, pixai, siglip2, dinov2, depth } };
}
