// Email service for assessment reminders
// TODO cursor: configure with your email provider (Resend, SendGrid, etc.)

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface AssessmentReminderData {
  clientName: string;
  instrumentName: string;
  dueDate: string;
  magicLink: string;
}

// Email templates
const getAssessmentReminderTemplate = (data: AssessmentReminderData): EmailTemplate => {
  const { clientName, instrumentName, dueDate, magicLink } = data;
  
  return {
    subject: `ReflectMe: Assessment ${instrumentName} in scadenza`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Assessment Reminder</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6366f1; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { 
            display: inline-block; 
            background: #6366f1; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0;
          }
          .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧠 ReflectMe</h1>
            <p>Assessment Reminder</p>
          </div>
          <div class="content">
            <h2>Ciao ${clientName},</h2>
            <p>È il momento di completare il tuo assessment <strong>${instrumentName}</strong>.</p>
            <p>Questo breve questionario aiuta te e il tuo terapista a monitorare i tuoi progressi nel percorso di benessere mentale.</p>
            
            <p><strong>Due date:</strong> ${new Date(dueDate).toLocaleDateString('en-US')}</p>
            
            <a href="${magicLink}" class="button">
              Completa Assessment (5-10 min)
            </a>
            
            <p><small>⚠️ Questo link è personale e sicuro. Non condividerlo con nessuno.</small></p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            
            <h3>Perché completare gli assessment?</h3>
            <ul>
              <li>📊 Monitoraggio oggettivo dei progressi</li>
              <li>🎯 Personalizzazione del trattamento</li>
              <li>🔍 Identificazione precoce di cambiamenti</li>
              <li>💪 Motivazione attraverso i miglioramenti visibili</li>
            </ul>
          </div>
          <div class="footer">
            <p>Se hai difficoltà, contatta il tuo terapista o il supporto ReflectMe</p>
            <p><small>ReflectMe - Il tuo compagno digitale per il benessere mentale</small></p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      ReflectMe - Assessment Reminder
      
      Ciao ${clientName},
      
      È il momento di completare il tuo assessment ${instrumentName}.
      Due date: ${new Date(dueDate).toLocaleDateString('en-US')}
      
      Completa qui: ${magicLink}
      
      Questo assessment aiuta te e il tuo terapista a monitorare i tuoi progressi.
      
      Se hai difficoltà, contatta il tuo terapista o il supporto ReflectMe.
    `
  };
};

// Production email service with Resend
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendAssessmentReminder = async (
  to: string,
  data: AssessmentReminderData
): Promise<boolean> => {
  try {
    const template = getAssessmentReminderTemplate(data);
    
    console.log('📧 Sending assessment reminder email:');
    console.log(`To: ${to}`);
    console.log(`Subject: ${template.subject}`);
    
    // Check if we're in production mode with Resend API key
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (resendApiKey && resendApiKey !== 'demo' && resendApiKey !== 'your-resend-api-key') {
      try {
        const { data: result, error } = await resend.emails.send({
          from: 'ReflectMe <noreply@yourdomain.com>',
          to: [to],
          subject: template.subject,
          html: template.html,
          text: template.text,
          tags: [
            {
              name: 'category',
              value: 'assessment-reminder'
            }
          ]
        });
        
        if (error) {
          console.error('❌ Resend email error:', error);
          throw error;
        }
        
        console.log('✅ Email sent via Resend:', result?.id);
        return true;
        
      } catch (resendError) {
        console.error('❌ Resend service error:', resendError);
        throw resendError;
      }
    }
    
    // Demo mode: simulate successful send
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('⚠️ Demo mode: Email not sent (add RESEND_API_KEY for production)');
    console.log(`📧 Would send to: ${to}`);
    console.log(`🔗 Magic Link: ${data.magicLink}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error sending assessment reminder:', error);
    return false;
  }
};

