// `type`, not `interface`: Prisma's Json input needs an implicit index signature
export type RewardItem = {
  itemId: number;
  amount: number;
};

/** Admin textarea format: one "itemId:amount" per line, e.g. "501:10". Throws on a bad line. */
export function parseItemLines(text: string): RewardItem[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.match(/^(\d{1,7})\s*[:x×]\s*(\d{1,5})$/i);
      if (!m) throw new Error(`รูปแบบไอเทมไม่ถูกต้อง: "${l}" (ใช้ itemId:จำนวน)`);
      return { itemId: Number(m[1]), amount: Number(m[2]) };
    });
}

export function formatItemLines(items: unknown): string {
  return Array.isArray(items) ? (items as RewardItem[]).map((i) => `${i.itemId}:${i.amount}`).join("\n") : "";
}
