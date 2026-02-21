"""
Tests for Soul-First Response Generation Logic
Tests the Profile-First Doctrine enforcement
"""

import pytest
from soul_first_logic import (
    build_soul_context_summary,
    determine_response_strategy,
    process_soul_first_context,
    extract_soul_data_from_response,
    get_fallback_questions,
    format_fallback_response,
    SoulContextSummary,
    ResponseStrategy
)


class TestBuildSoulContextSummary:
    """Test building soul context from pet data"""
    
    def test_empty_pet(self):
        """Empty pet returns empty summary"""
        summary = build_soul_context_summary({})
        assert summary.pet_name == ""
        assert summary.grooming_relevant_count == 0
    
    def test_basic_pet_data(self):
        """Basic pet data is extracted correctly"""
        pet = {
            "name": "Buddy",
            "id": "pet-123",
            "breed": "Golden Retriever",
            "doggy_soul_answers": {
                "coat_type": "long",
                "handling_comfort": "Comfortable",
                "loud_sounds": "Slightly Nervous"
            }
        }
        summary = build_soul_context_summary(pet)
        
        assert summary.pet_name == "Buddy"
        assert summary.pet_id == "pet-123"
        assert summary.coat_type == "long"
        assert summary.handling_comfort == "Comfortable"
        assert summary.noise_sensitivity == "Slightly Nervous"
        assert summary.breed == "Golden Retriever"
        assert summary.grooming_relevant_count >= 2
    
    def test_anxiety_triggers_extracted(self):
        """Anxiety triggers are properly extracted"""
        pet = {
            "name": "Max",
            "doggy_soul_answers": {
                "anxiety_triggers": ["dryers", "loud sounds", "strangers"],
                "loud_sounds": "Very Scared"
            }
        }
        summary = build_soul_context_summary(pet)
        
        assert len(summary.grooming_anxiety_triggers) >= 1
        assert summary.noise_sensitivity == "Very Scared"
    
    def test_brachycephalic_detection(self):
        """Brachycephalic breeds are detected"""
        pet_pug = {
            "name": "Pugsley",
            "identity": {"breed": "Pug"}
        }
        summary_pug = build_soul_context_summary(pet_pug)
        assert summary_pug.is_brachycephalic == True
        
        pet_lab = {
            "name": "Labby",
            "identity": {"breed": "Labrador"}
        }
        summary_lab = build_soul_context_summary(pet_lab)
        assert summary_lab.is_brachycephalic == False


class TestDetermineResponseStrategy:
    """Test response strategy determination"""
    
    def test_soul_first_with_enough_data(self):
        """Soul-first strategy when >= 2 grooming-relevant fields"""
        summary = SoulContextSummary(
            pet_name="Buddy",
            coat_type="long",
            handling_comfort="Comfortable",
            noise_sensitivity="Nervous",
            grooming_relevant_count=3
        )
        strategy = determine_response_strategy(summary)
        
        assert strategy.strategy == "soul_first"
        assert len(strategy.soul_lines) > 0
    
    def test_breed_fallback_with_breed_only(self):
        """Breed fallback when Soul is sparse but breed known"""
        summary = SoulContextSummary(
            pet_name="Max",
            breed="Shih Tzu",
            grooming_relevant_count=1
        )
        strategy = determine_response_strategy(summary)
        
        assert strategy.strategy == "breed_fallback"
        assert strategy.breed_context is not None
        assert len(strategy.fallback_questions) > 0
    
    def test_ask_questions_with_no_data(self):
        """Ask questions strategy when no Soul data"""
        summary = SoulContextSummary(
            pet_name="Pet",
            grooming_relevant_count=0
        )
        strategy = determine_response_strategy(summary)
        
        assert strategy.strategy == "ask_questions"
        assert len(strategy.fallback_questions) > 0


