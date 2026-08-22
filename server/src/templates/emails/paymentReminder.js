// Task 1.4 (#19): visible privacy notice required by GDPR guardrails
const PRIVACY_NOTICE_TEXT =
  'Confidentialite : cet email inclut un pixel de suivi pour confirmer la bonne reception de vos documents. Aucune donnee personnelle n est partagee avec des tiers. Contactez votre gestionnaire pour exercer vos droits (acces, rectification, suppression).';
const PRIVACY_NOTICE_HTML =
  "Confidentialité : cet email inclut un pixel de suivi pour confirmer la bonne réception de vos documents. Aucune donnée personnelle n'est partagée avec des tiers. Contactez votre gestionnaire pour exercer vos droits (accès, rectification, suppression).";

/**
 * Payment Reminder Email Template
 * Task 1.2.1: Email Template System
 *
 * Responsive HTML email template for payment reminders
 */

/**
 * Generate payment reminder email HTML
 * @param {Object} data - Email data
 * @param {Object} data.tenant - Tenant information
 * @param {Object} data.receipt - Receipt information
 * @param {number} data.daysOverdue - Number of days overdue
 * @param {string} data.trackingToken - Email tracking token
 * @param {string} data.serverUrl - Server URL for tracking pixel
 * @returns {string} HTML email content
 */
function generatePaymentReminderHTML(data) {
  const { tenant, receipt, daysOverdue, trackingToken, serverUrl } = data;

  // Determine urgency level based on days overdue
  const urgencyLevel = daysOverdue <= 3 ? 'low' : daysOverdue <= 7 ? 'medium' : 'high';
  const urgencyColors = {
    low: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    medium: { bg: '#fed7aa', border: '#ea580c', text: '#7c2d12' },
    high: { bg: '#fecaca', border: '#dc2626', text: '#7f1d1d' },
  };
  const colors = urgencyColors[urgencyLevel];

  // Customize message based on days overdue
  let greeting, message, actionText;

  if (daysOverdue <= 3) {
    greeting = 'Rappel amical';
    message = `Nous vous rappelons que le paiement de votre loyer pour ${receipt.month}/${receipt.year} est en attente depuis ${daysOverdue} jour${daysOverdue > 1 ? 's' : ''}.`;
    actionText = 'Merci de procéder au paiement dans les plus brefs délais.';
  } else if (daysOverdue <= 7) {
    greeting = 'Rappel important';
    message = `Le paiement de votre loyer pour ${receipt.month}/${receipt.year} est en retard de ${daysOverdue} jours.`;
    actionText = 'Nous vous prions de régulariser votre situation rapidement.';
  } else {
    greeting = 'Rappel urgent';
    message = `Le paiement de votre loyer pour ${receipt.month}/${receipt.year} est en retard de ${daysOverdue} jours.`;
    actionText = 'Merci de nous contacter immédiatement pour régulariser votre situation.';
  }

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Rappel de paiement - ImmoFacile</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                ImmoFacile
              </h1>
              <p style="margin: 8px 0 0 0; color: #e0e7ff; font-size: 14px;">
                Gestion locative simplifiée
              </p>
            </td>
          </tr>
          
          <!-- Urgency Banner -->
          <tr>
            <td style="padding: 0;">
              <div style="background-color: ${colors.bg}; border-left: 4px solid ${colors.border}; padding: 16px 40px;">
                <p style="margin: 0; color: ${colors.text}; font-size: 16px; font-weight: 600;">
                  ⚠️ ${greeting}
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                Bonjour ${tenant.gender === 'M' ? 'Monsieur' : 'Madame'} <strong>${tenant.lastName}</strong>,
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                ${message}
              </p>
              
              <!-- Receipt Details Card -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #111827; font-weight: 600;">
                      Détails du paiement
                    </h2>
                    
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">
                          Période
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 600; text-align: right;">
                          ${receipt.month}/${receipt.year}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">
                          Montant
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 600; text-align: right;">
                          ${receipt.amount.toFixed(2)} €
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">
                          Jours de retard
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: ${colors.text}; font-weight: 700; text-align: right;">
                          ${daysOverdue} jour${daysOverdue > 1 ? 's' : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0; font-size: 16px; line-height: 1.6; color: #374151;">
                ${actionText}
              </p>
              
              <!-- Call to Action -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                <tr>
                  <td style="text-align: center;">
                    <div style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 6px; display: inline-block; font-size: 16px; font-weight: 600; text-decoration: none;">
                      Effectuer le paiement
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                Si vous avez déjà effectué ce paiement, merci de nous en informer ou d'ignorer ce message.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #374151; font-weight: 600;">
                Cordialement,
              </p>
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280;">
                Votre gestionnaire immobilier<br>
                ImmoFacile
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">
              
              <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                Cet email a été généré automatiquement par ImmoFacile.<br>
                Pour toute question, veuillez contacter votre gestionnaire.<br>
                <span data-privacy-notice>${PRIVACY_NOTICE_HTML}</span><br>
                <a href="#" style="color: #2563eb; text-decoration: none;">Politique de confidentialité</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
  
  <!-- Tracking Pixel -->
  ${trackingToken ? `<img src="${serverUrl}/api/receipts/track/${trackingToken}" width="1" height="1" alt="" style="display:block; border:0;" />` : ''}
</body>
</html>
  `;
}

/**
 * Generate payment reminder email plain text version
 * @param {Object} data - Email data
 * @returns {string} Plain text email content
 */
function generatePaymentReminderText(data) {
  const { tenant, receipt, daysOverdue } = data;

  let greeting, message, actionText;

  if (daysOverdue <= 3) {
    greeting = 'Rappel amical';
    message = `Nous vous rappelons que le paiement de votre loyer pour ${receipt.month}/${receipt.year} est en attente depuis ${daysOverdue} jour${daysOverdue > 1 ? 's' : ''}.`;
    actionText = 'Merci de procéder au paiement dans les plus brefs délais.';
  } else if (daysOverdue <= 7) {
    greeting = 'Rappel important';
    message = `Le paiement de votre loyer pour ${receipt.month}/${receipt.year} est en retard de ${daysOverdue} jours.`;
    actionText = 'Nous vous prions de régulariser votre situation rapidement.';
  } else {
    greeting = 'Rappel urgent';
    message = `Le paiement de votre loyer pour ${receipt.month}/${receipt.year} est en retard de ${daysOverdue} jours.`;
    actionText = 'Merci de nous contacter immédiatement pour régulariser votre situation.';
  }

  return `
ImmoFacile - ${greeting}

Bonjour ${tenant.gender === 'M' ? 'Monsieur' : 'Madame'} ${tenant.lastName},

${message}

Détails du paiement :
- Période : ${receipt.month}/${receipt.year}
- Montant : ${receipt.amount.toFixed(2)} €
- Jours de retard : ${daysOverdue} jour${daysOverdue > 1 ? 's' : ''}

${actionText}

Si vous avez déjà effectué ce paiement, merci de nous en informer ou d'ignorer ce message.

Cordialement,
Votre gestionnaire immobilier
ImmoFacile

---
Cet email a été généré automatiquement par ImmoFacile.
Pour toute question, veuillez contacter votre gestionnaire.

${PRIVACY_NOTICE_TEXT}
  `.trim();
}

module.exports = {
  generatePaymentReminderHTML,
  generatePaymentReminderText,
};
