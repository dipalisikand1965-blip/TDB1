"""
Member Auto-Recognition Utility
Lookup members by phone, email, or other identifiers
"""

from typing import Optional, Dict, List, Any
from datetime import datetime, timezone


class MemberRecognition:
    """Member recognition service for auto-identifying members"""
    
    def __init__(self, db):
        self.db = db
    
    async def find_member_by_phone(self, phone: str) -> Optional[Dict]:
        """Find member by phone number"""
        if not phone:
            return None
        
        # Clean phone number
        clean_phone = phone.replace("+", "").replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        
        # Try different phone formats
        phone_variants = [
            clean_phone,
            f"+91{clean_phone[-10:]}" if len(clean_phone) >= 10 else clean_phone,
            f"91{clean_phone[-10:]}" if len(clean_phone) >= 10 else clean_phone,
            clean_phone[-10:] if len(clean_phone) >= 10 else clean_phone,
        ]
        
        # Search in users collection
        for phone_var in phone_variants:
            member = await self.db.users.find_one({
                "$or": [
                    {"phone": phone_var},
                    {"phone": {"$regex": f".*{phone_var[-10:]}$"}} if len(phone_var) >= 10 else {"phone": phone_var}
                ]
            }, {"_id": 0, "password_hash": 0})
            if member:
                return await self._enrich_member_data(member)
        
        return None
    
    async def find_member_by_email(self, email: str) -> Optional[Dict]:
        """Find member by email address"""
        if not email:
            return None
        
        email_lower = email.lower().strip()
        
        member = await self.db.users.find_one(
            {"email": {"$regex": f"^{email_lower}$", "$options": "i"}},
            {"_id": 0, "password_hash": 0}
        )
        
        if member:
            return await self._enrich_member_data(member)
        
        return None
    
    async def find_member_by_name(self, name: str) -> List[Dict]:
        """Find members by name (returns multiple matches)"""
        if not name or len(name) < 2:
            return []
        
        members = await self.db.users.find(
            {"name": {"$regex": name, "$options": "i"}},
            {"_id": 0, "password_hash": 0}
        ).limit(10).to_list(10)
        
        enriched = []
        for member in members:
            enriched.append(await self._enrich_member_data(member))
        
        return enriched
    
    async def auto_recognize(self, identifier: str) -> Dict:
        """
        Auto-recognize a member from any identifier (phone, email, or name)
        
        Args:
            identifier: Phone number, email, or name
            
        Returns:
            Recognition result with member data if found
        """
        if not identifier:
            return {"found": False, "type": None, "member": None}
        
        identifier = identifier.strip()
        
        # Check if it's an email
        if "@" in identifier:
            member = await self.find_member_by_email(identifier)
            if member:
                return {"found": True, "type": "email", "member": member}
        
        # Check if it's a phone number (contains mostly digits)
        cleaned = identifier.replace("+", "").replace("-", "").replace(" ", "").replace("(", "").replace(")", "")
        if cleaned.isdigit() and len(cleaned) >= 10:
            member = await self.find_member_by_phone(identifier)
            if member:
                return {"found": True, "type": "phone", "member": member}
        
        # Try name search
        members = await self.find_member_by_name(identifier)
        if members:
            return {
                "found": True, 
                "type": "name", 
                "member": members[0] if len(members) == 1 else None,
                "candidates": members if len(members) > 1 else None
            }
        
        return {"found": False, "type": None, "member": None}
    
    async def _enrich_member_data(self, member: Dict) -> Dict:
        """Enrich member data with additional info"""
        member_id = member.get("id") or member.get("user_id")
        
        # Get order history
        orders = await self.db.orders.find(
            {"$or": [
                {"user_id": member_id},
                {"email": member.get("email")},
                {"phone": member.get("phone")}
            ]}
        ).sort("created_at", -1).limit(5).to_list(5)
        
        # Get pet data
        pets = await self.db.pet_profiles.find(
            {"user_id": member_id}
        ).to_list(10) if member_id else []
        
        # Get tickets
        tickets = await self.db.tickets.find(
            {"$or": [
                {"member.email": member.get("email")},
                {"member.phone": member.get("phone")}
            ]}
        ).sort("created_at", -1).limit(5).to_list(5)
        
        # Calculate stats
        total_spent = sum(o.get("total", 0) for o in orders)
        order_count = await self.db.orders.count_documents({
            "$or": [
                {"user_id": member_id},
                {"email": member.get("email")}
            ]
        })
        
        member["stats"] = {
            "total_orders": order_count,
            "total_spent": round(total_spent, 2),
            "recent_orders": len(orders),
            "pets_count": len(pets),
            "open_tickets": len([t for t in tickets if t.get("status") in ["open", "in_progress"]])
        }
        
        member["recent_orders"] = [
            {
                "order_id": o.get("order_id"),
                "total": o.get("total"),
                "status": o.get("status"),
                "created_at": o.get("created_at"),
                "items_count": len(o.get("items", []))
            }
            for o in orders
        ]
        
        member["pets"] = [
            {
                "name": p.get("name"),
                "breed": p.get("breed"),
                "pet_type": p.get("pet_type", "dog"),
                "age": p.get("age")
            }
            for p in pets
        ]
        
        member["recent_tickets"] = [
            {
                "ticket_id": t.get("ticket_id"),
                "title": t.get("title"),
                "status": t.get("status"),
                "created_at": t.get("created_at")
            }
            for t in tickets
        ]
        
        return member


# API route function to be added to server
async def member_lookup_api(db, identifier: str) -> Dict:
    """API wrapper for member lookup"""
    recognition = MemberRecognition(db)
    return await recognition.auto_recognize(identifier)
