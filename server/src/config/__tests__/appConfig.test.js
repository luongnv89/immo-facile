/**
 * Shared configuration single-sourcing tests.
 * Guards: defaults live only here; env overrides resolve lazily;
 * PDF layout values reproduce the legacy magic numbers verbatim
 * so generated quittances stay visually unchanged.
 */
const {
  LANDLORD_DEFAULTS,
  PROPERTY_ADDRESS,
  PAYMENT_CITY,
  PAYMENT_DUE_DAY,
  PAYMENT_METHODS,
  getLandlordIdentity,
  PDF_LAYOUT,
} = require('../appConfig');

describe('appConfig (#49) — one source of truth', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  describe('landlord identity', () => {
    it('exposes the historical French defaults exactly once', () => {
      expect(LANDLORD_DEFAULTS).toEqual({
        name: 'NGUYEN Van Luong',
        address1: '12 rue de la Paix',
        address2: '78000 Versailles',
        signature: 'NGUYEN Van Luong',
      });
    });

    it('getLandlordIdentity falls back to defaults without env vars', () => {
      delete process.env.LANDLORD_NAME;
      delete process.env.LANDLORD_ADDRESS1;
      delete process.env.LANDLORD_ADDRESS2;
      delete process.env.LANDLORD_SIGNATURE;

      expect(getLandlordIdentity()).toEqual({
        name: 'NGUYEN Van Luong',
        address1: '12 rue de la Paix',
        address2: '78000 Versailles',
        signature: 'NGUYEN Van Luong',
      });
    });

    it('getLandlordIdentity resolves env at call time', () => {
      process.env.LANDLORD_NAME = 'Test Propriétaire';
      process.env.LANDLORD_ADDRESS1 = '1 rue Test';

      const identity = getLandlordIdentity();
      expect(identity.name).toBe('Test Propriétaire');
      expect(identity.address1).toBe('1 rue Test');
      expect(identity.address2).toBe('78000 Versailles');
    });
  });

  describe('shared business constants', () => {
    it('keeps the property address printed on every quittance', () => {
      expect(PROPERTY_ADDRESS).toBe('4 rue Maurice Berteaux, 91120 Palaiseau');
    });

    it('names the payment city of the "Fait à" line', () => {
      expect(PAYMENT_CITY).toBe('Versailles');
    });

    it('pins rent due day to the 5th of the following month', () => {
      expect(PAYMENT_DUE_DAY).toBe(5);
    });

    it('lists the accepted payment methods', () => {
      expect(PAYMENT_METHODS).toEqual(['bank_transfer', 'check', 'cash', 'other']);
    });
  });

  describe('PDF layout constants (#49 — named, not magic)', () => {
    it('reproduces the legacy page and border geometry verbatim', () => {
      expect(PDF_LAYOUT.page).toEqual({ margin: 50, size: 'A4' });
      expect(PDF_LAYOUT.borderInset).toBe(30);
    });

    it('reproduces the legacy block coordinates verbatim', () => {
      expect(PDF_LAYOUT.header).toEqual({ x: 50, y: 70, fontSize: 18 });
      expect(PDF_LAYOUT.landlordBlock).toEqual({
        x: 70,
        startY: 130,
        lineStep: 15,
        fontSize: 10,
      });
      expect(PDF_LAYOUT.tenantBlock).toEqual({
        x: 350,
        startY: 175,
        lineStep: 15,
        dateY: 220,
        fontSize: 10,
      });
      expect(PDF_LAYOUT.propertyBlock).toEqual({
        labelX: 70,
        labelY: 240,
        addressX: 225,
        addressY: 255,
        fontSize: 11,
      });
    });

    it('reproduces the declaration and payment-detail rows verbatim', () => {
      expect(PDF_LAYOUT.declaration).toEqual({
        x: 70,
        startY: 285,
        lineStep: 15,
        fontSize: 11,
      });
      expect(PDF_LAYOUT.paymentDetails).toEqual({
        headingX: 70,
        headingY: 365,
        labelX: 70,
        valueX: 200,
        rentY: 390,
        chargesY: 410,
        energyContributionY: 430,
        totalY: 455,
        fontSize: 11,
      });
      expect(PDF_LAYOUT.paymentDate).toEqual({ x: 70, y: 480, fontSize: 11 });
    });

    it('reproduces signature and footer geometry verbatim', () => {
      expect(PDF_LAYOUT.signature).toEqual({
        x: 70,
        imageY: 520,
        textY: 540,
        imageFitWidth: 200,
        imageFitHeight: 60,
        fontSize: 11,
      });
      expect(PDF_LAYOUT.footer).toEqual({
        x: 70,
        startY: 595,
        lineStep: 15,
        referenceHeadingY: 665,
        lawReferenceY: 680,
        fontSize: 9,
      });
    });
  });
});
