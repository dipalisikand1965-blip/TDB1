"""
MIRA SOUL OS - Question Bank Tester
====================================
Automated testing of all question scenarios from the user's Question Bank document.

This script:
1. Tests questions across all pillars (CELEBRATE, DINE, STAY, TRAVEL, etc.)
2. Evaluates responses for "soulfulness" (pet name, allergies, health context)
3. Reports pass/fail with detailed analysis
4. Generates a comprehensive report

Usage:
    python question_bank_tester.py [--pillar PILLAR] [--verbose]
"""

import asyncio
import aiohttp
import json
import re
from datetime import datetime
from typing import Dict, List, Tuple
import argparse
import os

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

# API Configuration
BASE_URL = os.environ.get("TEST_API_URL", "https://mojo-tummy-profile.preview.emergentagent.com")
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"
TEST_PET_ID = "mystique-001"
TEST_PET_NAME = "Mystique"

# Soulfulness indicators - what makes a response "soulful"
SOUL_INDICATORS = {
    "pet_name_used": [TEST_PET_NAME, "Mystique"],
    "allergy_awareness": ["chicken", "allergy", "allergic", "avoid chicken", "chicken-free"],
    "health_awareness": ["lymphoma", "treatment", "health", "medical"],
    "personality_traits": ["protective", "cautious", "temperament", "nature"],
    "history_reference": ["last time", "previous", "before", "remember", "history"],
    "emotional_intelligence": ["I hear you", "I understand", "that's", "feeling"],
    "dog_friends": ["Bruno", "Cookie", "Mojo"],
    "providers": ["Pawfect Care", "Priya"],
}

# Generic/robotic indicators - what we DON'T want
GENERIC_INDICATORS = [
    "your pet",  # Should use actual name
    "Great!",  # Banned opener
    "I'd be happy to",  # Banned opener
    "Absolutely",  # Banned opener
    "Please select",  # Too robotic
    "Here are some options",  # Generic
]


# ═══════════════════════════════════════════════════════════════════════════════
# QUESTION BANK - From User's Document
# ═══════════════════════════════════════════════════════════════════════════════

