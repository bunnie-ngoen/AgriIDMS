export type VnProvince = {
  code: number;
  name: string;
};

export type VnDistrict = {
  code: number;
  name: string;
  province_code: number;
};

export type VnWard = {
  code: number;
  name: string;
  district_code: number;
};

const BASE = "https://provinces.open-api.vn/api";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${url} (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function getVnProvinces(): Promise<VnProvince[]> {
  return await fetchJson<VnProvince[]>(`${BASE}/p/`);
}

export async function getVnDistricts(provinceCode: number): Promise<VnDistrict[]> {
  const data = await fetchJson<{ districts: VnDistrict[] }>(
    `${BASE}/p/${provinceCode}?depth=2`
  );
  return data.districts ?? [];
}

export async function getVnWards(districtCode: number): Promise<VnWard[]> {
  const data = await fetchJson<{ wards: VnWard[] }>(
    `${BASE}/d/${districtCode}?depth=2`
  );
  return data.wards ?? [];
}

