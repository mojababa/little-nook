import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { expect } from "@playwright/test";

import { e2eOutboxDir } from "./outbox-dir";

type Email = { to: string; subject: string; text: string };

/** A fresh address, so tests never collide with each other or earlier runs. */
export function newEmailAddress(): string {
  return `e2e-${randomUUID().slice(0, 8)}@example.test`;
}

async function emailsTo(to: string): Promise<Email[]> {
  const files = await readdir(e2eOutboxDir).catch(() => []);
  const emails = await Promise.all(
    files
      .sort()
      .map(
        async (file) =>
          JSON.parse(
            await readFile(path.join(e2eOutboxDir, file), "utf8"),
          ) as Email,
      ),
  );
  return emails.filter((email) => email.to === to);
}

/**
 * Waits for an email to `to` whose subject contains `subject` and returns the
 * link in it.
 */
export async function linkFromEmail(
  to: string,
  subject: string,
): Promise<string> {
  let link: string | undefined;
  await expect
    .poll(async () => {
      const email = (await emailsTo(to))
        .filter((sent) => sent.subject.includes(subject))
        .at(-1);
      link = email?.text.match(/https?:\/\/\S+/)?.[0];
      return link;
    }, `email to ${to} about "${subject}"`)
    .toBeTruthy();
  return link!;
}
