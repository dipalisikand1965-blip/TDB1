"""
Meilisearch Search Service for The Doggy Bakery
Provides fast, typo-tolerant search with intelligent ranking
"""

import os
import logging
from typing import List, Optional, Dict, Any
from meilisearch_python_sdk import AsyncClient
from meilisearch_python_sdk.errors import MeilisearchApiError
from meilisearch_python_sdk.models.settings import (
    TypoTolerance, 
    MinWordSizeForTypos,
)

logger = logging.getLogger(__name__)

# Environment configuration
MEILISEARCH_URL = os.environ.get("MEILISEARCH_URL", "http://localhost:7700")
MEILISEARCH_MASTER_KEY = os.environ.get("MEILISEARCH_MASTER_KEY", "tdb-search-key-2025")

# Index names
PRODUCTS_INDEX = "products"
COLLECTIONS_INDEX = "collections"

class SearchService:
    """Meilisearch search service for product and collection search"""
    
    def __init__(self):
        self.client: Optional[AsyncClient] = None
        self._initialized = False
    
    async def connect(self):
        """Initialize connection to Meilisearch"""
        try:
            self.client = AsyncClient(
                url=MEILISEARCH_URL,
                api_key=MEILISEARCH_MASTER_KEY,
                timeout=5  # 5 second timeout for all operations
            )
            # Test connection with timeout
            await self.client.health()
            logger.info(f"✓ Connected to Meilisearch at {MEILISEARCH_URL}")
            
            # Configure indexes
            await self._configure_indexes()
            self._initialized = True
            
        except Exception as e:
            logger.warning(f"Meilisearch unavailable (non-blocking): {e}")
            self._initialized = False
    
    async def disconnect(self):
        """Close Meilisearch connection"""
        if self.client:
            await self.client.aclose()
            logger.info("✓ Disconnected from Meilisearch")
    
    async def _configure_indexes(self):
        """Configure search indexes with appropriate settings"""
        try:
            # Create products index if it doesn't exist
            try:
                await self.client.create_index(PRODUCTS_INDEX, primary_key="id")
            except MeilisearchApiError as e:
                if "index_already_exists" not in str(e):
                    raise
            
            products_index = self.client.index(PRODUCTS_INDEX)
            
            # Configure searchable attributes (order matters for ranking)
            await products_index.update_searchable_attributes([
                "name",
                "description",
                "tags",
                "category",
                "collection_names",
                "variant_options",  # Base, Flavour, Weight values
            ])
            
            # Configure filterable attributes for faceted search
            await products_index.update_filterable_attributes([
                "category",
                "collection_ids",
                "tags",
                "price",
                "available",
                "is_pan_india_shippable",
                "autoship_enabled",
            ])
            
            # Configure sortable attributes
            await products_index.update_sortable_attributes([
                "price",
                "name",
                "synced_at",
            ])
            
            # Configure displayed attributes (what's returned in search results)
            await products_index.update_displayed_attributes([
                "id",
                "name",
                "description",
                "price",
                "image",
                "category",
                "tags",
                "collection_names",
                "variant_options",
                "available",
                "shopify_handle",
            ])
            
            # Configure typo tolerance for better fuzzy matching
            typo_settings = TypoTolerance(
                enabled=True,
                min_word_size_for_typos=MinWordSizeForTypos(
                    one_typo=4,   # Allow 1 typo for words with 4+ chars
                    two_typos=8   # Allow 2 typos for words with 8+ chars
                ),
                disable_on_attributes=["id", "shopify_handle"],
            )
            await products_index.update_typo_tolerance(typo_settings)
            
            # Configure synonyms for pet-related terms
            synonyms_dict = {
                "dog": ["doggy", "pup", "puppy", "doggo", "pupper"],
                "cat": ["kitty", "kitten", "feline"],
                "cake": ["cakes", "birthday cake"],
                "treat": ["treats", "snack", "snacks"],
                "biscuit": ["biscuits", "cookie", "cookies"],
                "healthy": ["nutritious", "wholesome", "organic"],
                "chicken": ["poultry"],
                "beef": ["meat"],
                "peanut butter": ["pb", "nut butter"],
                "birthday": ["bday", "b'day"],
                "labrador": ["lab"],
                "german shepherd": ["gsd", "alsatian"],
                "golden retriever": ["goldie"],
            }
            await products_index.update_synonyms(synonyms_dict)
            
            # Configure ranking rules
            await products_index.update_ranking_rules([
                "words",
                "typo",
                "proximity",
                "attribute",
                "sort",
                "exactness",
            ])
            
            logger.info("✓ Products index configured successfully")
            
            # Create collections index
            try:
                await self.client.create_index(COLLECTIONS_INDEX, primary_key="id")
            except MeilisearchApiError as e:
                if "index_already_exists" not in str(e):
                    raise
            
            collections_index = self.client.index(COLLECTIONS_INDEX)
            await collections_index.update_searchable_attributes([
                "name",
                "description",
            ])
            await collections_index.update_displayed_attributes([
                "id",
                "name",
                "description",
                "slug",
                "image",
                "product_count",
            ])
            
            logger.info("✓ Collections index configured successfully")
            
        except Exception as e:
            logger.error(f"Failed to configure indexes: {e}")
            raise
    
    async def index_product(self, product: dict):
        """Index a single product document"""
        if not self._initialized:
            logger.warning("Search service not initialized, skipping indexing")
            return
        
        try:
            # Transform product for search indexing
            search_doc = self._transform_product_for_search(product)
            
            index = self.client.index(PRODUCTS_INDEX)
            await index.add_documents([search_doc])
            logger.debug(f"Indexed product: {product.get('name')}")
            
        except Exception as e:
            logger.error(f"Failed to index product {product.get('id')}: {e}")
    
    async def index_products_batch(self, products: List[dict]):
        """Index multiple products efficiently"""
        if not self._initialized:
            logger.warning("Search service not initialized, skipping batch indexing")
            return
        
        try:
            search_docs = [self._transform_product_for_search(p) for p in products]
            
            index = self.client.index(PRODUCTS_INDEX)
            # Index in batches of 1000
            batch_size = 1000
            for i in range(0, len(search_docs), batch_size):
                batch = search_docs[i:i + batch_size]
                await index.add_documents(batch)
                logger.info(f"Indexed batch {i // batch_size + 1}: {len(batch)} products")
            
            logger.info(f"✓ Indexed {len(products)} products total")
            
        except Exception as e:
            logger.error(f"Failed to batch index products: {e}")
            raise
    
    async def remove_product(self, product_id: str):
        """Remove a product from the search index"""
        if not self._initialized:
            return
        
        try:
            index = self.client.index(PRODUCTS_INDEX)
            await index.delete_document(product_id)
            logger.debug(f"Removed product from index: {product_id}")
            
        except Exception as e:
            logger.error(f"Failed to remove product {product_id}: {e}")
    
    async def index_collection(self, collection: dict):
        """Index a collection document"""
        if not self._initialized:
            return
        
        try:
            search_doc = {
                "id": str(collection.get("_id", collection.get("id"))),
                "name": collection.get("name", ""),
                "description": collection.get("description", ""),
                "slug": collection.get("slug", ""),
                "image": collection.get("image", ""),
                "product_count": collection.get("product_count", 0),
            }
            
            index = self.client.index(COLLECTIONS_INDEX)
            await index.add_documents([search_doc])
            logger.debug(f"Indexed collection: {collection.get('name')}")
            
        except Exception as e:
            logger.error(f"Failed to index collection: {e}")
    
    async def index_collections_batch(self, collections: List[dict]):
        """Index multiple collections"""
        if not self._initialized:
            return
        
        try:
            search_docs = []
            for c in collections:
                search_docs.append({
                    "id": str(c.get("_id", c.get("id"))),
                    "name": c.get("name", ""),
                    "description": c.get("description", ""),
                    "slug": c.get("slug", ""),
                    "image": c.get("image", ""),
                    "product_count": c.get("product_count", 0),
                })
            
            index = self.client.index(COLLECTIONS_INDEX)
            await index.add_documents(search_docs)
            logger.info(f"✓ Indexed {len(collections)} collections")
            
        except Exception as e:
            logger.error(f"Failed to batch index collections: {e}")
    
    def _transform_product_for_search(self, product: dict) -> dict:
        """Transform a product document for search indexing"""
        # Extract variant option values for searching
        variant_options = []
        for opt in product.get("options", []):
            values = opt.get("values", [])
            if values:
                variant_options.extend(values)
        
        # Also extract from variants directly
        for variant in product.get("variants", []):
            for key in ["option1", "option2", "option3"]:
                val = variant.get(key)
                if val and val not in variant_options:
                    variant_options.append(val)
        
        # Get collection names if available
        collection_names = product.get("collection_names", [])
        
        # Create search document
        return {
            "id": str(product.get("id", product.get("_id", ""))),
            "name": product.get("name", ""),
            "description": product.get("description", "")[:500],  # Limit description length
            "price": product.get("price", 0),
            "image": product.get("image", ""),
            "category": product.get("category", ""),
            "tags": product.get("tags", []) if isinstance(product.get("tags"), list) else [],
            "collection_ids": [str(cid) for cid in product.get("collection_ids", [])],
            "collection_names": collection_names,
            "variant_options": variant_options,
            "available": product.get("available", True),
            "is_pan_india_shippable": product.get("is_pan_india_shippable", False),
            "autoship_enabled": product.get("autoship_enabled", False),
            "shopify_handle": product.get("shopify_handle", ""),
        }
    
    async def search(
        self,
        query: str,
        limit: int = 20,
        offset: int = 0,
        filters: Optional[Dict[str, Any]] = None,
        sort: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Perform a search query with optional filters and sorting
        
        Args:
            query: The search query string
            limit: Maximum number of results (default 20)
            offset: Number of results to skip (default 0)
            filters: Optional filter conditions
            sort: Optional sort criteria (e.g., ["price:asc"])
        
        Returns:
            Search results with hits and metadata
        """
        if not self._initialized:
            logger.warning("Search service not initialized")
            return {"hits": [], "estimatedTotalHits": 0, "query": query}
        
        try:
            index = self.client.index(PRODUCTS_INDEX)
            
            # Build filter string
            filter_str = None
            filter_parts = []
            if filters:
                if filters.get("category"):
                    filter_parts.append(f'category = "{filters["category"]}"')
                if filters.get("collection_id"):
                    filter_parts.append(f'collection_ids = "{filters["collection_id"]}"')
                if filters.get("min_price") is not None:
                    filter_parts.append(f'price >= {filters["min_price"]}')
                if filters.get("max_price") is not None:
                    filter_parts.append(f'price <= {filters["max_price"]}')
                if filters.get("available") is not None:
                    filter_parts.append(f'available = {str(filters["available"]).lower()}')
                if filters.get("is_pan_india"):
                    filter_parts.append("is_pan_india_shippable = true")
                if filters.get("autoship_enabled"):
                    filter_parts.append("autoship_enabled = true")
                if filters.get("tags"):
                    tags = filters["tags"]
                    if isinstance(tags, list):
                        tag_filters = [f'tags = "{tag}"' for tag in tags]
                        filter_parts.append(f'({" OR ".join(tag_filters)})')
                    else:
                        filter_parts.append(f'tags = "{tags}"')
            
            if filter_parts:
                filter_str = " AND ".join(filter_parts)
            
            # Perform search with keyword arguments
            results = await index.search(
                query,
                limit=limit,
                offset=offset,
                filter=filter_str,
                sort=sort,
                show_ranking_score=True,
                attributes_to_highlight=["name", "description"],
                highlight_pre_tag="<mark>",
                highlight_post_tag="</mark>",
            )
            
            return {
                "hits": results.hits,
                "products": results.hits,
                "query": query,
                "processingTimeMs": results.processing_time_ms,
                "estimatedTotalHits": results.estimated_total_hits or 0,
                "limit": limit,
                "offset": offset,
            }
            
        except Exception as e:
            logger.error(f"Search failed for query '{query}': {e}")
            return {"hits": [], "products": [], "estimatedTotalHits": 0, "query": query, "error": str(e)}
    
    async def typeahead(self, query: str, limit: int = 8) -> Dict[str, Any]:
        """
        Fast typeahead search for autocomplete
        Returns minimal data for quick rendering
        """
        if not self._initialized or not query or len(query) < 2:
            return {"products": [], "collections": [], "query": query}
        
        try:
            # Search products
            products_index = self.client.index(PRODUCTS_INDEX)
            products_result = await products_index.search(
                query,
                limit=limit,
                attributes_to_retrieve=["id", "name", "image", "price", "category"],
            )
            
            # Search collections
            collections_index = self.client.index(COLLECTIONS_INDEX)
            collections_result = await collections_index.search(
                query,
                limit=4,
                attributes_to_retrieve=["id", "name", "slug", "image"],
            )
            
            return {
                "products": products_result.hits,
                "collections": collections_result.hits,
                "query": query,
            }
            
        except Exception as e:
            logger.error(f"Typeahead search failed: {e}")
            return {"products": [], "collections": [], "query": query}
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get search index statistics"""
        if not self._initialized:
            return {"initialized": False}
        
        try:
            products_index = self.client.index(PRODUCTS_INDEX)
            stats = await products_index.get_stats()
            
            return {
                "initialized": True,
                "products_indexed": stats.number_of_documents,
                "is_indexing": stats.is_indexing,
            }
        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return {"initialized": True, "error": str(e)}


# Global search service instance
search_service = SearchService()
