import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails."""

    def __init__(
        self,
        smtp_host: str = "localhost",
        smtp_port: int = 587,
        sender_email: str = "noreply@chesed.app",
        sender_name: str = "Chesed",
        username: Optional[str] = None,
        password: Optional[str] = None,
    ):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.sender_email = sender_email
        self.sender_name = sender_name
        self.username = username
        self.password = password

    def send_verification_email(self, recipient_email: str, verification_token: str, verification_link: str) -> bool:
        """Send email verification link to user."""
        try:
            subject = "Verify Your Email - Chesed"
            
            # HTML email body
            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #3c6a35;">Verify Your Email</h2>
                        <p>Welcome to Chesed! To complete your registration and start sharing favors, please verify your email address.</p>
                        
                        <p style="margin: 30px 0;">
                            <a href="{verification_link}" 
                               style="background-color: #3c6a35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
                                Verify Email
                            </a>
                        </p>
                        
                        <p style="font-size: 12px; color: #666;">
                            Or copy this link: <br/>
                            <code>{verification_link}</code>
                        </p>
                        
                        <p style="font-size: 12px; color: #999; margin-top: 40px;">
                            This link will expire in 24 hours.<br/>
                            If you didn't create this account, please ignore this email.
                        </p>
                    </div>
                </body>
            </html>
            """
            
            # Plain text fallback
            text_body = f"""
Verify Your Email - Chesed

Welcome to Chesed! To complete your registration and start sharing favors, please verify your email address.

Click this link to verify:
{verification_link}

This link will expire in 24 hours.
If you didn't create this account, please ignore this email.
            """
            
            return self._send_email(recipient_email, subject, text_body, html_body)
        except Exception as e:
            logger.error(f"Failed to send verification email to {recipient_email}: {str(e)}")
            return False

    def _send_email(self, recipient_email: str, subject: str, text_body: str, html_body: str) -> bool:
        """Send email via SMTP."""
        try:
            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.sender_name} <{self.sender_email}>"
            msg["To"] = recipient_email

            # Attach text and HTML versions
            msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            # Send via SMTP
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                if self.username and self.password:
                    server.starttls()
                    server.login(self.username, self.password)
                server.send_message(msg)

            logger.info(f"Email sent successfully to {recipient_email}")
            return True
        except Exception as e:
            logger.error(f"SMTP error while sending to {recipient_email}: {str(e)}")
            return False


# In development, use a mock email service that logs emails instead
class MockEmailService(EmailService):
    """Mock email service for development."""

    def _send_email(self, recipient_email: str, subject: str, text_body: str, html_body: str) -> bool:
        logger.info(f"\n{'='*60}")
        logger.info(f"MOCK EMAIL SENT")
        logger.info(f"To: {recipient_email}")
        logger.info(f"Subject: {subject}")
        logger.info(f"\n{text_body}")
        logger.info(f"{'='*60}\n")
        return True


# Create singleton instance (will be initialized in main.py)
email_service: Optional[EmailService] = None


def get_email_service() -> EmailService:
    """Get email service instance."""
    global email_service
    if email_service is None:
        # Use mock service by default
        email_service = MockEmailService()
    return email_service


def init_email_service(smtp_config: dict) -> None:
    """Initialize email service with configuration."""
    global email_service
    if smtp_config.get("use_mock", True):
        email_service = MockEmailService()
    else:
        email_service = EmailService(
            smtp_host=smtp_config.get("smtp_host", "localhost"),
            smtp_port=smtp_config.get("smtp_port", 587),
            sender_email=smtp_config.get("sender_email", "noreply@chesed.app"),
            sender_name=smtp_config.get("sender_name", "Chesed"),
            username=smtp_config.get("username"),
            password=smtp_config.get("password"),
        )
