"""
Pillar Resolver v1.0
Converts pillar intent → MongoDB query using rules

The Doggy Company
Last Updated: January 31, 2026

Usage:
    from pillar_resolver import PillarResolver
    
    resolver = PillarResolver()
    
    # Get products for a pillar
    products = await resolver.get_products("travel", db, limit=20)
    
    # Get services for a pillar
    services = await resolver.get_services("care", db, limit=10)
    
    # Get both
    results = await resolver.get_all("fit", db)
"""

import yaml
import os
import logging
from typing import Dict, List, Any, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

class PillarResolver:
    """
    Resolves pillar intents to MongoDB queries using pillar_rules_v1.yaml
    
    Architecture:
    - Products have base_tags (facts about WHAT they are)
    - Services have base_tags (facts about WHAT they are)
    - Pillars are VIEWS defined by rules (WHEN/WHY they matter)
    - This resolver converts pillar → rules → MongoDB filter
    """
    
    def __init__(self, rules_path: str = None):
        """Initialize resolver with pillar rules"""
        if rules_path is None:
            rules_path = Path(__file__).parent / "pillar_rules_v1.yaml"
        
        self.rules = self._load_rules(rules_path)
        self.valid_pillars = list(self.rules.keys())
        
    def _load_rules(self, path: str) -> Dict:
        """Load pillar rules from YAML file"""
        try:
            with open(path, 'r') as f:
                rules = yaml.safe_load(f)
            logger.info(f"Loaded {len(rules)} pillar rules")
            return rules
        except Exception as e:
            logger.error(f"Failed to load pillar rules: {e}")
            return {}
    
    def _build_mongo_query(self, rules: Dict, item_type: str = "products") -> Dict:
        """
        Convert pillar rules to MongoDB query
        
        Rules structure:
            must: {field: value}      → required match
            boost: {field: value}     → used for sorting, not filtering
            exclude: {field: value}   → must NOT match
        """
        if not rules or item_type not in rules:
            return {}
        
        item_rules = rules[item_type]
        query = {}
        
        # Process 'must' rules (required)
        must = item_rules.get("must", {})
        for field, value in must.items():
            if value:  # Skip empty values
                if isinstance(value, list):
                    # Field must be one of these values
                    query[f"base_tags.{field}"] = {"$in": value}
                else:
                    query[f"base_tags.{field}"] = value
        
        # Process 'exclude' rules (must not match)
        exclude = item_rules.get("exclude", {})
        for field, value in exclude.items():
            if value:  # Skip empty values
                if isinstance(value, list):
                    query[f"base_tags.{field}"] = {"$nin": value}
                else:
                    query[f"base_tags.{field}"] = {"$ne": value}
        
        return query
    
    def _get_boost_fields(self, rules: Dict, item_type: str = "products") -> Dict:
        """Get boost fields for sorting/scoring"""
        if not rules or item_type not in rules:
            return {}
        return rules[item_type].get("boost", {})
    
    def get_product_query(self, pillar: str) -> Dict:
        """Get MongoDB query for products in a pillar"""
        if pillar not in self.rules:
            logger.warning(f"Unknown pillar: {pillar}, returning empty query")
            return {}
        
        return self._build_mongo_query(self.rules[pillar], "products")
    
    def get_service_query(self, pillar: str) -> Dict:
        """Get MongoDB query for services in a pillar"""
        if pillar not in self.rules:
            logger.warning(f"Unknown pillar: {pillar}, returning empty query")
            return {}
        
        return self._build_mongo_query(self.rules[pillar], "services")
    
    async def get_products(
        self, 
        pillar: str, 
        db, 
        limit: int = 20,
        skip: int = 0,
        additional_filters: Dict = None
    ) -> List[Dict]:
        """
        Get products for a pillar using rules-based query
        
        Args:
            pillar: Pillar name (e.g., "travel", "care")
            db: MongoDB database instance
            limit: Max products to return
            skip: Pagination offset
            additional_filters: Extra filters to apply
            
        Returns:
            List of products matching pillar rules
        """
        query = self.get_product_query(pillar)
        
        # Add any additional filters
        if additional_filters:
            query.update(additional_filters)
        
        # Add active filter
        query["is_active"] = {"$ne": False}
        
        # Get boost fields for sorting
        boost = self._get_boost_fields(self.rules.get(pillar, {}), "products")
        
        # Build sort (boosted fields first, then by name)
        sort = [("_id", -1)]  # Default sort
        
        try:
            cursor = db.products.find(query, {"_id": 0}).skip(skip).limit(limit).sort(sort)
            products = await cursor.to_list(length=limit)
            
            logger.info(f"Pillar '{pillar}' returned {len(products)} products")
            return products
            
        except Exception as e:
            logger.error(f"Error fetching products for pillar {pillar}: {e}")
            return []
    
    async def get_services(
        self, 
        pillar: str, 
        db, 
        limit: int = 20,
        skip: int = 0,
        additional_filters: Dict = None
    ) -> List[Dict]:
        """
        Get services for a pillar using rules-based query
        
        Args:
            pillar: Pillar name
            db: MongoDB database instance
            limit: Max services to return
            skip: Pagination offset
            additional_filters: Extra filters to apply
            
        Returns:
            List of services matching pillar rules
        """
        query = self.get_service_query(pillar)
        
        if additional_filters:
            query.update(additional_filters)
        
        query["is_active"] = {"$ne": False}
        
        try:
            # Try multiple service collections
            services = []
            
            for collection_name in ["services", "care_services", "grooming_services"]:
                try:
                    cursor = db[collection_name].find(query, {"_id": 0}).limit(limit)
                    items = await cursor.to_list(length=limit)
                    services.extend(items)
                except:
                    pass
            
            # Deduplicate by id
            seen = set()
            unique_services = []
            for s in services:
                sid = s.get("id") or s.get("name")
                if sid and sid not in seen:
                    seen.add(sid)
                    unique_services.append(s)
            
            logger.info(f"Pillar '{pillar}' returned {len(unique_services)} services")
            return unique_services[:limit]
            
        except Exception as e:
            logger.error(f"Error fetching services for pillar {pillar}: {e}")
            return []
    
    async def get_all(
        self, 
        pillar: str, 
        db, 
        product_limit: int = 20,
        service_limit: int = 10
    ) -> Dict[str, List]:
        """
        Get both products and services for a pillar
        
        Returns:
            {"products": [...], "services": [...]}
        """
        products = await self.get_products(pillar, db, limit=product_limit)
        services = await self.get_services(pillar, db, limit=service_limit)
        
        return {
            "products": products,
            "services": services,
            "pillar": pillar,
            "total_products": len(products),
            "total_services": len(services)
        }
    
    def get_pillar_for_query(self, query_text: str) -> Optional[str]:
        """
        Resolve a user query to the most appropriate pillar
        
        Example:
            "birthday cake" → celebrate
            "travel kit" → travel
            "grooming" → care
        """
        query_lower = query_text.lower()
        
        # Keyword → Pillar mapping
        pillar_keywords = {
            "celebrate": ["birthday", "party", "celebration", "cake", "festive"],
            "dine": ["food", "meal", "eat", "feed", "nutrition", "diet"],
            "stay": ["boarding", "daycare", "hotel", "overnight", "kennel"],
            "travel": ["travel", "trip", "journey", "flight", "car", "transport", "carrier", "crate"],
            "care": ["grooming", "spa", "health", "vet", "medical", "groom", "bath"],
            "enjoy": ["toy", "play", "fun", "activity", "enrichment"],
            "fit": ["fitness", "exercise", "weight", "agility", "training"],
            "learn": ["train", "obedience", "behavior", "learn", "puppy class"],
            "adopt": ["puppy", "new pet", "adopt", "starter", "first time"],
            "emergency": ["emergency", "urgent", "immediate", "first aid"],
        }
        
        for pillar, keywords in pillar_keywords.items():
            if any(kw in query_lower for kw in keywords):
                return pillar
        
        return "shop"  # Default catch-all
    
    def validate_pillar(self, pillar: str) -> bool:
        """Check if pillar is valid"""
        return pillar in self.valid_pillars


