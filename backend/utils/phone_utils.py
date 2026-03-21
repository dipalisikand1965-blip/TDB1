"""Phone number normalisation for member matching."""
import re

def normalise_phone(raw: str) -> list:
    """Returns all plausible formats to match against DB."""
    if not raw:
        return []
    digits = re.sub(r"[^\d]", "", raw)
    variants = set()
    variants.add(raw)
    variants.add(digits)
    if len(digits) == 10:
        variants.update(["91" + digits, "+91" + digits, "+91" + digits[:5] + digits[5:]])
    elif len(digits) == 12 and digits.startswith("91"):
        local = digits[2:]
        variants.update([local, "+" + digits, digits])
    elif len(digits) == 13 and digits.startswith("91"):
        local = digits[3:]
        variants.update([local, "91" + local, "+91" + local])
    return list(variants)
