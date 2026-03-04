export type PersonalInfoForm = {
  name: string;
  email: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = {
  message: string;
};

export type ProfileUser = {
  name: string;
  email: string;
  role: string;
  department: string;
  joined: string;
  avatar: string;
};