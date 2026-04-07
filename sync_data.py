import requests
import json
import os

TOKEN = os.getenv('BASEROW_TOKEN')
TABLE_ID = 389
BASE_URL = f"https://dcp.huc.knaw.nl/api/database/rows/table/{TABLE_ID}/"

def fetch_all_data():
    all_rows = []
    # Voeg 'page' of 'user_field_names' expliciet toe
    url = f"{BASE_URL}?user_field_names=true&size=200" 
    
    headers = {
        "Authorization": f"Token {TOKEN}",
        "Content-Type": "application/json"
    }
    
    while url:
        print(f"Ophalen: {url}")
        response = requests.get(url, headers=headers)
        
        if response.status_code == 401:
            print("FOUT: 401 Unauthorized. Controleer of de BASEROW_TOKEN secret in GitHub correct is.")
            print("Zorg dat er geen extra spaties in de secret staan.")
            response.raise_for_status()
            
        response.raise_for_status()
        data = response.json()
        
        all_rows.extend(data['results'])
        url = data['next']
        
    return all_rows

def main():
    # 1. Haal nieuwe data op
    new_data = fetch_all_data()
    filename = 'data.json'
    
    # 2. Lees oude data (indien aanwezig) voor vergelijking
    old_data = []
    if os.path.exists(filename):
        with open(filename, 'r', encoding='utf-8') as f:
            try:
                old_data = json.load(f)
            except json.JSONDecodeError:
                pass

    # 3. Vergelijk en schrijf weg
    # We sorteren op ID om een eerlijke vergelijking te maken (volgorde kan variëren in API)
    new_sorted = sorted(new_data, key=lambda x: x['id'])
    old_sorted = sorted(old_data, key=lambda x: x['id'])

    if json.dumps(new_sorted) != json.dumps(old_sorted):
        with open('data.json', 'w', encoding='utf-8') as f:
            json.dump(new_sorted, f, indent=2, ensure_ascii=False)
        print("Bestand data.json is succesvol weggeschreven naar:", os.path.abspath('data.json'))
    else:
        print("Geen wijzigingen, maar we schrijven het bestand toch even voor de zekerheid...")
        with open('data.json', 'w', encoding='utf-8') as f:
            json.dump(new_sorted, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()