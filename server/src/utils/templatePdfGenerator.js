const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Template = require('../models/Template');

class TemplatePdfGenerator {
  static async generateReceipt(tenant, receiptData, templateId = null) {
    const { month, year, amount, charges = 0 } = receiptData;
    
    // Get template configuration
    let template;
    try {
      if (templateId) {
        template = await Template.findById(templateId);
      } else {
        template = await Template.findDefault();
      }
    } catch (error) {
      console.log('No template found, using fallback generation');
      // Fallback to original PDF generator
      const PDFGenerator = require('./pdfGenerator');
      return PDFGenerator.generateReceipt(tenant, receiptData);
    }

    // Get owner information
    const Owner = require('../models/Owner');
    let ownerInfo;
    try {
      ownerInfo = await Owner.getOwner();
    } catch (error) {
      console.log('No owner info found, using environment variables');
      ownerInfo = null;
    }
    
    // Format filename
    const formattedMonth = month.toString().padStart(2, '0');
    const fileName = `${year}_${formattedMonth}_quittance_de_loyer_${tenant.lastName.toUpperCase()}_${tenant.firstName}.pdf`;
    const receiptsDir = process.env.RECEIPTS_DIR || './receipts';
    
    // Ensure receipts directory exists
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }
    
    const filePath = path.join(receiptsDir, fileName);

