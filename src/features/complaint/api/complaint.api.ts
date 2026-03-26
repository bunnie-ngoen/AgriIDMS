import { api } from "../../../shared/api";
import {
  complaintListSchema,
  complaintSchema,
  complaintableBoxListItemSchema,
  eligibleOrderForComplaintListItemSchema,
  type Complaint,
  type ComplaintableBoxListItemDto,
  type CreateComplaintRequest,
  type EligibleOrderForComplaintListItemDto,
} from "../schemas/complaint.schema";

function toCamelCase(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      const camel = key.charAt(0).toLowerCase() + key.slice(1);
      out[camel] = toCamelCase((obj as Record<string, unknown>)[key]);
    }
    return out;
  }
  return obj;
}

export const complaintApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createComplaint: builder.mutation<Complaint, CreateComplaintRequest>({
      query: (body) => ({
        url: "Complaints",
        method: "POST",
        // Backend enum ComplaintType đang là numeric (Damaged=1,...),
        // FE select đang trả string enum name nên cần map trước khi gửi.
        body: {
          ...body,
          type: complaintTypeToNumber(body.type),
        },
      }),
      transformResponse: (raw: unknown) => {
        const normalized = toCamelCase(raw);
        const parsed = complaintSchema.safeParse(normalized);
        if (!parsed.success) throw new Error("Invalid complaint response");
        return parsed.data;
      },
    }),

    getMyComplaints: builder.query<Complaint[], void>({
      query: () => ({
        url: "Complaints/my",
        method: "GET",
      }),
      transformResponse: (raw: unknown) => {
        const normalized = toCamelCase(raw);
        const parsed = complaintListSchema.safeParse(normalized);
        if (!parsed.success) return [];
        return parsed.data;
      },
    }),

    getAllComplaintsForStaff: builder.query<Complaint[], { skip?: number; take?: number } | void>({
      query: (arg) => ({
        url: "Complaints/staff/all",
        method: "GET",
        params: {
          skip: arg?.skip ?? 0,
          take: arg?.take ?? 50,
        },
      }),
      transformResponse: (raw: unknown) => {
        const normalized = toCamelCase(raw);
        const parsed = complaintListSchema.safeParse(normalized);
        if (!parsed.success) return [];
        return parsed.data;
      },
    }),

    verifyComplaint: builder.mutation<Complaint, { complaintId: number; approved: boolean }>({
      query: ({ complaintId, approved }) => ({
        url: `Complaints/${complaintId}/verify`,
        method: "PATCH",
        body: { approved },
      }),
      transformResponse: (raw: unknown) => {
        const normalized = toCamelCase(raw);
        const parsed = complaintSchema.safeParse(normalized);
        if (!parsed.success) throw new Error("Invalid complaint verify response");
        return parsed.data;
      },
    }),

    cancelComplaint: builder.mutation<Complaint, number>({
      query: (complaintId) => ({
        url: `Complaints/${complaintId}/cancel`,
        method: "POST",
      }),
      transformResponse: (raw: unknown) => {
        const normalized = toCamelCase(raw);
        const parsed = complaintSchema.safeParse(normalized);
        if (!parsed.success) throw new Error("Invalid complaint cancel response");
        return parsed.data;
      },
    }),

    getOrderBoxesForComplaint: builder.query<
      ComplaintableBoxListItemDto[],
      number
    >({
      query: (orderId) => ({
        url: `Complaints/orders/${orderId}/boxes`,
        method: "GET",
      }),
      transformResponse: (raw: unknown) => {
        const normalized = toCamelCase(raw);
        return zodArrayParse(
          complaintableBoxListItemSchema,
          normalized,
        );
      },
    }),

    getEligibleOrdersForComplaint: builder.query<
      EligibleOrderForComplaintListItemDto[],
      { skip?: number; take?: number } | void
    >({
      query: (arg) => ({
        url: "Complaints/my/eligible-orders",
        method: "GET",
        params: {
          skip: arg?.skip ?? 0,
          take: arg?.take ?? 20,
        },
      }),
      transformResponse: (raw: unknown) => {
        const normalized = toCamelCase(raw);
        return zodArrayParse(
          eligibleOrderForComplaintListItemSchema,
          normalized,
        );
      },
    }),
  }),
});

function zodArrayParse<T>(
  schema: {
    safeParse: (data: unknown) => { success: boolean; data?: T; error?: unknown };
  },
  raw: unknown,
): T[] {
  if (!Array.isArray(raw)) return [];
  const out: T[] = [];
  for (const item of raw) {
    const parsed = schema.safeParse(item);
    if (!parsed.success || !parsed.data) continue;
    out.push(parsed.data);
  }
  return out;
}

function complaintTypeToNumber(type: string | number): number {
  if (typeof type === "number") return type;
  const t = type.trim();
  if (t === "Damaged") return 1;
  if (t === "MissingQuantity") return 2;
  if (t === "WrongItem") return 3;
  if (t === "Other") return 4;
  return Number.NaN;
}

export const {
  useCreateComplaintMutation,
  useGetMyComplaintsQuery,
  useGetAllComplaintsForStaffQuery,
  useVerifyComplaintMutation,
  useCancelComplaintMutation,
  useGetOrderBoxesForComplaintQuery,
  useGetEligibleOrdersForComplaintQuery,
} = complaintApi;
