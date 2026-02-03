import { transporter } from "../lib/nodemailer";


export const sendPassword = async ({ to, subject, role, password }) => {
    try {
        const info = await transporter.sendMail({
            from: `ACADFLOW <${process.env.SMTP_USER}>`,
            to,
            subject,
            html: `
            <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to ACADFLOW</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: Arial, Helvetica, sans-serif;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5, #6366f1);
      padding: 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
    }
    .content {
      padding: 32px;
      color: #333333;
      line-height: 1.6;
    }
    .content h2 {
      margin-top: 0;
      font-size: 20px;
      color: #111827;
    }
    .details {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 16px;
      margin: 24px 0;
    }
    .details p {
      margin: 8px 0;
      font-size: 14px;
    }
    .details span {
      font-weight: 600;
      color: #111827;
    }
    .button {
      display: inline-block;
      margin-top: 24px;
      padding: 12px 24px;
      background-color: #4f46e5;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
    }
    .footer {
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      background: #f9fafb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to ACADFLOW</h1>
    </div>

    <div class="content">
      <h2>Hello ${name}, 👋</h2>

      <p>
        You have been successfully added to <strong>ACADFLOW</strong>.
        Your account has been created with the following role:
      </p>

      <div class="details">
        <p><span>Role:</span> ${role}</p>
        <p><span>Email:</span> ${to}</p>
        <p><span>Temporary Password:</span> ${password}</p>
      </div>

      <p>
        Please log in using the credentials above. For security reasons,
        we strongly recommend changing your password after your first login.
      </p>

      <a href="http://localhost:8080/login" class="button">Login to ACADFLOW</a>

      <p style="margin-top: 32px;">
        If you did not expect this email, please contact the administrator immediately.
      </p>

      <p>
        Regards,<br />
        <strong>ACADFLOW Team</strong>
      </p>
    </div>

    <div class="footer">
      © ${new Date().getFullYear()} ACADFLOW. All rights reserved.
    </div>
  </div>
</body>
</html>
                `,
        });

        console.log("Email sent:", info.messageId);
        return info;
    } catch (error) {
        console.error("Email error:", error);
        throw error;
    }
};
