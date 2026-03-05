def clean_text(text):
    lines = text.split("\n")
    cleaned = []

    for line in lines:
        line = line.strip()

        if len(line) > 2:
            cleaned.append(line)

    return " ".join(cleaned)