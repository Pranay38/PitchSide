import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

/**
 * Send an email asynchronously using Resend.
 */
export async function sendEmail(options: {
    to: string | string[];
    bcc?: string | string[];
    subject: string;
    html: string;
    idempotencyKey?: string;
}): Promise<void> {
    if (!isMailerConfigured()) {
        throw new Error("Mailer not configured");
    }

    const { error } = await resend!.emails.send({
        from: "The Touchline Dribble <noreply@thetouchlinedribble.in>",
        to: Array.isArray(options.to) ? options.to : [options.to],
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
        subject: options.subject,
        html: options.html,
    }, options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined);
    if (error) throw new Error(`Email provider rejected send: ${error.message}`);
}

/**
 * Send individual emails in bulk using Resend's batch API to prevent BBC exposure.
 */
export async function sendBatchEmails(optionsList: Array<{
    to: string;
    subject: string;
    html: string;
}>): Promise<void> {
    if (!isMailerConfigured()) {
        throw new Error("Mailer not configured");
    }

    const batchData = optionsList.map(opt => ({
        from: "The Touchline Dribble <noreply@thetouchlinedribble.in>",
        to: [opt.to],
        subject: opt.subject,
        html: opt.html,
    }));

    // Resend batch API accepts up to 100 emails at a time
    for (let i = 0; i < batchData.length; i += 100) {
        const chunk = batchData.slice(i, i + 100);
        const { error } = await resend!.batch.send(chunk);
        if (error) throw new Error(`Email provider rejected batch: ${error.message}`);
    }
}

/**
 * Check if Resend credentials are configured.
 */
export function isMailerConfigured(): boolean {
    return !!RESEND_API_KEY;
}