// Crisis alert email for immediate attention
export const sendCrisisAlert = async (
  therapistEmail: string,
  clientName: string,
  assessmentData: {
    instrument: string;
    score: number;
    responses: Record<string, number>;
  }
): Promise<boolean> => {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    
    const template = {
      subject: `🚨 URGENTE: Alert di crisi per ${clientName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .alert { background: #fef2f2; border: 2px solid #ef4444; padding: 20px; border-radius: 8px; }
            .urgent { color: #dc2626; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="alert">
              <h1 class="urgent">🚨 ALERT DI CRISI</h1>
              <p><strong>Paziente:</strong> ${clientName}</p>
              <p><strong>Assessment:</strong> ${assessmentData.instrument}</p>
              <p><strong>Punteggio:</strong> ${assessmentData.score}</p>
              <p><strong>Date/Time:</strong> ${new Date().toLocaleString('en-US')}</p>
              
              ${assessmentData.instrument === 'PHQ-9' && assessmentData.responses['phq9_9'] > 0 ? `
                <p class="urgent">⚠️ IDEAZIONE SUICIDARIA RILEVATA</p>
                <p>Il paziente ha risposto positivamente alla domanda 9 del PHQ-9 riguardo pensieri di morte o autolesionismo.</p>
              ` : ''}
              
              <h3>Azioni Raccomandate:</h3>
              <ul>
                <li>Contattare immediatamente il paziente</li>
                <li>Valutare il rischio di sicurezza</li>
                <li>Considerare intervento di crisi se necessario</li>
                <li>Documentare la valutazione e le azioni intraprese</li>
              </ul>
              
              <p><small>Questo alert è stato generato automaticamente dal sistema ReflectMe.</small></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        🚨 ALERT DI CRISI - ${clientName}
        
        Assessment: ${assessmentData.instrument}
        Punteggio: ${assessmentData.score}
        Date/Time: ${new Date().toLocaleString('en-US')}
        
        ${assessmentData.instrument === 'PHQ-9' && assessmentData.responses['phq9_9'] > 0 ? 
          'IDEAZIONE SUICIDARIA RILEVATA - Contattare immediatamente il paziente' : ''
        }
        
        Azioni raccomandate:
        - Contattare immediatamente il paziente
        - Valutare il rischio di sicurezza
        - Considerare intervento di crisi se necessario
      `
    };
    
    console.log('🚨 Sending crisis alert email:');
    console.log(`To: ${therapistEmail}`);
    console.log(`Subject: ${template.subject}`);
    
    if (resendApiKey && resendApiKey !== 'demo' && resendApiKey !== 'your-resend-api-key') {
      try {
        const { data: result, error } = await resend.emails.send({
          from: 'ReflectMe Crisis Alert <alert@yourdomain.com>',
          to: [therapistEmail],
          subject: template.subject,
          html: template.html,
          text: template.text,
          tags: [
            {
              name: 'category',
              value: 'crisis-alert'
            },
            {
              name: 'priority',
              value: 'urgent'
            }
          ]
        });
        
        if (error) {
          console.error('❌ Crisis alert email error:', error);
          throw error;
        }
        
        console.log('🚨 Crisis alert sent via Resend:', result?.id);
        return true;
        
      } catch (resendError) {
        console.error('❌ Crisis alert Resend error:', resendError);
        throw resendError;
      }
    }
    
    // Demo mode: log the alert
    console.log('⚠️ CRISIS ALERT TRIGGERED (demo mode):', {
      client: clientName,
      therapist: therapistEmail,
      assessment: assessmentData
    });
    
    return true;
  } catch (error) {
    console.error('Error sending crisis alert:', error);
    return false;
  }
};

// Generate magic link for secure assessment access
export const generateMagicLink = (assessmentId: string, clientId: string): string => {
  // TODO cursor: Implement JWT token or secure token generation
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5174';
  const token = btoa(`${assessmentId}:${clientId}:${Date.now()}`); // Basic encoding for demo
  
  return `${baseUrl}/assessment/${assessmentId}?token=${token}`;
};

// Validate magic link token
export const validateMagicLink = (token: string, assessmentId: string): boolean => {
  try {
    // TODO cursor: Implement proper JWT validation
    const decoded = atob(token);
    const [tokenAssessmentId, clientId, timestamp] = decoded.split(':');
    
    // Check if token is for the correct assessment
    if (tokenAssessmentId !== assessmentId) {
      return false;
    }
    
    // Check if token is not expired (24 hours)
    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    return (now - tokenTime) < twentyFourHours;
  } catch (error) {
    console.error('Error validating magic link:', error);
    return false;
  }
};

