import { Resend } from "resend";

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export const DEFAULT_FROM_SENDER = "Aegis Health AI <care@aegishealthai.co.in>";

/**
 * Brand Assets hosted on the verified production domain
 */
export const BRAND_ASSETS = {
  logoShield: "https://aegishealthai.co.in/aegis-logo-transparent.png",
  logoHorizontalDark: "https://aegishealthai.co.in/aegis-horizontal-brand-dark.png",
  logoHorizontalTransparent: "https://aegishealthai.co.in/aegis-horizontal-brand-transparent.png",
  nvidiaBadge: "https://aegishealthai.co.in/nvidia-inception-badge.png",
  siteUrl: "https://aegishealthai.co.in",
  dashboardUrl: "https://aegishealthai.co.in/dashboard",
  privacyUrl: "https://aegishealthai.co.in/privacy",
  securityUrl: "https://aegishealthai.co.in/security",
};

/**
 * Lazily instantiate Resend client using runtime environment secret
 */
export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable.");
  }
  return new Resend(apiKey);
}

/**
 * Apple Design System (HIG) Email Template Wrapper
 * - Canvas: Apple signature neutral (#f5f5f7)
 * - Container: Pure white card (#ffffff), 16px radius, hairline border, soft diffused shadow
 * - Typography: SF Pro Display / Text stack (-apple-system, BlinkMacSystemFont)
 * - Bulletproof Buttons: Table-cell nested styling for 100% Gmail/Outlook rendering
 */
