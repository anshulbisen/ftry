import { describe, it, expect, beforeEach } from 'vitest';
import { EncryptionService } from './util-encryption';

describe('EncryptionService', () => {
  let encryption: EncryptionService;
  const testKey = 'test-encryption-key-32-characters-minimum-length-required';

  beforeEach(() => {
    encryption = new EncryptionService(testKey);
  });

  describe('Constructor', () => {
    it('should initialize with provided key', () => {
      expect(() => new EncryptionService(testKey)).not.toThrow();
    });

    it('should throw error if key is not provided', () => {
      expect(() => new EncryptionService('')).toThrow(
        'ENCRYPTION_KEY must be provided via constructor or environment variable',
      );
    });

    it('should throw error if key is too short', () => {
      expect(() => new EncryptionService('short-key')).toThrow(
        'ENCRYPTION_KEY must be at least 32 characters for security',
      );
    });

    it('should use environment variable if no key provided', () => {
      process.env['ENCRYPTION_KEY'] = testKey;
      expect(() => new EncryptionService()).not.toThrow();
      delete process.env['ENCRYPTION_KEY'];
    });
  });

  describe('Basic Encryption/Decryption', () => {
    it('should encrypt plaintext', () => {
      const plaintext = 'sensitive data';
      const encrypted = encryption.encrypt(plaintext);

      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(plaintext);
    });

    it('should decrypt ciphertext correctly', () => {
      const plaintext = 'sensitive data';
      const encrypted = encryption.encrypt(plaintext);
      const decrypted = encryption.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should return empty string for empty plaintext', () => {
      expect(encryption.encrypt('')).toBe('');
      expect(encryption.decrypt('')).toBe('');
    });

    it('should handle unicode characters', () => {
      const plaintext = 'नमस्ते मुंबई 🎉';
      const encrypted = encryption.encrypt(plaintext);
      const decrypted = encryption.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext each time (due to salt)', () => {
      const plaintext = 'test data';
      const encrypted1 = encryption.encrypt(plaintext);
      const encrypted2 = encryption.encrypt(plaintext);

      // CryptoJS.AES includes random salt, so same plaintext produces different ciphertext
      expect(encrypted1).not.toBe(encrypted2);
      expect(encryption.decrypt(encrypted1)).toBe(plaintext);
      expect(encryption.decrypt(encrypted2)).toBe(plaintext);
    });
  });

  describe('Phone Encryption', () => {
    it('should encrypt phone number with digits only', () => {
      const phone = '9876543210';
      const { encrypted, hash } = encryption.encryptPhone(phone);

      expect(encrypted).toBeTruthy();
      expect(hash).toBeTruthy();
      expect(hash).toHaveLength(64); // SHA-256 produces 64 char hex string
    });

    it('should strip non-digit characters from phone', () => {
      const phone1 = '987-654-3210';
      const phone2 = '9876543210';
      const phone3 = '(987) 654-3210';

      const result1 = encryption.encryptPhone(phone1);
      const result2 = encryption.encryptPhone(phone2);
      const result3 = encryption.encryptPhone(phone3);

      // All should produce same hash (for searching)
      expect(result1.hash).toBe(result2.hash);
      expect(result2.hash).toBe(result3.hash);
    });

    it('should decrypt phone correctly', () => {
      const phone = '9876543210';
      const { encrypted } = encryption.encryptPhone(phone);
      const decrypted = encryption.decryptPhone(encrypted);

      expect(decrypted).toBe(phone);
    });

    it('should return empty for empty phone', () => {
      const result = encryption.encryptPhone('');

      expect(result.encrypted).toBe('');
      expect(result.hash).toBe('');
    });
  });

  describe('Email Encryption', () => {
    it('should encrypt email', () => {
      const email = 'user@example.com';
      const { encrypted, hash } = encryption.encryptEmail(email);

      expect(encrypted).toBeTruthy();
      expect(hash).toBeTruthy();
      expect(hash).toHaveLength(64);
    });

    it('should normalize email (lowercase, trim)', () => {
      const email1 = 'USER@EXAMPLE.COM';
      const email2 = 'user@example.com';
      const email3 = '  User@Example.com  ';

      const result1 = encryption.encryptEmail(email1);
      const result2 = encryption.encryptEmail(email2);
      const result3 = encryption.encryptEmail(email3);

      // All should produce same hash
      expect(result1.hash).toBe(result2.hash);
      expect(result2.hash).toBe(result3.hash);
    });

    it('should decrypt email correctly', () => {
      const email = 'user@example.com';
      const { encrypted } = encryption.encryptEmail(email);
      const decrypted = encryption.decryptEmail(encrypted);

      expect(decrypted).toBe(email);
    });
  });

  describe('Hashing', () => {
    it('should produce consistent hash for same input', () => {
      const data = 'test data';
      const hash1 = encryption.hash(data);
      const hash2 = encryption.hash(data);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hash for different input', () => {
      const hash1 = encryption.hash('data1');
      const hash2 = encryption.hash('data2');

      expect(hash1).not.toBe(hash2);
    });

    it('should return empty string for empty input', () => {
      expect(encryption.hash('')).toBe('');
    });
  });

  describe('Verification', () => {
    it('should verify matching plaintext and encrypted data', () => {
      const plaintext = 'test data';
      const encrypted = encryption.encrypt(plaintext);

      expect(encryption.verify(plaintext, encrypted)).toBe(true);
    });

    it('should reject non-matching plaintext', () => {
      const plaintext = 'test data';
      const encrypted = encryption.encrypt(plaintext);

      expect(encryption.verify('wrong data', encrypted)).toBe(false);
    });

    it('should handle invalid encrypted data', () => {
      expect(encryption.verify('test', 'invalid-encrypted-data')).toBe(false);
    });
  });

  describe('Key Rotation', () => {
    it('should re-encrypt data with new key', () => {
      const plaintext = 'sensitive data';
      const oldKey = 'old-key-32-characters-minimum-required-length-here';
      const newKey = 'new-key-32-characters-minimum-required-length-here';

      const oldEncryption = new EncryptionService(oldKey);
      const newEncryption = new EncryptionService(newKey);

      const oldEncrypted = oldEncryption.encrypt(plaintext);
      const reencrypted = newEncryption.reencrypt(oldEncrypted, oldKey);

      // Should not be able to decrypt with old key
      expect(() => oldEncryption.decrypt(reencrypted)).toThrow();

      // Should decrypt correctly with new key
      const decrypted = newEncryption.decrypt(reencrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should return empty string for empty ciphertext', () => {
      const newKey = 'new-key-32-characters-minimum-required-length-here';
      const newEncryption = new EncryptionService(newKey);

      expect(newEncryption.reencrypt('', testKey)).toBe('');
    });
  });

  describe('Security Properties', () => {
    it('should not decrypt with wrong key', () => {
      const plaintext = 'sensitive data';
      const encrypted = encryption.encrypt(plaintext);

      const wrongKeyEncryption = new EncryptionService(
        'wrong-key-32-characters-minimum-required-length',
      );

      expect(() => wrongKeyEncryption.decrypt(encrypted)).toThrow();
    });

    it('should produce different hashes with different keys', () => {
      const data = 'test data';
      const encryption2 = new EncryptionService(
        'different-key-32-characters-minimum-required-length',
      );

      const hash1 = encryption.hash(data);
      const hash2 = encryption2.hash(data);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Performance', () => {
    it('should encrypt/decrypt within reasonable time', () => {
      const plaintext = 'performance test data';

      const startEncrypt = Date.now();
      const encrypted = encryption.encrypt(plaintext);
      const encryptTime = Date.now() - startEncrypt;

      const startDecrypt = Date.now();
      encryption.decrypt(encrypted);
      const decryptTime = Date.now() - startDecrypt;

      // Encryption/decryption should be fast (< 10ms)
      expect(encryptTime).toBeLessThan(10);
      expect(decryptTime).toBeLessThan(10);
    });

    it('should hash within reasonable time', () => {
      const data = 'performance test data';

      const start = Date.now();
      encryption.hash(data);
      const hashTime = Date.now() - start;

      // Hashing should be very fast (< 5ms)
      expect(hashTime).toBeLessThan(5);
    });
  });
});
