import * as CryptoJS from 'crypto-js';

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  encrypted: string;
  hash: string;
}

/**
 * EncryptionService - Provides field-level encryption for PII
 *
 * Features:
 * - AES-256 encryption for sensitive data
 * - SHA-256 hashing for searchable fields
 * - Phone number special handling
 * - Key rotation support
 *
 * @example
 * ```typescript
 * const encryption = new EncryptionService(process.env.ENCRYPTION_KEY);
 *
 * // Encrypt phone number
 * const { encrypted, hash } = encryption.encryptPhone('+91-9876543210');
 *
 * // Store in database
 * await prisma.user.create({
 *   data: {
 *     phoneEncrypted: encrypted,
 *     phoneHash: hash
 *   }
 * });
 *
 * // Search by phone
 * const searchHash = encryption.hash('9876543210');
 * const user = await prisma.user.findFirst({
 *   where: { phoneHash: searchHash }
 * });
 *
 * // Decrypt phone
 * const phone = encryption.decryptPhone(user.phoneEncrypted);
 * ```
 */
export class EncryptionService {
  private readonly encryptionKey: string;

  constructor(encryptionKey?: string) {
    this.encryptionKey = encryptionKey || process.env['ENCRYPTION_KEY'] || '';

    if (!this.encryptionKey) {
      throw new Error('ENCRYPTION_KEY must be provided via constructor or environment variable');
    }

    if (this.encryptionKey.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters for security');
    }
  }

  /**
   * Encrypt sensitive data using AES-256
   *
   * @param plaintext - Data to encrypt
   * @returns Encrypted ciphertext
   * @throws Error if encryption fails
   */
  encrypt(plaintext: string): string {
    if (!plaintext) return '';

    try {
      const ciphertext = CryptoJS.AES.encrypt(plaintext, this.encryptionKey).toString();
      return ciphertext;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   *
   * @param ciphertext - Encrypted data
   * @returns Decrypted plaintext
   * @throws Error if decryption fails or produces empty result
   */
  decrypt(ciphertext: string): string {
    if (!ciphertext) return '';

    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, this.encryptionKey);
      const plaintext = bytes.toString(CryptoJS.enc.Utf8);

      if (!plaintext) {
        throw new Error('Decryption produced empty result - possible wrong key');
      }

      return plaintext;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash data for searching (one-way)
   *
   * @param data - Data to hash
   * @returns SHA-256 hash (64 characters)
   */
  hash(data: string): string {
    if (!data) return '';
    return CryptoJS.SHA256(data + this.encryptionKey).toString();
  }

  /**
   * Encrypt phone number with special handling
   *
   * Removes all non-digit characters before encryption for consistent searching
   *
   * @param phone - Phone number (any format)
   * @returns Encrypted phone and searchable hash
   *
   * @example
   * ```typescript
   * encryptPhone('+91-987-654-3210')  // → { encrypted: '...', hash: '...' }
   * encryptPhone('9876543210')        // → Same hash as above
   * ```
   */
  encryptPhone(phone: string): EncryptedData {
    if (!phone) {
      return { encrypted: '', hash: '' };
    }

    // Remove all non-digit characters for consistent storage and searching
    const cleaned = phone.replace(/\D/g, '');

    return {
      encrypted: this.encrypt(cleaned),
      hash: this.hash(cleaned),
    };
  }

  /**
   * Decrypt phone number
   *
   * @param encrypted - Encrypted phone number
   * @returns Decrypted phone number (digits only)
   */
  decryptPhone(encrypted: string): string {
    return this.decrypt(encrypted);
  }

  /**
   * Encrypt email with special handling
   *
   * Normalizes email (lowercase, trim) before encryption
   *
   * @param email - Email address
   * @returns Encrypted email and searchable hash
   */
  encryptEmail(email: string): EncryptedData {
    if (!email) {
      return { encrypted: '', hash: '' };
    }

    // Normalize: lowercase and trim
    const normalized = email.toLowerCase().trim();

    return {
      encrypted: this.encrypt(normalized),
      hash: this.hash(normalized),
    };
  }

  /**
   * Decrypt email
   *
   * @param encrypted - Encrypted email
   * @returns Decrypted email
   */
  decryptEmail(encrypted: string): string {
    return this.decrypt(encrypted);
  }

  /**
   * Verify if data matches encrypted value
   *
   * @param plaintext - Plaintext to verify
   * @param encrypted - Encrypted value
   * @returns True if plaintext matches encrypted value
   */
  verify(plaintext: string, encrypted: string): boolean {
    try {
      const decrypted = this.decrypt(encrypted);
      return plaintext === decrypted;
    } catch {
      return false;
    }
  }

  /**
   * Rotate encryption key (re-encrypt data)
   *
   * @param ciphertext - Data encrypted with old key
   * @param oldKey - Old encryption key
   * @returns Data encrypted with new key
   *
   * @example
   * ```typescript
   * const oldEncryption = new EncryptionService(oldKey);
   * const newEncryption = new EncryptionService(newKey);
   *
   * const users = await prisma.user.findMany();
   * for (const user of users) {
   *   const reencrypted = newEncryption.reencrypt(user.phoneEncrypted, oldKey);
   *   await prisma.user.update({
   *     where: { id: user.id },
   *     data: { phoneEncrypted: reencrypted }
   *   });
   * }
   * ```
   */
  reencrypt(ciphertext: string, oldKey: string): string {
    if (!ciphertext) return '';

    // Decrypt with old key
    const oldEncryption = new EncryptionService(oldKey);
    const plaintext = oldEncryption.decrypt(ciphertext);

    // Encrypt with new key
    return this.encrypt(plaintext);
  }
}
