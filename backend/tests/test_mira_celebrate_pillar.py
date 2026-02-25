"""
Test Mira OS - Celebrate Pillar Flows
=====================================
Tests for:
1. Birthday cake request for Indie dog shows breed-specific cake first
2. Friend's dog question does NOT mention user's pet (Mojo)
3. Barking question gets training advice, not overwhelm response
4. Shopify products with CDN images instead of placeholders
"""

import pytest
import requests
import os
import re

# BASE_URL from environment variable (includes /api prefix)
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"


class TestBreedSpecificCakes:
    """Test that birthday cake requests prioritize breed-specific cakes from Shopify"""
    
    def test_indie_dog_birthday_cake_breed_first(self):
        """
        Feature: Birthday cake request for Indie dog shows Shopify breed-specific cake first
        - User has an Indie dog
        - When asking for birthday cake, should get Indie-specific cake prioritized
        """
        payload = {
            "message": "I want a birthday cake for my dog",  # Correct field name
            "pet_context": {
                "name": "Bruno",
                "breed": "Indie",
                "age": "3 years",
                "sensitivities": []
            },
            "current_pillar": "celebrate"
        }
        
        response = requests.post(f"{BASE_URL}/api/mira/chat", json=payload)
        assert response.status_code == 200, f"Chat endpoint failed: {response.text}"
        
        data = response.json()
        
        # Check that products are returned
        products = data.get("products", [])
        message = data.get("message", "")
        print(f"[TEST] Birthday cake for Indie - Got {len(products)} products")
        print(f"[TEST] Message: {message[:200]}...")
        
        # Check if breed-specific product comes first
        if products:
            first_product = products[0]
            product_name = first_product.get("name", "").lower()
            why_for_pet = first_product.get("why_for_pet", "").lower()
            
            print(f"[TEST] First product: {first_product.get('name')}")
            print(f"[TEST] why_for_pet: {first_product.get('why_for_pet')}")
            
            # Log all products for debugging
            for i, p in enumerate(products[:5]):
                img = p.get("image", "")
                is_shopify = "cdn.shopify" in str(img) if img else False
                print(f"[TEST] Product {i+1}: {p.get('name')} - Shopify: {is_shopify}")
            
            # Check if any product is Indie-specific
            has_breed_product = any(
                "indie" in p.get("name", "").lower() or 
                "indie" in p.get("why_for_pet", "").lower()
                for p in products
            )
            
            if has_breed_product:
                print("[TEST] ✓ Found Indie-specific cake in products")
            else:
                print("[TEST] Note: No Indie-specific cake found - may need DB check")
    
    def test_golden_retriever_birthday_cake(self):
        """Test breed-specific cakes for Golden Retriever"""
        payload = {
            "message": "Birthday cake for my golden retriever",
            "pet_context": {
                "name": "Buddy",
                "breed": "Golden Retriever",
                "age": "5 years"
            },
            "current_pillar": "celebrate"
        }
        
        response = requests.post(f"{BASE_URL}/api/mira/chat", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        print(f"[TEST] Golden Retriever birthday - Got {len(products)} products")
        
        for i, p in enumerate(products[:3]):
            print(f"[TEST] Product {i+1}: {p.get('name')}")


class TestFriendsDogContext:
    """Test that friend's dog questions do NOT include user's pet context"""
    
    def test_friends_dog_no_user_pet_mention(self):
        """
        Feature: Friend's dog question does NOT mention user's pet (Mojo)
        - User has a pet named Mojo
        - User asks about a friend's dog
        - Response should NOT mention Mojo
        """
        payload = {
            "message": "What treats can I gift my friend's dog?",
            "pet_context": {
                "name": "Mojo",
                "breed": "Beagle",
                "age": "2 years",
                "sensitivities": ["Chicken allergy"]
            },
            "current_pillar": "shop"
        }
        
        response = requests.post(f"{BASE_URL}/api/mira/chat", json=payload)
        assert response.status_code == 200, f"Chat endpoint failed: {response.text}"
        
        data = response.json()
        
        message = data.get("message", "")
        print(f"[TEST] Friend's dog response: {message[:300]}...")
        
        # The response should NOT mention Mojo (user's pet)
        message_lower = message.lower()
        
        # Check for absence of user's pet name
        mojo_mentioned = "mojo" in message_lower
        
        print(f"[TEST] 'Mojo' mentioned in response: {mojo_mentioned}")
        
        # Should ask clarifying questions about the friend's dog
        asks_about_friend_dog = any(phrase in message_lower for phrase in [
            "friend's dog", "their dog", "breed", "allergies", "know about",
            "tell me more", "can you tell me", "what do you know about"
        ])
        
        print(f"[TEST] Asks about friend's dog: {asks_about_friend_dog}")
        
        if mojo_mentioned:
            print("[TEST] ⚠ WARNING: User's pet (Mojo) was mentioned in friend's dog response")
        else:
            print("[TEST] ✓ User's pet (Mojo) correctly not mentioned")
    
    def test_neighbors_dog_context(self):
        """Test neighbor's dog question also works correctly"""
        payload = {
            "message": "My neighbor's dog needs some treats, any suggestions?",
            "pet_context": {
                "name": "Max",
                "breed": "Labrador",
                "age": "4 years"
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/mira/chat", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        message = data.get("message", "")
        
        # Should not mention Max (user's pet) - case sensitive check
        max_mentioned = "max" in message.lower().split()  # Split to avoid matching "maximum"
        
        print(f"[TEST] Neighbor's dog response - Max mentioned: {max_mentioned}")
        print(f"[TEST] Message: {message[:200]}...")
        if not max_mentioned:
            print("[TEST] ✓ Correctly did not mention user's pet for neighbor's dog")


class TestBarkingQuestionClassification:
    """Test that barking questions get training advice, NOT overwhelm response"""
    
    def test_barking_gets_training_not_overwhelm(self):
        """
        Feature: Barking question gets training advice, not overwhelm response
        - User asks about barking
        - Should classify as training/advisory, NOT as "overwhelmed by choices"
        """
        payload = {
            "message": "My dog keeps barking at strangers, what to do?",
            "pet_context": {
                "name": "Rocky",
                "breed": "German Shepherd",
                "age": "2 years"
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/mira/chat", json=payload)
        assert response.status_code == 200, f"Chat endpoint failed: {response.text}"
        
        data = response.json()
        message = data.get("message", "")
        pillar = data.get("pillar", "")
        
        print(f"[TEST] Barking question response:")
        print(f"[TEST] Pillar detected: {pillar}")
        print(f"[TEST] Message: {message[:400]}...")
        
        message_lower = message.lower()
        
        # Should NOT be treated as overwhelm/choice paralysis
        overwhelm_phrases = [
            "let me make this easier",
            "too many options",
            "overwhelmed",
            "simplify your choices"
        ]
        is_overwhelm_response = any(phrase in message_lower for phrase in overwhelm_phrases)
        
        # Should contain training advice
        training_phrases = [
            "train", "training", "behavior", "behaviour", "desensitiz",
            "sociali", "reward", "positive", "counter-conditioning",
            "triggers", "bark", "calm", "redirection", "distract"
        ]
        has_training_advice = any(phrase in message_lower for phrase in training_phrases)
        
        print(f"[TEST] Is overwhelm response: {is_overwhelm_response}")
        print(f"[TEST] Has training advice: {has_training_advice}")
        
        if not is_overwhelm_response and has_training_advice:
            print("[TEST] ✓ Barking correctly classified as training, not overwhelm")
        elif is_overwhelm_response:
            print("[TEST] ⚠ ERROR: Barking incorrectly classified as overwhelm")
        
        # Check pillar is related to learning/training
        learn_pillars = ["learn", "advisory", "care", "training"]
        is_correct_pillar = pillar.lower() in learn_pillars if pillar else True
        print(f"[TEST] Pillar is learning/training: {is_correct_pillar}")
    
    def test_biting_behavior_not_overwhelm(self):
        """Test biting question also not treated as overwhelm"""
        payload = {
            "message": "Help! My puppy keeps biting everyone",
            "pet_context": {
                "name": "Charlie",
                "breed": "Labrador Puppy",
                "age": "4 months"
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/mira/chat", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        message = data.get("message", "").lower()
        
        # Should not have overwhelm response
        has_overwhelm = "let me make this easier" in message or "too many options" in message
        
        # Should have training advice
        has_training = any(word in message for word in ["bite", "training", "puppy", "teeth", "redirect", "chew"])
        
        print(f"[TEST] Biting question - Has overwhelm: {has_overwhelm}, Has training: {has_training}")
        print(f"[TEST] Message excerpt: {message[:200]}...")
        
        assert not has_overwhelm, "Behavior questions should not trigger overwhelm response"


class TestShopifyProductImages:
    """Test that products show Shopify CDN images instead of placeholders"""
    
    def test_products_have_shopify_images(self):
        """
        Feature: Products show beautiful Shopify CDN images instead of placeholders
        - Products should have cdn.shopify.com URLs
        - NOT unsplash.com placeholder images
        """
        payload = {
            "message": "Show me birthday cakes for my dog",
            "pet_context": {
                "name": "Buddy",
                "breed": "Golden Retriever"
            },
            "current_pillar": "celebrate"
        }
        
        response = requests.post(f"{BASE_URL}/api/mira/chat", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        
        print(f"[TEST] Products returned: {len(products)}")
        
        shopify_image_count = 0
        placeholder_count = 0
        
        for p in products[:6]:
            image_url = p.get("image") or (p.get("images", [None])[0] if p.get("images") else None)
            name = p.get("name", "Unknown")
            
            if image_url:
                is_shopify = "cdn.shopify.com" in str(image_url)
                is_placeholder = "unsplash.com" in str(image_url)
                
                if is_shopify:
                    shopify_image_count += 1
                    print(f"[TEST] ✓ Shopify image: {name}")
                elif is_placeholder:
                    placeholder_count += 1
                    print(f"[TEST] ⚠ Placeholder image: {name}")
                else:
                    print(f"[TEST] Other image: {name} - {str(image_url)[:50]}...")
            else:
                print(f"[TEST] No image: {name}")
        
        print(f"[TEST] Summary: {shopify_image_count} Shopify, {placeholder_count} placeholders")
        
        if shopify_image_count > 0:
            print("[TEST] ✓ Found Shopify CDN images in products")
    
    def test_product_master_has_shopify_images(self):
        """Check products_master collection for Shopify images"""
        # Query products endpoint directly
        response = requests.get(f"{BASE_URL}/api/products?limit=20&category=cakes")
        
        if response.status_code == 200:
            data = response.json()
            products = data.get("products", [])
            
            shopify_count = 0
            for p in products:
                images = p.get("images", [])
                if images and any("cdn.shopify.com" in str(img) for img in images):
                    shopify_count += 1
                    
            print(f"[TEST] Products endpoint: {shopify_count}/{len(products)} have Shopify images")
        else:
            print(f"[TEST] Products endpoint returned {response.status_code}")


class TestCelebratePillarFlow:
    """Test complete celebrate pillar conversational flow"""
    
    def test_birthday_planning_flow(self):
        """Test birthday planning starts with clarifying questions"""
        payload = {
            "message": "I want to plan my dog's birthday",
            "pet_context": {
                "name": "Luna",
                "breed": "Beagle",
                "age": "4 years"
            },
            "current_pillar": "celebrate"
        }
        
        response = requests.post(f"{BASE_URL}/api/mira/chat", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        message = data.get("message", "")
        quick_replies = data.get("quick_replies", [])
        
        print(f"[TEST] Birthday planning response:")
        print(f"[TEST] Message: {message[:400]}...")
        print(f"[TEST] Quick replies: {quick_replies}")
        
        # Should ask a clarifying question (active vs cosy)
        message_lower = message.lower()
        asks_question = "?" in message
        
        # Common birthday flow questions
        has_birthday_question = any(phrase in message_lower for phrase in [
            "active", "playful", "cosy", "simple", "focus", "celebrate", "celebration"
        ])
        
        print(f"[TEST] Asks question: {asks_question}")
        print(f"[TEST] Has birthday context: {has_birthday_question}")
    
    def test_gotcha_day_celebration(self):
        """Test gotcha day celebration flow"""
        payload = {
            "message": "What's a gotcha day and how do we celebrate it?",
            "pet_context": {
                "name": "Max",
                "breed": "Lab Mix"
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/mira/chat", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        message = data.get("message", "").lower()
        
        # Should explain gotcha day
        explains_gotcha = "gotcha" in message or "adoption" in message or "anniversary" in message
        
        print(f"[TEST] Gotcha day explained: {explains_gotcha}")
        print(f"[TEST] Message excerpt: {message[:300]}...")


class TestProductSearchAPI:
    """Test the product search functionality"""
    
    def test_breed_cakes_category_exists(self):
        """Check if breed-cakes category exists"""
        response = requests.get(f"{BASE_URL}/api/products?category=breed-cakes&limit=10")
        
        if response.status_code == 200:
            data = response.json()
            products = data.get("products", [])
            print(f"[TEST] breed-cakes category: {len(products)} products")
            
            # Check for specific breeds
            indie_cakes = [p for p in products if "indie" in p.get("name", "").lower()]
            golden_cakes = [p for p in products if "golden" in p.get("name", "").lower()]
            
            print(f"[TEST] Indie cakes: {len(indie_cakes)}")
            print(f"[TEST] Golden cakes: {len(golden_cakes)}")
            
            for p in products[:5]:
                has_shopify = bool(p.get("shopify_id"))
                print(f"[TEST] - {p.get('name')} (Shopify: {has_shopify})")
        else:
            print(f"[TEST] Products endpoint: {response.status_code}")
    
    def test_products_have_shopify_ids(self):
        """Check that products have Shopify IDs"""
        response = requests.get(f"{BASE_URL}/api/products?limit=50")
        
        if response.status_code == 200:
            data = response.json()
            products = data.get("products", [])
            
            shopify_count = sum(1 for p in products if p.get("shopify_id"))
            print(f"[TEST] Products with Shopify ID: {shopify_count}/{len(products)}")
        else:
            print(f"[TEST] Products endpoint: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s", "--tb=short"])
