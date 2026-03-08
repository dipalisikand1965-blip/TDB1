"""
Product Mockup Generator Service
=================================
Generates AI-powered product mockup images with:
- Pet name integrated into the product design
- Breed illustration composited onto the product
- Realistic product visualization

Uses OpenAI GPT Image 1 for generation.
"""

import os
import base64
import logging
from typing import Optional, List, Dict
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Product mockup prompt templates
PRODUCT_PROMPTS = {
    "mug": """A premium white ceramic coffee mug photographed on a clean white background. 
The mug has a beautiful watercolor illustration of a {breed} dog printed on its side, 
with the name "{pet_name}" elegantly printed in purple script below the illustration. 
Professional product photography, soft shadows, minimalist style.""",

    "bowl": """A high-quality stainless steel or ceramic dog food bowl photographed from above on a clean surface.
The bowl has the name "{pet_name}" engraved or printed on the outer rim in elegant purple lettering.
Inside the bowl shows a subtle watercolor {breed} dog illustration. 
Professional pet product photography, clean background.""",

    "cake": """A beautiful artisan dog birthday cake, decorated with dog-safe frosting.
The cake has "{pet_name}" written in elegant script on top with edible purple icing.
The cake is decorated with paw print designs and has a watercolor {breed} dog illustration as a cake topper.
Professional food photography, festive but elegant, pet-safe celebration cake.""",

    "bandana": """A premium cotton pet bandana laid flat on a clean surface.
The bandana features a beautiful watercolor illustration of a {breed} dog printed on the fabric,
with the name "{pet_name}" embroidered in elegant purple thread.
Professional product photography, soft fabric texture visible, high-quality pet accessory.""",

    "frame": """An elegant photo frame with a watercolor portrait illustration of a {breed} dog.
Below the portrait, the name "{pet_name}" is written in beautiful calligraphy.
The frame has a premium matte finish, photographed on a clean background.
Art print style, soulful watercolor illustration, personalized pet keepsake.""",

    "treat_box": """A premium gift box for dog treats, beautifully designed packaging.
The box has a watercolor {breed} dog illustration on the front,
with "{pet_name}'s Treats" written in elegant purple script.
Professional product photography, luxury pet gift packaging.""",

    "collar_tag": """A premium metal pet ID tag in the shape of a bone or circle.
The tag has "{pet_name}" engraved on the front in elegant lettering,
with a small watercolor {breed} dog silhouette.
Professional product photography, shiny metal surface, high-end pet accessory.""",

    "tote_bag": """A premium cotton canvas tote bag photographed flat on a clean surface.
The bag features a large, beautiful watercolor illustration of a {breed} dog,
with the text "Proud Parent of {pet_name}" printed below in elegant purple lettering.
Professional product photography, fabric texture visible, dog parent gift.""",

    "default": """A premium personalized pet product photographed professionally.
The product features a beautiful watercolor illustration of a {breed} dog,
with the name "{pet_name}" elegantly displayed.
Clean background, professional lighting, high-quality pet merchandise."""
}

# Breed descriptions for better prompts
BREED_DESCRIPTIONS = {
    "indie": "Indian Pariah dog with tan/brown coat, alert ears, and soulful eyes",
    "labrador": "golden/chocolate/black Labrador Retriever with friendly face",
    "golden_retriever": "Golden Retriever with flowing golden coat and gentle expression",
    "german_shepherd": "German Shepherd with black and tan markings, noble profile",
    "beagle": "tricolor Beagle with floppy ears and curious expression",
    "pug": "fawn Pug with wrinkled face and curly tail",
    "shih_tzu": "Shih Tzu with long flowing coat and sweet face",
    "poodle": "elegant Poodle with curly coat",
    "husky": "Siberian Husky with blue eyes and wolf-like markings",
    "rottweiler": "Rottweiler with black and tan markings, powerful build",
    "boxer": "Boxer with brindle or fawn coat, athletic build",
    "bulldog": "English Bulldog with wrinkled face and stocky build",
    "chihuahua": "tiny Chihuahua with big ears and alert expression",
    "dachshund": "Dachshund with long body and short legs",
    "cocker_spaniel": "Cocker Spaniel with long silky ears",
    "default": "adorable dog with soulful expression"
}


