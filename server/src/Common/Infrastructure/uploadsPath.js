import path from "path";
import { fileURLToPath } from "url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(currentDir, "../../..");

export const uploadsDir = path.resolve(
  process.env.UPLOADS_DIR ||
    process.env.UPLOAD_DIR ||
    path.join(serverRoot, "uploads")
);
