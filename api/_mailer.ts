import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER || "";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || "";

/**
 * Create a reusable transporter using Gmail SMTP.
 * Requires GMAIL_USER and GMAIL_APP_PASSWORD env vars.
 */
function createTransporter() {
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
        throw new Error(
            "GMAIL_USER and GMAIL_APP_PASSWORD environment variables are required. " +
            "Go to Vercel → Settings → Environment Variables to add them."
        );
    }

    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: GMAIL_USER,
            pass: GMAIL_APP_PASSWORD,
        },
    });
}

/**
 * Send an email using Gmail SMTP.
 */
export async function sendEmail(options: {
    to: string | string[];
    subject: string;
    html: string;
}): Promise<void> {
    const transporter = createTransporter();

    await transporter.sendMail({
        from: `"The Touchline Dribble" <${GMAIL_USER}>`,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        html: options.html,
    });
}

/**
 * Check if Gmail credentials are configured.
 */
export function isMailerConfigured(): boolean {
    return !!(GMAIL_USER && GMAIL_APP_PASSWORD);
}
