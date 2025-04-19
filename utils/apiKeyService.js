const crypto = require('crypto');
const connection = require('../config/database');
const Encryption = require('../utils/encryption');

const generateApiKey = async (userId) => {
    const apiKey = crypto.randomBytes(32).toString('hex');
    const encryptedKey = Encryption.encryptApiKey(apiKey);
    
    await connection.promise().query(
        'UPDATE user SET API_Key = ? WHERE ID_User = ?',
        [encryptedKey, userId]
    );
    
    return apiKey;
};

const verifyApiKey = async (apiKey, userId) => {
    const [user] = await connection.promise().query(
        'SELECT ID_User, API_Key FROM user WHERE ID_User = ?',
        [userId]
    );
    
    if (!user.length) return false;
    
    const decryptedKey = Encryption.decryptApiKey(user[0].API_Key);
    return apiKey === decryptedKey;
};

module.exports = {
    generateApiKey,
    verifyApiKey
};