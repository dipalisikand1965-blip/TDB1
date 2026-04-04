"""
Generate individual product photos for 35 remaining paperwork pillar products.
Run: python3 generate_paperwork_remaining.py
"""
import asyncio, os, sys, base64, logging
sys.path.insert(0, '/app/backend')
os.chdir('/app/backend')
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')
import cloudinary, cloudinary.uploader
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[logging.FileHandler('/tmp/paperwork_remaining.log'), logging.StreamHandler()]
)
log = logging.getLogger(__name__)

MONGO_URL = os.environ['MONGO_URL']
DB_NAME   = os.environ['DB_NAME']
LLM_KEY   = os.environ['EMERGENT_LLM_KEY']

PRODUCTS = [
    # ── Identity & Safety (10) ────────────────────────────────────────────────
    {
        "slug":   "paperwork-qr-id-tag",
        "prompt": "Professional product photo of a round stainless steel smart QR code pet ID tag, polished silver with a clean QR pattern engraved, small lobster clasp attached, clean white background, studio lighting, no text",
        "name_regex": "Smart QR ID Tag"
    },
    {
        "slug":   "paperwork-engraved-collar-tag",
        "prompt": "Professional product photo of a premium bone-shaped engraved metal dog collar tag in brushed gold, personalisation lines visible, small split ring attached, clean white background, studio lighting, no text",
        "name_regex": "Premium Engraved Collar Tag"
    },
    {
        "slug":   "paperwork-digital-id-card",
        "prompt": "Professional product photo of a laminated digital pet ID card, credit-card size, light blue with a paw print icon and photo placeholder, clean white background, studio lighting, no text",
        "name_regex": "Digital Pet ID Card"
    },
    {
        "slug":   "paperwork-id-tag-set",
        "prompt": "Professional product photo of a premium pet ID tag set, three metal tags in different shapes — round, bone and heart — arranged neatly together, clean white background, studio lighting, no text",
        "name_regex": "Premium ID Tag Set"
    },
    {
        "slug":   "paperwork-health-file-folder",
        "prompt": "Professional product photo of a branded pet health file folder in teal, expanding accordion style with labeled sections, upright position showing depth, clean white background, studio lighting, no text",
        "name_regex": "TDC Health File Folder|Health File Folder"
    },
    {
        "slug":   "paperwork-vaccination-booklet-holder",
        "prompt": "Professional product photo of a clear PVC vaccination booklet holder sleeve with a zipped edge, slightly open showing a booklet inside, clean white background, studio lighting, no text",
        "name_regex": "Vaccination Booklet Holder"
    },
    {
        "slug":   "paperwork-microchip-card",
        "prompt": "Professional product photo of a white and blue microchip information card, credit card size, with a chip graphic and info fields printed on it, clean white background, studio lighting, no text",
        "name_regex": "Microchip Information Card"
    },
    {
        "slug":   "paperwork-emergency-contact-card",
        "prompt": "Professional product photo of a laminated red emergency contact card for pets, wallet size, with labelled fields and a paw print border, clean white background, studio lighting, no text",
        "name_regex": "Emergency Contact Card"
    },
    {
        "slug":   "paperwork-compliance-guide",
        "prompt": "Professional product photo of a pet compliance guide booklet in navy blue and white, A5 size, spiral bound, sitting slightly open, clean white background, studio lighting, no text on cover",
        "name_regex": "Compliance Checklist|Compliance Guide|Society Rules"
    },
    # ── Insurance / insure (6) ────────────────────────────────────────────────
    {
        "slug":   "paperwork-insurance-quote-comparison",
        "prompt": "Professional product photo of a printed pet insurance quote comparison sheet on a clipboard, clean columns with tick boxes, clean white background, studio lighting, no text",
        "name_regex": "Insurance Quote Comparison|Quote Comparison"
    },
    {
        "slug":   "paperwork-claim-filing",
        "prompt": "Professional product photo of a red pet insurance claim filing folder, A4 size with labeled pocket dividers, clean white background, studio lighting, no text",
        "name_regex": "Claim Filing Assistance|Claim Tracking"
    },
    {
        "slug":   "paperwork-renewal-management",
        "prompt": "Professional product photo of a pet insurance renewal management planner, spiral-bound calendar format in green and white, desk standing position, clean white background, studio lighting, no text",
        "name_regex": "Renewal Management"
    },
    {
        "slug":   "paperwork-insurance-complete-package",
        "prompt": "Professional product photo of a complete pet insurance document package, a flat lay of a folder, info card, policy booklet and pen arranged neatly, clean white background, studio lighting, no text",
        "name_regex": "Complete Insurance Package"
    },
    {
        "slug":   "paperwork-policy-review",
        "prompt": "Professional product photo of a pet insurance policy review document with a magnifying glass resting on top, white paper with subtle header lines, clean white background, studio lighting, no text",
        "name_regex": "Policy Review"
    },
    # ── Health Records (4) ────────────────────────────────────────────────────
    {
        "slug":   "paperwork-vaccination-organiser",
        "prompt": "Professional product photo of a pet vaccination record organiser in blue, accordion folder with colour-coded tabs, standing upright, clean white background, studio lighting, no text",
        "name_regex": "Vaccination Record Organiser"
    },
    {
        "slug":   "paperwork-medical-history-binder",
        "prompt": "Professional product photo of a red pet medical history ring binder, slightly open showing tabbed dividers inside, A4 size, clean white background, studio lighting, no text",
        "name_regex": "Medical History Binder"
    },
    {
        "slug":   "paperwork-medication-tracker-pad",
        "prompt": "Professional product photo of a pet medication tracker notepad, A5 size, white cover with a subtle pill icon, top-spiral bound, clean white background, studio lighting, no text",
        "name_regex": "Medication Tracker Pad"
    },
    {
        "slug":   "paperwork-vet-visit-summary-cards",
        "prompt": "Professional product photo of a set of vet visit summary cards fanned out, white cards with coloured header strip and ruled lines, clean white background, studio lighting, no text",
        "name_regex": "Vet Visit Summary Cards|Vet Visit Summary"
    },
    # ── Insurance & Finance (4) ───────────────────────────────────────────────
    {
        "slug":   "paperwork-insurance-doc-organiser",
        "prompt": "Professional product photo of a navy blue pet insurance document organiser folder, multiple internal pockets, a paw print embossed on the cover, clean white background, studio lighting, no text",
        "name_regex": "Insurance Document Organiser"
    },
    {
        "slug":   "paperwork-budget-planner",
        "prompt": "Professional product photo of a pet budget planner notebook in mint green, hardcover with a paw print icon, open slightly showing ruled budget pages, clean white background, studio lighting, no text",
        "name_regex": "Pet Budget Planner"
    },
    {
        "slug":   "paperwork-insurance-comparison-card",
        "prompt": "Professional product photo of a laminated pet insurance comparison card, A5 landscape, columns for comparing policies, clean white background, studio lighting, no text",
        "name_regex": "Pet Insurance Comparison Card|Insurance Comparison Card"
    },
    # ── Travel Documents (4) ─────────────────────────────────────────────────
    {
        "slug":   "paperwork-passport-holder-universal",
        "prompt": "Professional product photo of a universal pet passport holder in dark teal leather-look material, slot for passport visible, a small paw print embossed on front, clean white background, studio lighting, no text",
        "name_regex": "Pet Passport Holder"
    },
    {
        "slug":   "paperwork-health-certificate-folder",
        "prompt": "Professional product photo of a pale blue pet health certificate folder, A4 size with a clear front pocket, standing slightly open, clean white background, studio lighting, no text",
        "name_regex": "Health Certificate Folder"
    },
    {
        "slug":   "paperwork-travel-document-kit",
        "prompt": "Professional product photo of a pet travel document kit, flat lay showing a zipped pouch, passport holder, tag and checklist card arranged together, clean white background, studio lighting, no text",
        "name_regex": "Travel Document Kit"
    },
    {
        "slug":   "paperwork-airline-checklist",
        "prompt": "Professional product photo of a printed airline pet travel checklist on a red clipboard, neat checkbox rows, clean white background, studio lighting, no text",
        "name_regex": "Airline Pet Travel Checklist"
    },
    # ── Paperwork (3) ────────────────────────────────────────────────────────
    {
        "slug":   "paperwork-waterproof-sleeve",
        "prompt": "Professional product photo of a clear waterproof A4 document sleeve with a zip seal, showing a document inside, clean white background, studio lighting, no text",
        "name_regex": "Waterproof Document Sleeve"
    },
    {
        "slug":   "paperwork-travel-document-pouch",
        "prompt": "Professional product photo of a black zippered travel document pouch with multiple internal card slots, slightly open to show pockets, clean white background, studio lighting, no text",
        "name_regex": "Travel Document Pouch|TDC Travel Document"
    },
    # ── Breed & Advisory (2) ─────────────────────────────────────────────────
    {
        "slug":   "paperwork-breed-archetype-report",
        "prompt": "Professional product photo of a printed breed archetype report booklet, A5 size, white cover with a paw print graphic and decorative border, clean white background, studio lighting, no text",
        "name_regex": "Breed Archetype Report"
    },
    {
        "slug":   "paperwork-life-stage-calendar",
        "prompt": "Professional product photo of a dog life stage care wall calendar, A4, showing month grids with paw print motifs, ring-bound at top, clean white background, studio lighting, no text",
        "name_regex": "Life Stage Care Calendar"
    },
    # ── Expert Advisory (2) ──────────────────────────────────────────────────
    {
        "slug":   "paperwork-multi-pet-guide",
        "prompt": "Professional product photo of a multi-pet household guide booklet, A5, white cover with a graphic of two dogs and a cat, ring bound, clean white background, studio lighting, no text",
        "name_regex": "Multi-Pet Household Guide"
    },
    {
        "slug":   "paperwork-new-parent-handbook",
        "prompt": "Professional product photo of a new pet parent handbook, A5 spiral-bound, soft mint cover with a small paw print icon, clean white background, studio lighting, no text",
        "name_regex": "New Pet Parent Handbook"
    },
]


