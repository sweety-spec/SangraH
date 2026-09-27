import type { Order } from "../shared/schema";

const SHIPROCKET_API_URL = "https://apiv2.shiprocket.in/v1/external";

type ShiprocketCreateOrderResponse = {
  order_id?: number | string;
  shipment_id?: number | string;
  status?: string;
  status_code?: number;
  message?: string;
  awb_code?: string;
  courier_name?: string;
};

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Shiprocket is not configured. Missing ${name}.`);
  return value;
}

async function shiprocketRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(`${SHIPROCKET_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof data?.message === "string" ? data.message : "Shiprocket request failed";
    throw new Error(message);
  }
  return data as T;
}

async function getShiprocketToken() {
  const email = requiredEnv("SHIPROCKET_EMAIL");
  const password = requiredEnv("SHIPROCKET_PASSWORD");
  const res = await shiprocketRequest<{ token?: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  if (!res.token) throw new Error("Shiprocket login did not return an access token.");
  return res.token;
}

function splitCustomerName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts.shift() || "Customer";
  return { firstName, lastName: parts.join(" ") || firstName };
}

function toShiprocketDate(value?: string) {
  const date = value ? new Date(value) : new Date();
  return date.toISOString().slice(0, 10);
}

export async function createShiprocketOrder(order: Order) {
  if (order.shiprocketOrderId || order.shiprocketShipmentId) {
    throw new Error("This order is already linked with Shiprocket.");
  }

  const pickupLocation = requiredEnv("SHIPROCKET_PICKUP_LOCATION");
  const token = await getShiprocketToken();
  const address = order.shippingAddress;
  const { firstName, lastName } = splitCustomerName(address.fullName);
  const length = Number(process.env.SHIPROCKET_DEFAULT_LENGTH_CM || 20);
  const breadth = Number(process.env.SHIPROCKET_DEFAULT_BREADTH_CM || 15);
  const height = Number(process.env.SHIPROCKET_DEFAULT_HEIGHT_CM || 8);
  const weight = Number(process.env.SHIPROCKET_DEFAULT_WEIGHT_KG || 0.5);

  const payload = {
    order_id: order.orderNumber,
    order_date: toShiprocketDate(order.createdAt),
    pickup_location: pickupLocation,
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: address.line1,
    billing_address_2: address.line2 || "",
    billing_city: address.city,
    billing_pincode: address.postalCode,
    billing_state: address.state,
    billing_country: address.country || "India",
    billing_email: process.env.SHIPROCKET_FALLBACK_EMAIL || "support@sangrah.com",
    billing_phone: address.phone,
    shipping_is_billing: true,
    order_items: order.items.map((item) => ({
      name: item.name,
      sku: item.slug || item.productId,
      units: item.quantity,
      selling_price: item.price
    })),
    payment_method: order.paymentMethod === "cod" ? "COD" : "Prepaid",
    sub_total: order.subtotal,
    length,
    breadth,
    height,
    weight
  };

  return shiprocketRequest<ShiprocketCreateOrderResponse>("/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify(payload)
  }, token);
}
