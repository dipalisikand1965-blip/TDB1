"""
Ticket Intelligence Module
===========================
AI-powered features for the Concierge Command Center:
1. Sentiment Analysis - Analyzes incoming requests
2. Auto-acknowledgment emails - Sends confirmation to members
3. NPS (Net Pawmoter Score) - Post-resolution satisfaction surveys

Uses Emergent LLM Key for AI features.
"""

import os
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import resend

logger = logging.getLogger(__name__)

# Database reference
_db = None

def set_intelligence_db(db):
    global _db
    _db = db

def get_db():
    if _db is None:
        raise Exception("Database not initialized for ticket_intelligence")
    return _db


# ============== SENTIMENT ANALYSIS ==============

SENTIMENT_LABELS = {
    "positive": {"emoji": "😊", "color": "green", "priority_modifier": 0},
    "neutral": {"emoji": "😐", "color": "gray", "priority_modifier": 0},
    "frustrated": {"emoji": "😠", "color": "orange", "priority_modifier": 1},
    "urgent": {"emoji": "🆘", "color": "red", "priority_modifier": 2},
    "angry": {"emoji": "😡", "color": "red", "priority_modifier": 2}
}

async def analyze_sentiment(text: str) -> Dict[str, Any]:
    """
    Analyze sentiment of incoming ticket request using Emergent LLM.
    
    Returns:
        {
            "sentiment": "positive|neutral|frustrated|urgent|angry",
            "confidence": 0.0-1.0,
            "emoji": "😊",
            "color": "green",
            "summary": "Brief reason for sentiment",
            "priority_modifier": 0-2
        }
    """
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            logger.warning("EMERGENT_LLM_KEY not set, using keyword-based sentiment")
            return keyword_based_sentiment(text)
        
        system_prompt = """You are a sentiment analyzer for a pet services company. 
Analyze customer messages and classify their emotional state.

Respond with ONLY a JSON object (no markdown, no explanation):
{
    "sentiment": "positive|neutral|frustrated|urgent|angry",
    "confidence": 0.85,
    "summary": "Brief 5-10 word reason"
}

Classification guide:
- positive: Happy, appreciative, excited about services
- neutral: Standard inquiry, no strong emotion
- frustrated: Mild annoyance, repeat issues, waiting too long
- urgent: Emergency, health concern, time-sensitive need
- angry: Very upset, complaint, demanding immediate action

Focus on pet-related context. A sick pet = urgent, not just frustrated."""

        chat = LlmChat(
            api_key=api_key,
            system_message=system_prompt
        )
        chat.with_model("openai", "gpt-4o-mini")
        
        response = await chat.send_message(UserMessage(text=f"Analyze this customer message:\n\n{text[:1000]}"))
        
        # Parse response
        import json
        try:
            # Clean response (remove markdown if present)
            clean_response = response.strip()
            if clean_response.startswith("```"):
                clean_response = clean_response.split("```")[1]
                if clean_response.startswith("json"):
                    clean_response = clean_response[4:]
            
            result = json.loads(clean_response)
            sentiment = result.get("sentiment", "neutral").lower()
            
            # Validate sentiment
            if sentiment not in SENTIMENT_LABELS:
                sentiment = "neutral"
            
            label_info = SENTIMENT_LABELS[sentiment]
            
            return {
                "sentiment": sentiment,
                "confidence": result.get("confidence", 0.8),
                "emoji": label_info["emoji"],
                "color": label_info["color"],
                "summary": result.get("summary", ""),
                "priority_modifier": label_info["priority_modifier"],
                "analyzed_at": datetime.now(timezone.utc).isoformat()
            }
            
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse LLM response: {response[:200]}")
            return keyword_based_sentiment(text)
            
    except Exception as e:
        logger.error(f"Sentiment analysis error: {e}")
        return keyword_based_sentiment(text)


