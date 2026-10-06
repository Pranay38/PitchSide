import { Resend } from "resend";
import { emailToText } from "./utils/emailTemplate";

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
    text?: string;
    unsubscribeUrl?: string;
    idempotencyKey?: string;
}): Promise<void> {
    if (!isMailerConfigured()) {
        throw new Error("Mailer not configured");
    }

    const { error } = await resend!.emails.send({
        from: "Pranay at The Touchline Dribble <noreply@thetouchlinedribble.in>",
        replyTo: "thetouchlinedribble@gmail.com",
        to: Array.isArray(options.to) ? options.to : [options.to],
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
        subject: options.subject,
        html: options.html,
        text: options.text || emailToText(options.html),
        headers: unsubscribeHeaders(options.unsubscribeUrl),
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
    text?: string;
    unsubscribeUrl?: string;
}>): Promise<void> {
    if (!isMailerConfigured()) {
        throw new Error("Mailer not configured");
    }

    const batchData = optionsList.map(opt => ({
        from: "Pranay at The Touchline Dribble <noreply@thetouchlinedribble.in>",
        replyTo: "thetouchlinedribble@gmail.com",
        to: [opt.to],
        subject: opt.subject,
        html: opt.html,
        text: opt.text || emailToText(opt.html),
        headers: unsubscribeHeaders(opt.unsubscribeUrl),
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

function unsubscribeHeaders(url?: string) {
    return url ? { "List-Unsubscribe": `<${url}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : undefined;
}
