// Email Notification Service for SideQuest
import nodemailer, { Transporter, SentMessageInfo } from 'nodemailer';
import { config } from '../config';
import {
  EmailNotificationData,
  EmailService as IEmailService,
  NotificationDeliveryResult,
  NotificationChannel,
  TemplateContext,
} from '../types/notification';

export class EmailService implements IEmailService {
  private transporter: Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  // Initialize the email service with configuration
  private async initialize(): Promise<void> {
    try {
      if (!config.email?.enabled) {
        console.log('Email service disabled in configuration');
        return;
      }

      this.transporter = nodemailer.createTransporter({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure, // true for 465, false for other ports
        auth: {
          user: config.email.auth.user,
          pass: config.email.auth.pass,
        },
        pool: true, // Use connection pooling
        maxConnections: 5,
        maxMessages: 100,
        rateLimit: 14, // Max 14 messages per second
      });

      // Verify the connection
      await this.verifyConnection();
      this.isConfigured = true;
      
      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  // Send a single email
  async sendEmail(data: EmailNotificationData): Promise<NotificationDeliveryResult> {
    if (!this.isConfigured || !this.transporter) {
      return {
        success: false,
        channel: NotificationChannel.EMAIL,
        error: 'Email service not configured',
        timestamp: new Date(),
      };
    }

    try {
      const mailOptions = {
        from: config.email.from,
        to: Array.isArray(data.to) ? data.to.join(', ') : data.to,
        cc: data.cc ? (Array.isArray(data.cc) ? data.cc.join(', ') : data.cc) : undefined,
        bcc: data.bcc ? (Array.isArray(data.bcc) ? data.bcc.join(', ') : data.bcc) : undefined,
        subject: data.subject,
        text: data.text,
        html: data.html,
        replyTo: data.replyTo || config.email.replyTo,
        priority: data.priority || 'normal',
        attachments: data.attachments,
        headers: {
          'X-Mailer': 'SideQuest Notification System',
          'X-Priority': this.getPriorityHeader(data.priority),
        },
      };

      const info: SentMessageInfo = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        channel: NotificationChannel.EMAIL,
        messageId: info.messageId,
        timestamp: new Date(),
        metadata: {
          accepted: info.accepted,
          rejected: info.rejected,
          response: info.response,
        },
      };
    } catch (error) {
      console.error('Failed to send email:', error);
      
      return {
        success: false,
        channel: NotificationChannel.EMAIL,
        error: error instanceof Error ? error.message : 'Unknown email error',
        timestamp: new Date(),
      };
    }
  }

  // Send templated email using Handlebars
  async sendTemplatedEmail(
    templateId: string,
    to: string,
    data: Record<string, any>
  ): Promise<NotificationDeliveryResult> {
    try {
      const template = await this.getEmailTemplate(templateId);
      if (!template) {
        return {
          success: false,
          channel: NotificationChannel.EMAIL,
          error: `Template not found: ${templateId}`,
          timestamp: new Date(),
        };
      }

      // Compile template with data
      const compiledSubject = this.compileTemplate(template.subject, data);
      const compiledHtml = this.compileTemplate(template.html, data);
      const compiledText = template.text ? this.compileTemplate(template.text, data) : undefined;

      return await this.sendEmail({
        to,
        subject: compiledSubject,
        html: compiledHtml,
        text: compiledText,
        templateData: data,
      });
    } catch (error) {
      console.error('Failed to send templated email:', error);
      
      return {
        success: false,
        channel: NotificationChannel.EMAIL,
        error: error instanceof Error ? error.message : 'Template processing error',
        timestamp: new Date(),
      };
    }
  }

  // Send bulk emails with rate limiting
  async sendBulkEmails(emails: EmailNotificationData[]): Promise<NotificationDeliveryResult[]> {
    const results: NotificationDeliveryResult[] = [];
    const batchSize = 10;
    const delay = 1000; // 1 second delay between batches

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      const batchPromises = batch.map(email => this.sendEmail(email));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            channel: NotificationChannel.EMAIL,
            error: result.reason?.message || 'Bulk email failed',
            timestamp: new Date(),
          });
        }
      });

      // Delay between batches to respect rate limits
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return results;
  }

  // Verify email service connection
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection verification failed:', error);
      return false;
    }
  }

  // Send welcome email to new users
  async sendWelcomeEmail(userEmail: string, userData: {
    username: string;
    firstName?: string;
  }): Promise<NotificationDeliveryResult> {
    const context: TemplateContext = {
      user: {
        id: '',
        username: userData.username,
        email: userEmail,
        firstName: userData.firstName,
      },
      app: {
        name: 'SideQuest',
        url: config.server.baseUrl,
        logoUrl: `${config.server.baseUrl}/assets/logo.png`,
        supportEmail: config.email.from,
      },
    };

    return await this.sendTemplatedEmail('welcome', userEmail, context);
  }

  // Send password reset email
  async sendPasswordResetEmail(
    userEmail: string,
    resetToken: string,
    userData: { username: string }
  ): Promise<NotificationDeliveryResult> {
    const resetUrl = `${config.server.baseUrl}/reset-password?token=${resetToken}`;
    
    const context: TemplateContext = {
      user: {
        id: '',
        username: userData.username,
        email: userEmail,
      },
      app: {
        name: 'SideQuest',
        url: config.server.baseUrl,
        logoUrl: `${config.server.baseUrl}/assets/logo.png`,
        supportEmail: config.email.from,
      },
      resetUrl,
      resetToken,
    };

    return await this.sendTemplatedEmail('password_reset', userEmail, context);
  }

  // Send quest completion notification
  async sendQuestCompletionEmail(
    userEmail: string,
    questData: {
      title: string;
      points: number;
    },
    userData: { username: string }
  ): Promise<NotificationDeliveryResult> {
    const context: TemplateContext = {
      user: {
        id: '',
        username: userData.username,
        email: userEmail,
      },
      quest: {
        id: '',
        title: questData.title,
        description: '',
        points: questData.points,
      },
      app: {
        name: 'SideQuest',
        url: config.server.baseUrl,
        logoUrl: `${config.server.baseUrl}/assets/logo.png`,
        supportEmail: config.email.from,
      },
    };

    return await this.sendTemplatedEmail('quest_completion', userEmail, context);
  }

  // Send badge earned notification
  async sendBadgeEarnedEmail(
    userEmail: string,
    badgeData: {
      name: string;
      description: string;
      imageUrl: string;
    },
    userData: { username: string }
  ): Promise<NotificationDeliveryResult> {
    const context: TemplateContext = {
      user: {
        id: '',
        username: userData.username,
        email: userEmail,
      },
      badge: {
        id: '',
        name: badgeData.name,
        description: badgeData.description,
        imageUrl: badgeData.imageUrl,
      },
      app: {
        name: 'SideQuest',
        url: config.server.baseUrl,
        logoUrl: `${config.server.baseUrl}/assets/logo.png`,
        supportEmail: config.email.from,
      },
    };

    return await this.sendTemplatedEmail('badge_earned', userEmail, context);
  }

  // Private helper methods
  private getPriorityHeader(priority?: string): string {
    switch (priority) {
      case 'high': return '1 (Highest)';
      case 'low': return '5 (Lowest)';
      default: return '3 (Normal)';
    }
  }

  private compileTemplate(template: string, data: Record<string, any>): string {
    // Simple template compilation - in production, you'd use Handlebars
    let compiled = template;
    
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      const value = this.getNestedValue(data, key);
      compiled = compiled.replace(regex, String(value || ''));
    });

    // Handle nested properties like {{user.username}}
    const nestedRegex = /\{\{([^}]+)\}\}/g;
    compiled = compiled.replace(nestedRegex, (match, path) => {
      const value = this.getNestedValue(data, path);
      return String(value || '');
    });

    return compiled;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : '';
    }, obj);
  }

  private async getEmailTemplate(templateId: string): Promise<{
    subject: string;
    html: string;
    text?: string;
  } | null> {
    // In a real implementation, you'd fetch from database or file system
    const templates: Record<string, any> = {
      welcome: {
        subject: 'Welcome to {{app.name}}, {{user.username}}!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <img src="{{app.logoUrl}}" alt="{{app.name}}" style="max-width: 200px;">
            <h1>Welcome to SideQuest!</h1>
            <p>Hi {{user.firstName || user.username}},</p>
            <p>Welcome to SideQuest! We're excited to have you join our community of adventure seekers.</p>
            <p>Get started by exploring available quests and start your journey today!</p>
            <a href="{{app.url}}/quests" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Explore Quests</a>
            <p>Happy questing!</p>
            <p>The SideQuest Team</p>
          </div>
        `,
        text: 'Welcome to SideQuest, {{user.username}}! Get started by exploring available quests at {{app.url}}/quests',
      },
      password_reset: {
        subject: 'Reset your SideQuest password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Password Reset Request</h1>
            <p>Hi {{user.username}},</p>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            <a href="{{resetUrl}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>If you didn't request this, please ignore this email.</p>
            <p>This link will expire in 24 hours.</p>
          </div>
        `,
      },
      quest_completion: {
        subject: 'Quest Completed: {{quest.title}}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Quest Completed! 🎉</h1>
            <p>Congratulations {{user.username}}!</p>
            <p>You've successfully completed the quest: <strong>{{quest.title}}</strong></p>
            <p>You earned <strong>{{quest.points}} points</strong>!</p>
            <a href="{{app.url}}/quests" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Find More Quests</a>
          </div>
        `,
      },
      badge_earned: {
        subject: 'New Badge Earned: {{badge.name}}',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>New Badge Earned! 🏆</h1>
            <p>Awesome work {{user.username}}!</p>
            <div style="text-align: center; margin: 20px 0;">
              <img src="{{badge.imageUrl}}" alt="{{badge.name}}" style="max-width: 100px;">
              <h2>{{badge.name}}</h2>
              <p>{{badge.description}}</p>
            </div>
            <a href="{{app.url}}/profile" style="background: #ffc107; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Your Badges</a>
          </div>
        `,
      },
    };

    return templates[templateId] || null;
  }

  // Cleanup method
  async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
