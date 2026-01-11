const Queue = require('bull');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create email queue
const emailQueue = new Queue('email', process.env.REDIS_URL || 'redis://localhost:6379', {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Email templates
const templates = {
  'order-confirmation': (data) => ({
    subject: `Order Confirmation - ${data.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Thank you for your order!</h2>
        <p>Hi there,</p>
        <p>Your order <strong>${data.orderNumber}</strong> has been received and is being processed.</p>
        <p>We'll send you another email when your order ships.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated email from AfriMart. Please do not reply.
        </p>
      </div>
    `
  }),
  'order-status-update': (data) => ({
    subject: `Order ${data.orderNumber} - Status Update`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Order Status Update</h2>
        <p>Hi there,</p>
        <p>Your order <strong>${data.orderNumber}</strong> status has been updated to:</p>
        <p style="font-size: 18px; color: #10b981; font-weight: bold;">${data.status.toUpperCase()}</p>
        ${data.status === 'shipped' ? '<p>Your order is on its way! 🎉</p>' : ''}
        ${data.status === 'delivered' ? '<p>Your order has been delivered. We hope you enjoy your purchase!</p>' : ''}
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated email from AfriMart. Please do not reply.
        </p>
      </div>
    `
  })
};

// Process email jobs
emailQueue.process(async (job) => {
  const { type, to, data } = job.data;
  
  logger.info(`Processing email job: ${type} to ${to}`);

  try {
    const template = templates[type];
    if (!template) {
      throw new Error(`Unknown email template: ${type}`);
    }

    const emailContent = template(data);
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@afrimart.com',
      to,
      subject: emailContent.subject,
      html: emailContent.html
    });

    logger.info(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Email sending failed: ${error.message}`);
    throw error;
  }
});

// Event listeners
emailQueue.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed:`, result);
});

emailQueue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed:`, err.message);
});

emailQueue.on('error', (error) => {
  logger.error('Queue error:', error);
});

// Wrapper function to add email jobs
emailQueue.add = async (type, data) => {
  return emailQueue.add(type, {
    type,
    to: data.userEmail,
    data
  });
};

module.exports = emailQueue;
