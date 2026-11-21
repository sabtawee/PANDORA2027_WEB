import "server-only";
import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";

const scrypt = (pw: string, salt: Buffer, len: number, opts: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) => scryptCb(pw, salt, len, opts, (err, key) => (err ? reject(err) : resolve(key))));

// N=2^15, r=8, p=1 → ~32 MB, ~50-100 ms per check: slow for attackers, fine for a login form.
const N = 32768;
const R = 8;
const P = 1;
const KEYLEN = 64;
const maxmem = 64 * 1024 * 1024;

/** Format: scrypt$N$r$p$saltB64$hashB64 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize("NFKC"), salt, KEYLEN, { N, r: R, p: P, maxmem });
  return ["scrypt", N, R, P, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [alg, n, r, p, saltB64, hashB64] = stored.split("$");
  if (alg !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const key = await scrypt(password.normalize("NFKC"), Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem,
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** A real hash of a random password, so unknown usernames take as long as wrong passwords. */
let dummy: Promise<string> | null = null;
export async function burnPasswordCheck(password: string) {
  dummy ??= hashPassword(randomBytes(16).toString("hex"));
  await verifyPassword(password, await dummy);
}

/** Returns a Thai error message, or null if the password is acceptable. */
export function passwordProblem(password: string, username: string): string | null {
  if (password.length < 10) return "รหัสผ่านต้องยาวอย่างน้อย 10 ตัวอักษร";
  if (password.length > 128) return "รหัสผ่านยาวเกินไป";
  if (username && password.toLowerCase().includes(username.toLowerCase())) return "รหัสผ่านต้องไม่มีชื่อผู้ใช้อยู่ในนั้น";
  const kinds = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (kinds < 3) return "รหัสผ่านต้องมีอย่างน้อย 3 แบบจาก: ตัวเล็ก ตัวใหญ่ ตัวเลข สัญลักษณ์";
  return null;
}

/** Random temporary password for new admins / resets (shown once, must be changed at first login). */
export function generateTempPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const body = [...randomBytes(14)].map((b) => alphabet[b % alphabet.length]).join("");
  return `${body.slice(0, 7)}-${body.slice(7)}!`;
}
