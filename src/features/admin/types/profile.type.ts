export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = {
  message: string;
};

export interface ProfileResponse {
  id: string;
  fullName: string | null;
  email: string;
  phoneNumber: string | null;
  gender: boolean;
  dob: string | null;
  age: number | null;
  address: string | null;
  status: string;
  userType: string;
  createdAt: string;
}

export interface ProfileUser {
  id: string;
  fullName: string | null;
  email: string;
  phoneNumber: string | null;
  gender: boolean;
  dob: string | null;
  age: number | null;
  address: string | null;
  status: string;
  userType: string;
  createdAt: string;
}