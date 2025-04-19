const crypto = require('crypto');
const { logger } = require('./logger');

class Encryption {
    static algorithm = 'aes-256-gcm';
    static #encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
    static #ivLength = 16;
    static #authTagLength = 16;

    // ENKRIPSI
    static encrypt(text) {
        try {
            const iv = crypto.randomBytes(this.#ivLength);
            const cipher = crypto.createCipheriv(this.algorithm, this.#encryptionKey, iv);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag();
            // Menggabungkan IV, authTag, dan data terenkripsi
            return Buffer.concat([
                iv,
                authTag,
                Buffer.from(encrypted, 'hex')
            ]).toString('base64');
        } catch (error) {
            logger.error('Encryption error:', error);
            throw new Error('Encryption failed');
        }
    }

    // DEKRIPSI
    static decrypt(encryptedData) {
        try {
            const buffer = Buffer.from(encryptedData, 'base64');
            // Memisahkan IV, authTag, dan data terenkripsi
            const iv = buffer.slice(0, this.#ivLength);
            const authTag = buffer.slice(this.#ivLength, this.#ivLength + this.#authTagLength);
            const encrypted = buffer.slice(this.#ivLength + this.#authTagLength);
            const decipher = crypto.createDecipheriv(this.algorithm, this.#encryptionKey, iv);
            decipher.setAuthTag(authTag);
            let decrypted = decipher.update(encrypted, 'binary', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (error) {
            logger.error('Decryption error:', error);
            throw new Error('Decryption failed');
        }
    }

    // Khusus untuk API keys dan data sensitif lainnya
    static encryptApiKey(apiKey) {
        return this.encrypt(apiKey);
    }
    static decryptApiKey(encryptedApiKey) {
        return this.decrypt(encryptedApiKey);
    }

    // Untuk mengenkripsi objek/data kompleks
    static encryptObject(obj) {
        return this.encrypt(JSON.stringify(obj));
    }
    static decryptObject(encryptedData) {
        const decrypted = this.decrypt(encryptedData);
        return JSON.parse(decrypted);
    }
}

module.exports = Encryption;