/**
 * Upload magic-byte validation.
 * Multer's fileFilter only trusts the client-declared MIME type; these
 * helpers verify the actual bytes match an allowlisted image format.
 */
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

/** Signature bytes for the allowlisted image formats. */
const SIGNATURES = [
  { ext: '.jpg', bytes: [0xff, 0xd8, 0xff] }, // JPEG
  { ext: '.jpeg', bytes: [0xff, 0xd8, 0xff] },
  {
    ext: '.png',
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // PNG
  },
  {
    ext: '.webp',
    check: buf =>
      buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buf.subarray(8, 12).toString('ascii') === 'WEBP',
  },
];

const extensionAllowed = filename =>
  ALLOWED_EXTENSIONS.has(require('path').extname(filename).toLowerCase());

/**
 * @returns true when the buffer starts with a known image signature.
 */
const hasImageMagicBytes = buffer => {
  if (!buffer || buffer.length < 12) return false;
  return SIGNATURES.some(sig =>
    sig.check ? sig.check(buffer) : sig.bytes.every((b, i) => buffer[i] === b)
  );
};

module.exports = { extensionAllowed, hasImageMagicBytes };
