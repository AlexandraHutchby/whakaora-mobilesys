import unittest
from unittest.mock import patch, MagicMock
import pandas as pd
from src.data.local.pdfscrapper import (
    get_information,
    extract_text_between_headers,
    extract_medication_name,
    json_information,
    save_to_csv,
)

class TestPDFScraper(unittest.TestCase):
    def setUp(self):
        self.sample_text_between = [
            "Indications", 
            "Pain Relief",
            "Contra-indications",
            "Liver disease",
            "Cautions",
            "Avoid overdose",
            "Adverse Effects",
            "Nausea",
            "Patient Advice",
            "Take with water"]
        self.sample_general_medication = [
			["Medication Name", "Paracetamol", "Tablet"],
			["Common Name", "Acetaminophen", "Syrup"]
		]
        self.sample_medication = ["1", "Paracetamol", 10]
        self.sample_result = self.sample_text_between
    
    def test_get_information(self):
        result = get_information(self.sample_text_between, "Indications")
        self.assertEqual(result, "Pain Relief")

        result = get_information(self.sample_text_between, "Non-existent")
        self.assertIsNone(result)

    def test_extract_text_between_headers(self):
        with patch("fitz.open") as mock_open:
            mock_doc = MagicMock()
            mock_page = MagicMock()
            mock_doc.pages.return_value = [mock_page]
            mock_page.get_text.return_value =  "\n".join(self.sample_text_between)
            mock_open.return_value = mock_doc
            
            result = extract_text_between_headers(mock_doc, 0, 1, "Indications", "Contra-indications")
            
            self.assertEqual(result, ["Pain Relief"])

    def test_extract_medication_name(self):
        toc = [
            [1, "Medication Name", 1],
            [2, "Common Name", 2],
            [3, "Tablet", 3],
            [1, "Testing", 3],
            [5, "Nice", 4],
        ]
        result = extract_medication_name(toc, 0, [])
        self.assertEqual(result, [[toc[0], toc[1], toc[2],]])

    def test_json_information(self):
        result = json_information(
            self.sample_result,
            self.sample_general_medication,
            self.sample_medication
		)
        
        self.assertEqual(result["medication_name"], "Paracetamol")
        self.assertEqual(result["common_names"], self.sample_general_medication)
        self.assertEqual(result["common_use"], "Pain Relief")
        self.assertEqual(result["contra_indication"], "Liver disease")
        self.assertEqual(result["cautions"], "Avoid overdose")
        self.assertEqual(result["side_effects"], "Nausea")
        self.assertEqual(result["patient_advice"], "Take with water")

    @patch("os.path.exists")
    @patch("pandas.read_csv")
    @patch("pandas.DataFrame.to_csv")
    def test_save_to_csv(self, mock_to_csv, mock_read_csv, mock_exists):
        mock_exists.return_value = False
        mock_read_csv.return_value = pd.DataFrame()
        save_to_csv({"medication_name": "Paracetamol"}, "test_data.csv")
        mock_exists.assert_called_once_with("test_data.csv")
        mock_read_csv.assert_not_called()
        mock_to_csv.assert_called_once()

    @patch("os.path.exists")
    @patch("pandas.read_csv")
    @patch("pandas.DataFrame.to_csv")
    def test_save_to_csv_file_exists(self, mock_to_csv, mock_read_csv, mock_exists):
        mock_exists.return_value = True
        mock_read_csv.return_value = pd.DataFrame({"medication_name": ["Ibuprofen"]})
        save_to_csv({"medication_name": "Paracetamol"}, "test_data.csv")
        mock_exists.assert_called_once_with("test_data.csv")
        mock_read_csv.assert_called_once_with("test_data.csv")
        mock_to_csv.assert_called_once()

if __name__ == "__main__":
    unittest.main()