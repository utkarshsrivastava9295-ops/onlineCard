import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { api } from "../api/client";
import type { Address, Cart, ParsedExcelAddress } from "../types";

interface CheckoutPageProps {
  sessionId: string;
}

const EMPTY_ADDRESS: Address = {
  recipient_name: "",
  street: "",
  city: "",
  state: "",
  postal_code: "",
  country: "India",
  phone: "",
};

export default function CheckoutPage({ sessionId }: CheckoutPageProps) {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [email, setEmail] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([{ ...EMPTY_ADDRESS }]);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [step, setStep] = useState<"addresses" | "payment" | "done">("addresses");
  const [validations, setValidations] = useState<
    { is_valid: boolean; issues: string[] }[]
  >([]);
  const [excelResults, setExcelResults] = useState<ParsedExcelAddress[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<{
    order_id: string;
    message: string;
    total_amount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getCart(sessionId).then(setCart).catch(console.error);
  }, [sessionId]);

  const updateAddress = (index: number, field: keyof Address, value: string) => {
    const updated = [...addresses];
    updated[index] = { ...updated[index], [field]: value };
    setAddresses(updated);
    setValidations([]);
  };

  const addAddress = () => setAddresses([...addresses, { ...EMPTY_ADDRESS }]);

  const removeAddress = (index: number) => {
    if (addresses.length > 1) {
      setAddresses(addresses.filter((_, i) => i !== index));
    }
  };

  const handleValidateAddresses = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.validateAddresses(addresses);
      setValidations(result.results.map((r) => ({ is_valid: r.is_valid, issues: r.issues })));
      if (result.invalid_count > 0) {
        setError(`${result.invalid_count} address(es) have validation issues. Please fix them.`);
      } else {
        setStep("payment");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.parseExcel(file);
      setExcelResults(result.addresses);
      const validAddresses = result.addresses
        .filter((a) => a.is_valid)
        .map(({ recipient_name, street, city, state, postal_code, country, phone }) => ({
          recipient_name,
          street,
          city,
          state,
          postal_code,
          country,
          phone,
        }));
      if (validAddresses.length > 0) {
        setAddresses(validAddresses);
        setValidations(
          result.addresses.map((a) => ({ is_valid: a.is_valid, issues: a.issues }))
        );
      }
      if (result.invalid_count > 0) {
        setError(
          `Imported ${result.valid_count} valid and ${result.invalid_count} invalid addresses from Excel.`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Excel upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.checkout(sessionId, email, addresses, {
        method: paymentMethod,
        card_number: paymentMethod === "card" ? cardNumber : undefined,
        card_holder: paymentMethod === "card" ? cardHolder : undefined,
      });
      setOrderResult({
        order_id: result.order_id,
        message: result.message,
        total_amount: result.total_amount,
      });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  const shippingCost = addresses.length * 2.99;
  const total = (cart?.subtotal || 0) + shippingCost;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-stone-500">Your cart is empty. Add items before checkout.</p>
      </div>
    );
  }

  if (step === "done" && orderResult) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="font-display text-3xl font-bold text-stone-900">Order Placed!</h2>
        <p className="text-stone-500 mt-2">{orderResult.message}</p>
        <div className="card-shadow p-6 mt-8 text-left">
          <p>
            <span className="text-stone-500">Order ID:</span>{" "}
            <span className="font-mono font-bold">{orderResult.order_id}</span>
          </p>
          <p className="mt-2">
            <span className="text-stone-500">Total Paid:</span>{" "}
            <span className="font-bold text-brand-600">
              ${orderResult.total_amount.toFixed(2)}
            </span>
          </p>
        </div>
        <button
          onClick={() => navigate(`/track?order=${orderResult.order_id}`)}
          className="btn-primary mt-6"
        >
          Track Your Order
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold mb-2">Checkout</h1>
      <p className="text-stone-500 mb-8">
        {addresses.length} delivery address{addresses.length > 1 ? "es" : ""} · Shipping $
        {shippingCost.toFixed(2)}
      </p>

      {/* Steps indicator */}
      <div className="flex gap-4 mb-8">
        {(["addresses", "payment"] as const).map((s, i) => (
          <div
            key={s}
            className={`flex items-center gap-2 text-sm font-medium ${
              step === s
                ? "text-brand-600"
                : step === "done" || (s === "addresses" && step === "payment")
                  ? "text-green-600"
                  : "text-stone-400"
            }`}
          >
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                step === s
                  ? "bg-brand-600 text-white"
                  : step === "payment" && s === "addresses"
                    ? "bg-green-500 text-white"
                    : "bg-stone-200 text-stone-500"
              }`}
            >
              {i + 1}
            </span>
            {s === "addresses" ? "Delivery Addresses" : "Payment"}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {step === "addresses" && (
        <div>
          <div className="card-shadow p-6 mb-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-brand-600" />
              Bulk Upload via Excel
            </h2>
            <p className="text-sm text-stone-500 mb-4">
              Upload an Excel file with columns: <code className="bg-stone-100 px-1 rounded">name</code>,{" "}
              <code className="bg-stone-100 px-1 rounded">street</code>,{" "}
              <code className="bg-stone-100 px-1 rounded">city</code>,{" "}
              <code className="bg-stone-100 px-1 rounded">state</code>,{" "}
              <code className="bg-stone-100 px-1 rounded">postal_code</code>,{" "}
              <code className="bg-stone-100 px-1 rounded">country</code>
            </p>
            <label className="btn-secondary inline-flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload Excel (.xlsx)
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              required
            />
          </div>

          {addresses.map((addr, index) => (
            <div key={index} className="card-shadow p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  Address {index + 1}
                  {validations[index] &&
                    (validations[index].is_valid ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ))}
                </h3>
                {addresses.length > 1 && (
                  <button
                    onClick={() => removeAddress(index)}
                    className="text-stone-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {validations[index] && !validations[index].is_valid && (
                <div className="bg-amber-50 text-amber-800 text-sm px-3 py-2 rounded-lg mb-4">
                  {validations[index].issues.join(" · ")}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(
                  [
                    ["recipient_name", "Recipient Name"],
                    ["street", "Street Address"],
                    ["city", "City"],
                    ["state", "State"],
                    ["postal_code", "Postal Code"],
                    ["country", "Country"],
                    ["phone", "Phone (optional)"],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field} className={field === "street" ? "sm:col-span-2" : ""}>
                    <label className="block text-sm font-medium text-stone-600 mb-1">
                      {label}
                    </label>
                    <input
                      value={addr[field] || ""}
                      onChange={(e) => updateAddress(index, field, e.target.value)}
                      className="input-field"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button onClick={addAddress} className="btn-secondary flex items-center gap-2 mb-6">
            <Plus className="w-4 h-4" /> Add Another Address
          </button>

          {excelResults && (
            <div className="card-shadow p-4 mb-6 text-sm">
              <p className="font-medium mb-2">Excel Import Summary</p>
              <p className="text-stone-500">
                {excelResults.filter((a) => a.is_valid).length} valid,{" "}
                {excelResults.filter((a) => !a.is_valid).length} invalid out of{" "}
                {excelResults.length} rows
              </p>
            </div>
          )}

          <button
            onClick={handleValidateAddresses}
            disabled={loading || !email}
            className="btn-primary w-full"
          >
            {loading ? "Validating..." : "Validate Addresses & Continue"}
          </button>
        </div>
      )}

      {step === "payment" && (
        <div>
          <div className="card-shadow p-6 mb-6">
            <h2 className="font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Subtotal</span>
                <span>${cart.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">
                  Shipping ({addresses.length} addresses × $2.99)
                </span>
                <span>${shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-brand-600">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="card-shadow p-6">
            <h2 className="font-semibold mb-4">Payment Method</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {["card", "upi", "netbanking", "wallet"].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium capitalize transition-colors ${
                    paymentMethod === method
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            {paymentMethod === "card" && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1">
                    Card Holder Name
                  </label>
                  <input
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="input-field"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1">
                    Card Number
                  </label>
                  <input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="input-field"
                    placeholder="4111 1111 1111 1111"
                  />
                  <p className="text-xs text-stone-400 mt-1">
                    Use a card ending in 0000 to simulate payment failure
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep("addresses")} className="btn-secondary flex-1">
                Back
              </button>
              <button
                onClick={handleCheckout}
                disabled={loading || (paymentMethod === "card" && !cardNumber)}
                className="btn-primary flex-1"
              >
                {loading ? "Processing..." : `Pay $${total.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
