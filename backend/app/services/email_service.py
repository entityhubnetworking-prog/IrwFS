"""
Email service for verification and notifications
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import secrets
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.user import User, VerificationToken


class EmailService:
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.email_from = settings.EMAIL_FROM
    
    def send_email(self, to_email: str, subject: str, body: str, html_body: Optional[str] = None):
        """Send an email via SMTP"""
        if not self.smtp_user or not self.smtp_password:
            print(f"[DEV] Would send email to {to_email}: {subject}")
            return True
        
        msg = MIMEMultipart("alternative")
        msg["From"] = self.email_from
        msg["To"] = to_email
        msg["Subject"] = subject
        
        msg.attach(MIMEText(body, "plain"))
        if html_body:
            msg.attach(MIMEText(html_body, "html"))
        
        try:
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.email_from, to_email, msg.as_string())
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False
    
    def send_verification_email(self, to_email: str, token: str):
        """Send email verification link"""
        verify_url = f"http://localhost:8000/api/auth/verify/{token}"
        subject = "Verify your IrwFS account"
        body = f"Please verify your email by visiting: {verify_url}"
        html_body = f"""
        <h2>Welcome to IrwFS!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="{verify_url}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
        """
        return self.send_email(to_email, subject, body, html_body)
    
    def send_password_reset_email(self, to_email: str, token: str):
        """Send password reset link"""
        reset_url = f"http://localhost:3000/reset-password/{token}"
        subject = "Reset your IrwFS password"
        body = f"Reset your password by visiting: {reset_url}"
        html_body = f"""
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="{reset_url}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        """
        return self.send_email(to_email, subject, body, html_body)


async def create_verification_token(
    db: AsyncSession, 
    user_id: int, 
    token_type: str = "email_verification",
    expires_hours: int = 24
) -> VerificationToken:
    """Create a new verification token"""
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=expires_hours)
    
    verification = VerificationToken(
        user_id=user_id,
        token=token,
        token_type=token_type,
        expires_at=expires_at
    )
    db.add(verification)
    await db.commit()
    await db.refresh(verification)
    return verification


async def verify_token(
    db: AsyncSession,
    token: str,
    token_type: str = "email_verification"
) -> Optional[User]:
    """Verify a token and return the user"""
    result = await db.execute(
        select(VerificationToken).where(
            VerificationToken.token == token,
            VerificationToken.token_type == token_type,
            VerificationToken.used == False,
            VerificationToken.expires_at > datetime.utcnow()
        )
    )
    verification = result.scalar_one_or_none()
    
    if not verification:
        return None
    
    # Mark token as used
    verification.used = True
    
    # Get user
    result = await db.execute(select(User).where(User.id == verification.user_id))
    user = result.scalar_one_or_none()
    
    if user and token_type == "email_verification":
        user.is_verified = True
    
    await db.commit()
    return user


email_service = EmailService()
