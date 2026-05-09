const BASE = process.env.NEXT_PUBLIC_API_URL;

export interface ShippingContact {
    shippingContactId: string;
    fullName: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    region: string;
    postalCode: string;
    countryCode: string;
    isDefault: boolean;
}

export interface AddShippingContactRequest {
    fullName: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    region: string;
    postalCode: string;
    countryCode: string;
}

export async function getShippingContacts(token: string): Promise<ShippingContact[]> {
    const res = await fetch(`${BASE}/api/shipping-contacts`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`getShippingContacts failed: ${res.status}`);
    return res.json();
}

export async function addShippingContact(
    token: string,
    data: AddShippingContactRequest
): Promise<string> {
    const res = await fetch(`${BASE}/api/shipping-contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Nu s-a putut salva adresa");
    const json = await res.json();
    return json.shippingContactId;
}

export async function deleteShippingContact(token: string, id: string): Promise<void> {
    const res = await fetch(`${BASE}/api/shipping-contacts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Nu s-a putut șterge adresa");
}

export async function updateShippingContact(
    token: string,
    id: string,
    data: AddShippingContactRequest
): Promise<void> {
    const res = await fetch(`${BASE}/api/shipping-contacts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Nu s-a putut actualiza adresa");
}

export async function setDefaultShippingContact(token: string, id: string): Promise<void> {
    const res = await fetch(`${BASE}/api/shipping-contacts/${id}/set-default`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Nu s-a putut seta adresa implicită");
}