async def generate_image(prompt: str) -> bytes | None:
    try:
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        gen = OpenAIImageGeneration(api_key=LLM_KEY)
        images = await gen.generate_images(prompt=prompt, number_of_images=1, model="gpt-image-1")
        return images[0] if images else None
    except Exception as e:
        log.error(f"  Gen error: {e}")
        return None

def upload(image_bytes: bytes, slug: str) -> str | None:
    try:
        data_url = f"data:image/png;base64,{base64.b64encode(image_bytes).decode()}"
        result = cloudinary.uploader.upload(
            data_url, public_id=f"tdc/products/shared/{slug}",
            overwrite=True, resource_type="image", format="webp", quality="auto:good"
        )
        return result.get("secure_url")
    except Exception as e:
        log.error(f"  Upload error: {e}")
        return None


async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    loop = asyncio.get_running_loop()
    total = len(PRODUCTS)
    log.info(f"=== PAPERWORK REMAINING — {total} product images ===")

    for i, item in enumerate(PRODUCTS):
        log.info(f"[{i+1}/{total}] {item['slug']}")
        img_bytes = await generate_image(item['prompt'])
        if not img_bytes:
            log.warning("  SKIPPED — generation failed"); await asyncio.sleep(3); continue

        url = await loop.run_in_executor(None, upload, img_bytes, item['slug'])
        if not url:
            log.warning("  SKIPPED — upload failed"); await asyncio.sleep(3); continue

        log.info(f"  Uploaded → {url}")
        res = await db.products_master.update_many(
            {'pillar': 'paperwork', 'name': {'$regex': item['name_regex'], '$options': 'i'}},
            {'$set': {
                'cloudinary_url': url, 'image_url': url, 'image': url, 'images': [url],
                'image_updated_at': datetime.now(timezone.utc).isoformat()
            }}
        )
        log.info(f"  DB: {res.modified_count} products updated")
        await asyncio.sleep(5)

    # Final report
    still_missing = await db.products_master.count_documents({
        'pillar': 'paperwork',
        'cloudinary_url': {'$exists': False},
        'category': {'$nin': ['service', 'Soul Documents']}
    })
    log.info(f"\n=== DONE — Still missing (excl. Soul/Service): {still_missing} ===")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
