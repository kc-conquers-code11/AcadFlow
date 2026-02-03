import nodemailer from "nodemailer"

export const transporter = nodemailer.createTransport({
    host: import.meta.env.VITE_SMTP_HOST,
    port: import.meta.env.VITE_SMTP_PORT,
    auth: {
        user: import.meta.env.VITE_SMTP_MAIL_ID,
        pass: import.meta.env.VITE_SMTP_PASS,
    },
    secure: true,
    ignoreTLS: true,
    tls: {
        rejectUnauthorized: false
    }
})