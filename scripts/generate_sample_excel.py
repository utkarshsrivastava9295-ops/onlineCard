"""Generate a sample Excel file for bulk address upload."""
from pathlib import Path

from openpyxl import Workbook

SAMPLE_ADDRESSES = [
    ["name", "street", "city", "state", "postal_code", "country", "phone"],
    ["Rajesh Kumar", "42 MG Road, Andheri West", "Mumbai", "Maharashtra", "400058", "India", "+91 9876543210"],
    ["Priya Sharma", "15 Park Street, Sector 12", "Delhi", "Delhi", "110001", "India", "+91 9123456789"],
    ["John Smith", "789 Broadway Avenue, Apt 4B", "New York", "New York", "10001", "USA", "+1 555-123-4567"],
    ["Invalid User", "Short", "UnknownCity", "XX", "ABC", "Atlantis", "123"],
]

wb = Workbook()
ws = wb.active
ws.title = "Addresses"
for row in SAMPLE_ADDRESSES:
    ws.append(row)

output = Path(__file__).parent.parent / "sample_addresses.xlsx"
wb.save(output)
print(f"Created {output}")