def get_breed_description(breed: str) -> str:
    """Get a descriptive phrase for the breed."""
    if not breed:
        return BREED_DESCRIPTIONS["default"]
    
    breed_key = breed.lower().replace(" ", "_").replace("-", "_")
    return BREED_DESCRIPTIONS.get(breed_key, f"{breed} with soulful expression")


def detect_product_type(product_name: str) -> str:
    """Detect product type from name."""
    name = (product_name or "").lower()
    
    if "mug" in name or "cup" in name:
        return "mug"
    if "bowl" in name or "feeder" in name:
        return "bowl"
    if "cake" in name or "birthday" in name:
        return "cake"
    if "bandana" in name or "scarf" in name:
        return "bandana"
    if "frame" in name or "photo" in name or "portrait" in name:
        return "frame"
    if "treat" in name or "box" in name or "hamper" in name:
        return "treat_box"
    if "collar" in name or "tag" in name:
        return "collar_tag"
    if "tote" in name or "bag" in name:
        return "tote_bag"
    
    return "default"


def build_mockup_prompt(product_name: str, pet_name: str, breed: str) -> str:
    """Build the AI prompt for generating a product mockup."""
    product_type = detect_product_type(product_name)
    prompt_template = PRODUCT_PROMPTS.get(product_type, PRODUCT_PROMPTS["default"])
    breed_desc = get_breed_description(breed)
    
    prompt = prompt_template.format(
        pet_name=pet_name,
        breed=breed_desc
    )
    
    # Add style instructions
    prompt += "\n\nStyle: Soulful watercolor illustration style, warm and emotional, not cartoonish or cutesy. Premium product photography aesthetic."
    
    return prompt


async def generate_product_mockup(
    product_name: str,
    pet_name: str,
    breed: str,
    existing_breed_illustration_url: Optional[str] = None
) -> Dict:
    """
    Generate a product mockup image using AI.
    
    Args:
        product_name: Name of the product (e.g., "Custom Photo Mug")
        pet_name: Pet's name (e.g., "Mojo")
        breed: Pet's breed (e.g., "Indie")
        existing_breed_illustration_url: URL of existing breed illustration to reference
    
    Returns:
        Dict with image_base64 and metadata
    """
    try:
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            logger.error("EMERGENT_LLM_KEY not found")
            return {"error": "API key not configured"}
        
        # Build the prompt
        prompt = build_mockup_prompt(product_name, pet_name, breed)
        logger.info(f"Generating mockup for: {product_name} | Pet: {pet_name} | Breed: {breed}")
        logger.debug(f"Prompt: {prompt}")
        
        # Initialize generator
        image_gen = OpenAIImageGeneration(api_key=api_key)
        
        # Generate the mockup
        images = await image_gen.generate_images(
            prompt=prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if images and len(images) > 0:
            image_base64 = base64.b64encode(images[0]).decode('utf-8')
            
            return {
                "success": True,
                "image_base64": image_base64,
                "image_url": f"data:image/png;base64,{image_base64}",
                "product_type": detect_product_type(product_name),
                "pet_name": pet_name,
                "breed": breed,
                "prompt_used": prompt[:200] + "..."  # Truncated for logging
            }
        else:
            return {"error": "No image was generated"}
            
    except Exception as e:
        logger.error(f"Error generating mockup: {e}")
        return {"error": str(e)}


async def generate_multiple_mockups(
    products: List[Dict],
    pet_name: str,
    breed: str
) -> List[Dict]:
    """
    Generate mockups for multiple products.
    
    Args:
        products: List of product dicts with 'name' field
        pet_name: Pet's name
        breed: Pet's breed
    
    Returns:
        List of mockup results
    """
    results = []
    
    for product in products:
        product_name = product.get("name") or product.get("title", "Product")
        result = await generate_product_mockup(product_name, pet_name, breed)
        result["product_id"] = product.get("id")
        result["product_name"] = product_name
        results.append(result)
    
    return results
