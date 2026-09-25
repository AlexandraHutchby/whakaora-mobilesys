import fitz

doc = fitz.open("nzformulary.pdf")

toc = doc.get_toc()

def extract_text_between_headers(page1, page2, header1, header2):
    text_between = []
    for page in doc.pages(page1, page2):
        foundHeader1 = False
        foundHeader2 = False
        text = page.get_text("text")
        lines = text.split("\n")

        for line in lines:
            if header1 in line:
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

def extract_medication_name(toc_start, text_between):
    if(toc[toc_start][0] == 1):
        medication_name = toc[toc_start]
        if(toc[toc_start+1][0] ==2):
            medication_type = toc[toc_start+1]
            if(toc[toc_start+2][0] == 3):
                medication_dosage = toc[toc_start+2]
                text_between.append([medication_name, medication_type, medication_dosage])
                extract_medication_name(toc_start + 3, text_between)

    if(toc[toc_start][0] == 2):
        i = 1
        while (toc[toc_start - i][0] != 1):
            i = i + 1
        medication_name = toc[toc_start-i]
        medication_type = toc[toc_start]
        if(toc[toc_start+1][0] == 3):
            medication_dosage = toc[toc_start+1]
            text_between.append([medication_name, medication_type, medication_dosage])
            extract_medication_name(toc_start + 2, text_between)

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
        extract_medication_name(toc_start + 1, text_between)

    return text_between


for i in range(120,140):
    medication = toc[i]
    generic_name = toc[i+1]
    type = toc[i+2]
    if (medication[0] == 1 and generic_name[0] == 1 and type[0] == 2):
        name = medication[1]
        first_letter = name[0]
        match first_letter:
            case '1':
                continue
            case '2':
                continue
            case '3':
                continue
            case '4':
                continue
            case '5':
                continue
            case '6':
                continue
            case '7':
                continue
            case '8': 
                continue
            case '9':
                continue
            case _:
                if(name == "Appendix"):
                    print(medication)
                    break
                else:
                    result = extract_text_between_headers(medication[2]-1, type[2]+1, medication[1], type[1])
                    general_medication = extract_medication_name(i+1, [])
                    print(medication)
                    print(generic_name)
                    print(type)
                    print(result)
                    print(general_medication)
                    print("==========\n")