def keyword_based_sentiment(text: str) -> Dict[str, Any]:
    """Fallback keyword-based sentiment analysis."""
    text_lower = text.lower()
    
    # Urgent keywords
    urgent_keywords = ["emergency", "urgent", "asap", "immediately", "sick", "dying", "accident", 
                       "injured", "bleeding", "not eating", "vomiting", "collapsed", "help"]
    
    # Angry/frustrated keywords
    angry_keywords = ["terrible", "worst", "never again", "disgusting", "scam", "fraud", 
                      "unacceptable", "ridiculous", "awful", "horrible", "pathetic"]
    
    frustrated_keywords = ["disappointed", "frustrated", "waiting", "still waiting", "no response",
                          "ignored", "again", "third time", "still no", "delay", "late"]
    
    # Positive keywords
    positive_keywords = ["thank", "love", "amazing", "wonderful", "great", "excellent", 
                        "happy", "excited", "appreciate", "perfect", "best"]
    
    # Check for matches
    if any(kw in text_lower for kw in urgent_keywords):
        sentiment = "urgent"
    elif any(kw in text_lower for kw in angry_keywords):
        sentiment = "angry"
    elif any(kw in text_lower for kw in frustrated_keywords):
        sentiment = "frustrated"
    elif any(kw in text_lower for kw in positive_keywords):
        sentiment = "positive"
    else:
        sentiment = "neutral"
    
    label_info = SENTIMENT_LABELS[sentiment]
    
    return {
        "sentiment": sentiment,
        "confidence": 0.6,  # Lower confidence for keyword-based
        "emoji": label_info["emoji"],
        "color": label_info["color"],
        "summary": "Keyword-based analysis",
        "priority_modifier": label_info["priority_modifier"],
        "analyzed_at": datetime.now(timezone.utc).isoformat()
    }


# ============== AUTO-ACKNOWLEDGMENT EMAILS ==============

