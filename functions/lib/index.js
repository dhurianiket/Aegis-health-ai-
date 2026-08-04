"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRecaptcha = exports.verifyRecaptchaToken = exports.PaperclipJulesCoordinator = exports.handleGitHubWebhook = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
(0, app_1.initializeApp)();
// Export secondary autonomous orchestrator integrations
var julesWebhook_1 = require("./julesWebhook");
Object.defineProperty(exports, "handleGitHubWebhook", { enumerable: true, get: function () { return julesWebhook_1.handleGitHubWebhook; } });
var paperclipJulesCoordinator_1 = require("./paperclipJulesCoordinator");
Object.defineProperty(exports, "PaperclipJulesCoordinator", { enumerable: true, get: function () { return paperclipJulesCoordinator_1.PaperclipJulesCoordinator; } });
const verifyRecaptchaToken = async (token, secretKey) => {
    if (!secretKey) {
        console.error("Missing RECAPTCHA_SECRET_KEY in environment variables.");
        return false;
    }
    try {
        const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            // Security: use encodeURIComponent to prevent HTTP Parameter Pollution (HPP) via the token parameter
            body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
        });
        const result = await response.json();
        console.log("reCAPTCHA raw response:", JSON.stringify(result));
        // Require an anti-bot risk score threshold >= 0.5
        if (result.success && result.score >= 0.5) {
            return true;
        }
        else {
            console.log(`reCAPTCHA validation failed. Success: ${result.success}, Score: ${result.score}, Token: ${token}`);
            return false;
        }
    }
    catch (error) {
        console.error("reCAPTCHA Verification Exception Error:", error);
        return false;
    }
};
exports.verifyRecaptchaToken = verifyRecaptchaToken;
// Cloud Function Entrypoint
exports.verifyRecaptcha = (0, https_1.onCall)({ secrets: ["RECAPTCHA_SECRET_KEY"] }, async (request) => {
    const token = request.data?.token;
    if (!token) {
        throw new https_1.HttpsError("invalid-argument", "Missing reCAPTCHA validation token.");
    }
    const isHuman = await (0, exports.verifyRecaptchaToken)(token, process.env.RECAPTCHA_SECRET_KEY);
    if (!isHuman) {
        throw new https_1.HttpsError("permission-denied", "Automated traffic/bot verification failed.");
    }
    return { verified: true };
});
//# sourceMappingURL=index.js.map