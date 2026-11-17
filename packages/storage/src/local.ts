import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { StorageDriver } from "./index";

export function createLocalStorage(basePath: string): StorageDriver {
  return {
    async put(key, body, _contentType) {
      const filePath = join(basePath, key);
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, body);
      return key;
    },
    async get(key) {
      return readFile(join(basePath, key));
    },
    async delete(key) {
      await unlink(join(basePath, key)).catch(() => {});
    },
    async getSignedUrl(key, _expiresInSeconds) {
      return `file://${join(basePath, key)}`;
    },
  };
}
