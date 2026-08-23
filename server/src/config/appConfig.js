/**
 * Application-wide shared configuration.
 * Single source of truth for landlord identity, property address,
 * payment due day, accepted payment methods and the quittance PDF
 * layout. Every consumer imports from here; no constant may be
 * redefined locally.
 */

/**
 * Hardcoded French defaults used when neither the database owner
 * record nor the environment provides a value.
 */
const LANDLORD_DEFAULTS = Object.freeze({
  name: 'NGUYEN Van Luong',
  address1: '12 rue de la Paix',
  address2: '78000 Versailles',
  signature: 'NGUYEN Van Luong',
});

/** Address printed on every quittance ("Adresse de la location"). */
const PROPERTY_ADDRESS = '4 rue Maurice Berteaux, 91120 Palaiseau';

/** City named in the "Fait à …" line of the quittance. */
const PAYMENT_CITY = 'Versailles';

/**
 * Day of the following month on which rent is considered due
 * (drives payment reminders).
 */
const PAYMENT_DUE_DAY = 5;

/** Accepted payment_method values for Receipt.recordPayment. */
const PAYMENT_METHODS = Object.freeze(['bank_transfer', 'check', 'cash', 'other']);

/**
 * Resolve landlord identity from the environment, falling back to
 * the shared defaults above. Evaluated lazily so tests and runtime
 * can set LANDLORD_* variables dynamically.
 */
const getLandlordIdentity = () => ({
  name: process.env.LANDLORD_NAME || LANDLORD_DEFAULTS.name,
  address1: process.env.LANDLORD_ADDRESS1 || LANDLORD_DEFAULTS.address1,
  address2: process.env.LANDLORD_ADDRESS2 || LANDLORD_DEFAULTS.address2,
  signature: process.env.LANDLORD_SIGNATURE || LANDLORD_DEFAULTS.signature,
});

/**
 * Named layout constants for the quittance PDF (pdfkit coordinates).
 * Values reproduce the historical magic numbers verbatim — changing
 * any value changes the generated document pixel-for-pixel.
 */
const PDF_LAYOUT = Object.freeze({
  page: Object.freeze({ margin: 50, size: 'A4' }),
  borderInset: 30,
  header: Object.freeze({ x: 50, y: 70, fontSize: 18 }),
  landlordBlock: Object.freeze({
    x: 70,
    startY: 130,
    lineStep: 15,
    fontSize: 10,
  }),
  tenantBlock: Object.freeze({
    x: 350,
    startY: 175,
    lineStep: 15,
    dateY: 220,
    fontSize: 10,
  }),
  propertyBlock: Object.freeze({
    labelX: 70,
    labelY: 240,
    addressX: 225,
    addressY: 255,
    fontSize: 11,
  }),
  declaration: Object.freeze({ x: 70, startY: 285, lineStep: 15, fontSize: 11 }),
  paymentDetails: Object.freeze({
    headingX: 70,
    headingY: 365,
    labelX: 70,
    valueX: 200,
    rentY: 390,
    chargesY: 410,
    energyContributionY: 430,
    totalY: 455,
    fontSize: 11,
  }),
  paymentDate: Object.freeze({ x: 70, y: 480, fontSize: 11 }),
  signature: Object.freeze({
    x: 70,
    imageY: 520,
    textY: 540,
    imageFitWidth: 200,
    imageFitHeight: 60,
    fontSize: 11,
  }),
  footer: Object.freeze({
    x: 70,
    startY: 595,
    lineStep: 15,
    referenceHeadingY: 665,
    lawReferenceY: 680,
    fontSize: 9,
  }),
});

module.exports = {
  LANDLORD_DEFAULTS,
  PROPERTY_ADDRESS,
  PAYMENT_CITY,
  PAYMENT_DUE_DAY,
  PAYMENT_METHODS,
  getLandlordIdentity,
  PDF_LAYOUT,
};
