import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
export const security = {
  hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
  },
  verifyPassword(password, stored) {
    const [salt, hash] = (stored || this.hashPassword("invalid")).split(":");
    return timingSafeEqual(
      scryptSync(password, salt, 64),
      Buffer.from(hash, "hex"),
    );
  },
  token() {
    return randomBytes(32).toString("hex");
  },
  digest(token) {
    return createHash("sha256").update(token).digest("hex");
  },
};
