import { createAuth } from "./auth.js";
import { toNextJsHandler } from "./next.js";

export { createAuth, toNextJsHandler };
export type AuthInstance = ReturnType<typeof createAuth>;
