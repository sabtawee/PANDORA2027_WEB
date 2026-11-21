import "server-only";
import { prisma } from "@/core/db/prisma";

export interface MilestoneView {
  id: string;
  target: number;
  title: unknown;
  description: unknown;
  image: string | null;
  unlocked: boolean;
}

export interface PreregisterStats {
  registered: number;
  milestones: MilestoneView[];
}

/** Public landing-page numbers. Never throws, so the page still renders without a DB. */
export async function getPreregisterStats(): Promise<PreregisterStats> {
  try {
    const [registered, milestones] = await Promise.all([
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.milestone.findMany({ where: { isActive: true }, orderBy: { target: "asc" } }),
    ]);
    return {
      registered,
      milestones: milestones.map((m) => ({
        id: m.id,
        target: m.target,
        title: m.title,
        description: m.description,
        image: m.image,
        unlocked: registered >= m.target,
      })),
    };
  } catch (err) {
    console.warn("[preregister] stats unavailable", (err as Error).message);
    return { registered: 0, milestones: [] };
  }
}

export async function getActiveQuests() {
  try {
    return await prisma.quest.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  } catch {
    return [];
  }
}