export function renderEmailLayout(params: {
  preheader: string;
  badgeText?: string;
  badgeType?: "info" | "success" | "warning" | "critical";
  title: string;
  subtitle?: string;
  contentHtml: string;
  actionButton?: {
    label: string;
    url: string;
  };
}): string {
  const badgeColors = {
    info: { bg: "#f0fdfa", text: "#0f766e", border: "#ccfbf1" },
    success: { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0" },
    warning: { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
    critical: { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" },
  };

  const badge = badgeColors[params.badgeType || "info"];

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(params.title)}</title>
  <!--[if mso]>
  <style type="text/css">
    table, td, div, p, a, span { font-family: -apple-system, 'SF Pro Text', Helvetica, Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: 0 auto !important; border-radius: 0 !important; }
      .email-content { padding: 28px 20px !important; }
      .email-header { padding: 24px 20px 20px 20px !important; }
      .email-footer { padding: 24px 20px !important; }
      .responsive-title { font-size: 22px !important; line-height: 1.3 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; width: 100% !important; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #1d1d1f;">

  <!-- Hidden Preheader Preview Text -->
  <div style="display: none; font-size: 1px; color: #f5f5f7; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${escapeHtml(params.preheader)}
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f7; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        
        <!-- MAIN CARD -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 580px; background-color: #ffffff; border-radius: 18px; border: 1px solid #e5e5ea; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05); overflow: hidden;">
          
          <!-- BRAND HEADER: Crystal-clear Apple aesthetic with official Aegis logo & typography -->
          <tr>
            <td class="email-header" style="background-color: #ffffff; padding: 32px 36px 24px 36px; border-bottom: 1px solid #f0f0f2;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" valign="middle">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <!-- Official Aegis Shield Icon with Retina Crispness -->
                        <td valign="middle" style="padding-right: 14px;">
                          <a href="${BRAND_ASSETS.siteUrl}" target="_blank" style="text-decoration: none; display: block;">
                            <img 
                              src="${BRAND_ASSETS.logoShield}" 
                              alt="Aegis Health AI" 
                              width="46" 
                              height="46" 
                              style="display: block; width: 46px; height: 46px; border: 0; outline: none;" 
                            />
                          </a>
                        </td>
                        <td valign="middle">
                          <a href="${BRAND_ASSETS.siteUrl}" target="_blank" style="text-decoration: none; color: inherit; display: block;">
                            <span style="font-size: 20px; font-weight: 800; color: #0a192f; letter-spacing: -0.025em; display: block; line-height: 1.2;">
                              Aegis <span style="color: #059669;">Health AI</span>
                            </span>
                            <span style="font-size: 11px; font-weight: 600; color: #0f766e; letter-spacing: 0.5px; text-transform: uppercase; display: block; margin-top: 2px;">
                              Clinical Intelligence Platform
                            </span>
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" valign="middle">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-left: auto;">
                      <tr>
                        <td align="right">
                          <span style="display: inline-block; padding: 5px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 980px; background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;">
                            Verified Session
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CARD BODY -->
          <tr>
            <td class="email-content" style="padding: 36px 36px 28px 36px; background-color: #ffffff;">
              
              ${params.badgeText ? `
              <div style="margin-bottom: 14px;">
                <span style="display: inline-block; padding: 4px 12px; font-size: 12px; font-weight: 600; border-radius: 980px; background-color: ${badge.bg}; color: ${badge.text}; border: 1px solid ${badge.border}; letter-spacing: 0.1px;">
                  ${escapeHtml(params.badgeText)}
                </span>
              </div>` : ""}

              <h1 class="responsive-title" style="margin: 0 0 10px 0; font-size: 24px; font-weight: 700; color: #1d1d1f; letter-spacing: -0.025em; line-height: 1.25;">
                ${escapeHtml(params.title)}
              </h1>

              ${params.subtitle ? `
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #86868b; line-height: 1.47; font-weight: 400;">
                ${escapeHtml(params.subtitle)}
              </p>` : `<div style="margin-bottom: 24px;"></div>`}

              <!-- Main Content Body -->
              <div style="color: #1d1d1f; font-size: 15px; line-height: 1.55;">
                ${params.contentHtml}
              </div>

              <!-- BULLETPROOF APPLE PILL ACTION BUTTON -->
              ${params.actionButton ? `
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 36px; margin-bottom: 8px;">
                <tr>
                  <td align="center">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <td align="center" bgcolor="#0f766e" style="border-radius: 980px; background-color: #0f766e; box-shadow: 0 4px 14px rgba(15, 118, 110, 0.35);">
                          <a href="${params.actionButton.url}" target="_blank" style="display: inline-block; padding: 14px 34px; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff !important; text-decoration: none; border-radius: 980px; letter-spacing: -0.01em; border: 1px solid #0f766e;">
                            ${escapeHtml(params.actionButton.label)} &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>` : ""}

            </td>
          </tr>

          <!-- INSTITUTIONAL DIVIDER -->
          <tr>
            <td style="padding: 0 36px;">
              <hr style="border: 0; border-top: 1px solid #e5e5ea; margin: 0;" />
            </td>
          </tr>

          <!-- APPLE HIG STYLE INSTITUTIONAL FOOTER -->
          <tr>
            <td class="email-footer" style="background-color: #fafafc; padding: 32px 36px 36px 36px; color: #86868b; font-size: 12px; line-height: 1.55;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                
                <!-- Official Partner & Acceleration Recognition Badges -->
                <tr>
                  <td align="center" style="padding-bottom: 22px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                      <tr>
                        <!-- NVIDIA Inception Official Member Badge -->
                        <td align="center" valign="middle" style="padding: 0 8px;">
                          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 5px 12px; display: inline-block; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                            <a href="https://www.nvidia.com/en-us/startups/" target="_blank" style="text-decoration: none; display: block;">
                              <img 
                                src="${BRAND_ASSETS.nvidiaBadge}" 
                                alt="Member of NVIDIA Inception Program" 
                                width="108" 
                                height="47" 
                                style="display: block; width: 108px; height: auto; border: 0;" 
                              />
                            </a>
                          </div>
                        </td>
                        <!-- AWS Activate Approved Startup Badge -->
                        <td align="center" valign="middle" style="padding: 0 8px;">
                          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 15px; display: inline-block; box-shadow: 0 1px 3px rgba(0,0,0,0.04); text-align: left;">
                            <span style="font-size: 10px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px; text-transform: uppercase; display: block; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;">
                              AWS Activate
                            </span>
                            <span style="font-size: 10.5px; font-weight: 600; color: #059669; display: block; letter-spacing: 0.2px;">
                              Startup Member
                            </span>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <strong style="color: #1d1d1f; font-weight: 600;">Aegis Health AI Platform</strong> &bull; Clinical Intelligence &amp; Diagnostic Telemetry<br />
                    Registered MSME Udyam: <span style="font-family: SF Mono, Monaco, Consolas, monospace; color: #48484a;">UDYAM-MH-33-0782403</span> &bull; Mumbai, MH, India
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 16px; font-size: 11px; color: #86868b; line-height: 1.5;">
                    <strong>Privacy by Architecture:</strong> Zero health data monetization &bull; Zero third-party trackers &bull; DPDP Act 2023 Compliant.<br />
                    Compute sponsored by the <strong>NVIDIA Inception Program</strong> &amp; <strong>AWS Activate Startup</strong>.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="border-top: 1px solid #e5e5ea; padding-top: 16px; font-size: 12px;">
                    <a href="${BRAND_ASSETS.dashboardUrl}" target="_blank" style="color: #0f766e; text-decoration: none; font-weight: 500;">Clinical Dashboard</a> &nbsp;&bull;&nbsp;
                    <a href="${BRAND_ASSETS.securityUrl}" target="_blank" style="color: #0f766e; text-decoration: none; font-weight: 500;">Security Center</a> &nbsp;&bull;&nbsp;
                    <a href="${BRAND_ASSETS.privacyUrl}" target="_blank" style="color: #0f766e; text-decoration: none; font-weight: 500;">Privacy Protocol</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        
        <!-- SUB-FOOTER REASSURANCE -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin-top: 16px;">
          <tr>
            <td align="center" style="color: #a1a1a6; font-size: 11px; line-height: 1.4;">
              This automated notification was sent to verify account activity. Please do not reply directly to this email.
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}

/**
 * Base transactional email dispatcher with idempotency support
 */
export async function sendTransactionalEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  idempotencyKey?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}): Promise<SendEmailResult> {
  try {
    const resend = getResendClient();
    const fromAddress = options.from || DEFAULT_FROM_SENDER;

    const { data, error } = await resend.emails.send(
      {
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo || "care@aegishealthai.co.in",
        attachments: options.attachments,
      },
      options.idempotencyKey ? { headers: { "Idempotency-Key": options.idempotencyKey } } : undefined
    );

    if (error) {
      console.error("[Resend] Email dispatch error:", error);
      return { success: false, error: error.message };
    }

    console.log(`[Resend] Email sent successfully. ID: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Resend] Unexpected exception during email dispatch:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * 1. Apple-Grade Security / Login Notification Email
 */
export async function sendLoginNotificationEmail(params: {
  userEmail: string;
  displayName?: string;
  timestamp?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  authMethod?: string;
}): Promise<SendEmailResult> {
  const timeString = params.timestamp || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST";
  const name = params.displayName || params.userEmail.split("@")[0] || "Aegis Member";

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #1d1d1f;">
      Hello <strong>${escapeHtml(name)}</strong>,
    </p>
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #3a3a3c; line-height: 1.5;">
      Your account was just used to sign in to the <strong>Aegis Health AI</strong> clinical portal.
    </p>

    <!-- Apple HIG Inset Grouped Telemetry Box -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f7; border: 1px solid #e5e5ea; border-radius: 14px; margin: 20px 0; overflow: hidden;">
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid #e5e5ea;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="color: #86868b; font-size: 13px; font-weight: 500; width: 120px;">Date & Time</td>
              <td align="right" style="color: #1d1d1f; font-size: 13px; font-weight: 600;">${escapeHtml(timeString)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid #e5e5ea;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="color: #86868b; font-size: 13px; font-weight: 500; width: 120px;">Device & Client</td>
              <td align="right" style="color: #1d1d1f; font-size: 13px; font-weight: 600;">${escapeHtml(params.deviceType || "Web Browser")}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid #e5e5ea;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="color: #86868b; font-size: 13px; font-weight: 500; width: 120px;">Identity Method</td>
              <td align="right" style="color: #1d1d1f; font-size: 13px; font-weight: 600;">${escapeHtml(params.authMethod || "Google OAuth 2.0")}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 18px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="color: #86868b; font-size: 13px; font-weight: 500; width: 120px;">Session Status</td>
              <td align="right" style="color: #15803d; font-size: 13px; font-weight: 600;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #22c55e; margin-right: 6px; vertical-align: middle;"></span>Active &bull; Token Verified
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Subtle Safety Reassurance -->
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 18px; margin-top: 24px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td valign="top" style="width: 24px; padding-right: 10px; font-size: 16px;">
            🔒
          </td>
          <td valign="top" style="color: #166534; font-size: 13px; line-height: 1.5;">
            <strong>Did not perform this sign-in?</strong><br />
            If you do not recognize this activity, visit your <a href="${BRAND_ASSETS.securityUrl}" style="color: #0f766e; text-decoration: underline; font-weight: 600;">Security Center</a> immediately to revoke all active tokens.
          </td>
        </tr>
      </table>
    </div>
  `;

  const html = renderEmailLayout({
    preheader: `Sign-in confirmation for ${params.userEmail} on ${timeString}.`,
    badgeText: "Security Notice",
    badgeType: "info",
    title: "New Sign-in to Your Account",
    subtitle: "We're verifying that this session was authorized by you.",
    contentHtml,
    actionButton: {
      label: "Open Clinical Dashboard",
      url: BRAND_ASSETS.dashboardUrl,
    },
  });

  return sendTransactionalEmail({
    to: params.userEmail,
    subject: `[Aegis Health AI] New Sign-in Detected (${timeString})`,
    html,
  });
}

/**
 * 2. Welcome & Onboarding Email
 */
export async function sendWelcomeEmail(params: {
  userEmail: string;
  displayName?: string;
}): Promise<SendEmailResult> {
  const name = params.displayName || params.userEmail.split("@")[0] || "Aegis Member";

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #1d1d1f;">Welcome, <strong>${escapeHtml(name)}</strong>,</p>
    <p style="margin: 0 0 24px 0; font-size: 15px; color: #3a3a3c; line-height: 1.5;">
      Thank you for activating your profile on <strong>Aegis Health AI</strong> — India's grant-funded clinical intelligence platform.
    </p>

    <!-- 3 Action Cards -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f7; border: 1px solid #e5e5ea; border-radius: 14px; margin: 20px 0; overflow: hidden;">
      <tr>
        <td style="padding: 16px 18px; border-bottom: 1px solid #e5e5ea;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td valign="top" style="width: 32px; padding-right: 12px; font-size: 18px;">📄</td>
              <td valign="top">
                <strong style="color: #1d1d1f; font-size: 14px; display: block; margin-bottom: 2px;">1. Instant Lab Report OCR</strong>
                <span style="color: #86868b; font-size: 13px; line-height: 1.4; display: block;">Upload any blood test PDF to map 40+ biomarkers into longitudinal trajectory charts.</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 18px; border-bottom: 1px solid #e5e5ea;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td valign="top" style="width: 32px; padding-right: 12px; font-size: 18px;">💊</td>
              <td valign="top">
                <strong style="color: #1d1d1f; font-size: 14px; display: block; margin-bottom: 2px;">2. Drug-Drug & Drug-Lab Matrix</strong>
                <span style="color: #86868b; font-size: 13px; line-height: 1.4; display: block;">Real-time medication safety checks with FDA Boxed Warning and FAERS telemetry.</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 18px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td valign="top" style="width: 32px; padding-right: 12px; font-size: 18px;">🩺</td>
              <td valign="top">
                <strong style="color: #1d1d1f; font-size: 14px; display: block; margin-bottom: 2px;">3. Multi-Specialist AI Lounge</strong>
                <span style="color: #86868b; font-size: 13px; line-height: 1.4; display: block;">Consult with specialized Cardiology, Endocrinology, and Functional Medicine boards.</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  const html = renderEmailLayout({
    preheader: `Welcome to Aegis Health AI. Your personalized clinical dashboard is ready.`,
    badgeText: "Account Activated",
    badgeType: "success",
    title: "Welcome to Aegis Health AI",
    subtitle: "Your clinical intelligence and biomarker surveillance portal.",
    contentHtml,
    actionButton: {
      label: "Open Your Portal",
      url: BRAND_ASSETS.dashboardUrl,
    },
  });

  return sendTransactionalEmail({
    to: params.userEmail,
    subject: `Welcome to Aegis Health AI - Your Clinical Portal is Ready`,
    html,
  });
}

/**
 * 3. Phlebotomy Requisition & Booking Confirmation
 */
export async function sendPhlebotomyRequisitionEmail(params: {
  patientEmail: string;
  patientName: string;
  requisitionId: string;
  partnerLab: string;
  collectionAddress: string;
  scheduledTime: string;
  testsOrdered: string[];
  fastingRequired: boolean;
}): Promise<SendEmailResult> {
  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #1d1d1f;">
      Hello <strong>${escapeHtml(params.patientName)}</strong>,
    </p>
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #3a3a3c; line-height: 1.5;">
      Your diagnostic laboratory requisition has been scheduled with partner <strong>${escapeHtml(params.partnerLab)}</strong>.
    </p>

    <!-- Details Box -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f7; border: 1px solid #e5e5ea; border-radius: 14px; margin: 20px 0; overflow: hidden;">
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid #e5e5ea;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="color: #86868b; font-size: 13px; font-weight: 500; width: 140px;">Requisition Token</td>
              <td align="right" style="color: #0f766e; font-size: 13px; font-family: SF Mono, monospace; font-weight: 700;">#${escapeHtml(params.requisitionId)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid #e5e5ea;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="color: #86868b; font-size: 13px; font-weight: 500; width: 140px;">Appointment Time</td>
              <td align="right" style="color: #1d1d1f; font-size: 13px; font-weight: 600;">${escapeHtml(params.scheduledTime)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid #e5e5ea;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="color: #86868b; font-size: 13px; font-weight: 500; width: 140px;">Collection Site</td>
              <td align="right" style="color: #1d1d1f; font-size: 13px; font-weight: 500;">${escapeHtml(params.collectionAddress)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 18px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="color: #86868b; font-size: 13px; font-weight: 500; width: 140px;">Fasting Required</td>
              <td align="right" style="color: ${params.fastingRequired ? "#b45309" : "#166534"}; font-size: 13px; font-weight: 600;">
                ${params.fastingRequired ? "10-12h overnight fasting required" : "No fasting required"}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <h3 style="color: #1d1d1f; font-size: 15px; margin: 24px 0 10px 0; font-weight: 600;">Ordered Panels:</h3>
    <ul style="color: #3a3a3c; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
      ${params.testsOrdered.map(t => `<li><strong>${escapeHtml(t)}</strong></li>`).join("")}
    </ul>
  `;

  const html = renderEmailLayout({
    preheader: `Phlebotomy appointment #${params.requisitionId} confirmed with ${params.partnerLab} on ${params.scheduledTime}.`,
    badgeText: "Requisition Confirmed",
    badgeType: "info",
    title: "Diagnostic Requisition Scheduled",
    subtitle: `Diagnostic Partner: ${params.partnerLab}`,
    contentHtml,
    actionButton: {
      label: "View Requisition Details",
      url: BRAND_ASSETS.dashboardUrl,
    },
  });

  return sendTransactionalEmail({
    to: params.patientEmail,
    subject: `[Aegis Health AI] Phlebotomy Requisition Scheduled (#${params.requisitionId})`,
    html,
    idempotencyKey: `phlebotomy-${params.requisitionId}`,
  });
}

/**
 * 4. Lab Analysis Ready & Longitudinal Biomarker Notification
 */
export async function sendLabAnalysisReadyEmail(params: {
  patientEmail: string;
  patientName: string;
  reportName: string;
  reportDate: string;
  totalBiomarkers: number;
  outOfRangeCount: number;
  criticalCount: number;
  highlights: string[];
}): Promise<SendEmailResult> {
  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #1d1d1f;">
      Hello <strong>${escapeHtml(params.patientName)}</strong>,
    </p>
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #3a3a3c; line-height: 1.5;">
      Your diagnostic laboratory report <strong>${escapeHtml(params.reportName)}</strong> has been extracted and synthesized into your longitudinal profile.
    </p>

    <!-- Clinical Telemetry Summary Box -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f7; border: 1px solid #e5e5ea; border-radius: 14px; margin: 20px 0; overflow: hidden;">
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid #e5e5ea;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="color: #86868b; font-size: 13px; font-weight: 500; width: 140px;">Report Date</td>
              <td align="right" style="color: #1d1d1f; font-size: 13px; font-weight: 600;">${escapeHtml(params.reportDate)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid #e5e5ea;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="color: #86868b; font-size: 13px; font-weight: 500; width: 140px;">Biomarkers Mapped</td>
              <td align="right" style="color: #1d1d1f; font-size: 13px; font-weight: 700;">${params.totalBiomarkers} Parameters</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 18px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="color: #86868b; font-size: 13px; font-weight: 500; width: 140px;">Clinical Status</td>
              <td align="right" style="font-size: 13px; font-weight: 700; color: ${params.criticalCount > 0 ? '#dc2626' : params.outOfRangeCount > 0 ? '#b45309' : '#15803d'};">
                ${params.criticalCount > 0 ? `${params.criticalCount} Critical &bull; ${params.outOfRangeCount} Out of Range` : params.outOfRangeCount > 0 ? `${params.outOfRangeCount} Parameters Need Review` : 'All Key Biomarkers Optimal'}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <h3 style="color: #1d1d1f; font-size: 15px; margin: 24px 0 10px 0; font-weight: 600;">Key Insights:</h3>
    <ul style="color: #3a3a3c; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
      ${params.highlights.map(h => `<li>${escapeHtml(h)}</li>`).join("")}
    </ul>
  `;

  const html = renderEmailLayout({
    preheader: `Lab report analyzed: ${params.totalBiomarkers} biomarkers parsed from ${params.reportName}.`,
    badgeText: "Biomarker Report Ready",
    badgeType: params.criticalCount > 0 ? "critical" : params.outOfRangeCount > 0 ? "warning" : "success",
    title: "Lab Analysis & SBAR Synthesis Complete",
    subtitle: `Longitudinal trajectory updated for ${params.reportName}.`,
    contentHtml,
    actionButton: {
      label: "View Longitudinal Report & SBAR",
      url: `${BRAND_ASSETS.dashboardUrl}?tab=reports`,
    },
  });

  return sendTransactionalEmail({
    to: params.patientEmail,
    subject: `[Aegis Health AI] Lab Analysis Ready: ${params.reportName}`,
    html,
  });
}

/**
 * 5. Clinical Safety & Critical Triage Alert
 */
export async function sendCriticalTriageAlertEmail(params: {
  recipientEmail: string;
  patientName: string;
  flaggedMetric: string;
  observedValue: string;
  referenceRange: string;
  severityLevel: "CRITICAL" | "HIGH" | "URGENT";
  recommendedAction: string;
}): Promise<SendEmailResult> {
  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #1d1d1f;">
      Attention <strong>${escapeHtml(params.patientName)}</strong>,
    </p>
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #991b1b; line-height: 1.5; font-weight: 600;">
      Aegis Health AI clinical safety surveillance has flagged an acute biomarker requiring prompt attention.
    </p>

    <!-- Critical Inset Box -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 14px; margin: 20px 0; overflow: hidden;">
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid #fee2e2;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="color: #991b1b; font-size: 13px; font-weight: 600; width: 140px;">Biomarker</td>
              <td align="right" style="color: #7f1d1d; font-size: 14px; font-weight: 700;">${escapeHtml(params.flaggedMetric)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid #fee2e2;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="color: #991b1b; font-size: 13px; font-weight: 500; width: 140px;">Observed Value</td>
              <td align="right" style="color: #b91c1c; font-size: 14px; font-weight: 800; font-family: SF Mono, monospace;">${escapeHtml(params.observedValue)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 18px; border-bottom: 1px solid #fee2e2;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="color: #991b1b; font-size: 13px; font-weight: 500; width: 140px;">Standard Range</td>
              <td align="right" style="color: #4b5563; font-size: 13px; font-weight: 500;">${escapeHtml(params.referenceRange)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 14px 18px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="color: #991b1b; font-size: 13px; font-weight: 500; width: 140px;">Severity</td>
              <td align="right" style="color: #dc2626; font-size: 13px; font-weight: 800; text-transform: uppercase;">
                ${escapeHtml(params.severityLevel)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="background-color: #ffffff; border-left: 4px solid #dc2626; padding: 14px 16px; margin: 20px 0; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
      <strong style="color: #1d1d1f; font-size: 14px; display: block; margin-bottom: 4px;">Recommended Clinical Action:</strong>
      <span style="color: #374151; font-size: 13.5px; line-height: 1.5;">${escapeHtml(params.recommendedAction)}</span>
    </div>
  `;

  const html = renderEmailLayout({
    preheader: `Urgent clinical notice: ${params.flaggedMetric} flagged at ${params.observedValue}.`,
    badgeText: "Clinical Triage Flag",
    badgeType: "critical",
    title: "Urgent Biomarker Notice",
    subtitle: "Safety review flagged a value outside established thresholds.",
    contentHtml,
    actionButton: {
      label: "Open Clinical Safety Review",
      url: `${BRAND_ASSETS.dashboardUrl}?tab=specialist`,
    },
  });

  return sendTransactionalEmail({
    to: params.recipientEmail,
    subject: `[CRITICAL ALERT] Aegis Health AI: Urgent Notice for ${params.flaggedMetric}`,
    html,
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
