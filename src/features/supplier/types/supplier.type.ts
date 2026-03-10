export type Supplier = {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
};

export type CreateSupplierRequest = {
  name: string;
  address: string;
  phone: string;
};

export type UpdateSupplierRequest = CreateSupplierRequest;

