import pdfplumber

def find_word(pdf, word):
    for page in pdf.pages:
        text = page.extract_text()
        if word in text:
            print(f"Found '{word}' on page {page.page_number}")
            for line in text.split('\n'):
                if word in line:
                    print(line.strip())

with pdfplumber.open("nzformulary.pdf") as pdf:
    find_word(pdf, "Appendix")