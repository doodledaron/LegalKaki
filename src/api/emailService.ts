import { EmailData } from "@/components/modals/EmailModal";

export interface EmailResponse {
  message_id: string;
  status: string;
  to: string[];
}

export interface EmailError {
  detail: string;
}

export class EmailService {
  private baseUrl: string;

  constructor() {
    // Use the email backend service URL - you can configure this in env
    this.baseUrl = process.env.NEXT_PUBLIC_EMAIL_SERVICE_URL || 'http://localhost:8001/api/v1';
  }

  async sendEmail(emailData: EmailData): Promise<EmailResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailData.to,
          subject: emailData.subject,
          body: emailData.body,
          is_html: false, // Send as plain text for now
        }),
      });

      if (!response.ok) {
        const errorData: EmailError = await response.json();
        throw new Error(errorData.detail || 'Failed to send email');
      }

      return await response.json();
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  }

  async getVerifiedEmails(): Promise<{
    verified_emails: string[];
    sandbox_mode: boolean;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/verified-emails`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch verified emails');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch verified emails:', error);
      throw error;
    }
  }

  // For development/demo purposes when email service is not available
  async sendEmailDemo(emailData: EmailData): Promise<EmailResponse> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('Demo email send:', {
      to: emailData.to,
      subject: emailData.subject,
      body: emailData.body,
      documentIds: emailData.documentIds,
    });

    // Simulate success response
    return {
      message_id: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'sent',
      to: emailData.to,
    };
  }
}

// Create singleton instance
export const emailService = new EmailService();