const nodemailer = require('nodemailer');

// Create transporter — uses environment variables for config
// For development, you can use Ethereal (fake SMTP) or Gmail
const createTransporter = () => {
    // If no email config, use Ethereal test account
    if (!process.env.EMAIL_HOST) {
        return null; // Gracefully skip if not configured
    }

    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

const sendTicketEmail = async (participantEmail, participantName, event, ticket) => {
    try {
        const transporter = createTransporter();
        if (!transporter) {
            console.log('Email not configured — skipping ticket email for', participantEmail);
            return;
        }

        const ismerch = event.eventType === 'merchandise';

        const mailOptions = {
            from: process.env.EMAIL_FROM || '"Felicity Fest" <noreply@felicity.iiit.ac.in>',
            to: participantEmail,
            subject: `🎟️ ${ismerch ? 'Purchase' : 'Registration'} Confirmed — ${event.eventName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333;">🎉 ${ismerch ? 'Purchase' : 'Registration'} Confirmed!</h2>
                    <p>Hi <strong>${participantName}</strong>,</p>
                    <p>Your ${ismerch ? 'purchase for' : 'registration for'} <strong>${event.eventName}</strong> has been confirmed.</p>
                    
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Event:</strong> ${event.eventName}</p>
                        <p style="margin: 5px 0;"><strong>Type:</strong> ${event.eventType}</p>
                        <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(event.eventStartDate).toLocaleDateString()} - ${new Date(event.eventEndDate).toLocaleDateString()}</p>
                        <p style="margin: 5px 0;"><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
                    </div>

                    ${ticket.qrCode ? `
                        <div style="text-align: center; margin: 20px 0;">
                            <p><strong>Your QR Code:</strong></p>
                            <img src="${ticket.qrCode}" alt="QR Code" style="width: 200px; height: 200px;" />
                        </div>
                    ` : ''}
                    
                    <p style="color: #666; font-size: 14px;">Please keep this ticket for entry. Show the QR code at the venue.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="color: #999; font-size: 12px;">Felicity — IIIT Hyderabad</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('Ticket email sent to', participantEmail);
        return true;
    } catch (error) {
        console.error('Email sending failed:', error.message);
        return false;
    }
};

module.exports = { sendTicketEmail };