async def send_ticket_acknowledgment(
    member_email: str,
    member_name: str,
    ticket_id: str,
    subject: str,
    pillar: str = "general"
) -> bool:
    """
    Send auto-acknowledgment email when a ticket is created.
    
    Returns True if email sent successfully.
    """
    try:
        api_key = os.environ.get("RESEND_API_KEY")
        if not api_key:
            logger.warning("RESEND_API_KEY not set, skipping acknowledgment email")
            return False
        
        resend.api_key = api_key
        
        # Pillar-specific messaging
        pillar_messages = {
            "celebrate": "We're excited to help make your pet's celebration special! 🎂",
            "dine": "We'll find the perfect pet-friendly dining experience for you! 🍽️",
            "stay": "We're on it to find the best boarding or stay option! 🏨",
            "travel": "Your pet's travel arrangements are our priority! ✈️",
            "care": "Your pet's health is our top concern. We're here to help! 💝",
            "shop": "We've received your order inquiry and will assist you shortly! 🛒",
            "general": "We've received your request and will get back to you soon! 🐾"
        }
        
        pillar_message = pillar_messages.get(pillar.lower(), pillar_messages["general"])
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 0 auto; }}
                .header {{ background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; }}
                .header h1 {{ margin: 0; font-size: 24px; }}
                .content {{ padding: 30px; background: #ffffff; }}
                .ticket-box {{ background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }}
                .ticket-id {{ font-size: 24px; font-weight: bold; color: #9333ea; font-family: monospace; }}
                .cta-button {{ display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }}
                .footer {{ background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }}
                .pillar-badge {{ display: inline-block; background: #9333ea; color: white; padding: 4px 12px; border-radius: 15px; font-size: 12px; text-transform: uppercase; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🐕 The Doggy Company</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Request Has Been Received!</p>
                </div>
                <div class="content">
                    <p>Hi {member_name or 'there'},</p>
                    
                    <p>Thank you for reaching out to us! We've received your request and a member of our concierge team will be in touch with you shortly.</p>
                    
                    <div class="ticket-box">
                        <p style="margin: 0 0 10px 0; color: #6b7280;">Your Ticket Reference</p>
                        <div class="ticket-id">{ticket_id}</div>
                        <p style="margin: 10px 0 0 0;"><span class="pillar-badge">{pillar.title()}</span></p>
                    </div>
                    
                    <p><strong>Regarding:</strong> {subject}</p>
                    
                    <p style="background: #fdf4ff; padding: 15px; border-radius: 8px; border-left: 4px solid #9333ea;">
                        💜 {pillar_message}
                    </p>
                    
                    <p><strong>What happens next?</strong></p>
                    <ul>
                        <li>Our concierge team is reviewing your request</li>
                        <li>You'll receive a personalized response within 24 hours</li>
                        <li>For urgent matters, we'll prioritize your request</li>
                    </ul>
                    
                    <p>In the meantime, feel free to chat with <strong>Mira®</strong>, our AI concierge, for instant assistance!</p>
                    
                    <div style="text-align: center;">
                        <a href="https://thedoggycompany.in/ask-mira" class="cta-button">
                            Chat with Mira®
                        </a>
                    </div>
                    
                    <p>With love,<br><strong>The Doggy Company Concierge Team</strong> 🐾</p>
                </div>
                <div class="footer">
                    <p>🐕 The Doggy Company | Your Pet's Life Operating System</p>
                    <p>📞 +91 96631 85747 | 📧 woof@thedoggycompany.in</p>
                    <p style="margin-top: 10px; font-size: 11px;">Reference: {ticket_id}</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        sender_email = os.environ.get("SENDER_EMAIL", "woof@thedoggycompany.in")
        
        params = {
            "from": f"The Doggy Company <{sender_email}>",
            "to": member_email,
            "subject": f"✅ We've received your request - {ticket_id}",
            "html": html_content
        }
        
        response = resend.Emails.send(params)
        logger.info(f"Acknowledgment email sent to {member_email} for ticket {ticket_id}")
        
        # Log the communication
        db = get_db()
        await db.service_desk_tickets.update_one(
            {"ticket_id": ticket_id},
            {
                "$push": {
                    "communications": {
                        "type": "auto_acknowledgment",
                        "channel": "email",
                        "to": member_email,
                        "sent_at": datetime.now(timezone.utc).isoformat(),
                        "status": "sent"
                    }
                }
            }
        )
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to send acknowledgment email: {e}")
        return False


# ============== TICKET ENRICHMENT ==============

async def enrich_ticket_with_intelligence(ticket_doc: dict) -> dict:
    """
    Enrich a ticket document with AI intelligence (sentiment, etc.)
    Call this when creating new tickets.
    """
    # Get the text to analyze
    text_to_analyze = ticket_doc.get("original_request") or ticket_doc.get("description") or ""
    
    if text_to_analyze:
        sentiment_result = await analyze_sentiment(text_to_analyze)
        ticket_doc["sentiment"] = sentiment_result
        
        # Adjust priority based on sentiment
        current_priority = ticket_doc.get("priority", 3)
        modifier = sentiment_result.get("priority_modifier", 0)
        ticket_doc["priority"] = max(1, current_priority - modifier)  # Lower number = higher priority
        
        # Add urgency flag if sentiment is urgent
        if sentiment_result.get("sentiment") in ["urgent", "angry"]:
            if ticket_doc.get("urgency") not in ["urgent", "high"]:
                ticket_doc["urgency"] = "high"
    
    return ticket_doc


# ============== NPS (NET PAWMOTER SCORE) ==============

async def send_nps_survey(
    member_email: str,
    member_name: str,
    ticket_id: str,
    resolved_by: str = None
) -> bool:
    """
    Send NPS survey email after ticket resolution.
    """
    try:
        api_key = os.environ.get("RESEND_API_KEY")
        if not api_key:
            logger.warning("RESEND_API_KEY not set, skipping NPS survey")
            return False
        
        resend.api_key = api_key
        
        # Generate unique survey token
        import hashlib
        survey_token = hashlib.sha256(f"{ticket_id}{member_email}{datetime.now().isoformat()}".encode()).hexdigest()[:16]
        
        # Build survey URL
        survey_url = f"https://thedoggycompany.in/feedback?ticket={ticket_id}&token={survey_token}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 0 auto; }}
                .header {{ background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; }}
                .content {{ padding: 30px; background: #ffffff; }}
                .nps-scale {{ display: flex; justify-content: center; gap: 8px; margin: 20px 0; flex-wrap: wrap; }}
                .nps-btn {{ width: 40px; height: 40px; border-radius: 50%; border: 2px solid #e5e7eb; background: white; font-weight: bold; cursor: pointer; text-decoration: none; display: flex; align-items: center; justify-content: center; color: #333; }}
                .nps-btn:hover {{ background: #9333ea; color: white; border-color: #9333ea; }}
                .detractor {{ border-color: #ef4444; }}
                .passive {{ border-color: #f59e0b; }}
                .promoter {{ border-color: #10b981; }}
                .footer {{ background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }}
                .paw-emoji {{ font-size: 48px; margin: 10px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🐕 How Did We Do?</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Your feedback helps us serve you better!</p>
                </div>
                <div class="content">
                    <p>Hi {member_name or 'there'},</p>
                    
                    <p>We hope we were able to help you with your recent request (Ticket: <strong>{ticket_id}</strong>).</p>
                    
                    <p>We'd love to hear about your experience! On a scale of 0-10, how likely are you to recommend The Doggy Company to a fellow pet parent?</p>
                    
                    <div class="paw-emoji">🐾</div>
                    
                    <p style="text-align: center; font-weight: bold; margin: 20px 0;">Click a number below:</p>
                    
                    <div class="nps-scale">
                        <a href="{survey_url}&score=0" class="nps-btn detractor">0</a>
                        <a href="{survey_url}&score=1" class="nps-btn detractor">1</a>
                        <a href="{survey_url}&score=2" class="nps-btn detractor">2</a>
                        <a href="{survey_url}&score=3" class="nps-btn detractor">3</a>
                        <a href="{survey_url}&score=4" class="nps-btn detractor">4</a>
                        <a href="{survey_url}&score=5" class="nps-btn detractor">5</a>
                        <a href="{survey_url}&score=6" class="nps-btn detractor">6</a>
                        <a href="{survey_url}&score=7" class="nps-btn passive">7</a>
                        <a href="{survey_url}&score=8" class="nps-btn passive">8</a>
                        <a href="{survey_url}&score=9" class="nps-btn promoter">9</a>
                        <a href="{survey_url}&score=10" class="nps-btn promoter">10</a>
                    </div>
                    
                    <p style="text-align: center; font-size: 12px; color: #6b7280;">
                        0 = Not likely &nbsp;|&nbsp; 10 = Extremely likely
                    </p>
                    
                    <p style="background: #fdf4ff; padding: 15px; border-radius: 8px; border-left: 4px solid #9333ea; margin-top: 20px;">
                        💜 <strong>Pawsome reviews with your feedback may be featured on our website!</strong> (with your permission, of course)
                    </p>
                    
                    <p>Thank you for being part of The Doggy Company family! 🐾</p>
                    
                    <p>With love,<br><strong>The Doggy Company Team</strong></p>
                </div>
                <div class="footer">
                    <p>🐕 The Doggy Company | Your Pet's Life Operating System</p>
                    <p>Reference: {ticket_id}</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        sender_email = os.environ.get("SENDER_EMAIL", "woof@thedoggycompany.in")
        
        params = {
            "from": f"The Doggy Company <{sender_email}>",
            "to": member_email,
            "subject": f"🐾 How did we do? Share your experience!",
            "html": html_content
        }
        
        response = resend.Emails.send(params)
        logger.info(f"NPS survey sent to {member_email} for ticket {ticket_id}")
        
        # Store pending NPS record
        db = get_db()
        await db.nps_surveys.insert_one({
            "ticket_id": ticket_id,
            "member_email": member_email,
            "member_name": member_name,
            "survey_token": survey_token,
            "resolved_by": resolved_by,
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "status": "pending",
            "score": None,
            "feedback": None,
            "responded_at": None
        })
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to send NPS survey: {e}")
        return False


async def record_nps_response(
    ticket_id: str,
    survey_token: str,
    score: int,
    feedback: str = None,
    allow_publish: bool = False
) -> Dict[str, Any]:
    """
    Record an NPS survey response.
    
    If score >= 9 and feedback is provided and allow_publish is True,
    creates a pending review for admin approval.
    """
    db = get_db()
    
    # Find the survey
    survey = await db.nps_surveys.find_one({
        "ticket_id": ticket_id,
        "survey_token": survey_token
    })
    
    if not survey:
        return {"success": False, "error": "Survey not found"}
    
    if survey.get("status") == "completed":
        return {"success": False, "error": "Survey already completed"}
    
    # Update the survey
    now = datetime.now(timezone.utc).isoformat()
    await db.nps_surveys.update_one(
        {"_id": survey["_id"]},
        {
            "$set": {
                "score": score,
                "feedback": feedback,
                "allow_publish": allow_publish,
                "responded_at": now,
                "status": "completed"
            }
        }
    )
    
    # Classify NPS
    if score >= 9:
        nps_category = "promoter"
    elif score >= 7:
        nps_category = "passive"
    else:
        nps_category = "detractor"
    
    result = {
        "success": True,
        "score": score,
        "category": nps_category,
        "message": "Thank you for your feedback!"
    }
    
    # If promoter with feedback and permission, create pending review
    if score >= 9 and feedback and allow_publish:
        review_doc = {
            "source": "nps_survey",
            "ticket_id": ticket_id,
            "member_email": survey.get("member_email"),
            "member_name": survey.get("member_name"),
            "score": score,
            "content": feedback,
            "status": "pending",  # Requires admin approval
            "created_at": now,
            "approved_at": None,
            "approved_by": None,
            "display_locations": [],  # Will be set by admin
            "featured": False
        }
        await db.reviews.insert_one(review_doc)
        result["review_created"] = True
        result["message"] = "Thank you! Your review is pending approval and may be featured on our website!"
    
    return result
