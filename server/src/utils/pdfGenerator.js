const PDFDocument = require('pdfkit');
const fs = require('fs');
const { sanitizeFilenameSegment, assertInsideDir } = require('./pathSafety');
const path = require('path');
const {
  PROPERTY_ADDRESS,
  PAYMENT_CITY,
  getLandlordIdentity,
  PDF_LAYOUT,
} = require('../config/appConfig');

class PDFGenerator {
  static async generateReceipt(tenant, receiptData) {
    const { month, year, amount, charges = 0 } = receiptData;

    // Get owner information first; fall back to the shared config
    // defaults when no owner record exists in the database.
    const Owner = require('../models/Owner');
    let ownerInfo;
    try {
      ownerInfo = await Owner.getOwner();
    } catch (error) {
      ownerInfo = null;
    }

    // Format filename: YYYY_MM_quittance_de_loyer_LASTNAME_Firstname.pdf
    // Task 1.2 (#17): sanitize segments so tenant names like "../../x"
    // can never escape the receipts directory.
    const formattedMonth = month.toString().padStart(2, '0');
    const fileName = `${sanitizeFilenameSegment(String(year))}_${sanitizeFilenameSegment(formattedMonth)}_quittance_de_loyer_${sanitizeFilenameSegment(tenant.lastName.toUpperCase())}_${sanitizeFilenameSegment(tenant.firstName)}.pdf`;
    const receiptsDir = process.env.RECEIPTS_DIR || './receipts';

    // Ensure receipts directory exists
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }

