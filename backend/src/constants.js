const __dirname = import.meta.dirname

export const ISPROD = process.env.NODE_ENV === "production";
export const assetsPath = "/uploads"
export const uploadsDirectory = ISPROD ? `${__dirname}/prodUploads` : `${__dirname}/uploads`
export const FRONTEND_URL = process.env.FRONTEND_URL;
