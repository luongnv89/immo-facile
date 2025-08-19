const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Configure email transporter based on environment variables
    const emailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true' || false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    };

    // Only create transporter if email credentials are provided
    if (emailConfig.auth.user && emailConfig.auth.pass) {
      this.transporter = nodemailer.createTransport(emailConfig);
      console.log('Email service initialized successfully');
    } else {
      console.warn('Email service not initialized - missing EMAIL_USER or EMAIL_PASSWORD environment variables');
    }
  }

  async sendReceiptEmail(tenant, receiptData, filePath) {
    if (!this.transporter) {
      throw new Error('Email service not configured. Please set EMAIL_USER and EMAIL_PASSWORD environment variables.');
    }

    if (!tenant.email) {
      throw new Error('Tenant email address not found');
    }

    if (!fs.existsSync(filePath)) {
      throw new Error('Receipt file not found');
    }

    const { month, year, amount, charges } = receiptData;
    const totalAmount = amount + (charges || 0);
    
    // Create email content in French
    const subject = `Quittance de loyer - ${month}/${year} - ${tenant.firstName} ${tenant.lastName}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
          ImmoFacile - Quittance de Loyer
        </h2>
        
        <p>Bonjour ${tenant.gender === 'M' ? 'Monsieur' : 'Madame'} ${tenant.lastName},</p>
        
        <p>Veuillez trouver ci-joint votre quittance de loyer pour la période suivante :</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Détails de la quittance</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 8px 0;"><strong>Période :</strong> ${month}/${year}</li>
            <li style="margin: 8px 0;"><strong>Locataire :</strong> ${tenant.firstName} ${tenant.lastName}</li>
            <li style="margin: 8px 0;"><strong>Montant du loyer :</strong> ${amount.toFixed(2)} €</li>
            ${charges > 0 ? `<li style="margin: 8px 0;"><strong>Charges :</strong> ${charges.toFixed(2)} €</li>` : ''}
            <li style="margin: 8px 0; border-top: 1px solid #d1d5db; padding-top: 8px;">
              <strong>Total payé :</strong> ${totalAmount.toFixed(2)} €
            </li>
          </ul>
        </div>
        
        <p>Cette quittance atteste du paiement intégral de votre loyer pour la période mentionnée.</p>
        
        <p>Cordialement,<br>
        <strong>Votre gestionnaire immobilier</strong><br>
        ImmoFacile</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280;">
          Cet email a été généré automatiquement par ImmoFacile. 
          Merci de conserver cette quittance pour vos dossiers.
        </p>
      </div>
    `;

    const textContent = `
ImmoFacile - Quittance de Loyer

Bonjour ${tenant.gender === 'M' ? 'Monsieur' : 'Madame'} ${tenant.lastName},

Veuillez trouver ci-joint votre quittance de loyer pour la période suivante :

Détails de la quittance :
- Période : ${month}/${year}
- Locataire : ${tenant.firstName} ${tenant.lastName}
- Montant du loyer : ${amount.toFixed(2)} €
${charges > 0 ? `- Charges : ${charges.toFixed(2)} €` : ''}
- Total payé : ${totalAmount.toFixed(2)} €

Cette quittance atteste du paiement intégral de votre loyer pour la période mentionnée.

Cordialement,
Votre gestionnaire immobilier
ImmoFacile

---
Cet email a été généré automatiquement par ImmoFacile.
Merci de conserver cette quittance pour vos dossiers.
    `;

    const mailOptions = {
      from: {
        name: 'ImmoFacile',
        address: process.env.EMAIL_USER
      },
      to: tenant.email,
      subject: subject,
      text: textContent,
      html: htmlContent,
      attachments: [
        {
          filename: path.basename(filePath),
          path: filePath,
          contentType: 'application/pdf'
        }
      ]
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return {
        success: true,
        messageId: info.messageId,
        recipient: tenant.email
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async testConnection() {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'Email service connection verified' };
    } catch (error) {
      throw new Error(`Email service connection failed: ${error.message}`);
    }
  }
}

// Export singleton instance
module.exports = new EmailService();
