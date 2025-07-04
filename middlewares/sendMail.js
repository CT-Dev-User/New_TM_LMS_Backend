import { createTransport } from "nodemailer";

const sendMail = async (email, subject, data, templateType = 'activation') => {
    try {
        const transport = createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.Gmail,
                pass: process.env.Password,
            },
            tls: {
                // Do not fail on invalid certificates
                rejectUnauthorized: false
            }
        });

        let htmlContent;
        
        if (templateType === 'reset-password-otp') {
            htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset OTP</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f7f7f7;
        }
        .container {
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        h1 {
            color: #ff4500;
        }
        p {
            margin-bottom: 20px;
            color: #555;
        }
        .otp {
            font-size: 36px;
            font-weight: bold;
            color: #7b68ee;
            margin-bottom: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Password Reset OTP</h1>
        <p>Hello,</p>
        <p>Your One-Time Password (OTP) for password reset is:</p>
        <p class="otp">${data.otp}</p>
        <p>Please use this OTP to reset your password. If you did not request this reset, please ignore this email.</p>
    </div>
</body>
</html>
`;
        } else {
            // Default to account activation template
            htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f7f7f7;
        }
        .container {
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        h1 {
            color: #ff4500;
        }
        p {
            margin-bottom: 20px;
            color: #555;
        }
        .otp {
            font-size: 36px;
            font-weight: bold;
            color: #7b68ee;
            margin-bottom: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>OTP Verification</h1>
        <p>Hello <strong>${data.name}</strong>,</p>
        <p>Your One-Time Password (OTP) for account verification is:</p>
        <p class="otp">${data.otp}</p>
        <p>If you did not request this, please ignore this email.</p>
    </div>
</body>
</html>
`;
        }

        await transport.sendMail({
            from: process.env.Gmail, 
            to: email, 
            subject, 
            html: htmlContent,
        });

        console.log("Email sent successfully!");
    } catch (error) {
        console.error("Error while sending email:", error.message);
        throw new Error("Failed to send email. Please try again later.");
    }
};

export default sendMail;
