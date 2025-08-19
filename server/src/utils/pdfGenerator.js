const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerator {
  static async generateReceipt(tenant, receiptData) {
    const { month, year, amount, charges = 0 } = receiptData;
    
    // Get owner information first
    const Owner = require('../models/Owner');
    let ownerInfo;
    try {
      ownerInfo = await Owner.getOwner();
    } catch (error) {
      console.log('No owner info found, using environment variables');
      ownerInfo = null;
    }
    
    // Format filename: YYYY_MM_quittance_de_loyer_LASTNAME_Firstname.pdf
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
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const stream = fs.createWriteStream(filePath);
        
        doc.pipe(stream);

        // Add border
        doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke();

        // Format month as number (e.g., 08 instead of August) - do this once at the top
        const monthNumber = typeof month === 'string' && isNaN(month) ? 
          new Date(Date.parse(month + " 1, 2000")).getMonth() + 1 : 
          parseInt(month);
        const formattedMonth = monthNumber.toString().padStart(2, '0');
        
        // Debug: Log the month values
        console.log('Month input:', month, 'monthNumber:', monthNumber, 'formattedMonth:', formattedMonth);

        // Header - Title with formatted month
        doc.fontSize(18)
           .font('Helvetica-Bold')
           .text('Quittance de loyer du mois de ' + formattedMonth + '/' + year, 50, 70, { align: 'center' });

        // Landlord info (left side) - using database or environment variables as fallback
        const landlordName = ownerInfo?.name || process.env.LANDLORD_NAME || 'NGUYEN Van Luong';
        const landlordAddress1 = ownerInfo?.address1 || process.env.LANDLORD_ADDRESS1 || '12 rue de la Paix';
        const landlordAddress2 = ownerInfo?.address2 || process.env.LANDLORD_ADDRESS2 || '78000 Versailles';
        const landlordSignature = ownerInfo?.signature || process.env.LANDLORD_SIGNATURE || 'NGUYEN Van Luong';
        const ownerSignaturePath = ownerInfo?.signature_path || process.env.SIGNATURE_PATH;

        doc.fontSize(10)
           .font('Helvetica')
           .text(landlordName, 70, 130)
           .text(landlordAddress1, 70, 145)
           .text(landlordAddress2, 70, 160);

        // Tenant info (right side) - moved down 3 rows (45 pixels)
        doc.fontSize(10);
        const genderTitle = tenant.gender === 'F' ? 'Madame' : 'Monsieur';
        doc.text(`${genderTitle} ${tenant.firstName} ${tenant.lastName}`, 350, 175);
        // Use apartment address if available, otherwise fallback to tenant address
        const tenantAddress = tenant.apartmentAddress 
          ? `${tenant.apartmentAddress}, ${tenant.apartmentCity} ${tenant.apartmentPostalCode}`
          : tenant.address;
        doc.text(tenantAddress, 350, 190);

        // Date and location - moved lower for better spacing
        doc.text('Fait à Versailles, le ' + new Date().toLocaleDateString('fr-FR'), 350, 220);

        // Property address - use apartment address if available
        const propertyAddress = tenant.apartmentAddress 
          ? `${tenant.apartmentAddress}, ${tenant.apartmentCity} ${tenant.apartmentPostalCode}`
          : tenant.address;
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text(`Adresse de la location : ${propertyAddress}`, 70, 240);

        // Main declaration text with gender-based title
        const totalAmount = amount + charges;
        const amountInWords = this.numberToWords(totalAmount);
        
        doc.fontSize(11)
           .font('Helvetica')
           .text(`Je soussigné ${landlordName} propriétaire du logement désigné ci-dessus, déclare avoir`, 70, 270)
           .text(`reçu de ${genderTitle} ${tenant.firstName} ${tenant.lastName.toUpperCase()}, la somme de ${totalAmount} euros (${amountInWords}), au titre`, 70, 285)
           .text(`du paiement du loyer et des charges pour la période de location du ${this.getLastDayOfPreviousMonth(monthNumber, year)}/${this.getPreviousMonthFormatted(monthNumber, year)} au ${this.getDayBeforeLastDayOfMonth(monthNumber, year)}/${formattedMonth}/${year}`, 70, 300)
           .text('et lui en donne quittance, sous réserve de tous mes droits.', 70, 315);

        // Payment details section
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text('Détail du règlement :', 70, 350);

        doc.fontSize(11)
           .font('Helvetica')
           .text('Loyer :', 70, 375)
           .text(amount + ' euros', 200, 375);

        doc.text('Pour charges :', 70, 395)
           .text(charges + ' euros', 200, 395);

        doc.text('(le cas échéant, contribution aux économies d\'énergies) : ....... euros', 70, 415);

        doc.fontSize(11)
           .font('Helvetica-Bold')
           .text('Total :', 70, 440)
           .text((amount + charges) + ' euros', 200, 440);

        // Payment date
        const paymentDate = receiptData.paymentDate ? new Date(receiptData.paymentDate) : new Date();
        doc.fontSize(11)
           .font('Helvetica')
           .text('Date du paiement : le ' + paymentDate.toLocaleDateString('fr-FR'), 70, 465);

        // Signature - image signature
        if (ownerSignaturePath && fs.existsSync(ownerSignaturePath)) {
          try {
            doc.image(ownerSignaturePath, 70, 480, { width: 150, height: 40 });
          } catch (error) {
            // Fallback to text signature if image fails
            doc.fontSize(11)
               .font('Helvetica-Oblique')
               .text(landlordSignature, 70, 490);
          }
        } else {
          // Fallback to text signature if image doesn't exist
          doc.fontSize(11)
             .font('Helvetica-Oblique')
             .text(landlordSignature, 70, 490);
        }

        // Footer legal text
        doc.fontSize(9)
           .font('Helvetica')
           .text('(En bas de page) Cette quittance annule tous les reçus qui auraient pu être établis précédemment en cas de', 70, 580)
           .text('paiement partiel du montant du présent terme. Elle est à conserver pendant trois ans par le locataire (loi n° 89-', 70, 595)
           .text('462 du 6 juillet 1989 : art. 7-1).', 70, 610);

        // Reference text
        doc.fontSize(9)
           .font('Helvetica-Bold')
           .text('Texte de référence :', 70, 650);
        
        doc.fontSize(9)
           .font('Helvetica')
           .text('- loi du 6.7.89 : art. 21', 70, 665);

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

  static numberToWords(num) {
    // Enhanced French number to words conversion
    const ones = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
    const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];

    // Handle decimal numbers by rounding to nearest integer
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
        result += 's'; // plural form: cents
      }
      if (remainder) {
        result += ' ' + this.numberToWords(remainder);
      }
      return result;
    }
    
    // For larger numbers, return a basic conversion
    if (num < 1000000) {
      const thousand = Math.floor(num / 1000);
      const remainder = num % 1000;
      let result = (thousand === 1 ? 'mille' : this.numberToWords(thousand) + ' mille');
      if (remainder) {
        result += ' ' + this.numberToWords(remainder);
      }
      return result;
    }
    
    // For very large numbers, return the numeric value
    return num.toString();
  }

  static getLastDayOfPreviousMonth(month, year) {
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
    const prevYear = monthNum === 1 ? yearNum - 1 : yearNum;
    const lastDay = new Date(prevYear, prevMonth, 0).getDate();
    console.log('getLastDayOfPreviousMonth:', { month: monthNum, year: yearNum, prevMonth, prevYear, lastDay });
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
    console.log('getDayBeforeLastDayOfMonth:', { month: monthNum, year: yearNum, lastDay, dayBefore });
    return dayBefore.toString().padStart(2, '0');
  }
}

module.exports = PDFGenerator;
