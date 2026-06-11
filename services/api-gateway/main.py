import os

import httpx
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

CATALOG_URL = os.getenv("CATALOG_SERVICE_URL", "http://localhost:8001")
CART_URL = os.getenv("CART_SERVICE_URL", "http://localhost:8002")
ORDER_URL = os.getenv("ORDER_SERVICE_URL", "http://localhost:8003")
ADDRESS_URL = os.getenv("ADDRESS_SERVICE_URL", "http://localhost:8004")
PAYMENT_URL = os.getenv("PAYMENT_SERVICE_URL", "http://localhost:8005")
TRACKING_URL = os.getenv("TRACKING_SERVICE_URL", "http://localhost:8006")

app = FastAPI(title="InviteShop API Gateway", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def proxy_request(method: str, url: str, request: Request | None = None, **kwargs):
    async with httpx.AsyncClient() as client:
        try:
            if request:
                body = await request.body()
                headers = {
                    k: v
                    for k, v in request.headers.items()
                    if k.lower() not in ("host", "content-length")
                }
                response = await client.request(
                    method, url, content=body, headers=headers, timeout=60, **kwargs
                )
            else:
                response = await client.request(method, url, timeout=60, **kwargs)

            if response.headers.get("content-type", "").startswith("application/json"):
                return JSONResponse(
                    content=response.json(),
                    status_code=response.status_code,
                )
            return Response(
                content=response.content,
                status_code=response.status_code,
                media_type=response.headers.get("content-type"),
            )
        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail=f"Service unavailable: {url}")


@app.get("/health")
async def health():
    services = {
        "catalog": CATALOG_URL,
        "cart": CART_URL,
        "order": ORDER_URL,
        "address": ADDRESS_URL,
        "payment": PAYMENT_URL,
        "tracking": TRACKING_URL,
    }
    status = {}
    async with httpx.AsyncClient() as client:
        for name, url in services.items():
            try:
                resp = await client.get(f"{url}/health", timeout=5)
                status[name] = "healthy" if resp.status_code == 200 else "unhealthy"
            except Exception:
                status[name] = "unavailable"
    return {"gateway": "healthy", "services": status}


# Catalog routes
@app.get("/api/cards")
async def list_cards(request: Request):
    params = dict(request.query_params)
    query = "&".join(f"{k}={v}" for k, v in params.items())
    url = f"{CATALOG_URL}/cards" + (f"?{query}" if query else "")
    return await proxy_request("GET", url)


@app.get("/api/cards/{card_id}")
async def get_card(card_id: int):
    return await proxy_request("GET", f"{CATALOG_URL}/cards/{card_id}")


# Cart routes
@app.get("/api/cart/{session_id}")
async def get_cart(session_id: str):
    return await proxy_request("GET", f"{CART_URL}/cart/{session_id}")


@app.post("/api/cart/add")
async def add_to_cart(request: Request):
    return await proxy_request("POST", f"{CART_URL}/cart/add", request)


@app.put("/api/cart/{session_id}/items/{item_id}")
async def update_cart_item(session_id: str, item_id: int, request: Request):
    return await proxy_request("PUT", f"{CART_URL}/cart/{session_id}/items/{item_id}", request)


@app.delete("/api/cart/{session_id}/items/{item_id}")
async def remove_cart_item(session_id: str, item_id: int):
    return await proxy_request("DELETE", f"{CART_URL}/cart/{session_id}/items/{item_id}")


@app.delete("/api/cart/{session_id}")
async def clear_cart(session_id: str):
    return await proxy_request("DELETE", f"{CART_URL}/cart/{session_id}")


# Address routes
@app.post("/api/addresses/validate")
async def validate_address(request: Request):
    return await proxy_request("POST", f"{ADDRESS_URL}/validate", request)


@app.post("/api/addresses/validate/bulk")
async def validate_addresses_bulk(request: Request):
    return await proxy_request("POST", f"{ADDRESS_URL}/validate/bulk", request)


# Order routes
@app.post("/api/orders/checkout")
async def checkout(request: Request):
    return await proxy_request("POST", f"{ORDER_URL}/orders/checkout", request)


@app.post("/api/orders/validate-addresses")
async def validate_order_addresses(request: Request):
    return await proxy_request("POST", f"{ORDER_URL}/orders/validate-addresses", request)


@app.post("/api/orders/parse-excel")
async def parse_excel(file: UploadFile = File(...)):
    content = await file.read()
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{ORDER_URL}/orders/parse-excel",
                files={"file": (file.filename, content, file.content_type)},
                timeout=60,
            )
            return JSONResponse(content=response.json(), status_code=response.status_code)
        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail="Order service unavailable")


@app.get("/api/orders/{order_id}")
async def get_order(order_id: str):
    return await proxy_request("GET", f"{ORDER_URL}/orders/{order_id}")


@app.get("/api/orders")
async def list_orders(request: Request):
    params = dict(request.query_params)
    query = "&".join(f"{k}={v}" for k, v in params.items())
    url = f"{ORDER_URL}/orders" + (f"?{query}" if query else "")
    return await proxy_request("GET", url)


# Payment routes
@app.get("/api/payments/{payment_id}")
async def get_payment(payment_id: str):
    return await proxy_request("GET", f"{PAYMENT_URL}/payments/{payment_id}")


@app.get("/api/payments/order/{order_id}")
async def get_payment_by_order(order_id: str):
    return await proxy_request("GET", f"{PAYMENT_URL}/payments/order/{order_id}")


# Tracking routes
@app.get("/api/tracking/{order_id}")
async def get_tracking(order_id: str):
    return await proxy_request("GET", f"{TRACKING_URL}/tracking/{order_id}")


@app.post("/api/tracking/{order_id}/advance")
async def advance_tracking(order_id: str):
    return await proxy_request("POST", f"{TRACKING_URL}/tracking/{order_id}/advance")
