import nodemailer from "nodemailer";
import { envFlag } from "@/lib/utils";

export type ApplyPacket = {
  jobTitle: string;
  company: string;
  applyUrl?: string | null;
  applyEmail?: string | null;
  candidateName: string;
  candidateEmail: string;
  resumeText: string;
  coverLetter: string;
};

export type ApplyResult = {
  channel: string;
  ok: boolean;
  message: string;
};

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function applyWithAdapters(packet: ApplyPacket): Promise<ApplyResult[]> {
  const results: ApplyResult[] = [];

  if (packet.applyEmail && smtpConfigured()) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: envFlag("SMTP_SECURE", false),
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: process.env.APPLY_FROM_EMAIL || packet.candidateEmail,
        to: packet.applyEmail,
        replyTo: packet.candidateEmail,
        subject: `Application: ${packet.jobTitle} — ${packet.candidateName}`,
        text: `${packet.coverLetter}\n\n---\nATS resume\n\n${packet.resumeText}`,
      });
      results.push({
        channel: "email",
        ok: true,
        message: `Emailed application to ${packet.applyEmail}`,
      });
    } catch (e) {
      results.push({
        channel: "email",
        ok: false,
        message: e instanceof Error ? e.message : "Email send failed",
      });
    }
  }

  results.push({
    channel: "packet",
    ok: true,
    message: packet.applyUrl
      ? `Application packet ready. Submit on the employer site: ${packet.applyUrl}`
      : "Application packet stored in Octave. Open the job URL and paste the ATS resume and cover letter.",
  });

  return results;
}
