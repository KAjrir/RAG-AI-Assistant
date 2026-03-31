import crypto from "crypto";

export const toJsonLine = (data) => JSON.stringify(data) + "\n";

export const hashFile = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex")