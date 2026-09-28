import fitz
import pandas as pd
import os
import json

def open_formulary():
    return fitz.open("nzformulary.pdf")

def get_information(text_between, information_needed):
    for i in range(len(text_between) -1):
        if text_between[i] == information_needed:
            return text_between[i+1]
    return

def extract_text_between_headers(doc, page1, page2, header1, header2):
    text_between = []
    for page in doc.pages(page1, page2):
        foundHeader1 = False
        foundHeader2 = False
        text = page.get_text("text")
        lines = text.split("\n")
        for line in lines:
            if (header1 == line):
                foundHeader1 = True
                continue
            elif header2 in line and foundHeader1:
                foundHeader2 = True
                break
            if foundHeader1 and not foundHeader2:
                text_between.append(line)
        if foundHeader2:
            break
    return text_between

def extract_medication_name(toc, toc_start, text_between):
    if(toc[toc_start][0] == 1):
        medication_name = toc[toc_start]
        if(toc[toc_start+1][0] ==2):
            medication_type = toc[toc_start+1]
            if(toc[toc_start+2][0] == 3):
                medication_dosage = toc[toc_start+2]
                text_between.append([medication_name, medication_type, medication_dosage])
                extract_medication_name(toc, toc_start + 3, text_between)

    if(toc[toc_start][0] == 2):
        i = 1
        while (toc[toc_start - i][0] != 1):
            i = i + 1
        medication_name = toc[toc_start-i]
        medication_type = toc[toc_start]
        if(toc[toc_start+1][0] == 3):
            medication_dosage = toc[toc_start+1]
            text_between.append([medication_name, medication_type, medication_dosage])
            extract_medication_name(toc, toc_start + 2, text_between)

    if(toc[toc_start][0] == 3):
        i = 1
        j = 1
        while (toc[toc_start - i][0] != 1):
            if(toc[toc_start - i][0] == 2):
                j = i
            i = i + 1
        medication_name = toc[toc_start - i]
        medication_type = toc[toc_start - j]
        medication_dosage = toc[toc_start]
        text_between.append([medication_name, medication_type, medication_dosage])
        extract_medication_name(toc, toc_start + 1, text_between)

    return text_between

def json_information(result, general_medication, medication):
    common_names = []

    for item in general_medication:
        if isinstance(item, list) and len(item) > 0 and isinstance(item[0], list):
            if len(item[0]) > 1 and isinstance(item[0][1], str):
                common_names.append(item[0][1])

    information = {
        "medication_name": medication[1],
        "common_names": common_names,
        "common_use": get_information(result, "Indications"),
        "contra_indication": get_information(result, "Contra-indications"),
        "cautions": get_information(result, "Cautions"),
        "side_effects": get_information(result, "Adverse Effects"),
        "patient_advice": get_information(result, "Patient Advice"),
    }

    return information

def save_to_csv(information, output="data.csv"):
    if not os.path.exists(output):
        pd.DataFrame([information]).to_csv(output, index=False)
        return
        
    exisiting_information = pd.read_csv(output)
    json_df = pd.DataFrame([information])
    combined_df = pd.concat([exisiting_information, json_df], ignore_index=True)
    combined_df.to_csv(output, index=False)

def save_to_json(records, output="medications.json"):
    with open(output, "w", encoding="utf-8") as file:
        json.dump(records, file, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    doc = open_formulary()
    toc = doc.get_toc()
    all_records = []

    for i in range(len(toc) - 2):
        medication = toc[i]
        generic_name = toc[i + 1]
        med_type = toc[i + 2]

        if medication[0] == 1 and generic_name[0] == 1 and med_type[0] == 2:
            name = medication[1]

            if name == "Appendix":
                print(medication)
                break

            if len(name) > 0 and name[0].isdigit():
                continue

            result = extract_text_between_headers(
                doc,
                medication[2] - 1,
                med_type[2] + 1,
                medication[1],
                med_type[1],
            )

            general_medication = extract_medication_name(toc, i + 1, [])
            record = json_information(result, general_medication, medication)
            all_records.append(record)

    save_to_json(all_records)