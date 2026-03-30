"""
Email sender module.

Sends personalized outreach emails to businesses with page_approved status.
Includes rate limiting, opt-out link, and SMTP support.
"""

import smtplib
import time
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from automation.config import (
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD,
    SENDER_EMAIL, SENDER_NAME, PREVIEW_BASE_URL,
    MAX_EMAILS_PER_DAY,
)


EMAIL_TEMPLATE = """
Dzień dobry,

Zauważyliśmy, że {nazwa_firmy} {website_status}.

Przygotowaliśmy bezpłatny podgląd nowoczesnej strony internetowej
specjalnie dla Państwa firmy:

👉 {preview_url}

Strona zawiera Państwa aktualne dane, godziny otwarcia{reviews_mention}
i mapę dojazdu.

Jeśli strona się podoba — zapraszamy do kontaktu.
Chętnie dostosujemy ją do Państwa potrzeb.

Pozdrawiam,
{sender_name}
{sender_email}

---
Jeśli nie chcą Państwo otrzymywać od nas wiadomości,
prosimy o odpowiedź z tematem "REZYGNACJA".
""".strip()


def _build_email_body(lead: dict) -> str:
    """Build personalized email body for a lead."""
    has_website = bool(lead.get("strona_www"))
    website_status = (
        "posiada stronę, która mogłaby lepiej prezentować Państwa firmę"
        if has_website
        else "nie posiada jeszcze strony internetowej"
    )

    has_reviews = bool(lead.get("ocena"))
    reviews_mention = ", opinie klientów" if has_reviews else ""

    # Build preview URL from local file path or configured base URL
    slug = lead.get("link_preview", "").split("/")[-1].replace(".html", "")
    preview_url = f"{PREVIEW_BASE_URL}/{slug}"

    return EMAIL_TEMPLATE.format(
        nazwa_firmy=lead.get("nazwa_firmy", ""),
        website_status=website_status,
        preview_url=preview_url,
        reviews_mention=reviews_mention,
        sender_name=SENDER_NAME,
        sender_email=SENDER_EMAIL,
    )


def _build_subject(lead: dict) -> str:
    """Build email subject line."""
    return f"Przygotowaliśmy stronę internetową dla {lead.get('nazwa_firmy', 'Państwa firmy')} — zobacz podgląd"


def send_email(to_email: str, subject: str, body: str) -> bool:
    """
    Send a single email via SMTP.

    Returns True if sent successfully, False otherwise.
    """
    if not all([SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SENDER_EMAIL]):
        print("  [Email] SMTP not configured. Skipping send.")
        print(f"  [Email] Would send to: {to_email}")
        print(f"  [Email] Subject: {subject}")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
    msg["To"] = to_email

    msg.attach(MIMEText(body, "plain", "utf-8"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        print(f"  [Email] Sent to {to_email}")
        return True
    except smtplib.SMTPException as e:
        print(f"  [Email] Failed to send to {to_email}: {e}")
        return False


def send_outreach_emails(leads: list[dict]) -> list[dict]:
    """
    Send outreach emails to leads with status 'page_approved'.
    Respects MAX_EMAILS_PER_DAY rate limit.

    Updates lead status to 'sent' or keeps unchanged on failure.
    Returns updated leads.
    """
    approved = [l for l in leads if l.get("status") == "page_approved"]

    if not approved:
        print("[Email] No leads with status 'page_approved'. Nothing to send.")
        return leads

    print(f"[Email] Sending to {min(len(approved), MAX_EMAILS_PER_DAY)} of {len(approved)} approved leads (limit: {MAX_EMAILS_PER_DAY}/day)...")

    sent_count = 0
    today = datetime.now().strftime("%Y-%m-%d")

    for lead in approved:
        if sent_count >= MAX_EMAILS_PER_DAY:
            print(f"[Email] Daily limit reached ({MAX_EMAILS_PER_DAY}). Stopping.")
            break

        email = lead.get("email", "")
        if not email:
            print(f"  [Email] No email for {lead.get('nazwa_firmy', '?')}. Skipping.")
            continue

        subject = _build_subject(lead)
        body = _build_email_body(lead)

        success = send_email(email, subject, body)
        if success:
            lead["status"] = "sent"
            lead["data_wyslania"] = today
            lead["kanal_wyslania"] = "email"
            sent_count += 1

        # Rate limiting: wait between sends
        time.sleep(2)

    print(f"[Email] Done. Sent {sent_count} emails.")
    return leads
