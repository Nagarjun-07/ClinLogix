import emailjs from '@emailjs/browser';

/**
 * Service to handle sending emails using EmailJS
 * 
 * Required Environment Variables (must be set in .env):
 * VITE_EMAILJS_SERVICE_ID
 * VITE_EMAILJS_TEMPLATE_ID
 * VITE_EMAILJS_PUBLIC_KEY
 */

const SERVICE_ID = "service_3l3gdem";
const TEMPLATE_ID = "template_sd5i8ul"; // Correct ID from your dashboard
const PUBLIC_KEY = "pUilQzm2u7OWsq4Vc";

export const emailService = {
    /**
     * Send an invitation email to a new user
     */
    async sendInvitation(toEmail: string, sendToName: string, role: string) {
        console.log('Attempting to send email with:', {
            serviceId: SERVICE_ID,
            templateId: TEMPLATE_ID,
            publicKey: PUBLIC_KEY ? 'Present' : 'Missing',
            email: toEmail
        });

        if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
            console.warn('EmailJS environment variables are missing. Email not sent.');
            return false;
        }

        const templateParams = {
            email: toEmail,      // Matches {{email}} in "To Email" field
            to_name: sendToName, // Matches typical body templates
            name: sendToName,    // Matches default subject line {{name}}
            role: role,
            login_url: window.location.origin, // e.g., http://localhost:3000
        };

        try {
            const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
            console.log('Invitation email sent successfully!', response.status, response.text);
            return true;
        } catch (error) {
            console.error('Failed to send invitation email:', error);
            return false;
        }
    }
};