    return new Promise((resolve, reject) => {
      try {
        // Handle template with configuration (both uploaded and custom templates now have template_data)
        // The template analyzer generates proper configurations for uploaded templates
        const templateConfig = template.template_data || {};
        const layoutConfig = templateConfig.layout || { margin: 50, pageSize: 'A4' };
        
        const doc = new PDFDocument({ 
          margin: layoutConfig.margin, 
          size: layoutConfig.pageSize 
        });
        const stream = fs.createWriteStream(filePath);
        
        doc.pipe(stream);

        // Handle background based on template configuration
        if (layoutConfig.useBackgroundImage && layoutConfig.backgroundImagePath && fs.existsSync(layoutConfig.backgroundImagePath)) {
          try {
            doc.image(layoutConfig.backgroundImagePath, 0, 0, {
              width: doc.page.width,
              height: doc.page.height
            });
          } catch (error) {
            console.warn('Could not add background image:', error);
          }
        } else if (template.background_image_path && fs.existsSync(template.background_image_path)) {
          try {
            doc.image(template.background_image_path, 0, 0, {
              width: doc.page.width,
              height: doc.page.height
            });
          } catch (error) {
            console.warn('Could not add background image:', error);
          }
        }

        // Add border if no background image
        if (!layoutConfig.useBackgroundImage && !template.background_image_path) {
          doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke();
        }

        // Format month
        const monthNumber = typeof month === 'string' && isNaN(month) ? 
          new Date(Date.parse(month + " 1, 2000")).getMonth() + 1 : 
          parseInt(month);
        const formattedMonthDisplay = monthNumber.toString().padStart(2, '0');

        // Render template sections with enhanced styling
        this.renderHeader(doc, templateConfig.header, formattedMonthDisplay, year);
        this.renderLandlordInfo(doc, templateConfig.landlordInfo, ownerInfo);
        this.renderTenantInfo(doc, templateConfig.tenantInfo, tenant);
        this.renderPropertyAddress(doc, templateConfig.propertyAddress, tenant);
        this.renderMainText(doc, templateConfig.mainText, tenant, amount, charges, monthNumber, year, ownerInfo);
        this.renderPaymentDetails(doc, templateConfig.paymentDetails, amount, charges, receiptData);
        this.renderSignature(doc, templateConfig.signature, ownerInfo);
        this.renderFooter(doc, templateConfig.footer);

        doc.end();

        stream.on('finish', () => {
          resolve({ fileName, filePath });
        });

        stream.on('error', (err) => {
          reject(err);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  static async handleUploadedTemplate(template, tenant, receiptData, ownerInfo, outputPath) {
    const { month, year, amount, charges = 0 } = receiptData;
    
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Check if uploaded file is an image or PDF
        const fileExtension = path.extname(template.template_file_path).toLowerCase();
        
        if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(fileExtension)) {
          // Handle image template
          try {
            doc.image(template.template_file_path, 0, 0, {
              width: doc.page.width,
              height: doc.page.height
            });
          } catch (error) {
            console.warn('Could not add template image:', error);
            // Fallback to blank page
            doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke();
          }
          
          // Overlay receipt data on the image template
          this.overlayReceiptData(doc, tenant, receiptData, ownerInfo);
          
        } else if (fileExtension === '.pdf') {
          // For PDF templates, we need to use a different approach
          // Since PDFKit doesn't support PDF import, we'll create a new document
          // and add the receipt data with a note about the template
          doc.fontSize(12)
             .font('Helvetica')
             .text('Receipt generated using uploaded PDF template', 50, 50);
          
          // Add receipt data
          this.overlayReceiptData(doc, tenant, receiptData, ownerInfo);
          
        } else {
          // Unsupported file type, create basic receipt
          doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke();
          this.overlayReceiptData(doc, tenant, receiptData, ownerInfo);
        }

        doc.end();

        stream.on('finish', () => {
          resolve();
        });

        stream.on('error', (err) => {
          reject(err);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  static overlayReceiptData(doc, tenant, receiptData, ownerInfo) {
    const { month, year, amount, charges = 0 } = receiptData;
    
    // Format month
    const monthNumber = typeof month === 'string' && isNaN(month) ? 
      new Date(Date.parse(month + " 1, 2000")).getMonth() + 1 : 
      parseInt(month);
    const formattedMonthDisplay = monthNumber.toString().padStart(2, '0');

    // Get owner information
    const landlordName = ownerInfo?.name || process.env.LANDLORD_NAME || 'NGUYEN Van Luong';
    const landlordAddress1 = ownerInfo?.address1 || process.env.LANDLORD_ADDRESS1 || '12 rue de la Paix';
    const landlordAddress2 = ownerInfo?.address2 || process.env.LANDLORD_ADDRESS2 || '78000 Versailles';
    const landlordSignature = ownerInfo?.signature || process.env.LANDLORD_SIGNATURE || 'NGUYEN Van Luong';

    // Overlay key information on the template
    // Position these carefully to not interfere with the template design
    
    // Header
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('black')
       .text(`Receipt for ${formattedMonthDisplay}/${year}`, 50, 80, { align: 'center' });

    // Landlord info (top left)
    doc.fontSize(10)
       .font('Helvetica')
       .text(landlordName, 70, 130)
       .text(landlordAddress1, 70, 145)
       .text(landlordAddress2, 70, 160);

    // Tenant info (top right)
    const genderTitle = tenant.gender === 'F' ? 'Madame' : 'Monsieur';
    const tenantAddress = tenant.apartmentAddress 
      ? `${tenant.apartmentAddress}, ${tenant.apartmentCity} ${tenant.apartmentPostalCode}`
      : tenant.address;

    doc.fontSize(10)
       .font('Helvetica')
       .text(`${genderTitle} ${tenant.firstName} ${tenant.lastName}`, 350, 175)
       .text(tenantAddress, 350, 190)
       .text('Date: ' + new Date().toLocaleDateString('fr-FR'), 350, 220);

    // Property address
    const propertyAddress = tenant.apartmentAddress 
      ? `${tenant.apartmentAddress}, ${tenant.apartmentCity} ${tenant.apartmentPostalCode}`
      : tenant.address;

    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text(`Property: ${propertyAddress}`, 70, 260);

    // Main text
    const totalAmount = amount + charges;
    const amountInWords = this.numberToWords(totalAmount);

    doc.fontSize(11)
       .font('Helvetica')
       .text(`I, ${landlordName}, owner of the above property, declare having`, 70, 290)
       .text(`received from ${genderTitle} ${tenant.firstName} ${tenant.lastName.toUpperCase()}, the sum of ${totalAmount} euros (${amountInWords})`, 70, 305)
       .text(`for rent and charges for the period of ${formattedMonthDisplay}/${year}`, 70, 320)
       .text('and hereby provide this receipt.', 70, 335);

    // Payment details
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text('Payment Details:', 70, 370);

    doc.fontSize(11)
       .font('Helvetica')
       .text('Rent:', 70, 395)
       .text(amount + ' euros', 200, 395)
       .text('Charges:', 70, 415)
       .text(charges + ' euros', 200, 415);

    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text('Total:', 70, 440)
       .text((amount + charges) + ' euros', 200, 440);

    // Payment date
    const paymentDate = receiptData.paymentDate ? new Date(receiptData.paymentDate) : new Date();
    doc.fontSize(11)
       .font('Helvetica')
       .text('Payment date: ' + paymentDate.toLocaleDateString('fr-FR'), 70, 465);

    // Signature
    doc.fontSize(11)
       .font('Helvetica-Oblique')
       .text(landlordSignature, 70, 500);
  }

  static renderHeader(doc, config, month, year) {
    if (!config) return;
    
    const { title = 'Quittance de loyer', fontSize = 18, fontStyle = 'bold', position = { x: 50, y: 70 }, align = 'center' } = config;
    
    doc.fontSize(fontSize);
    if (fontStyle === 'bold') {
      doc.font('Helvetica-Bold');
    } else {
      doc.font('Helvetica');
    }
    
    const headerText = `${title} du mois de ${month}/${year}`;
    doc.text(headerText, position.x, position.y, { align });
  }

  static renderLandlordInfo(doc, config, ownerInfo) {
    if (!config) return;
    
    const { position = { x: 70, y: 130 }, fontSize = 10 } = config;
    
    const landlordName = ownerInfo?.name || process.env.LANDLORD_NAME || 'NGUYEN Van Luong';
    const landlordAddress1 = ownerInfo?.address1 || process.env.LANDLORD_ADDRESS1 || '12 rue de la Paix';
    const landlordAddress2 = ownerInfo?.address2 || process.env.LANDLORD_ADDRESS2 || '78000 Versailles';

    doc.fontSize(fontSize)
       .font('Helvetica')
       .text(landlordName, position.x, position.y)
       .text(landlordAddress1, position.x, position.y + 15)
       .text(landlordAddress2, position.x, position.y + 30);
  }

  static renderTenantInfo(doc, config, tenant) {
    if (!config) return;
    
    const { position = { x: 350, y: 175 }, fontSize = 10 } = config;
    
    const genderTitle = tenant.gender === 'F' ? 'Madame' : 'Monsieur';
    const tenantAddress = tenant.apartmentAddress 
      ? `${tenant.apartmentAddress}, ${tenant.apartmentCity} ${tenant.apartmentPostalCode}`
      : tenant.address;

    doc.fontSize(fontSize)
       .font('Helvetica')
       .text(`${genderTitle} ${tenant.firstName} ${tenant.lastName}`, position.x, position.y)
       .text(tenantAddress, position.x, position.y + 15)
       .text('Fait à Versailles, le ' + new Date().toLocaleDateString('fr-FR'), position.x, position.y + 45);
  }

  static renderPropertyAddress(doc, config, tenant) {
    if (!config) return;
    
    const { position = { x: 70, y: 240 }, fontSize = 11, fontStyle = 'bold' } = config;
    
    const propertyAddress = tenant.apartmentAddress 
      ? `${tenant.apartmentAddress}, ${tenant.apartmentCity} ${tenant.apartmentPostalCode}`
      : tenant.address;

    doc.fontSize(fontSize);
    if (fontStyle === 'bold') {
      doc.font('Helvetica-Bold');
    } else {
      doc.font('Helvetica');
    }
    
    doc.text(`Adresse de la location : ${propertyAddress}`, position.x, position.y);
  }

  static renderMainText(doc, config, tenant, amount, charges, monthNumber, year, ownerInfo) {
    if (!config) return;
    
    const { position = { x: 70, y: 270 }, fontSize = 11 } = config;
    
    const landlordName = ownerInfo?.name || process.env.LANDLORD_NAME || 'NGUYEN Van Luong';
    const genderTitle = tenant.gender === 'F' ? 'Madame' : 'Monsieur';
    const totalAmount = amount + charges;
    const amountInWords = this.numberToWords(totalAmount);
    const formattedMonth = monthNumber.toString().padStart(2, '0');

    doc.fontSize(fontSize)
       .font('Helvetica')
       .text(`Je soussigné ${landlordName} propriétaire du logement désigné ci-dessus, déclare avoir`, position.x, position.y)
       .text(`reçu de ${genderTitle} ${tenant.firstName} ${tenant.lastName.toUpperCase()}, la somme de ${totalAmount} euros (${amountInWords}), au titre`, position.x, position.y + 15)
       .text(`du paiement du loyer et des charges pour la période de location du ${this.getLastDayOfPreviousMonth(monthNumber, year)}/${this.getPreviousMonthFormatted(monthNumber, year)} au ${this.getDayBeforeLastDayOfMonth(monthNumber, year)}/${formattedMonth}/${year}`, position.x, position.y + 30)
       .text('et lui en donne quittance, sous réserve de tous mes droits.', position.x, position.y + 45);
  }

  static renderPaymentDetails(doc, config, amount, charges, receiptData) {
    if (!config) return;
    
    const { position = { x: 70, y: 350 }, fontSize = 11 } = config;
    
    doc.fontSize(fontSize)
       .font('Helvetica-Bold')
       .text('Détail du règlement :', position.x, position.y);

    doc.fontSize(fontSize)
       .font('Helvetica')
       .text('Loyer :', position.x, position.y + 25)
       .text(amount + ' euros', position.x + 130, position.y + 25)
       .text('Pour charges :', position.x, position.y + 45)
       .text(charges + ' euros', position.x + 130, position.y + 45)
       .text('(le cas échéant, contribution aux économies d\'énergies) : ....... euros', position.x, position.y + 65);

    doc.fontSize(fontSize)
       .font('Helvetica-Bold')
       .text('Total :', position.x, position.y + 90)
       .text((amount + charges) + ' euros', position.x + 130, position.y + 90);

    // Payment date
    const paymentDate = receiptData.paymentDate ? new Date(receiptData.paymentDate) : new Date();
    doc.fontSize(fontSize)
       .font('Helvetica')
       .text('Date du paiement : le ' + paymentDate.toLocaleDateString('fr-FR'), position.x, position.y + 115);
  }

  static renderSignature(doc, config, ownerInfo) {
    if (!config) return;
    
    const { position = { x: 70, y: 480 } } = config;
    
    const landlordSignature = ownerInfo?.signature || process.env.LANDLORD_SIGNATURE || 'NGUYEN Van Luong';
    const ownerSignaturePath = ownerInfo?.signature_path || process.env.SIGNATURE_PATH;

    // Signature - image signature
    if (ownerSignaturePath && fs.existsSync(ownerSignaturePath)) {
      try {
        doc.image(ownerSignaturePath, position.x, position.y, { width: 150, height: 40 });
      } catch (error) {
        // Fallback to text signature if image fails
        doc.fontSize(11)
           .font('Helvetica-Oblique')
           .text(landlordSignature, position.x, position.y + 10);
      }
    } else {
      // Fallback to text signature if image doesn't exist
      doc.fontSize(11)
         .font('Helvetica-Oblique')
         .text(landlordSignature, position.x, position.y + 10);
    }
  }

  static renderFooter(doc, config) {
    if (!config) return;
    
    const { position = { x: 70, y: 580 }, fontSize = 9 } = config;
    
    doc.fontSize(fontSize)
       .font('Helvetica')
       .text('(En bas de page) Cette quittance annule tous les reçus qui auraient pu être établis précédemment en cas de', position.x, position.y)
       .text('paiement partiel du montant du présent terme. Elle est à conserver pendant trois ans par le locataire (loi n° 89-', position.x, position.y + 15)
       .text('462 du 6 juillet 1989 : art. 7-1).', position.x, position.y + 30);

    doc.fontSize(fontSize)
       .font('Helvetica-Bold')
       .text('Texte de référence :', position.x, position.y + 70);
    
    doc.fontSize(fontSize)
       .font('Helvetica')
       .text('- loi du 6.7.89 : art. 21', position.x, position.y + 85);
  }

  // Helper methods (same as original PDFGenerator)
  static numberToWords(num) {
    const ones = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
    const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];

    num = Math.round(num);

    if (num === 0) return 'zéro';
    if (num < 10) return ones[num];
    if (num >= 10 && num < 20) return teens[num - 10];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const one = num % 10;
      if (ten === 7 && one > 0) {
        return 'soixante-' + teens[one];
      }
      if (ten === 9 && one > 0) {
        return 'quatre-vingt-' + teens[one];
      }
      return tens[ten] + (one ? '-' + ones[one] : '');
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const remainder = num % 100;
      let result = (hundred === 1 ? 'cent' : ones[hundred] + ' cent');
      if (hundred > 1 && remainder === 0) {
        result += 's';
      }
      if (remainder) {
        result += ' ' + this.numberToWords(remainder);
      }
      return result;
    }
    
    if (num < 1000000) {
      const thousand = Math.floor(num / 1000);
      const remainder = num % 1000;
      let result = (thousand === 1 ? 'mille' : this.numberToWords(thousand) + ' mille');
      if (remainder) {
        result += ' ' + this.numberToWords(remainder);
      }
      return result;
    }
    
    return num.toString();
  }

  static getLastDayOfPreviousMonth(month, year) {
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
    const prevYear = monthNum === 1 ? yearNum - 1 : yearNum;
    const lastDay = new Date(prevYear, prevMonth, 0).getDate();
    return lastDay.toString().padStart(2, '0');
  }

  static getPreviousMonthFormatted(month, year) {
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
    const prevYear = monthNum === 1 ? yearNum - 1 : yearNum;
    return `${prevMonth.toString().padStart(2, '0')}/${prevYear}`;
  }

  static getDayBeforeLastDayOfMonth(month, year) {
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    const lastDay = new Date(yearNum, monthNum, 0).getDate();
    const dayBefore = lastDay - 1;
    return dayBefore.toString().padStart(2, '0');
  }
}

module.exports = TemplatePdfGenerator;
