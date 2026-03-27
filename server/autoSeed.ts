import { SEED_LESSONS } from "./seedLessons";
import * as db from "./db";

/**
 * Auto-seeds the lesson library on server startup if fewer than 30 published lessons exist.
 * Creates a default organization if none exists.
 * Runs once, silently, with no user interaction required.
 */
export async function autoSeedLessons() {
  try {
    const dbInstance = await db.getDb();
    if (!dbInstance) {
      console.log("[AutoSeed] Database not available, skipping seed.");
      return;
    }

    const count = await db.getPublishedLessonsCount();
    if (count >= 30) {
      console.log(`[AutoSeed] Library already has ${count} lessons, skipping.`);
      return;
    }

    // Ensure at least one organization exists
    let orgId: number;
    const orgs = await db.getAllOrganizations();
    if (orgs.length > 0) {
      orgId = orgs[0].id;
    } else {
      const newOrg = await db.createOrganization({
        name: "MicroLearning Platform",
        slug: "platform-default",
        industry: "General",
        maxUsers: 1000,
      });
      orgId = (newOrg as any).id ?? 1;
      console.log(`[AutoSeed] Created default organization (id: ${orgId}).`);
    }

    // Build lesson records from seed data
    const lessonsToInsert = SEED_LESSONS.map(sl => ({
      orgId,
      title: sl.title,
      description: sl.description,
      content: sl.content,
      contentType: sl.contentType as any,
      durationMinutes: sl.durationMinutes,
      difficulty: sl.difficulty as any,
      category: sl.category,
      tags: sl.tags,
      language: sl.language,
      authorId: 1, // system author
      status: "published" as const,
      publishedAt: new Date(),
      thumbnailUrl: sl.thumbnailUrl || null,
    }));

    await db.bulkCreateLessons(lessonsToInsert);
    console.log(`[AutoSeed] Seeded ${lessonsToInsert.length} lessons into the library.`);
  } catch (err) {
    console.error("[AutoSeed] Failed to seed lessons:", err);
  }
}
