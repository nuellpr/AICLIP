import nodemailer from 'nodemailer';

export interface WelcomeEmailData {
  toEmail: string;
  toName: string;
  credits?: number;
}

/**
 * Send Welcome Email to newly registered / Google sign-in user's Gmail inbox
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  const { toEmail, toName, credits = 5 } = data;

  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const smtpUser = process.env.SMTP_USER || '';
  const smtpPass = process.env.SMTP_PASS || '';
  const smtpFrom = process.env.SMTP_FROM || 'ClipForge AI <noreply@forgeai.web.id>';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://forgeai.web.id';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #060609; color: #ffffff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #12121a; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px; text-align: center; }
        .header h1 { margin: 0; color: #000000; font-size: 26px; font-weight: 900; }
        .body { padding: 32px; font-size: 14px; line-height: 1.6; color: #d1d5db; }
        .welcome-badge { display: inline-block; background-color: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.4); color: #fbbf24; font-weight: bold; font-size: 12px; padding: 6px 12px; border-radius: 9999px; margin-bottom: 16px; }
        .highlight-box { background-color: rgba(255, 255, 255, 0.05); border-left: 4px solid #f59e0b; padding: 16px; border-radius: 12px; margin: 20px 0; }
        .highlight-box p { margin: 0; color: #ffffff; font-weight: bold; }
        .cta-button { display: inline-block; background-color: #22d3ee; color: #000000; font-weight: 900; font-size: 14px; padding: 14px 28px; border-radius: 16px; text-decoration: none; margin-top: 24px; text-align: center; }
        .footer { padding: 24px; text-align: center; font-size: 11px; color: #6b7280; border-top: 1px solid rgba(255, 255, 255, 0.05); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ClipForge AI</h1>
        </div>
        <div class="body">
          <div class="welcome-badge">🎉 Pendaftaran Berhasil</div>
          <h2 style="color: #ffffff; margin-top: 0;">Halo, ${toName || 'Pengguna ClipForge'}! 👋</h2>
          <p>Selamat datang di <strong>ClipForge AI</strong> — Platform AI Video Clipper No.1 di Indonesia.</p>

          <div class="highlight-box">
            <p>🎁 Kredit AI Anda: ${credits} Kredit Gratis Telah Aktif!</p>
            <span style="font-size: 12px; color: #9ca3af;">1 kredit = 1 proyek (3 klip viral). Gunakan kredit untuk mengubah video podcast atau video YouTube favorit Anda menjadi klip 9:16 viral secara otomatis.</span>
          </div>

          <h3 style="color: #ffffff; margin-top: 24px;">3 Langkah Mudah Membuat Klip Viral Pertama Anda:</h3>
          <ol style="padding-left: 20px; color: #d1d5db;">
            <li><strong>Tempel Link YouTube:</strong> Salin link video panjang YouTube dan tempelkan di dashboard.</li>
            <li><strong>AI Memproses Otomatis:</strong> AI akan memilih 3 momen paling seru, memotong format 9:16, memasang subtitle karaoke bahasa Indonesia, dan mengaktifkan face tracking speaker.</li>
            <li><strong>Unduh & Upload:</strong> Download klip HD Anda dan langsung unggah ke TikTok, Instagram Reels, atau YouTube Shorts!</li>
          </ol>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${appUrl}/dashboard" class="cta-button">🚀 Buka Dashboard & Bikin Klip Pertama</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2026 ClipForge AI — Auto Viral AI Clipping System. Semua hak dilindungi.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!smtpUser || !smtpPass) {
    console.log(`[Email Service Log] Welcome email queued for ${toEmail} (${toName}). Add SMTP_USER and SMTP_PASS in .env to send via live SMTP.`);
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: smtpFrom,
      to: toEmail,
      subject: `🎉 Selamat Datang di ClipForge AI! ${credits} Kredit AI Anda Sudah Aktif`,
      html: htmlContent,
    });

    console.log(`[Email Service] Welcome email successfully sent to ${toEmail}`);
    return true;
  } catch (err: any) {
    console.error(`[Email Service Error] Failed to send email to ${toEmail}:`, err.message);
    return false;
  }
}
