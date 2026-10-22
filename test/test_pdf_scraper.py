import json
import os
import tempfile
import unittest
from unittest.mock import MagicMock, patch

from src.data.local import pdfscrapper as scraper

SAMPLE_PAGE = "\n".join(
    [
        "Paracetamol",
        "Trade names: Panadol, Pamol",
        "Indications",
        "Pain and fever",
        "Contra-indications",
        "Liver disease",
        "Cautions",
        "Avoid overdose",
        "Adverse Effects",
        "Nausea",
        "Patient Advice",
        "Take with water",
    ]
)

def make_doc(page_texts):
    pages = []
    for text in page_texts:
        page = MagicMock()
        page.get_text.return_value = text
        pages.append(page)
    return pages

class TestCleanText(unittest.TestCase):
    def test_empty_values_return_empty_string(self):
        self.assertEqual(scraper.clean_text(None), "")
        self.assertEqual(scraper.clean_text(""), "")

    def test_replaces_dashes_and_nbsp_and_strips(self):
        self.assertEqual(scraper.clean_text(" a\u2013b\u2014c\xa0d "), "a-b-c d")

    def test_non_string_values_are_converted(self):
        self.assertEqual(scraper.clean_text(42), "42")

class TestOpenFormulary(unittest.TestCase):
    def test_opens_configured_pdf(self):
        with patch.object(scraper.fitz, "open") as mock_open:
            result = scraper.open_formulary()
        mock_open.assert_called_once_with(scraper.PDF_FILE)
        self.assertEqual(result, mock_open.return_value)

class TestExtractPages(unittest.TestCase):
    def test_joins_requested_pages_inclusive(self):
        doc = make_doc(["p0", "p1", "p2"])
        self.assertEqual(scraper.extract_pages(doc, 0, 1), "p0\np1")
        doc[0].get_text.assert_called_once_with("text")

    def test_end_page_is_clamped_to_document_length(self):
        doc = make_doc(["p0", "p1", "p2"])
        self.assertEqual(scraper.extract_pages(doc, 1, 10), "p1\np2")

    def test_start_beyond_document_returns_empty_string(self):
        doc = make_doc(["p0"])
        self.assertEqual(scraper.extract_pages(doc, 5, 6), "")

class TestExtractSection(unittest.TestCase):
    def test_extracts_each_section(self):
        expected = {
            "Indications": "Pain and fever",
            "Contra-indications": "Liver disease",
            "Cautions": "Avoid overdose",
            "Adverse Effects": "Nausea",
            "Patient Advice": "Take with water",
        }

        for heading, value in expected.items():
            with self.subTest(heading=heading):
                self.assertEqual(scraper.extract_section(SAMPLE_PAGE, heading), value)

    def test_missing_heading_returns_empty_string(self):
        self.assertEqual(scraper.extract_section(SAMPLE_PAGE, "Non-existent"), "")

    def test_heading_match_is_case_insentive(self):
        self.assertEqual(scraper.extract_section(SAMPLE_PAGE, "indications"), "Pain and fever")

    def test_multiline_section_is_joined_and_blank_lines_skipped(self):
        text = "Indications\nPain\n\nFever\nCautions\nOther"
        self.assertEqual(scraper.extract_section(text, "Indications"), "Pain Fever")

    def test_en_dash_in_heading_is_normalised(self):
        text = "Contra\u2013indications\nLiver disease\nCautions\nOther"
        self.assertEqual(scraper.extract_section(text, "Contra-indications"), "Liver disease")

    def test_custom_headings_control_where_section_ends(self):
        text = "Indications\nPain\nCautions\nOther"
        self.assertEqual(scraper.extract_section(text, "Indications", headings=["Indications"]), "Pain Cautions Other")

class TestBrandHelpers(unittest.TestCase):
    def test_split_names(self):
        self.assertEqual(scraper.split_names("A, B; C"), ["A", "B", "C"])
        self.assertEqual(scraper.split_names("A,, ,B"), ["A", "B"])
        self.assertEqual(scraper.split_names(None), [])
        self.assertEqual(scraper.split_names(""), [])

    def test_extract_registered_brands(self):
        text = "Use Panadol\u00ae or Nurofen\u2122 for pain."
        self.assertEqual(scraper.extract_registered_brands(text), ["Panadol", "Nurofen"])

    def test_extract_registered_brands_multi_words(self):
        text = "Panadol\u00ae Osteo\u00ae tablets"
        self.assertEqual(scraper.extract_registered_brands(text), ["Panadol Osteo"])

    def test_extract_registered_brands_deduplicates_case_insensitively(self):
        text = "Panadol\u00ae is common. PANADOL\u00ae again."
        self.assertEqual(scraper.extract_registered_brands(text), ["Panadol"])

    def test_extract_registered_brands_empty(self):
        self.assertEqual(scraper.extract_registered_brands(""), [])
        self.assertEqual(scraper.extract_registered_brands(None), [])
        self.assertEqual(scraper.extract_registered_brands("No brands here"), [])

    def test_clean_brand_names(self):
        names = ["Panadol", "paracetamol", "Tablets", "panadol", " Pamol ", ""]
        self.assertEqual(scraper.clean_brand_names(names, "Paracetamol"), ["Panadol", "Pamol"])

