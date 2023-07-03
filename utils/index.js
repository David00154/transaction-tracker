const { prisma } = require("./prisma")


function generateTrackingCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const codeLength = 12;
    let trackingCode = '';

    for (let i = 0; i < codeLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        trackingCode += characters.charAt(randomIndex);
    }

    trackingCode += 'TF'; // Append the country code at the end, assuming "US" is the country code.

    return trackingCode;
}

module.exports = {
    prisma,
    generateTrackingCode
}