import { Resend } from 'resend';

// Resend configuration
const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;
if (!resendApiKey) {
  throw new Error("VITE_RESEND_API_KEY is not set. Email functionality cannot be initialized.");
}

const resend = new Resend(resendApiKey);

export interface EmailTemplate {
  type: 'welcome' | 'update' | 'launch' | 'reminder';
  subject: string;
  htmlContent: string;
  textContent: string;
}

export interface EmailData {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text: string;
  metadata?: Record<string, any>;
}

class EmailService {
  private fromEmail = 'hello@reflectme.app';
  private fromName = 'ReflectMe Team';

  // Email templates
  private getEmailTemplate(type: 'welcome' | 'update' | 'launch' | 'reminder', subscriberData?: any): EmailTemplate {
    const templates = {
      welcome: {
        subject: 'Welcome to ReflectMe Waitlist! 🎉',
        htmlContent: this.getWelcomeEmailHTML(subscriberData),
        textContent: this.getWelcomeEmailText(subscriberData)
      },
      update: {
        subject: 'ReflectMe Development Update 🚀',
        htmlContent: this.getUpdateEmailHTML(subscriberData),
        textContent: this.getUpdateEmailText(subscriberData)
      },
      launch: {
        subject: 'ReflectMe is Live! Your 50% Discount Awaits 🎊',
        htmlContent: this.getLaunchEmailHTML(subscriberData),
        textContent: this.getLaunchEmailText(subscriberData)
      },
      reminder: {
        subject: 'Still excited about ReflectMe? 💙',
        htmlContent: this.getReminderEmailHTML(subscriberData),
        textContent: this.getReminderEmailText(subscriberData)
      }
    };

    return templates[type];
  }

  // Send email using Resend
  async sendEmail(emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: any }> {
    try {
      console.log(`📧 Sending email to ${emailData.to}: ${emailData.subject}`);
      
      const response = await resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [emailData.to],
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        tags: [
          { name: 'type', value: emailData.metadata?.type || 'waitlist' },
          { name: 'source', value: emailData.metadata?.source || 'system' }
        ]
      });

      if (response.error) {
        console.error('Resend error:', response.error);
        return { success: false, error: response.error };
      }

