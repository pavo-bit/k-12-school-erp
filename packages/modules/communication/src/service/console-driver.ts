/**
 * Console notification driver for local development.
 * In production, replace with provider adapters (Resend, MSG91, WhatsApp BSP, FCM).
 * Prints deliveries to stdout so they are visible in `pnpm dev`.
 */

export interface ConsoleMessage {
  channel: "email" | "sms" | "whatsapp" | "push";
  to: string;
  subject?: string;
  body: string;
}

export function sendConsoleMessage(message: ConsoleMessage): {
  providerMessageId: string;
  status: string;
} {
  const providerMessageId = `console-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const line = `[NOTIFICATION:${message.channel.toUpperCase()}] to=${message.to} subject=${message.subject ?? "-"} body=${message.body} id=${providerMessageId}`;
  // eslint-disable-next-line no-console
  console.log(line);
  return { providerMessageId, status: "delivered" };
}

export function sendConsoleEmail(to: string, subject: string, body: string) {
  return sendConsoleMessage({ channel: "email", to, subject, body });
}

export function sendConsoleSms(to: string, body: string) {
  return sendConsoleMessage({ channel: "sms", to, body });
}

export function sendConsoleWhatsApp(to: string, body: string) {
  return sendConsoleMessage({ channel: "whatsapp", to, body });
}

export function sendConsolePush(to: string, title: string, body: string) {
  return sendConsoleMessage({ channel: "push", to, subject: title, body });
}
