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
            if header2 in line and foundHeader1:
                foundHeader2 = True
                break
            if foundHeader1 and not foundHeader2:
                text_between.append(line)
        if foundHeader2:
            break
    return text_between



for i in range(0, 200):
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
                print(medication)
                    # result = extract_text_between_headers(value[2], next_value[2], value[1], next_value[1])
                    # if (result != []):
                    #     print(result)