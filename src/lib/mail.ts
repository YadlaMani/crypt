import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "cryptonite.devv@gmail.com",
    pass: process.env.MAIL_PASS || "http://localhost:3000",
  },
});

export const sendTransactionMail = async (
  to: string,
  amount: number,
  transactionId: string
) => {
  try {
    const payUrl = `${process.env.API_URL}/pay/${transactionId}`;

    const mailOptions = {
      from: `"Cryptonite" <cryptonite.devv@gmail.com>`,
      to,
      subject: `Payment Request - Cryptonite`,
      html: `
        <div style="
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #ffffff;
          color: #222;
          padding: 32px;
          max-width: 600px;
          margin: auto;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
        ">
          <h2 style="margin-top: 0; font-weight: 600; font-size: 20px;">
            💸 Payment Request
          </h2>
          <p style="font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            You've received a new <strong>payment request</strong> from <span style="color:#111;">Cryptonite</span>.
          </p>
          <div style="
            background: #f9f9f9;
            padding: 16px 20px;
            border-radius: 8px;
            border: 1px solid #e5e5e5;
            margin-bottom: 24px;
          ">
            <p style="margin: 0; font-size: 14px; color: #555;">
              <strong>Requested Amount:</strong>
              <span style="font-size: 16px; font-weight: 600; color: #111;">$${amount}</span>
            </p>
          </div>
          <a href="${payUrl}" 
            style="
              display: inline-block;
              text-decoration: none;
              background-color: #111;
              color: #fff;
              font-size: 14px;
              padding: 12px 20px;
              border-radius: 8px;
              font-weight: 500;
            ">
            👉 Pay with Cryptonite
          </a>
          <p style="font-size: 12px; color: #888; margin-top: 32px;">
            If you didn’t expect this request, you can safely ignore this email.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
  } catch (err) {
    console.error("Error sending transaction email:", err);
  }
};
