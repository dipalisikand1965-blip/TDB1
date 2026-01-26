"""
AI Product Description Enhancer for The Doggy Company
Uses Emergent LLM to rewrite product descriptions professionally for Mira AI
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


class AIDescriptionEnhancer:
    """Enhances product descriptions using AI"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.api_key = EMERGENT_LLM_KEY
        
    async def enhance_description(self, product: dict) -> str:
        """Generate an AI-enhanced description for a product"""
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        name = product.get("name", "")
        category = product.get("category", "")
        tags = product.get("tags", [])
        options = product.get("options", [])
        current_desc = product.get("description", "") or product.get("short_description", "")
        
        # Build options string
        options_str = ""
        for opt in options:
            if opt.get("values"):
                options_str += f"\n- {opt.get('name')}: {', '.join(opt.get('values', []))}"
        
        prompt = f"""You are a professional copywriter for The Doggy Company, a premium pet products company.

Rewrite the product description for this pet product to be:
- Engaging and warm, speaking to pet parents
- Highlighting key benefits for pets
- Professional yet friendly tone
- Mentioning any customization options available
- 2-3 sentences maximum
- Include relevant emojis sparingly (1-2 max)

Product: {name}
Category: {category}
Tags: {', '.join(tags[:10]) if tags else 'N/A'}
Available Options: {options_str if options_str else 'None'}
Current Description: {current_desc[:300] if current_desc else 'No description available'}

Write ONLY the new description, nothing else:"""

        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"desc-enhance-{product.get('id', 'unknown')[:20]}",
                system_message="You are a professional pet product copywriter. Write concise, engaging descriptions."
            ).with_model("openai", "gpt-4.1-mini")
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            # Clean up response
            enhanced = response.strip().strip('"').strip()
            
            # Fallback if response is empty or too short
            if not enhanced or len(enhanced) < 20:
                enhanced = f"Treat your furry friend to {name}! Perfect for pet parents who want the best for their companions."
            
            return enhanced
            
        except Exception as e:
            logger.error(f"Error enhancing description for {name}: {e}")
            # Return a basic enhanced description
            return f"Delight your pet with {name}! A perfect choice for discerning pet parents."
    
    async def enhance_all_products(self, batch_size: int = 20, update_db: bool = False) -> Dict[str, Any]:
        """Enhance descriptions for all products"""
        results = {
            "total_processed": 0,
            "enhanced": 0,
            "skipped": 0,
            "errors": [],
            "samples": []
        }
        
        # Get products that need enhancement (empty or short descriptions)
        products = await self.db.unified_products.find(
            {
                "$or": [
                    {"ai_description": {"$exists": False}},
                    {"ai_description": None},
                    {"ai_description": ""}
                ]
            },
            {"_id": 0}
        ).to_list(None)
        
        logger.info(f"Found {len(products)} products needing description enhancement")
        results["total_to_process"] = len(products)
        
        # Process in batches
        for i in range(0, len(products), batch_size):
            batch = products[i:i + batch_size]
            logger.info(f"Processing batch {i//batch_size + 1} ({len(batch)} products)")
            
            for product in batch:
                try:
                    product_id = product.get("id")
                    name = product.get("name", "Unknown")
                    
                    # Skip if already has good description
                    existing_desc = product.get("short_description") or product.get("description", "")
                    if existing_desc and len(existing_desc) > 100 and product.get("ai_description"):
                        results["skipped"] += 1
                        continue
                    
                    # Enhance description
                    enhanced_desc = await self.enhance_description(product)
                    
                    results["total_processed"] += 1
                    
                    if update_db and enhanced_desc:
                        await self.db.unified_products.update_one(
                            {"id": product_id},
                            {"$set": {
                                "ai_description": enhanced_desc,
                                "short_description": enhanced_desc,
                                "ai_enhanced_at": datetime.now(timezone.utc).isoformat()
                            }}
                        )
                        results["enhanced"] += 1
                    
                    # Keep samples for review
                    if len(results["samples"]) < 10:
                        results["samples"].append({
                            "name": name,
                            "original": existing_desc[:100] if existing_desc else "None",
                            "enhanced": enhanced_desc[:200]
                        })
                    
                    # Small delay to avoid rate limits
                    await asyncio.sleep(0.3)
                    
                except Exception as e:
                    logger.error(f"Error processing {product.get('name', 'unknown')}: {e}")
                    results["errors"].append(str(e)[:100])
            
            # Pause between batches
            await asyncio.sleep(1)
        
        return results
    
    async def enhance_single_product(self, product_id: str) -> Dict[str, Any]:
        """Enhance description for a single product"""
        product = await self.db.unified_products.find_one({"id": product_id}, {"_id": 0})
        
        if not product:
            return {"error": "Product not found"}
        
        enhanced_desc = await self.enhance_description(product)
        
        # Update in database
        await self.db.unified_products.update_one(
            {"id": product_id},
            {"$set": {
                "ai_description": enhanced_desc,
                "short_description": enhanced_desc,
                "ai_enhanced_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {
            "success": True,
            "product_id": product_id,
            "original": product.get("short_description", "")[:200],
            "enhanced": enhanced_desc
        }
