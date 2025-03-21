# Packages
import gspread
from google.oauth2.service_account import Credentials
import requests
import time

# Service key path - !! Delete when committing
SERVICE_ACCOUNT_FILE = 'YOUR PATH HERE'

# Google Sheets API
SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
credentials = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)

# Setup
gc = gspread.authorize(credentials)
spreadsheetID = 'YOUR ID HERE' # !! Delete when committing
sheetName = 'Sheet1'

# Open spreadsheet
sheet = gc.open_by_key(spreadsheetID)
worksheet = sheet.worksheet(sheetName)
fullAddresses = worksheet.col_values(10)[1:]

# Google Geocoding API
GEOCODING_API_KEY = 'YOUR KEY HERE' # !! Delete when committing
GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json'

def get_geocode_data(address):
    params = {
        'address': address,
        'key': GEOCODING_API_KEY
    }
    response = requests.get(GEOCODING_API_URL, params=params)
    data = response.json()
    if 'results' in data and len(data['results']) > 0:
        return data['results'][0]
    return None

def extract_info(geocode_data):
    county = city = latitude = longitude = zip_code = street_address = None
    if geocode_data:
        for component in geocode_data['address_components']:
            if 'administrative_area_level_2' in component['types']:
                county = component['long_name']
            if 'locality' in component['types']:
                city = component['long_name']
            if 'postal_code' in component['types']:
                zip_code = component['long_name']
            if 'street_address' in component['types'] or 'route' in component['types']:
                street_address = component['long_name']
        latitude = geocode_data['geometry']['location']['lat']
        longitude = geocode_data['geometry']['location']['lng']
    return county, city, latitude, longitude, zip_code, street_address

# Lists to store new data
counties = []
cities = []
latitudes = []
longitudes = []
zip_codes = []
street_addresses = []

total_addresses = len(fullAddresses)
start_time = time.time()

for i, address in enumerate(fullAddresses):
    geocode_data = get_geocode_data(address)
    county, city, latitude, longitude, zip_code, street_address = extract_info(geocode_data)
    counties.append(county)
    cities.append(city)
    latitudes.append(latitude)
    longitudes.append(longitude)
    zip_codes.append(zip_code)
    street_addresses.append(street_address)
    
    # Progress indicator
    if (i + 1) % 10 == 0 or i == total_addresses - 1:
        print(f"Processed {i + 1}/{total_addresses} addresses")

combined_data = list(zip(counties, cities, latitudes, longitudes, zip_codes, street_addresses))

def update_columns(start_row, combined_data):
    worksheet.update(range_name=f'A{start_row}:A{start_row + len(combined_data) - 1}', values=[[data[0]] for data in combined_data])
    worksheet.update(range_name=f'E{start_row}:E{start_row + len(combined_data) - 1}', values=[[data[1]] for data in combined_data])
    worksheet.update(range_name=f'G{start_row}:G{start_row + len(combined_data) - 1}', values=[[data[2]] for data in combined_data])
    worksheet.update(range_name=f'H{start_row}:H{start_row + len(combined_data) - 1}', values=[[data[3]] for data in combined_data])
    worksheet.update(range_name=f'I{start_row}:I{start_row + len(combined_data) - 1}', values=[[data[4]] for data in combined_data])
    worksheet.update(range_name=f'D{start_row}:D{start_row + len(combined_data) - 1}', values=[[data[5]] for data in combined_data])

update_columns(2, combined_data)

end_time = time.time()
print(f"Script ran successfully in {end_time - start_time:.2f} seconds.")