      console.log(`✅ Email sent successfully. Message ID: ${response.data?.id}`);
      return { success: true, messageId: response.data?.id };

    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error };
    }
  }

  // Send welcome email
  async sendWelcomeEmail(email: string, subscriberData?: any): Promise<{ success: boolean; messageId?: string; error?: any }> {
    const template = this.getEmailTemplate('welcome', subscriberData);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.htmlContent,
      text: template.textContent,
      metadata: { type: 'welcome', source: 'waitlist' }
    });
  }

  // Send update email
  async sendUpdateEmail(email: string, subscriberData?: any): Promise<{ success: boolean; messageId?: string; error?: any }> {
    const template = this.getEmailTemplate('update', subscriberData);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.htmlContent,
      text: template.textContent,
      metadata: { type: 'update', source: 'waitlist' }
    });
  }

  // Send launch email
  async sendLaunchEmail(email: string, subscriberData?: any): Promise<{ success: boolean; messageId?: string; error?: any }> {
    const template = this.getEmailTemplate('launch', subscriberData);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.htmlContent,
      text: template.textContent,
      metadata: { type: 'launch', source: 'waitlist' }
    });
  }

  // Send reminder email
  async sendReminderEmail(email: string, subscriberData?: any): Promise<{ success: boolean; messageId?: string; error?: any }> {
    const template = this.getEmailTemplate('reminder', subscriberData);
    
    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.htmlContent,
      text: template.textContent,
      metadata: { type: 'reminder', source: 'waitlist' }
    });
  }

  // Send bulk emails to multiple subscribers
  async sendBulkEmails(
    emails: string[], 
    type: 'welcome' | 'update' | 'launch' | 'reminder',
    subscribersData?: Record<string, any>
  ): Promise<{ 
    success: number; 
    failed: number; 
    results: Array<{ email: string; success: boolean; messageId?: string; error?: any }> 
  }> {
    const results = [];
    let success = 0;
    let failed = 0;

    for (const email of emails) {
      const subscriberData = subscribersData?.[email];
      let result;

      switch (type) {
        case 'welcome':
          result = await this.sendWelcomeEmail(email, subscriberData);
          break;
        case 'update':
          result = await this.sendUpdateEmail(email, subscriberData);
          break;
        case 'launch':
          result = await this.sendLaunchEmail(email, subscriberData);
          break;
        case 'reminder':
          result = await this.sendReminderEmail(email, subscriberData);
          break;
      }

      if (result.success) {
        success++;
      } else {
        failed++;
      }

      results.push({
        email,
        success: result.success,
        messageId: result.messageId,
        error: result.error
      });

      // Add delay between emails to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { success, failed, results };
  }

  // Email HTML Templates
  private getWelcomeEmailHTML(subscriberData?: any): string {
    const position = subscriberData?.position_in_queue ? `#${subscriberData.position_in_queue}` : 'early';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Welcome to ReflectMe Waitlist</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; }
            .logo { color: white; font-size: 32px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 40px; }
            .welcome-box { background: linear-gradient(135deg, #667eea20, #764ba220); border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #667eea30; }
            .benefits { margin: 24px 0; }
            .benefit { display: flex; align-items: center; margin: 12px 0; padding: 12px; background: #f8fafc; border-radius: 8px; }
            .benefit-icon { width: 24px; height: 24px; margin-right: 12px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .footer { padding: 20px; background: #f8fafc; text-align: center; color: #64748b; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">💙 ReflectMe</div>
                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Our Waitlist!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Thank you for joining our journey to revolutionize mental health support.</p>
            </div>
            
            <div class="content">
                <div class="welcome-box">
                    <h2 style="margin: 0 0 16px; color: #334155;">Hi there! 👋</h2>
                    <p style="margin: 0; color: #475569; line-height: 1.6;">
                        We're thrilled to have you as part of the ReflectMe community! Your spot on our waitlist has been confirmed, 
                        and you're one step closer to experiencing the future of personalized mental health support.
                    </p>
                    <p style="margin: 16px 0 0; color: #475569; line-height: 1.6;">
                        You're position ${position} in line – thank you for being an early supporter!
                    </p>
                </div>

                <h3 style="color: #334155; margin: 32px 0 16px;">What's coming your way:</h3>
                <div class="benefits">
                    <div class="benefit">
                        <div class="benefit-icon">🎁</div>
                        <div>
                            <strong>50% Launch Discount</strong><br>
                            <span style="color: #64748b;">Exclusive pricing for early supporters</span>
                        </div>
                    </div>
                    <div class="benefit">
                        <div class="benefit-icon">⚡</div>
                        <div>
                            <strong>Priority Access</strong><br>
                            <span style="color: #64748b;">Skip the line when we go live</span>
                        </div>
                    </div>
                    <div class="benefit">
                        <div class="benefit-icon">🚀</div>
                        <div>
                            <strong>Beta Features</strong><br>
                            <span style="color: #64748b;">Test new features before anyone else</span>
                        </div>
                    </div>
                </div>

                <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 32px 0;">
                    <h3 style="margin: 0 0 16px; color: #334155;">What happens next?</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #475569; line-height: 1.8;">
                        <li>We'll send you regular updates on our development progress</li>
                        <li>You'll get notified immediately when ReflectMe launches</li>
                        <li>Your exclusive discount will be automatically applied</li>
                        <li>Access to our beta program before public release</li>
                    </ul>
                </div>

                <div style="text-align: center; margin: 40px 0;">
                    <a href="https://reflectme.app" class="button">Visit Our Website</a>
                </div>
            </div>

            <div class="footer">
                <p style="margin: 0 0 8px;">Thank you for being part of our mission to transform mental health support.</p>
                <p style="margin: 0 0 16px;">Questions? Reply to this email or visit <a href="mailto:support@reflectme.app" style="color: #667eea;">support@reflectme.app</a></p>
                <p style="margin: 0; font-size: 12px;">
                    You're receiving this because you signed up for the ReflectMe waitlist.<br>
                    <a href="#" style="color: #667eea;">Unsubscribe</a> | <a href="#" style="color: #667eea;">Update preferences</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private getWelcomeEmailText(subscriberData?: any): string {
    const position = subscriberData?.position_in_queue ? `#${subscriberData.position_in_queue}` : 'early';
    
    return `
Welcome to ReflectMe Waitlist! 🎉

Hi there! 👋

We're thrilled to have you as part of the ReflectMe community! Your spot on our waitlist has been confirmed, and you're one step closer to experiencing the future of personalized mental health support.

You're position ${position} in line – thank you for being an early supporter!

What's coming your way:

🎁 50% Launch Discount - Exclusive pricing for early supporters
⚡ Priority Access - Skip the line when we go live  
🚀 Beta Features - Test new features before anyone else

What happens next?
• We'll send you regular updates on our development progress
• You'll get notified immediately when ReflectMe launches
• Your exclusive discount will be automatically applied
• Access to our beta program before public release

Visit our website: https://reflectme.app

Thank you for being part of our mission to transform mental health support.

Questions? Reply to this email or contact support@reflectme.app

---
You're receiving this because you signed up for the ReflectMe waitlist.
Unsubscribe: [link] | Update preferences: [link]
    `;
  }

  private getUpdateEmailHTML(subscriberData?: any): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>ReflectMe Development Update</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; }
            .content { padding: 40px; }
            .update-box { background: #ecfdf5; border-radius: 16px; padding: 24px; margin: 24px 0; border-left: 4px solid #10b981; }
            .progress-bar { background: #e5e7eb; border-radius: 8px; height: 8px; margin: 16px 0; }
            .progress-fill { background: #10b981; border-radius: 8px; height: 8px; width: 75%; }
            .button { display: inline-block; background: #10b981; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .footer { padding: 20px; background: #f8fafc; text-align: center; color: #64748b; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div style="color: white; font-size: 32px; font-weight: bold; margin-bottom: 10px;">🚀 ReflectMe</div>
                <h1 style="color: white; margin: 0; font-size: 28px;">Development Update</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Great progress this week! We're getting closer to launch.</p>
            </div>
            
            <div class="content">
                <div class="update-box">
                    <h2 style="margin: 0 0 16px; color: #065f46;">This Week's Highlights</h2>
                    <ul style="margin: 0; padding-left: 20px; color: #047857; line-height: 1.8;">
                        <li>✅ AI chat system refined and optimized</li>
                        <li>✅ New coping tools library added</li>
                        <li>✅ Enhanced privacy and security features</li>
                        <li>✅ Mobile app UI/UX improvements</li>
                    </ul>
                </div>

                <h3 style="color: #334155; margin: 32px 0 16px;">Development Progress</h3>
                <p style="color: #64748b; margin: 0 0 8px;">Overall completion: 75%</p>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>

                <h3 style="color: #334155; margin: 32px 0 16px;">Coming Soon</h3>
                <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 16px 0;">
                    <ul style="margin: 0; padding-left: 20px; color: #475569; line-height: 1.8;">
                        <li>🔧 Final beta testing phase</li>
                        <li>📱 Mobile apps for iOS and Android</li>
                        <li>🎨 Final UI polish and accessibility improvements</li>
                        <li>🚀 Launch preparation and onboarding flows</li>
                    </ul>
                </div>

                <div style="text-align: center; margin: 40px 0;">
                    <a href="https://reflectme.app/updates" class="button">Read Full Update</a>
                </div>
            </div>

            <div class="footer">
                <p style="margin: 0 0 8px;">Thank you for your patience and support!</p>
                <p style="margin: 0 0 16px;">Questions? Reply to this email or visit <a href="mailto:support@reflectme.app" style="color: #10b981;">support@reflectme.app</a></p>
                <p style="margin: 0; font-size: 12px;">
                    <a href="#" style="color: #10b981;">Unsubscribe</a> | <a href="#" style="color: #10b981;">Update preferences</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private getUpdateEmailText(subscriberData?: any): string {
    return `
ReflectMe Development Update 🚀

Great progress this week! We're getting closer to launch.

This Week's Highlights:
✅ AI chat system refined and optimized
✅ New coping tools library added  
✅ Enhanced privacy and security features
✅ Mobile app UI/UX improvements

Development Progress: 75% complete

Coming Soon:
🔧 Final beta testing phase
📱 Mobile apps for iOS and Android
🎨 Final UI polish and accessibility improvements
🚀 Launch preparation and onboarding flows

Read the full update: https://reflectme.app/updates

Thank you for your patience and support!

Questions? Reply to this email or contact support@reflectme.app

---
Unsubscribe: [link] | Update preferences: [link]
    `;
  }

  private getLaunchEmailHTML(subscriberData?: any): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>ReflectMe is Live!</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px; text-align: center; }
            .content { padding: 40px; }
            .launch-box { background: linear-gradient(135deg, #8b5cf620, #7c3aed20); border-radius: 16px; padding: 24px; margin: 24px 0; border: 2px solid #8b5cf6; text-align: center; }
            .discount-code { background: #7c3aed; color: white; font-size: 24px; font-weight: bold; padding: 16px; border-radius: 8px; margin: 16px 0; letter-spacing: 2px; }
            .button { display: inline-block; background: #8b5cf6; color: white; padding: 20px 40px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 18px; margin: 20px 0; }
            .footer { padding: 20px; background: #f8fafc; text-align: center; color: #64748b; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div style="color: white; font-size: 48px; margin-bottom: 10px;">🎊</div>
                <div style="color: white; font-size: 32px; font-weight: bold; margin-bottom: 10px;">ReflectMe</div>
                <h1 style="color: white; margin: 0; font-size: 32px;">We're Live!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 18px;">Your wait is over! ReflectMe is now available.</p>
            </div>
            
            <div class="content">
                <div class="launch-box">
                    <h2 style="margin: 0 0 16px; color: #6d28d9; font-size: 28px;">🎉 Launch Special!</h2>
                    <p style="margin: 0 0 16px; color: #7c3aed; font-size: 18px; font-weight: 600;">Your exclusive 50% discount:</p>
                    <div class="discount-code">WAITLIST50</div>
                    <p style="margin: 16px 0 0; color: #6d28d9; font-weight: 600;">Valid for the next 48 hours!</p>
                </div>

                <h3 style="color: #334155; margin: 32px 0 16px;">Ready to get started?</h3>
                <p style="color: #475569; line-height: 1.6; margin: 0 0 24px;">
                    ReflectMe is now live with all the features you've been waiting for! Create your account now and start your personalized mental health journey.
                </p>

                <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
                    <h4 style="margin: 0 0 16px; color: #334155;">What's included:</h4>
                    <ul style="margin: 0; padding-left: 20px; color: #475569; line-height: 1.8;">
                        <li>🤖 AI-powered therapy companion</li>
                        <li>📝 Digital journaling and mood tracking</li>
                        <li>🛠️ Personalized coping tools library</li>
                        <li>📊 Progress insights and analytics</li>
                        <li>🔒 End-to-end encrypted privacy</li>
                    </ul>
                </div>

                <div style="text-align: center; margin: 40px 0;">
                    <a href="https://app.reflectme.app/signup?code=WAITLIST50" class="button">Claim Your Discount & Start Now</a>
                </div>

                <p style="color: #64748b; text-align: center; font-size: 14px; margin: 24px 0;">
                    Remember: This discount expires in 48 hours. Don't miss out!
                </p>
            </div>

            <div class="footer">
                <p style="margin: 0 0 8px;">Thank you for being part of our journey from day one!</p>
                <p style="margin: 0 0 16px;">Questions? Reply to this email or visit <a href="mailto:support@reflectme.app" style="color: #8b5cf6;">support@reflectme.app</a></p>
                <p style="margin: 0; font-size: 12px;">
                    <a href="#" style="color: #8b5cf6;">Unsubscribe</a> | <a href="#" style="color: #8b5cf6;">Update preferences</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private getLaunchEmailText(subscriberData?: any): string {
    return `
🎊 ReflectMe is Live! 🎊

Your wait is over! ReflectMe is now available.

🎉 LAUNCH SPECIAL 🎉
Your exclusive 50% discount: WAITLIST50
Valid for the next 48 hours!

Ready to get started?
ReflectMe is now live with all the features you've been waiting for! Create your account now and start your personalized mental health journey.

What's included:
🤖 AI-powered therapy companion
📝 Digital journaling and mood tracking  
🛠️ Personalized coping tools library
📊 Progress insights and analytics
🔒 End-to-end encrypted privacy

Claim your discount: https://app.reflectme.app/signup?code=WAITLIST50

Remember: This discount expires in 48 hours. Don't miss out!

Thank you for being part of our journey from day one!

Questions? Reply to this email or contact support@reflectme.app

---
Unsubscribe: [link] | Update preferences: [link]
    `;
  }

  private getReminderEmailHTML(subscriberData?: any): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Still excited about ReflectMe?</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 40px; text-align: center; }
            .content { padding: 40px; }
            .reminder-box { background: #ecfeff; border-radius: 16px; padding: 24px; margin: 24px 0; border-left: 4px solid #06b6d4; }
            .button { display: inline-block; background: #06b6d4; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .footer { padding: 20px; background: #f8fafc; text-align: center; color: #64748b; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div style="color: white; font-size: 32px; font-weight: bold; margin-bottom: 10px;">💙 ReflectMe</div>
                <h1 style="color: white; margin: 0; font-size: 28px;">Still with us?</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">We haven't forgotten about you!</p>
            </div>
            
            <div class="content">
                <div class="reminder-box">
                    <h2 style="margin: 0 0 16px; color: #0e7490;">Quick Update 📋</h2>
                    <p style="margin: 0 0 16px; color: #0891b2; line-height: 1.6;">
                        We know it's been a while since you joined our waitlist, and we wanted to check in! 
                        Development is progressing well, and we're getting closer to launch every day.
                    </p>
                    <p style="margin: 0; color: #0891b2; line-height: 1.6;">
                        Your early support means everything to us, and we can't wait to share ReflectMe with you soon.
                    </p>
                </div>

                <h3 style="color: #334155; margin: 32px 0 16px;">What we've been up to:</h3>
                <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 16px 0;">
                    <ul style="margin: 0; padding-left: 20px; color: #475569; line-height: 1.8;">
                        <li>🔬 Extensive user research and testing</li>
                        <li>🎨 Refining the user experience</li>
                        <li>🔒 Implementing robust security measures</li>
                        <li>🤖 Training our AI to be more helpful and empathetic</li>
                    </ul>
                </div>

                <div style="text-align: center; margin: 40px 0;">
                    <a href="https://reflectme.app/updates" class="button">Get the Latest Updates</a>
                </div>

                <p style="color: #64748b; text-align: center; font-style: italic; margin: 24px 0;">
                    "The best things take time, and ReflectMe will be worth the wait." ✨
                </p>
            </div>

            <div class="footer">
                <p style="margin: 0 0 8px;">Thank you for your continued patience and support!</p>
                <p style="margin: 0 0 16px;">Questions? Reply to this email or visit <a href="mailto:support@reflectme.app" style="color: #06b6d4;">support@reflectme.app</a></p>
                <p style="margin: 0; font-size: 12px;">
                    <a href="#" style="color: #06b6d4;">Unsubscribe</a> | <a href="#" style="color: #06b6d4;">Update preferences</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private getReminderEmailText(subscriberData?: any): string {
    return `
Still excited about ReflectMe? 💙

We haven't forgotten about you!

Quick Update 📋
We know it's been a while since you joined our waitlist, and we wanted to check in! Development is progressing well, and we're getting closer to launch every day.

Your early support means everything to us, and we can't wait to share ReflectMe with you soon.

What we've been up to:
🔬 Extensive user research and testing
🎨 Refining the user experience
🔒 Implementing robust security measures  
🤖 Training our AI to be more helpful and empathetic

Get the latest updates: https://reflectme.app/updates

"The best things take time, and ReflectMe will be worth the wait." ✨

Thank you for your continued patience and support!

Questions? Reply to this email or contact support@reflectme.app

---
Unsubscribe: [link] | Update preferences: [link]
    `;
  }
}

export default new EmailService(); 