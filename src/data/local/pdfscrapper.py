import fitz
import json
import re

PDF_FILE = "nzformulary.pdf"
OUTPUT_FILE = "medications.json" 

SECTION_HEADERS = [
    "Indications",
    "Contra-indications",
    "Cautions",
    "Adverse Effects",
    "Patient Advice",
]

BRAND_LABELS = [
    "Trade names",
    "Trade name",
    "Brand names",
    "Brand name",
    "Brands",
    "Proprietary preparations",
    "Preparations",
]

def clean_text(value):
    if not value:
        return ""

    return (
        str(value).replace("\u2013", "-").replace("\u2014", "-").replace("\xa0", " ").strip()
    )

def open_formulary():
    return fitz.open(PDF_FILE)

def extract_pages(doc, start_page, end_page):
    pages = []

    for page_number in range(start_page, min(end_page + 1, len(doc))):
        text = doc[page_number].get_text("text")
        pages.append(text)

    return "\n".join(pages)

def extract_section(text, heading, headings=SECTION_HEADERS):
    lines = [clean_text(line) for line in text.splitlines()]

    start = None
    for i, line in enumerate(lines):
        if line.casefold() == heading.casefold():
            start = i + 1
            break

    if start is None:
        return ""

    result = []

    for line in lines[start:]:
        if any(
            line.casefold() == other.casefold()
            for other in headings
            if other.casefold() != heading.casefold()
        ):
            break

        if line:
            result.append(line)

    return " ".join(result)

def extract_brand_names(text, generic_name):
    lines = [clean_text(line) for line in text.splitlines()]
    brands = []

    for i, line in enumerate(lines):
        lower = line.casefold()

        for label in BRAND_LABELS:
            label_lower = label.casefold()

            if lower.startswith(label_lower + ":"):
                brands.extend(split_names(line.split(":", 1)[1]))
            elif lower == label_lower and i + 1 < len(lines):
                brands.extend(split_names(lines[i + 1]))

    brands.extend(extract_registered_brands(text))

    return clean_brand_names(brands, generic_name)

def split_names(value):
    if not value:
        return []
    return [
        clean_text(name)
        for name in re.split(r"[,;]", value)
        if clean_text(name)
    ]

def extract_registered_brands(text):
    if not text:
        return []

    pattern = r"\b[A-Za-z][A-Za-z0-9-]*(?:[®™](?:\s+[A-Za-z][A-Za-z0-9-]*[®™])*)"
    matches = re.findall(pattern, text)

    brands = []
    seen = set()

    for match in matches:
        brand = match.replace("®", "").replace("™", "").strip()
        key = brand.casefold()

        if brand and key not in seen:
            seen.add(key)
            brands.append(brand)

    return brands

def clean_brand_names(names, generic_name):
    cleaned = []
    seen = set()
    generic_key = clean_text(generic_name).casefold()

    excluded = {
        "tablet",
        "tablets",
        "capsule",
        "capsules",
        "injection",
        "solution",
        "oral liquid",
        "syrup",
        "drops",
        "powder",
        "inhalation",
    }

    for name in names:
        name = clean_text(name)
        key = name.casefold()

        if not name or key == generic_key or key in seen:
            continue

        if key in excluded:
            continue

        seen.add(key)
        cleaned.append(name)

    return cleaned

def find_medications(toc):
    medications = []

    for i, entry in enumerate(toc):
        level, title, page = entry

        if level != 1:
            continue

        title = clean_text(title)

        if not title:
            continue

        if title == "Appendix":
            break

        if title[0].isdigit():
            continue

        end_page = page

        for next_entry in toc[i + 1:]:
            if next_entry[0] == 1:
                end_page = next_entry[2]
                break

        medications.append(
            {
                "name": title,
                "start_page": page - 1,
                "end_page": end_page - 1,
            }
        )

    return medications

def build_record(doc, medication):
    name = medication["name"]

    text = extract_pages(
        doc,
        medication["start_page"],
        medication["end_page"],
    )

    brands = extract_brand_names(text, name)

    return {
        "medication_name": name,
        "common_names": brands,
        "common_use": extract_section(
            text,
            "Indications",
        ),

        "contra_indication": extract_section(
            text,
            "Contra-indications",
        ),

        "cautions": extract_section(
            text,
            "Cautions",
        ),

        "side_effects": extract_section(
            text,
            "Adverse Effects",
        ),

        "patient_advice": extract_section(
            text,
            "Patient Advice",
        ),
    }

def save_to_json(records, output=OUTPUT_FILE):
    with open(output, "w", encoding="utf-8") as file:
        json.dump(
            records,
            file,
            ensure_ascii=False,
            indent=2,
        )

def main():
    doc = open_formulary()
    toc = doc.get_toc()

    medications = find_medications(toc[110:])
    records = []

    for medication in medications:
        record = build_record(doc, medication)
        records.append(record)

    save_to_json(records)

if __name__ == "__main__":
    main()