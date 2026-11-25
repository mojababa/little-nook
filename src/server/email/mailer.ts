import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type Email = {
  to: string;
  subject: string;
  text: string;
};

/** Sends transactional email (verification, password reset). */
export type Mailer = {
  send(email: Email): Promise<void>;
};

/** Delivers through Resend's HTTP API. */
export function resendMailer(options: {
  apiKey: string;
  from: string;
}): Mailer {
  return {
    async send(email) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: options.from,
          to: [email.to],
          subject: email.subject,
          text: email.text,
        }),
      });
      if (!response.ok) {
        throw new Error(
          `Resend refused the email (${response.status}): ${await response.text()}`,
        );
      }
    },
  };
}

/**
 * Writes each email as a JSON file into `dir` instead of sending it. The E2E
 * tests read their verification and reset links from there.
 */
export function outboxMailer(dir: string): Mailer {
  return {
    async send(email) {
      await mkdir(dir, { recursive: true });
      const file = `${Date.now()}-${crypto.randomUUID()}.json`;
      await writeFile(path.join(dir, file), JSON.stringify(email, null, 2));
    },
  };
}

/** Prints emails to the server log, for local development without a provider. */
export function consoleMailer(): Mailer {
  return {
    async send(email) {
      console.info(
        `\n[email] To: ${email.to}\nSubject: ${email.subject}\n\n${email.text}\n`,
      );
    },
  };
}

/**
 * Picks the mailer from the environment: Resend when `RESEND_API_KEY` is set,
 * else the file outbox when `EMAIL_OUTBOX_DIR` is set, else the console.
 * Production deployments must configure Resend.
 */
export function mailerFromEnv(env: NodeJS.ProcessEnv = process.env): Mailer {
  if (env.RESEND_API_KEY) {
    const from = env.EMAIL_FROM;
    if (!from) throw new Error("EMAIL_FROM is not set");
    return resendMailer({ apiKey: env.RESEND_API_KEY, from });
  }
  if (env.EMAIL_OUTBOX_DIR) return outboxMailer(env.EMAIL_OUTBOX_DIR);
  if (env.VERCEL_ENV === "production") {
    throw new Error("RESEND_API_KEY is not set");
  }
  return consoleMailer();
}
