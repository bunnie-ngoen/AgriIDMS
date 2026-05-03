/**
 * Body JSON khớp DTO backend (AgriIDMS.Application.DTOs.Order / Cart).
 * ASP.NET Core mặc định: camelCase.
 */

export type OrderRecipientCheckoutBody = {
    fullName: string;
    phone: string;
    address: string;
};

export type CreateOrderFromCartByVariantIdsItemBody = {
    productVariantId: number;
    boxWeight: number;
    isPartial: boolean;
    quantity: number;
};

export type CreateOrderFromCartRequestBody = {
    recipient: OrderRecipientCheckoutBody;
    items: CreateOrderFromCartByVariantIdsItemBody[];
};

export function roundBoxWeightKg(w: number): number {
    const n = Number(w);
    if (!Number.isFinite(n)) return n;
    return Math.round(n * 10000) / 10000;
}

export function toOrderRecipientCheckoutBody(input: {
    fullName: string;
    phone: string;
    address: string;
}): OrderRecipientCheckoutBody {
    return {
        fullName: input.fullName.trim(),
        phone: input.phone.trim(),
        address: input.address.trim(),
    };
}

export function toCreateOrderFromCartByVariantIdsItemBody(
    input: CreateOrderFromCartByVariantIdsItemBody,
): CreateOrderFromCartByVariantIdsItemBody {
    return {
        productVariantId: Math.trunc(Number(input.productVariantId)),
        boxWeight: roundBoxWeightKg(Number(input.boxWeight)),
        isPartial: Boolean(input.isPartial),
        quantity: Math.max(1, Math.trunc(Number(input.quantity))),
    };
}

export function toCreateOrderFromCartRequestBody(input: {
    recipient: { fullName: string; phone: string; address: string };
    items: CreateOrderFromCartByVariantIdsItemBody[];
}): CreateOrderFromCartRequestBody {
    return {
        recipient: toOrderRecipientCheckoutBody(input.recipient),
        items: input.items.map(toCreateOrderFromCartByVariantIdsItemBody),
    };
}

/** BE: UpdateCartItemRequest — body chỉ boxWeight, isPartial, quantity. */
export function toUpdateCartItemRequestBody(input: {
    boxWeight: number;
    isPartial: boolean;
    quantity: number;
}) {
    return {
        boxWeight: roundBoxWeightKg(Number(input.boxWeight)),
        isPartial: Boolean(input.isPartial),
        quantity: Math.max(1, Math.trunc(Number(input.quantity))),
    };
}

/** BE: AddCartItemRequest */
export function toAddCartItemRequestBody(input: {
    productVariantId: number;
    boxWeight: number;
    isPartial: boolean;
    quantity: number;
}) {
    return {
        productVariantId: Math.trunc(Number(input.productVariantId)),
        boxWeight: roundBoxWeightKg(Number(input.boxWeight)),
        isPartial: Boolean(input.isPartial),
        quantity: Math.max(1, Math.trunc(Number(input.quantity))),
    };
}

/** BE: CreatePosOrderItemRequest */
export type CreatePosOrderItemBody = {
    productVariantId: number;
    boxWeight: number;
    isPartial: boolean;
    quantity: number;
    unitPrice?: number;
};

/** BE: CreatePosOrderRequest */
export type CreatePosOrderRequestBody = {
    fulfillmentType?: 0 | 1;
    paymentTiming?: 0 | 1;
    customerUserId?: string;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    items: CreatePosOrderItemBody[];
};

export function toCreatePosOrderRequestBody(input: {
    fulfillmentType?: 0 | 1;
    paymentTiming?: 0 | 1;
    customerUserId?: string;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    items: Array<{
        productVariantId: number;
        boxWeight: number;
        isPartial: boolean;
        quantity: number;
        unitPrice?: number;
    }>;
}): CreatePosOrderRequestBody {
    return {
        fulfillmentType: input.fulfillmentType,
        paymentTiming: input.paymentTiming,
        customerUserId: input.customerUserId?.trim() || undefined,
        customerName: input.customerName?.trim() || undefined,
        customerPhone: input.customerPhone?.trim() || undefined,
        customerAddress: input.customerAddress?.trim() || undefined,
        items: input.items.map((i) => {
            const line: CreatePosOrderItemBody = {
                productVariantId: Math.trunc(Number(i.productVariantId)),
                boxWeight: roundBoxWeightKg(Number(i.boxWeight)),
                isPartial: Boolean(i.isPartial),
                quantity: Math.max(1, Math.trunc(Number(i.quantity))),
            };
            if (i.unitPrice != null && Number.isFinite(Number(i.unitPrice))) {
                line.unitPrice = Number(i.unitPrice);
            }
            return line;
        }),
    };
}
