"""
AI Service Description Enhancer for The Doggy Company
Uses Emergent LLM to enhance service descriptions for Mira AI
"""

import os
import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorDatabase
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Initialize Emergent LLM
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")


class AIServiceEnhancer:
    """Enhances service descriptions using AI"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.api_key = EMERGENT_LLM_KEY
        
    async def enhance_description(self, service: dict) -> str:
        """Generate an AI-enhanced description for a service"""
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        name = service.get("name", "")
        pillar = service.get("pillar", "")
        category = service.get("category", "")
        tags = service.get("tags", [])
        current_desc = service.get("description", "") or service.get("short_description", "")
        mira_whisper = service.get("mira_whisper", "")
        
        prompt = f"""Rewrite this pet service description to be:
- Warm and caring, speaking to pet parents
- Highlighting key benefits for their pets
- Professional yet approachable tone
- 2-3 sentences maximum
- Include 1-2 relevant emojis

Service: {name}
Category: {category}
Pillar: {pillar}
Tags: {', '.join(tags[:10]) if tags else 'N/A'}
Current Description: {current_desc[:300] if current_desc else 'No description'}
Mira's Note: {mira_whisper[:200] if mira_whisper else 'N/A'}

Write ONLY the new description, nothing else:"""

        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"svc-enhance-{service.get('id', 'unknown')[:20]}",
                system_message="You are a professional pet service copywriter. Write concise, engaging descriptions that make pet parents feel cared for."
            )
            
            response = await chat.send_message(UserMessage(prompt))
            
            enhanced = response.strip().strip('"').strip() if isinstance(response, str) else str(response).strip()
            
            if not enhanced or len(enhanced) < 20:
                enhanced = f"Give your furry friend the best care with {name}! Our dedicated team ensures a pawsome experience every time. 🐾"
            
            return enhanced
            
        except Exception as e:
            logger.error(f"Error enhancing service description for {name}: {e}")
            return f"Professional {category} service for your beloved pet. Our expert team is here to help! 🐕"
    
    async def enhance_all_services(self, batch_size: int = 20, update_db: bool = True) -> dict:
        """Enhance all service descriptions in batches"""
        # Find services without enhanced descriptions
        services = await self.db.services_master.find(
            {"$or": [
                {"ai_enhanced_description": {"$exists": False}},
                {"ai_enhanced_description": None},
                {"ai_enhanced_description": ""}
            ]},
            {"_id": 0}
        ).limit(batch_size).to_list(batch_size)
        
        enhanced_count = 0
        errors = []
        
        for service in services:
            try:
                enhanced_desc = await self.enhance_description(service)
                
                if update_db and enhanced_desc:
                    await self.db.services_master.update_one(
                        {"id": service["id"]},
                        {"$set": {
                            "ai_enhanced_description": enhanced_desc,
                            "description_enhanced_at": datetime.now(timezone.utc)
                        }}
                    )
                    enhanced_count += 1
                    
                # Small delay to avoid rate limits
                await asyncio.sleep(0.5)
                
            except Exception as e:
                errors.append({"service_id": service.get("id"), "error": str(e)})
                logger.error(f"Error enhancing service {service.get('id')}: {e}")
        
        return {
            "enhanced": enhanced_count,
            "total_processed": len(services),
            "errors": len(errors),
            "error_details": errors[:5]  # Only return first 5 errors
        }
    
    async def enhance_single_service(self, service_id: str) -> dict:
        """Enhance description for a single service"""
        service = await self.db.services_master.find_one({"id": service_id}, {"_id": 0})
        
        if not service:
            return {"success": False, "error": "Service not found"}
        
        enhanced_desc = await self.enhance_description(service)
        
        await self.db.services_master.update_one(
            {"id": service_id},
            {"$set": {
                "ai_enhanced_description": enhanced_desc,
                "description_enhanced_at": datetime.now(timezone.utc)
            }}
        )
        
        return {
            "success": True,
            "service_id": service_id,
            "original_description": service.get("description", "")[:200],
            "enhanced_description": enhanced_desc
        }