class TestExtractSoulDataFromResponse:
    """Test extracting Soul data from user responses"""
    
    def test_extract_coat_type(self):
        """Coat types are correctly extracted"""
        extracted = extract_soul_data_from_response("Her coat is long and fluffy", "Buddy")
        assert extracted.coat_type == "long"
        
        extracted = extract_soul_data_from_response("Short coat, very smooth", "Max")
        assert extracted.coat_type == "short"
        
        extracted = extract_soul_data_from_response("It's matted and tangled", "Luna")
        assert extracted.coat_type == "matted"
    
    def test_extract_grooming_preference(self):
        """Grooming preference is correctly extracted"""
        extracted = extract_soul_data_from_response("Home visit please", "Buddy")
        assert extracted.grooming_preference == "home"
        
        extracted = extract_soul_data_from_response("Take her to a salon", "Luna")
        assert extracted.grooming_preference == "salon"
    
    def test_extract_anxiety_triggers(self):
        """Anxiety triggers are correctly extracted"""
        extracted = extract_soul_data_from_response("She hates the dryer", "Luna")
        assert "dryers" in extracted.grooming_anxiety_triggers
        
        extracted = extract_soul_data_from_response("Scared of clippers", "Max")
        assert "clippers" in extracted.grooming_anxiety_triggers
    
    def test_extract_with_but_clause(self):
        """Extraction handles 'but' clauses correctly"""
        # "fine with X but hates Y" should capture Y as trigger
        extracted = extract_soul_data_from_response(
            "She is fine with grooming but hates the dryer",
            "Luna"
        )
        assert "dryers" in extracted.grooming_anxiety_triggers
    
    def test_extract_grooming_history(self):
        """Grooming history is extracted"""
        extracted = extract_soul_data_from_response("She has never been groomed before", "Luna")
        assert extracted.last_groom_date == "never"
        
        extracted = extract_soul_data_from_response("Last groomed 2 weeks ago", "Max")
        assert "weeks" in extracted.last_groom_date
    
    def test_extract_skin_and_allergies(self):
        """Skin issues and allergies are extracted"""
        extracted = extract_soul_data_from_response(
            "She has skin irritation and is allergic to chicken",
            "Luna"
        )
        assert "skin irritation" in extracted.skin_flags
        assert len(extracted.allergy_flags) > 0
    
    def test_extract_city(self):
        """City is extracted from Indian city mentions"""
        extracted = extract_soul_data_from_response("I'm in Mumbai", "Buddy")
        assert extracted.city == "Mumbai"


class TestGetFallbackQuestions:
    """Test fallback question generation"""
    
    def test_full_questions_list(self):
        """Full question list has all required questions"""
        questions = get_fallback_questions("Buddy", "grooming", lite=False)
        
        assert len(questions) >= 3
        # Should include coat, experience, and sensitivity questions
        assert any("coat" in q.lower() for q in questions)
        assert any("groomed before" in q.lower() for q in questions)
    
    def test_lite_questions_list(self):
        """Lite question list is shorter"""
        questions = get_fallback_questions("Buddy", "grooming", lite=True)
        
        assert len(questions) == 2
    
    def test_pet_name_in_questions(self):
        """Pet name is included in questions"""
        questions = get_fallback_questions("Luna", "grooming")
        
        assert any("Luna" in q for q in questions)


class TestProcessSoulFirstContext:
    """Test the main entry point function"""
    
    def test_complete_flow(self):
        """Full flow returns all components"""
        pet = {
            "name": "Mystique",
            "id": "pet-123",
            "breed": "Shih Tzu",
            "doggy_soul_answers": {
                "coat_type": "long",
                "handling_comfort": "Comfortable",
                "loud_sounds": "Nervous"
            }
        }
        
        summary, strategy, prompt = process_soul_first_context(pet, "grooming")
        
        assert summary is not None
        assert summary.pet_name == "Mystique"
        assert strategy is not None
        assert isinstance(prompt, str)
        assert "SOUL-FIRST" in prompt


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
