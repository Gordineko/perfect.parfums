import fs from "fs";
import path from "path";

function cleanDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      cleanDir(fullPath);
    } else {
      fs.unlinkSync(fullPath);
    }
  }
}

cleanDir("./src");
console.log("src очищен от файлов");
