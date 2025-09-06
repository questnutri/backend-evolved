import json
from bson import ObjectId
import os

SOURCE = "taco"
KEYS_TO_DELETE = ["name"]

def convert_aliments(input_file, output_file):
    with open(input_file, "r", encoding="utf-8") as f:
        aliments = json.load(f)

    converted = []
    for aliment in aliments:
        portions_data = aliment.copy()
        for key in KEYS_TO_DELETE:
            if key in portions_data:
                del portions_data[key]

        new_aliment = {
            "name": aliment.get("name", ""),
            "source": SOURCE,
            "availablePortions": ["100 grams"],
            "portions": {
                "100 grams": portions_data
            }
        }
        converted.append(new_aliment)

    output_dir = os.path.dirname(output_file)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(converted, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    convert_aliments("current-sql/taco.json", "new-taco.json")