class TestExtractBrandNames(unittest.TestCase):
    def test_label_with_colon_on_same_line(self):
        text = "Paracetamol\nTrade names: Panadol, Pamol\nIndications\nPain"
        self.assertEqual(scraper.extract_brand_names(text, "Paracetamol"), ["Panadol", "Pamol"])

    def test_label_with_names_on_next_line(self):
        text = "Brand names\nPanadol; Pamol\nIndications\nPain"
        self.assertEqual(scraper.extract_brand_names(text, "Paracetamol"), ["Panadol", "Pamol"])

    def test_registered_trademarks_are_picked_up(self):
        text = "Available as Panadol\u00ae for adults"
        self.assertEqual(scraper.extract_brand_names(text, "Paracetamol"), ["Panadol"])

    def test_generic_name_is_excluded(self):
        text = "Trade names: Paracetamol, Panadol"
        self.assertEqual(scraper.extract_brand_names(text, "Paracetamol"), ["Panadol"])

    def test_no_brands(self):
        self.assertEqual(scraper.extract_brand_names("Indications\nPain", "X"), [])

class TestFindMedications(unittest.TestCase):
    def test_finds_medications_and_page_ranges(self):
        toc = [
            [1, "1 Section", 5],
            [1, "Paracetamol", 10],
            [2, "Subsection", 10],
            [1, "Ibuprofen", 12],
            [1, "Appendix", 20],
            [1, "After Appendix", 25],
        ]
        self.assertEqual(scraper.find_medications(toc), [
            {"name": "Paracetamol", "start_page": 9, "end_page": 11},
            {"name": "Ibuprofen", "start_page": 11, "end_page": 19},
        ])

    def test_last_medication_without_next_entry_uses_own_page(self):
        self.assertEqual(scraper.find_medications([[1, "Zolpidem", 30]]), [{"name": "Zolpidem", "start_page": 29, "end_page": 29}])

    def test_blank_titles_are_skipped(self):
        self.assertEqual(scraper.find_medications([[1, "", 3]]), [])

    def test_title_is_cleaned(self):
        result = scraper.find_medications([[1, "Co\u2013trimoxazol", 7]])
        self.assertEqual(result[0]["name"], "Co-trimoxazol")

    def test_empty_toc(self):
        self.assertEqual(scraper.find_medications([]), [])

class TestBuildRecord(unittest.TestCase):
    def test_builds_full_record(self):
        doc = make_doc([SAMPLE_PAGE])
        medication = {"name": "Paracetamol", "start_page": 0, "end_page": 0}

        record = scraper.build_record(doc, medication)

        self.assertEqual(
            record,
            {
                "medication_name": "Paracetamol",
                "common_names": ["Panadol", "Pamol"],
                "common_use": "Pain and fever",
                "contra_indication": "Liver disease",
                "cautions": "Avoid overdose",
                "side_effects": "Nausea",
                "patient_advice": "Take with water",
            },
        )

    def test_missing_sections_are_empty_strings(self):
        doc = make_doc(["Nothing useful here"])
        medication = {"name": "Mystery", "start_page": 0, "end_page": 0}

        record = scraper.build_record(doc, medication)
        self.assertEqual(record["medication_name"], "Mystery")
        self.assertEqual(record["common_names"], [])
        for key in (
            "common_use",
            "contra_indication",
            "cautions",
            "side_effects",
            "patient_advice",
        ):
            self.assertEqual(record[key], "")

class TestSaveToJson(unittest.TestCase):
    def test_writes_readable_utf8_json(self):
        records = [{"medication_name": "Caf\u00e9ine", "common_names": ["A"]}]

        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "out.json")
            scraper.save_to_json(records, path)

            with open(path, encoding="utf-8") as f:
                raw = f.read()

        self.assertIn("Caf\u00e9ine", raw)
        self.assertEqual(json.loads(raw), records)

    def test_defaults_to_output_file_constant(self):
        with patch("builtins.open", unittest.mock.mock_open()) as mock_file:
            scraper.save_to_json([])

        mock_file.assert_called_once_with(scraper.OUTPUT_FILE, "w", encoding="utf-8")

class TestMain(unittest.TestCase):
    @patch.object(scraper, "save_to_json")
    @patch.object(scraper, "build_record")
    @patch.object(scraper, "find_medications")
    @patch.object(scraper, "open_formulary")
    def test_main_pipeline(self, mock_open, mock_find, mock_build, mock_save):
        doc = MagicMock()
        doc.get_toc.return_value = list(range(112))
        mock_open.return_value = doc

        meds = [{"name": "A"}, {"name": "B"}]
        mock_find.return_value = meds
        mock_build.side_effect = [{"medication_name": "A"}, {"medication_name": "B"}]

        scraper.main()

        mock_find.assert_called_once_with([110, 111])
        self.assertEqual(mock_build.call_count, 2)
        mock_build.assert_any_call(doc, meds[0])
        mock_build.assert_any_call(doc, meds[1])
        mock_save.assert_called_once_with([{"medication_name": "A"}, {"medication_name": "B"}])

if __name__ == "__main__":
    unittest.main()