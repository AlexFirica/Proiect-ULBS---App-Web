const axios = require('axios');

const PISTON_API_URL = 'http://localhost:2000/api/v2/execute';

/**
 * Trimite codul sursă către Piston pentru execuție.
 * @param {string} language - Limbajul sau compilatorul (ex: 'gcc')
 * @param {string} version - Versiunea (ex: '*')
 * @param {string} code - Codul sursă scris de elev
 * @returns {Promise<Object>} Rezultatul execuției (stdout, stderr, etc.)
 */
async function executeCode(language, version, code) {
    try {
        const response = await axios.post(PISTON_API_URL, {
            language: language,
            version: version,
            files: [
                {
                    content: code
                }
            ]
        });
        return response.data;
    } catch (error) {
        console.error("Eroare Piston:", error.response?.data || error.message);
        throw new Error(error.response?.data?.message || "Eroare la comunicarea cu motorul de compilare.");
    }
}

module.exports = { executeCode };