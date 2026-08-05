// Real-time notifications for mentor/sponsor submissions. These rows have no
// admin review queue (see apps/web/src/pages/admin/index.astro — it
// deliberately doesn't show an Approve action for mentorship/sponsorship
// rows), so a push notification on insert is the only way anyone finds out
// about them. Priority order (Mel, explicit): Telegram first, Discord as
// backup. Email is the documented last-resort channel — deferred, not
// implemented in this pass.

type SubmissionType = "mentorship" | "sponsorship";

type NotifySubmissionInput = {
  description: string;
  contactName: string;
  contactPlatform: string;
  contactValue: string;
  proofUrl?: string | null;
};

function formatMessage(type: SubmissionType, input: NotifySubmissionInput): string {
  const lines = [
    `New ${type} submission on regen/acc`,
    `From: ${input.contactName} (${input.contactPlatform}: ${input.contactValue})`,
    input.description,
  ];

  if (input.proofUrl) {
    lines.push(`Proof: ${input.proofUrl}`);
  }

  return lines.join("\n");
}

async function sendTelegram(message: string): Promise<boolean> {
  // Read via process.env, never import.meta.env — see turbo.json's build/dev
  // `env` arrays and apps/web/src/db/client.ts / apps/web/src/lib/scoring.ts
  // for the convention (Vite statically inlines import.meta.env.X at build
  // time, which both bakes the literal secret into the compiled artifact and
  // breaks under Turborepo, which strips undeclared env vars from the build
  // task unless declared there).
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function sendDiscord(message: string): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function notifySubmission(type: SubmissionType, input: NotifySubmissionInput): Promise<void> {
  const message = formatMessage(type, input);

  const telegramSent = await sendTelegram(message);
  if (telegramSent) {
    return;
  }

  const discordSent = await sendDiscord(message);
  if (discordSent) {
    return;
  }

  // Neither channel is configured, or both failed — never throw (a failed
  // notification must never fail the visitor's actual form submission).
  // Log enough to find the lost submission: type + contact info.
  console.error(
    `[notify] Failed to deliver ${type} submission notification (no channel configured or all channels failed). ` +
      `Contact: ${input.contactName} (${input.contactPlatform}: ${input.contactValue})`,
  );
}
