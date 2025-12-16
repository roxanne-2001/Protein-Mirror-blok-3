import csv
import glob

# Alle CSV-bestanden in de map
csv_files = glob.glob('*.csv')

# Kolomnamen die we willen gebruiken (uit de meest complete CSV)
columns = [
    'Naam','Prijs','Aanbieding','Eiwit per 100g','Koolhydraten per 100g','Vetten per 100g','Calorieën','Link','Afbeelding','Verzameld op'
]

all_rows = []

for file in csv_files:
    with open(file, encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Voeg lege afbeelding toe als die niet bestaat
            if 'Afbeelding' not in row:
                row['Afbeelding'] = ''
            # Alleen relevante kolommen
            filtered = {col: row.get(col, '') for col in columns}
            all_rows.append(filtered)

# Eerst alle producten met een afbeelding, dan zonder
def has_image(row):
    val = row.get('Afbeelding', '')
    if val is None:
        return False
    return bool(str(val).strip())

all_rows.sort(key=lambda r: not has_image(r))

with open('alle_producten_samengevoegd.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=columns)
    writer.writeheader()
    writer.writerows(all_rows)

print('CSV-bestanden samengevoegd in alle_producten_samengevoegd.csv, producten met afbeelding staan bovenaan.')