    // Defense in depth: the composed path must resolve inside receipts dir
    const filePath = assertInsideDir(path.join(receiptsDir, fileName), receiptsDir);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: PDF_LAYOUT.page.margin,
          size: PDF_LAYOUT.page.size,
        });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Add border
        const inset = PDF_LAYOUT.borderInset;
        doc.rect(inset, inset, doc.page.width - 2 * inset, doc.page.height - 2 * inset).stroke();

        // Task 4.4 (#40): months are integers 1-12 end-to-end.
        // Accept legacy string months ('August') defensively, but normalize
        // to an integer immediately; pad only at the display boundary.
        let monthNumber = parseInt(month);
        if (Number.isNaN(monthNumber) && typeof month === 'string') {
          const parsed = Date.parse(`${month} 1, 2000`);
          if (!Number.isNaN(parsed)) monthNumber = new Date(parsed).getMonth() + 1;
        }
        const formattedMonthDisplay = String(monthNumber).padStart(2, '0');

        // Header - Title with formatted month
        doc
          .fontSize(PDF_LAYOUT.header.fontSize)
          .font('Helvetica-Bold')
          .text(
            'Quittance de loyer du mois de ' + formattedMonthDisplay + '/' + year,
            PDF_LAYOUT.header.x,
            PDF_LAYOUT.header.y,
            {
              align: 'center',
            }
          );

        // Landlord info (left side) - database record, then environment,
        // then the shared defaults from appConfig (#49).
        const identity = getLandlordIdentity();
        const landlordName = ownerInfo?.name || identity.name;
        const landlordAddress1 = ownerInfo?.address1 || identity.address1;
        const landlordAddress2 = ownerInfo?.address2 || identity.address2;
        const landlordSignature = ownerInfo?.signature || identity.signature;
        const ownerSignaturePath = ownerInfo?.signature_path || process.env.SIGNATURE_PATH;

        doc
          .fontSize(PDF_LAYOUT.landlordBlock.fontSize)
          .font('Helvetica')
          .text(landlordName, PDF_LAYOUT.landlordBlock.x, PDF_LAYOUT.landlordBlock.startY)
          .text(
            landlordAddress1,
            PDF_LAYOUT.landlordBlock.x,
            PDF_LAYOUT.landlordBlock.startY + PDF_LAYOUT.landlordBlock.lineStep
          )
          .text(
            landlordAddress2,
            PDF_LAYOUT.landlordBlock.x,
            PDF_LAYOUT.landlordBlock.startY + 2 * PDF_LAYOUT.landlordBlock.lineStep
          );

        // Tenant info (right side)
        doc.fontSize(PDF_LAYOUT.tenantBlock.fontSize);
        const genderTitle = tenant.gender === 'F' ? 'Madame' : 'Monsieur';
        doc.text(
          `${genderTitle} ${tenant.firstName} ${tenant.lastName}`,
          PDF_LAYOUT.tenantBlock.x,
          PDF_LAYOUT.tenantBlock.startY
        );
        // Use apartment address if available, otherwise fallback to tenant address
        const tenantAddress = tenant.apartmentAddress
          ? `${tenant.apartmentAddress}, ${tenant.apartmentCity} ${tenant.apartmentPostalCode}`
          : tenant.address;
        doc.text(
          tenantAddress,
          PDF_LAYOUT.tenantBlock.x,
          PDF_LAYOUT.tenantBlock.startY + PDF_LAYOUT.tenantBlock.lineStep
        );

        // Date and location - moved lower for better spacing
        doc.text(
          `Fait à ${PAYMENT_CITY}, le ` + new Date().toLocaleDateString('fr-FR'),
          PDF_LAYOUT.tenantBlock.x,
          PDF_LAYOUT.tenantBlock.dateY
        );

        // Property address - use apartment address if available
        const propertyAddress = tenant.apartmentAddress
          ? `${tenant.apartmentAddress}, ${tenant.apartmentCity} ${tenant.apartmentPostalCode}`
          : tenant.address;
        doc
          .fontSize(PDF_LAYOUT.propertyBlock.fontSize)
          .font('Helvetica-Bold')
          .text(
            `Adresse de la location : ${propertyAddress}`,
            PDF_LAYOUT.propertyBlock.labelX,
            PDF_LAYOUT.propertyBlock.labelY
          )
          .text(
            PROPERTY_ADDRESS,
            PDF_LAYOUT.propertyBlock.addressX,
            PDF_LAYOUT.propertyBlock.addressY
          );

        // Main declaration text with gender-based title
        const totalAmount = amount + charges;
        const amountInWords = this.numberToWords(totalAmount);
        const declarationX = PDF_LAYOUT.declaration.x;
        const declarationY = line =>
          PDF_LAYOUT.declaration.startY + line * PDF_LAYOUT.declaration.lineStep;

        doc
          .fontSize(PDF_LAYOUT.declaration.fontSize)
          .font('Helvetica')
          .text(
            `Je soussigné ${landlordName} propriétaire du logement désigné ci-dessus, déclare avoir`,
            declarationX,
            declarationY(0)
          )
          .text(
            `reçu de ${genderTitle} ${tenant.firstName} ${tenant.lastName.toUpperCase()}, la somme de ${totalAmount} euros (${amountInWords}), au titre`,
            declarationX,
            declarationY(1)
          )
          .text(
            `du paiement du loyer et des charges pour la période de location du ${this.getFirstDayOfCoveredMonth(monthNumber, year)}/${this.getPreviousMonthFormatted(monthNumber, year)} au ${this.getLastDayOfCoveredMonth(monthNumber, year)}/${formattedMonthDisplay}/${year}`,
            declarationX,
            declarationY(2)
          )
          .text(
            'et lui en donne quittance, sous réserve de tous mes droits.',
            declarationX,
            declarationY(3)
          );

        // Payment details section
        const details = PDF_LAYOUT.paymentDetails;
        doc
          .fontSize(details.fontSize)
          .font('Helvetica-Bold')
          .text('Détail du règlement :', details.headingX, details.headingY);

        doc
          .fontSize(details.fontSize)
          .font('Helvetica')
          .text('Loyer :', details.labelX, details.rentY)
          .text(amount + ' euros', details.valueX, details.rentY);

        doc
          .text('Pour charges :', details.labelX, details.chargesY)
          .text(charges + ' euros', details.valueX, details.chargesY);

        doc.text(
          "(le cas échéant, contribution aux économies d'énergies) : ....... euros",
          details.labelX,
          details.energyContributionY
        );

        doc
          .fontSize(details.fontSize)
          .font('Helvetica-Bold')
          .text('Total :', details.labelX, details.totalY)
          .text(amount + charges + ' euros', details.valueX, details.totalY);

        // Payment date
        const paymentDate = receiptData.paymentDate
          ? new Date(receiptData.paymentDate)
          : new Date();
        doc
          .fontSize(PDF_LAYOUT.paymentDate.fontSize)
          .font('Helvetica')
          .text(
            'Date du paiement : le ' + paymentDate.toLocaleDateString('fr-FR'),
            PDF_LAYOUT.paymentDate.x,
            PDF_LAYOUT.paymentDate.y
          );

        // Signature - image signature
        if (ownerSignaturePath && fs.existsSync(ownerSignaturePath)) {
          try {
            doc.image(ownerSignaturePath, PDF_LAYOUT.signature.x, PDF_LAYOUT.signature.imageY, {
              fit: [PDF_LAYOUT.signature.imageFitWidth, PDF_LAYOUT.signature.imageFitHeight],
            });
          } catch (error) {
            // Fallback to text signature if image fails
            doc
              .fontSize(PDF_LAYOUT.signature.fontSize)
              .font('Helvetica-Oblique')
              .text(landlordSignature, PDF_LAYOUT.signature.x, PDF_LAYOUT.signature.textY);
          }
        } else {
          // Fallback to text signature if image doesn't exist
          doc
            .fontSize(PDF_LAYOUT.signature.fontSize)
            .font('Helvetica-Oblique')
            .text(landlordSignature, PDF_LAYOUT.signature.x, PDF_LAYOUT.signature.textY);
        }

        // Footer legal text
        const footer = PDF_LAYOUT.footer;
        const footerY = line => footer.startY + line * footer.lineStep;
        doc
          .fontSize(footer.fontSize)
          .font('Helvetica')
          .text(
            '(En bas de page) Cette quittance annule tous les reçus qui auraient pu être établis précédemment en cas de',
            footer.x,
            footerY(0)
          )
          .text(
            'paiement partiel du montant du présent terme. Elle est à conserver pendant trois ans par le locataire (loi n° 89-',
            footer.x,
            footerY(1)
          )
          .text('462 du 6 juillet 1989 : art. 7-1).', footer.x, footerY(2));

        // Reference text
        doc
          .fontSize(footer.fontSize)
          .font('Helvetica-Bold')
          .text('Texte de référence :', footer.x, footer.referenceHeadingY);

        doc
          .fontSize(footer.fontSize)
          .font('Helvetica')
          .text('- loi du 6.7.89 : art. 21', footer.x, footer.lawReferenceY);

        doc.end();

        stream.on('finish', () => {
          resolve({ fileName, filePath });
        });

        stream.on('error', err => {
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
    const tens = [
      '',
      '',
      'vingt',
      'trente',
      'quarante',
      'cinquante',
      'soixante',
      'soixante-dix',
      'quatre-vingt',
      'quatre-vingt-dix',
    ];
    const teens = [
      'dix',
      'onze',
      'douze',
      'treize',
      'quatorze',
      'quinze',
      'seize',
      'dix-sept',
      'dix-huit',
      'dix-neuf',
    ];

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
      let result = hundred === 1 ? 'cent' : ones[hundred] + ' cent';
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
      let result = thousand === 1 ? 'mille' : this.numberToWords(thousand) + ' mille';
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
    // Months are 1-based integers in this codebase; `new Date(y, m, 0)`
    // treats `m` as the 0-based index with day 0 = last day of that month,
    // so passing the 1-based number here yields the last day of the
    // PREVIOUS (m-1) calendar month — which is exactly what we want.
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

  // First day of the covered month, formatted DD (e.g. '01')
  static getFirstDayOfCoveredMonth() {
    return '01';
  }

  // Last calendar day of the covered month, formatted DD (handles leap years).
  // Same idiom as above: 1-based month + day 0 => last day of covered month.
  static getLastDayOfCoveredMonth(month, year) {
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    const lastDay = new Date(yearNum, monthNum, 0).getDate();
    return lastDay.toString().padStart(2, '0');
  }
}

module.exports = PDFGenerator;
