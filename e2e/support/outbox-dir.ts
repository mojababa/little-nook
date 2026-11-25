import path from "node:path";

/** Where the E2E web server writes the emails it "sends". */
export const e2eOutboxDir = path.resolve(".e2e-outbox");
