import nodemailer from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { LogTrail } from '../utils';

export class MailMan {
  readonly name = "MailerService"
  private logger = new LogTrail(this.name)

  constructor(private transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>) { }

  async sendMail(to: string, from: string, subject: string, message?: string, htmlContent?: string) {

    const mailOptions = {
      from,
      to,
      subject,
      html: htmlContent,
      message
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log('Email sent: ' + info.response);
    } catch (error) {
      this.logger.error(`Error sending email: ${error}`);
    }
  };

  async sendBulkMail(from: string, subject: string, email: string | string[], message?: string, htmlContent?: string) {

    const mailOptions = {
      from,
      to: from,
      bcc: email, // assume string email address
      subject,
      html: htmlContent,
      message
    };
    const emailId = `mail-${Math.floor(Math.random() * 1000000)}`

    if (email instanceof Array) {
      // if email is an array, send in batches
      const batchSize = 8;
      const waitTime = 5 * 60 * 1000; // wait for 5 minute
      const results = []
      this.logger.log(`${new Date()} - Sending email ${emailId} in batches of size ${batchSize}`)

      for (let i = 0; i < email.length; i += batchSize) {
        const emailBatch = email.slice(i, i + batchSize);
        this.logger.log(`${new Date()} - Sending batch ${i / batchSize} of email ${emailId}`)

        mailOptions.bcc = emailBatch; // array of email addresses

        const result = await this.transporter.sendMail(mailOptions)
          .catch((e) => {
            this.logger.error(`${new Date()} - Error occured in MailMan Module: MailMan<sendBulkMail>`)
            this.logger.error(e)
          });
        results.push(result);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      this.logger.log(`${new Date()} - Batch E-mail ${emailId} done sending`)
      return results[0];
    } else if (typeof email === 'string') {
      return await this.transporter.sendMail(mailOptions);
    } else {
      throw new Error(`LEGIT_MAIL_ERROR: Unsupported Email type: ${email}`);
    }
  };
}