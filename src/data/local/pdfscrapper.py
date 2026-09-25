import fitz

doc = fitz.open("nzformulary.pdf")

toc = doc.get_toc()

for i in range(0, toc.__sizeof__()):
    value = toc[i]
    next_value = toc[i+1]
    if (next_value[0] == 1 and value[0] == 1):
        name = value[1]
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
                    print(value)
                    break
                print(value)