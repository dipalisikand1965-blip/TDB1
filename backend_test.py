#!/usr/bin/env python3
"""
Backend Testing Suite - Admin Media Upload & Nearby Places
===========================================================

Testing focused backend verification for:
1. POST /api/upload/product-image returns 200 for a valid PNG upload
2. POST /api/upload/service-image returns 200 for a valid PNG upload  
3. POST /api/upload/bundle-image returns 200 for a valid PNG upload
4. Product upload persistence: create product -> upload image -> verify persistence
5. Service upload persistence: create service -> upload image -> verify persistence  
6. Nearby Google-powered route check: /api/nearby/places with representative queries

Author: Testing Agent
Date: December 30, 2024
"""

import asyncio
import httpx
import os
import json
import uuid
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import base64
from io import BytesIO
from PIL import Image
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Base URL for the backend (using frontend env variable)
BASE_URL = "https://mira-parity-sprint.preview.emergentagent.com"

class BackendTester:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.base_url = BASE_URL
        self.test_results = []
        
    async def create_test_png_image(self) -> bytes:
        """Create a simple test PNG image for upload testing"""
        img = Image.new('RGB', (100, 100), color='red')
        bio = BytesIO()
        img.save(bio, format='PNG')
        return bio.getvalue()
        
    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        logger.info(f"{status} {test_name}: {details}")
        
    async def test_upload_endpoints(self):
        """Test 1-3: Upload endpoints for product, service, and bundle images"""
        
        test_image = await self.create_test_png_image()
        
        upload_endpoints = [
            ("/api/upload/product-image", "Product Image Upload"),
            ("/api/upload/service-image", "Service Image Upload"), 
            ("/api/upload/bundle-image", "Bundle Image Upload")
        ]
        
        for endpoint, test_name in upload_endpoints:
            try:
                files = {"file": ("test.png", test_image, "image/png")}
                
                response = await self.client.post(
                    f"{self.base_url}{endpoint}",
                    files=files
                )
                
                if response.status_code == 200:
                    data = response.json()
                    image_url = data.get('image_url') or data.get('url')
                    self.log_result(
                        test_name, 
                        True, 
                        f"Upload successful, image URL: {image_url}", 
                        data
                    )
                else:
                    self.log_result(
                        test_name, 
                        False, 
                        f"Upload failed with status {response.status_code}: {response.text}"
                    )
                    
            except Exception as e:
                self.log_result(test_name, False, f"Upload error: {str(e)}")
                
    async def test_product_upload_persistence(self):
        """Test 4: Product creation -> image upload -> persistence verification"""
        
        try:
            # Step 1: Create a temporary product
            product_data = {
                "name": f"Test Product {uuid.uuid4().hex[:8]}",
                "product_type": "physical",
                "pricing": {
                    "base_price": 299.0,
                    "currency": "INR"
                },
                "visibility": {
                    "status": "active"
                }
            }
            
            create_response = await self.client.post(
                f"{self.base_url}/api/product-box/products",
                json=product_data
            )
            
            if create_response.status_code != 200:
                self.log_result(
                    "Product Creation", 
                    False, 
                    f"Failed to create product: {create_response.status_code} - {create_response.text}"
                )
                return
                
            product = create_response.json().get("product", {})
            product_id = product.get("id")
            
            if not product_id:
                self.log_result("Product Creation", False, "No product ID returned")
                return
                
            self.log_result("Product Creation", True, f"Created product: {product_id}")
            
            # Step 2: Upload image for the product
            test_image = await self.create_test_png_image()
            files = {"file": ("product_test.png", test_image, "image/png")}
            
            upload_response = await self.client.post(
                f"{self.base_url}/api/admin/product/{product_id}/upload-image",
                files=files
            )
            
            if upload_response.status_code != 200:
                self.log_result(
                    "Product Image Upload", 
                    False, 
                    f"Failed to upload image: {upload_response.status_code} - {upload_response.text}"
                )
                return
                
            upload_data = upload_response.json()
            uploaded_image_url = upload_data.get('url') or upload_data.get('image_url')
            self.log_result("Product Image Upload", True, f"Uploaded image: {uploaded_image_url}")
            
            # Step 3: Verify persistence - fetch product and check image data
            verify_response = await self.client.get(f"{self.base_url}/api/product-box/products/{product_id}")
            
            if verify_response.status_code != 200:
                self.log_result(
                    "Product Persistence Check", 
                    False, 
                    f"Failed to fetch updated product: {verify_response.status_code}"
                )
                return
                
            updated_product = verify_response.json()
            persisted_image_url = updated_product.get('image_url') or updated_product.get('images', [None])[0]
            
            if persisted_image_url and uploaded_image_url and uploaded_image_url in persisted_image_url:
                self.log_result(
                    "Product Upload Persistence", 
                    True, 
                    f"Image persisted successfully: {persisted_image_url}",
                    {"product_id": product_id, "persisted_image": persisted_image_url}
                )
            else:
                self.log_result(
                    "Product Upload Persistence", 
                    False, 
                    f"Image not persisted. Expected: {uploaded_image_url}, Got: {persisted_image_url}"
                )
                
        except Exception as e:
            self.log_result("Product Upload Persistence", False, f"Error: {str(e)}")
            
    async def test_service_upload_persistence(self):
        """Test 5: Service creation -> image upload -> persistence verification"""
        
        try:
            # Step 1: Create a temporary service
            service_data = {
                "name": f"Test Service {uuid.uuid4().hex[:8]}",
                "pillar": "care",
                "description": "Test service for image upload verification",
                "base_price": 150.0,
                "is_bookable": True,
                "is_active": True
            }
            
            create_response = await self.client.post(
                f"{self.base_url}/api/service-box/services",
                json=service_data
            )
            
            if create_response.status_code != 200:
                self.log_result(
                    "Service Creation", 
                    False, 
                    f"Failed to create service: {create_response.status_code} - {create_response.text}"
                )
                return
                
            service = create_response.json().get("service", {})
            service_id = service.get("id")
            
            if not service_id:
                self.log_result("Service Creation", False, "No service ID returned")
                return
                
            self.log_result("Service Creation", True, f"Created service: {service_id}")
            
            # Step 2: Upload image for the service
            test_image = await self.create_test_png_image()
            files = {"file": ("service_test.png", test_image, "image/png")}
            
            upload_response = await self.client.post(
                f"{self.base_url}/api/admin/service/{service_id}/upload-image",
                files=files
            )
            
            if upload_response.status_code != 200:
                self.log_result(
                    "Service Image Upload", 
                    False, 
                    f"Failed to upload image: {upload_response.status_code} - {upload_response.text}"
                )
                return
                
            upload_data = upload_response.json()
            uploaded_image_url = upload_data.get('url') or upload_data.get('image_url')
            self.log_result("Service Image Upload", True, f"Uploaded image: {uploaded_image_url}")
            
            # Step 3: Verify persistence - fetch service and check image data
            verify_response = await self.client.get(f"{self.base_url}/api/service-box/services/{service_id}")
            
            if verify_response.status_code != 200:
                self.log_result(
                    "Service Persistence Check", 
                    False, 
                    f"Failed to fetch updated service: {verify_response.status_code}"
                )
                return
                
            updated_service = verify_response.json()
            persisted_image_url = updated_service.get('image_url')
            
            if persisted_image_url and uploaded_image_url and uploaded_image_url in persisted_image_url:
                self.log_result(
                    "Service Upload Persistence", 
                    True, 
                    f"Image persisted successfully: {persisted_image_url}",
                    {"service_id": service_id, "persisted_image": persisted_image_url}
                )
            else:
                self.log_result(
                    "Service Upload Persistence", 
                    False, 
                    f"Image not persisted. Expected: {uploaded_image_url}, Got: {persisted_image_url}"
                )
                
        except Exception as e:
            self.log_result("Service Upload Persistence", False, f"Error: {str(e)}")
            
    async def test_nearby_places_google_powered(self):
        """Test 6: Nearby Google-powered route checks with representative queries"""
        
        # Goa coordinates for testing  
        goa_lat = 15.2993
        goa_lng = 74.1240
        
        test_queries = [
            {
                "type": "lodging",
                "keyword": "pet friendly hotel",
                "description": "Stay / Pet Friendly Hotel search"
            },
            {
                "type": "restaurant", 
                "keyword": "pet friendly cafe",
                "description": "Dine / Pet Friendly Cafe search"
            },
            {
                "type": "veterinary_care",
                "keyword": "vet",
                "description": "Advisory / Veterinary Care search"
            }
        ]
        
        for query in test_queries:
            try:
                params = {
                    "lat": goa_lat,
                    "lng": goa_lng,
                    "type": query["type"],
                    "keyword": query["keyword"],
                    "radius": 10000  # 10km radius
                }
                
                response = await self.client.get(
                    f"{self.base_url}/api/nearby/places",
                    params=params
                )
                
                if response.status_code == 200:
                    data = response.json()
                    places = data.get('places', [])
                    
                    if places and len(places) > 0:
                        self.log_result(
                            f"Nearby Places - {query['description']}", 
                            True, 
                            f"Found {len(places)} results for '{query['keyword']}' in Goa",
                            {"places_count": len(places), "first_result": places[0] if places else None}
                        )
                    else:
                        self.log_result(
                            f"Nearby Places - {query['description']}", 
                            False, 
                            f"No results found for '{query['keyword']}' in Goa"
                        )
                else:
                    self.log_result(
                        f"Nearby Places - {query['description']}", 
                        False, 
                        f"API returned {response.status_code}: {response.text}"
                    )
                    
            except Exception as e:
                self.log_result(
                    f"Nearby Places - {query['description']}", 
                    False, 
                    f"Error: {str(e)}"
                )
                
    async def run_all_tests(self):
        """Run all backend verification tests"""
        
        logger.info("🚀 Starting Backend Verification Tests...")
        logger.info(f"🎯 Testing against: {self.base_url}")
        
        try:
            # Test 1-3: Upload endpoints
            await self.test_upload_endpoints()
            
            # Test 4: Product upload persistence
            await self.test_product_upload_persistence()
            
            # Test 5: Service upload persistence  
            await self.test_service_upload_persistence()
            
            # Test 6: Nearby places Google-powered API
            await self.test_nearby_places_google_powered()
            
        except Exception as e:
            logger.error(f"Critical error during testing: {e}")
            
        finally:
            await self.client.aclose()
            
        # Generate summary
        self.generate_summary()
        
    def generate_summary(self):
        """Generate and print test summary"""
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print("\n" + "="*80)
        print("🧪 BACKEND VERIFICATION TEST RESULTS")
        print("="*80)
        print(f"📊 Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"🎯 Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        print()
        
        if failed_tests > 0:
            print("❌ FAILED TESTS:")
            print("-" * 40)
            for result in self.test_results:
                if not result["success"]:
                    print(f"• {result['test']}: {result['details']}")
            print()
            
        print("✅ PASSED TESTS:")
        print("-" * 40)
        for result in self.test_results:
            if result["success"]:
                print(f"• {result['test']}: {result['details']}")
        
        print("\n" + "="*80)
        
        # Save detailed results to JSON
        with open("/app/backend_test_results.json", "w") as f:
            json.dump({
                "summary": {
                    "total": total_tests,
                    "passed": passed_tests,
                    "failed": failed_tests,
                    "success_rate": (passed_tests/total_tests)*100
                },
                "tests": self.test_results,
                "timestamp": datetime.now().isoformat(),
                "base_url": self.base_url
            }, f, indent=2)
            
        logger.info("📁 Detailed results saved to backend_test_results.json")

async def main():
    """Main entry point"""
    tester = BackendTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())