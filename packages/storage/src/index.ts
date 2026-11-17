export interface StorageDriver {
  put(key: string, body: Buffer | Uint8Array, contentType: string): Promise<string>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
}

export { createLocalStorage } from "./local.js";
export { createS3Storage } from "./s3.js";