# Singleton instance
_resolver = None

def get_resolver() -> PillarResolver:
    """Get singleton resolver instance"""
    global _resolver
    if _resolver is None:
        _resolver = PillarResolver()
    return _resolver


# =============================================================================
# LEGACY COMPATIBILITY LAYER
# =============================================================================
# These functions maintain backwards compatibility with existing code
# that queries by pillar field directly

async def get_products_by_pillar_legacy(pillar: str, db, limit: int = 20) -> List[Dict]:
    """
    Legacy function: Get products by pillar field (old method)
    Use this while transitioning to new system
    """
    query = {"pillar": pillar, "is_active": {"$ne": False}}
    cursor = db.products.find(query, {"_id": 0}).limit(limit)
    return await cursor.to_list(length=limit)


async def get_products_by_pillar_new(pillar: str, db, limit: int = 20) -> List[Dict]:
    """
    New function: Get products using pillar rules (new method)
    """
    resolver = get_resolver()
    return await resolver.get_products(pillar, db, limit=limit)


async def get_products_hybrid(pillar: str, db, limit: int = 20) -> List[Dict]:
    """
    Hybrid function: Try new method first, fallback to legacy
    Use this during transition period
    """
    # Try new method
    resolver = get_resolver()
    products = await resolver.get_products(pillar, db, limit=limit)
    
    # If no results, fallback to legacy
    if not products:
        products = await get_products_by_pillar_legacy(pillar, db, limit=limit)
    
    return products
