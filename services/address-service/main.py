import re

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Address Validation Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PINCODE_PATTERN = re.compile(r"^\d{5,6}$")
PHONE_PATTERN = re.compile(r"^\+?[\d\s\-()]{10,15}$")

VALID_COUNTRIES = {
    "india", "united states", "usa", "uk", "united kingdom",
    "canada", "australia", "germany", "france",
}

KNOWN_CITIES = {
    "mumbai", "delhi", "bangalore", "bengaluru", "chennai", "kolkata",
    "hyderabad", "pune", "ahmedabad", "jaipur", "lucknow", "new york",
    "los angeles", "chicago", "london", "toronto", "sydney", "berlin",
}


class AddressInput(BaseModel):
    recipient_name: str = Field(min_length=2, max_length=100)
    street: str = Field(min_length=5, max_length=200)
    city: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)
    postal_code: str = Field(min_length=4, max_length=10)
    country: str = Field(min_length=2, max_length=100)
    phone: str | None = None


class AddressValidationResult(BaseModel):
    is_valid: bool
    confidence_score: float
    issues: list[str]
    normalized_address: AddressInput | None = None


class BulkValidationRequest(BaseModel):
    addresses: list[AddressInput]


class BulkValidationResponse(BaseModel):
    results: list[AddressValidationResult]
    valid_count: int
    invalid_count: int


def validate_address(address: AddressInput) -> AddressValidationResult:
    issues: list[str] = []
    score = 100.0

    if not PINCODE_PATTERN.match(address.postal_code.strip()):
        issues.append("Invalid postal code format (expected 5-6 digits)")
        score -= 30

    country_lower = address.country.strip().lower()
    if country_lower not in VALID_COUNTRIES:
        issues.append(f"Country '{address.country}' may not be serviceable")
        score -= 20

    city_lower = address.city.strip().lower()
    if city_lower not in KNOWN_CITIES:
        issues.append(f"City '{address.city}' could not be verified in our database")
        score -= 15

    if len(address.street.strip()) < 10:
        issues.append("Street address seems too short")
        score -= 10

    if address.phone and not PHONE_PATTERN.match(address.phone.strip()):
        issues.append("Phone number format is invalid")
        score -= 10

    if any(char.isdigit() for char in address.recipient_name):
        issues.append("Recipient name should not contain numbers")
        score -= 5

    normalized = AddressInput(
        recipient_name=address.recipient_name.strip().title(),
        street=address.street.strip(),
        city=address.city.strip().title(),
        state=address.state.strip().title(),
        postal_code=address.postal_code.strip(),
        country=address.country.strip().title(),
        phone=address.phone.strip() if address.phone else None,
    )

    is_valid = score >= 70 and len(issues) <= 1

    return AddressValidationResult(
        is_valid=is_valid,
        confidence_score=max(0, round(score, 1)),
        issues=issues,
        normalized_address=normalized if is_valid else None,
    )


@app.get("/health")
def health():
    return {"status": "healthy", "service": "address-service"}


@app.post("/validate", response_model=AddressValidationResult)
def validate_single(address: AddressInput):
    return validate_address(address)


@app.post("/validate/bulk", response_model=BulkValidationResponse)
def validate_bulk(payload: BulkValidationRequest):
    results = [validate_address(addr) for addr in payload.addresses]
    valid_count = sum(1 for r in results if r.is_valid)
    return BulkValidationResponse(
        results=results,
        valid_count=valid_count,
        invalid_count=len(results) - valid_count,
    )