QUESTION_BANK = {
    "celebrate": {
        "name": "CELEBRATE",
        "description": "Birthday, parties, celebrations, micro-celebrations",
        "questions": [
            # Core celebration questions
            {"q": "I want to celebrate Mystique, but I don't know how", "expects": ["pet_name_used", "emotional_intelligence"]},
            {"q": "What does celebrating Mystique even mean from her point of view, not mine?", "expects": ["pet_name_used", "personality_traits", "allergy_awareness"]},
            {"q": "Based on what you know about Mystique, what kind of birthday would she actually enjoy?", "expects": ["pet_name_used", "personality_traits", "allergy_awareness", "health_awareness"]},
            {"q": "Can you suggest 3 levels of celebration – tiny / medium / big – so I can pick what feels realistic?", "expects": ["pet_name_used"]},
            {"q": "How do I celebrate Mystique without making it about social media and photos?", "expects": ["pet_name_used", "emotional_intelligence"]},
            
            # Birthday planning
            {"q": "I want to plan Mystique's birthday – where should we start?", "expects": ["pet_name_used"]},
            {"q": "Should Mystique's birthday be more about activity, food, or quiet time with us?", "expects": ["pet_name_used", "personality_traits"]},
            {"q": "We've never celebrated her birthday before. How do we start this year without it feeling fake?", "expects": ["pet_name_used", "emotional_intelligence"]},
            {"q": "Last year's birthday felt too chaotic. Can you help me make this one calmer?", "expects": ["pet_name_used", "history_reference"]},
            
            # Party type
            {"q": "Should I celebrate Mystique's birthday at home, in a park, or at a pet-friendly café?", "expects": ["pet_name_used", "personality_traits"]},
            {"q": "How do I decide if Mystique will enjoy having other dogs over, or if that's too much for her?", "expects": ["pet_name_used", "personality_traits", "dog_friends"]},
            {"q": "Mystique gets nervous in new places – is it better to celebrate only at home?", "expects": ["pet_name_used", "personality_traits"]},
            
            # Cakes & treats
            {"q": "What kind of birthday cake is safe for Mystique with her allergies and sensitivities?", "expects": ["pet_name_used", "allergy_awareness"]},
            {"q": "Can you help me pick from cake options based on what you know about Mystique's diet?", "expects": ["pet_name_used", "allergy_awareness"]},
            {"q": "How do I stop Mystique from overeating on her birthday while still letting her enjoy?", "expects": ["pet_name_used"]},
            
            # Guests
            {"q": "How many dogs are too many for Mystique at a celebration, given her personality?", "expects": ["pet_name_used", "personality_traits", "dog_friends"]},
            {"q": "Who are Mystique's dog friends?", "expects": ["pet_name_used", "dog_friends"]},
            {"q": "Should I invite dog friends, only human friends, or keep it just us this year?", "expects": ["pet_name_used", "dog_friends"]},
            
            # History
            {"q": "What did we do for Mystique's last birthday?", "expects": ["pet_name_used", "history_reference", "dog_friends"]},
            {"q": "Same as last time for the party", "expects": ["pet_name_used", "history_reference"]},
            
            # Micro-celebrations
            {"q": "I don't want to wait for big days. What are small daily moments we can turn into mini celebrations?", "expects": ["pet_name_used", "emotional_intelligence"]},
            {"q": "Can you help me design a 5-minute daily ritual that says 'you matter to us' to Mystique?", "expects": ["pet_name_used", "emotional_intelligence"]},
            
            # Emotional edge cases
            {"q": "I'm overwhelmed right now. Is there a minimum beautiful thing I can do for Mystique that still counts?", "expects": ["pet_name_used", "emotional_intelligence", "health_awareness"]},
            {"q": "I feel guilty that I didn't celebrate her enough when she was here – can we talk about that gently?", "expects": ["emotional_intelligence"]},
            
            # Ageing
            {"q": "Mystique is getting older – how should celebrations change so they're kind to her body?", "expects": ["pet_name_used", "health_awareness", "personality_traits"]},
        ]
    },
    
    "dine": {
        "name": "DINE",
        "description": "Food, treats, diet, allergies, nutrition",
        "questions": [
            # Core food decisions
            {"q": "What kind of food is best for Mystique at her age and weight right now?", "expects": ["pet_name_used", "allergy_awareness", "health_awareness"]},
            {"q": "Should Mystique be on dry food, wet food, fresh food, or a mix?", "expects": ["pet_name_used", "allergy_awareness"]},
            {"q": "How do I know if her current food is actually suiting her?", "expects": ["pet_name_used", "health_awareness"]},
            
            # Allergies
            {"q": "Mystique has a chicken allergy – what proteins are safest for her?", "expects": ["pet_name_used", "allergy_awareness"]},
            {"q": "How do I read an ingredient label to be sure something is really chicken-free?", "expects": ["allergy_awareness"]},
            {"q": "What are signs that Mystique's food might not be agreeing with her?", "expects": ["pet_name_used", "health_awareness"]},
            
            # Portions & routine
            {"q": "How much should I feed Mystique per meal?", "expects": ["pet_name_used"]},
            {"q": "How many meals a day should Mystique have at her age?", "expects": ["pet_name_used"]},
            {"q": "Mystique always seems hungry – is that normal or a sign I'm underfeeding her?", "expects": ["pet_name_used"]},
            
            # Treats
            {"q": "How many treats per day is still healthy for Mystique?", "expects": ["pet_name_used", "allergy_awareness", "health_awareness"]},
            {"q": "What can I safely use from my kitchen as occasional treats for her?", "expects": ["pet_name_used", "allergy_awareness"]},
            {"q": "Mystique begs a lot – am I creating a problem by giving in?", "expects": ["pet_name_used"]},
            
            # Weight
            {"q": "Does Mystique sound overweight, underweight, or okay?", "expects": ["pet_name_used"]},
            {"q": "How can I gently help Mystique lose a bit of weight without making her feel deprived?", "expects": ["pet_name_used", "emotional_intelligence"]},
            
            # Order history
            {"q": "What did I order last time for Mystique?", "expects": ["pet_name_used", "history_reference"]},
            {"q": "What treats has Mystique liked in the past?", "expects": ["pet_name_used", "history_reference"]},
        ]
    },
    
    "stay": {
        "name": "STAY",
        "description": "Home, boarding, daycare, sleeping arrangements",
        "questions": [
            # Home base
            {"q": "Where should Mystique ideally sleep at home?", "expects": ["pet_name_used", "personality_traits"]},
            {"q": "Does Mystique need a crate, a bed, or is the floor okay?", "expects": ["pet_name_used"]},
            {"q": "Is it okay if Mystique sleeps in my bed?", "expects": ["pet_name_used"]},
            
            # Alone time
            {"q": "How long can Mystique safely be left alone at home?", "expects": ["pet_name_used", "personality_traits", "health_awareness"]},
            {"q": "What signs should I watch for that suggest she's not coping well when left alone?", "expects": ["pet_name_used"]},
            {"q": "Should I leave the lights, TV, or sound on when Mystique stays alone?", "expects": ["pet_name_used"]},
            
            # Boarding vs home
            {"q": "When I travel, is Mystique better off with a sitter at home or in boarding?", "expects": ["pet_name_used", "personality_traits", "health_awareness"]},
            {"q": "What questions should I ask a boarding facility before I trust them with Mystique?", "expects": ["pet_name_used"]},
            {"q": "How long is too long to leave Mystique in boarding at one stretch?", "expects": ["pet_name_used", "health_awareness"]},
            
            # Preparing for boarding
            {"q": "How do I prepare Mystique emotionally for her first boarding stay?", "expects": ["pet_name_used", "emotional_intelligence"]},
            {"q": "What should I pack in Mystique's boarding bag?", "expects": ["pet_name_used", "allergy_awareness"]},
            
            # Past stays
            {"q": "Same boarding as last time", "expects": ["pet_name_used", "history_reference", "providers"]},
        ]
    },
    
    "travel": {
        "name": "TRAVEL",
        "description": "Trips, car travel, flights, relocation",
        "questions": [
            # Should we travel
            {"q": "We're planning a trip next month – how do I decide if Mystique should come or stay back?", "expects": ["pet_name_used", "health_awareness", "personality_traits"]},
            {"q": "Is this destination realistically dog-friendly for Mystique, or will she just be stressed?", "expects": ["pet_name_used", "personality_traits"]},
            {"q": "Mystique doesn't like change much – is it kinder to leave her in a familiar place?", "expects": ["pet_name_used", "personality_traits", "emotional_intelligence"]},
            
            # Car travel
            {"q": "How long a car journey is reasonable for Mystique in one stretch?", "expects": ["pet_name_used", "health_awareness"]},
            {"q": "How do I handle motion sickness if Mystique has had that before?", "expects": ["pet_name_used"]},
            {"q": "Where is the safest place for Mystique to sit in the car?", "expects": ["pet_name_used"]},
            
            # Flights
            {"q": "Is flying with Mystique really necessary, or is there another option that's kinder to her?", "expects": ["pet_name_used", "health_awareness", "emotional_intelligence"]},
            {"q": "If we must fly, is Mystique better off in-cabin or in cargo?", "expects": ["pet_name_used", "health_awareness"]},
            
            # Food while travelling
            {"q": "How do I manage Mystique's food on travel days without upsetting her stomach?", "expects": ["pet_name_used", "allergy_awareness"]},
            {"q": "What if she refuses to eat in a new place?", "expects": ["pet_name_used", "emotional_intelligence"]},
            
            # Safety
            {"q": "What should I do to make sure Mystique doesn't get lost in a new city?", "expects": ["pet_name_used"]},
            {"q": "How do I find a local vet quickly if we're travelling somewhere new?", "expects": ["pet_name_used", "health_awareness"]},
        ]
    },
    
    "care": {
        "name": "CARE",
        "description": "Grooming, vet visits, health",
        "questions": [
            # Grooming
            {"q": "I need to book grooming for Mystique", "expects": ["pet_name_used"]},
            {"q": "Same grooming as last time for Mystique", "expects": ["pet_name_used", "history_reference", "providers"]},
            {"q": "When was Mystique's last grooming?", "expects": ["pet_name_used", "history_reference", "providers"]},
            
            # Vet
            {"q": "Book a vet checkup for Mystique", "expects": ["pet_name_used", "health_awareness"]},
            {"q": "When is Mystique's next vaccination due?", "expects": ["pet_name_used"]},
            
            # Health concerns
            {"q": "Mystique seems off today – what should I watch for?", "expects": ["pet_name_used", "health_awareness"]},
            {"q": "Is it normal for Mystique to be this tired?", "expects": ["pet_name_used", "health_awareness"]},
        ]
    },
    
    "emergency": {
        "name": "EMERGENCY",
        "description": "Urgent situations, emergencies, first aid",
        "questions": [
            {"q": "I'm scared, Mystique ate something weird", "expects": ["pet_name_used", "emotional_intelligence", "health_awareness"]},
            {"q": "Mystique just ate chocolate – what should I do right now?", "expects": ["pet_name_used", "health_awareness"]},
            {"q": "She skipped a meal and seems off – is this urgent?", "expects": ["pet_name_used", "health_awareness"]},
        ]
    },
    
    "farewell": {
        "name": "FAREWELL",
        "description": "Grief, loss, end of life",
        "questions": [
            {"q": "I lost my dog last week and I'm not ready to talk about it, but I also can't pretend nothing happened", "expects": ["emotional_intelligence"]},
            {"q": "How do I mark his birthday now that he's gone, without breaking down?", "expects": ["emotional_intelligence"]},
            {"q": "I feel guilty that I didn't celebrate him enough when he was here", "expects": ["emotional_intelligence"]},
        ]
    },
    
    "advisory": {
        "name": "ADVISORY",
        "description": "Advice, guidance, life stage questions",
        "questions": [
            {"q": "Mystique is getting older – how should her care change?", "expects": ["pet_name_used", "health_awareness"]},
            {"q": "What should I think about for Mystique's senior years?", "expects": ["pet_name_used", "health_awareness", "emotional_intelligence"]},
        ]
    },
    
    "shop": {
        "name": "SHOP",
        "description": "Products, orders, recommendations",
        "questions": [
            {"q": "What did I order last time for Mystique?", "expects": ["pet_name_used", "history_reference"]},
            {"q": "Recommend some treats for Mystique", "expects": ["pet_name_used", "allergy_awareness"]},
            {"q": "What toys would Mystique enjoy?", "expects": ["pet_name_used", "personality_traits"]},
        ]
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# TESTER CLASS
# ═══════════════════════════════════════════════════════════════════════════════

class QuestionBankTester:
    def __init__(self, base_url: str, verbose: bool = False):
        self.base_url = base_url
        self.verbose = verbose
        self.token = None
        self.results = {
            "total": 0,
            "passed": 0,
            "failed": 0,
            "warnings": 0,
            "by_pillar": {},
            "details": []
        }
    
    async def login(self, session: aiohttp.ClientSession) -> bool:
        """Login and get auth token"""
        try:
            async with session.post(
                f"{self.base_url}/api/auth/login",
                json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
            ) as resp:
                data = await resp.json()
                self.token = data.get("access_token") or data.get("token")
                return bool(self.token)
        except Exception as e:
            print(f"❌ Login failed: {e}")
            return False
    
    async def test_question(self, session: aiohttp.ClientSession, pillar: str, question: Dict) -> Dict:
        """Test a single question and evaluate the response"""
        q_text = question["q"]
        expects = question.get("expects", [])
        
        try:
            async with session.post(
                f"{self.base_url}/api/mira/chat",
                headers={"Authorization": f"Bearer {self.token}"},
                json={
                    "message": q_text,
                    "pillar": pillar,
                    "selected_pet_id": TEST_PET_ID
                }
            ) as resp:
                data = await resp.json()
                response = data.get("response", "")
                
                # Evaluate soulfulness
                soul_score, soul_details = self.evaluate_soulfulness(response, expects)
                
                # Check for generic/robotic indicators
                generic_found = self.check_generic_indicators(response)
                
                # Determine pass/fail
                passed = soul_score >= 0.5 and len(generic_found) == 0
                warning = soul_score >= 0.3 and soul_score < 0.5
                
                return {
                    "question": q_text,
                    "pillar": pillar,
                    "response": response[:500],  # Truncate for report
                    "passed": passed,
                    "warning": warning,
                    "soul_score": soul_score,
                    "soul_details": soul_details,
                    "generic_found": generic_found,
                    "expects": expects
                }
                
        except Exception as e:
            return {
                "question": q_text,
                "pillar": pillar,
                "response": f"ERROR: {str(e)}",
                "passed": False,
                "warning": False,
                "soul_score": 0,
                "soul_details": {},
                "generic_found": [],
                "expects": expects,
                "error": str(e)
            }
    
    def evaluate_soulfulness(self, response: str, expects: List[str]) -> Tuple[float, Dict]:
        """Evaluate how soulful the response is based on expected indicators"""
        response_lower = response.lower()
        found = {}
        
        for indicator in expects:
            if indicator in SOUL_INDICATORS:
                keywords = SOUL_INDICATORS[indicator]
                found[indicator] = any(kw.lower() in response_lower for kw in keywords)
            else:
                found[indicator] = False
        
        if not expects:
            return 0.5, found  # Neutral if no expectations
        
        score = sum(1 for v in found.values() if v) / len(expects)
        return score, found
    
    def check_generic_indicators(self, response: str) -> List[str]:
        """Check for generic/robotic indicators that shouldn't be present"""
        found = []
        response_lower = response.lower()
        
        for indicator in GENERIC_INDICATORS:
            if indicator.lower() in response_lower:
                found.append(indicator)
        
        return found
    
    async def run_tests(self, pillars: List[str] = None):
        """Run all tests for specified pillars (or all if not specified)"""
        if pillars is None:
            pillars = list(QUESTION_BANK.keys())
        
        async with aiohttp.ClientSession() as session:
            # Login first
            print("🔐 Logging in...")
            if not await self.login(session):
                print("❌ Failed to login. Aborting tests.")
                return
            print("✅ Logged in successfully\n")
            
            # Run tests for each pillar
            for pillar in pillars:
                if pillar not in QUESTION_BANK:
                    print(f"⚠️ Unknown pillar: {pillar}")
                    continue
                
                pillar_data = QUESTION_BANK[pillar]
                pillar_name = pillar_data["name"]
                questions = pillar_data["questions"]
                
                print(f"\n{'═' * 60}")
                print(f"  {pillar_name} ({len(questions)} questions)")
                print(f"{'═' * 60}")
                
                pillar_results = {"passed": 0, "failed": 0, "warnings": 0, "details": []}
                
                for i, question in enumerate(questions, 1):
                    result = await self.test_question(session, pillar, question)
                    pillar_results["details"].append(result)
                    
                    self.results["total"] += 1
                    
                    if result["passed"]:
                        self.results["passed"] += 1
                        pillar_results["passed"] += 1
                        status = "✅ PASS"
                    elif result["warning"]:
                        self.results["warnings"] += 1
                        pillar_results["warnings"] += 1
                        status = "⚠️ WARN"
                    else:
                        self.results["failed"] += 1
                        pillar_results["failed"] += 1
                        status = "❌ FAIL"
                    
                    # Print result
                    q_short = question["q"][:50] + "..." if len(question["q"]) > 50 else question["q"]
                    print(f"  {i:2}. {status} | {q_short}")
                    
                    if self.verbose or not result["passed"]:
                        print(f"      Soul Score: {result['soul_score']:.0%}")
                        if result["generic_found"]:
                            print(f"      ⚠️ Generic: {result['generic_found']}")
                        if not result["passed"]:
                            missing = [k for k, v in result["soul_details"].items() if not v]
                            if missing:
                                print(f"      Missing: {missing}")
                    
                    # Small delay between requests
                    await asyncio.sleep(0.5)
                
                self.results["by_pillar"][pillar] = pillar_results
                
                # Pillar summary
                print(f"\n  Summary: {pillar_results['passed']}/{len(questions)} passed, "
                      f"{pillar_results['warnings']} warnings, {pillar_results['failed']} failed")
    
    def generate_report(self) -> str:
        """Generate a comprehensive test report"""
        report = []
        report.append("\n" + "═" * 70)
        report.append("  MIRA SOUL OS - QUESTION BANK TEST REPORT")
        report.append("  Generated: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        report.append("═" * 70)
        
        # Overall summary
        pass_rate = (self.results["passed"] / self.results["total"] * 100) if self.results["total"] > 0 else 0
        report.append(f"\n📊 OVERALL RESULTS")
        report.append(f"   Total Questions: {self.results['total']}")
        report.append(f"   ✅ Passed: {self.results['passed']} ({pass_rate:.1f}%)")
        report.append(f"   ⚠️ Warnings: {self.results['warnings']}")
        report.append(f"   ❌ Failed: {self.results['failed']}")
        
        # By pillar
        report.append(f"\n📋 BY PILLAR")
        for pillar, data in self.results["by_pillar"].items():
            total = data["passed"] + data["warnings"] + data["failed"]
            pillar_rate = (data["passed"] / total * 100) if total > 0 else 0
            status = "✅" if pillar_rate >= 80 else "⚠️" if pillar_rate >= 50 else "❌"
            report.append(f"   {status} {pillar.upper()}: {data['passed']}/{total} ({pillar_rate:.0f}%)")
        
        # Failed questions detail
        report.append(f"\n❌ FAILED QUESTIONS (Need Attention)")
        report.append("-" * 60)
        
        for pillar, data in self.results["by_pillar"].items():
            failed_qs = [d for d in data["details"] if not d["passed"] and not d["warning"]]
            if failed_qs:
                report.append(f"\n  {pillar.upper()}:")
                for fq in failed_qs:
                    report.append(f"    • {fq['question'][:60]}...")
                    report.append(f"      Issue: {fq['generic_found'] or 'Missing context'}")
                    missing = [k for k, v in fq["soul_details"].items() if not v]
                    if missing:
                        report.append(f"      Missing: {', '.join(missing)}")
        
        # Recommendations
        report.append(f"\n💡 RECOMMENDATIONS")
        report.append("-" * 60)
        
        # Analyze common issues
        all_generic = []
        all_missing = []
        for pillar, data in self.results["by_pillar"].items():
            for d in data["details"]:
                all_generic.extend(d.get("generic_found", []))
                missing = [k for k, v in d.get("soul_details", {}).items() if not v]
                all_missing.extend(missing)
        
        if all_generic:
            from collections import Counter
            common_generic = Counter(all_generic).most_common(3)
            report.append(f"\n  🔴 Most common generic indicators to fix:")
            for indicator, count in common_generic:
                report.append(f"     • '{indicator}' appeared {count} times")
        
        if all_missing:
            from collections import Counter
            common_missing = Counter(all_missing).most_common(3)
            report.append(f"\n  🟡 Most commonly missing context:")
            for indicator, count in common_missing:
                report.append(f"     • '{indicator}' missing in {count} responses")
        
        report.append("\n" + "═" * 70)
        
        return "\n".join(report)
    
    def save_report(self, filename: str = None):
        """Save the report to a file"""
        if filename is None:
            filename = f"/app/test_reports/question_bank_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        
        report = self.generate_report()
        with open(filename, 'w') as f:
            f.write(report)
        
        # Also save detailed JSON
        json_filename = filename.replace('.txt', '.json')
        with open(json_filename, 'w') as f:
            json.dump(self.results, f, indent=2, default=str)
        
        print(f"\n📄 Report saved to: {filename}")
        print(f"📊 JSON data saved to: {json_filename}")
        
        return filename


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

async def main():
    parser = argparse.ArgumentParser(description="Mira Soul OS - Question Bank Tester")
    parser.add_argument("--pillar", "-p", help="Test specific pillar only (e.g., 'celebrate', 'dine')")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show detailed output for all questions")
    parser.add_argument("--url", help=f"API URL (default: {BASE_URL})")
    args = parser.parse_args()
    
    url = args.url or BASE_URL
    pillars = [args.pillar] if args.pillar else None
    
    print("🐾 MIRA SOUL OS - Question Bank Tester")
    print(f"🔗 Testing against: {url}")
    print(f"🐕 Test Pet: {TEST_PET_NAME} ({TEST_PET_ID})")
    
    tester = QuestionBankTester(url, verbose=args.verbose)
    await tester.run_tests(pillars)
    
    # Print and save report
    report = tester.generate_report()
    print(report)
    tester.save_report()


if __name__ == "__main__":
    asyncio.run(main())
