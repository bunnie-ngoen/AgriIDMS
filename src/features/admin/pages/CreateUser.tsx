import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateEmployeeSchema,
  type CreateEmployeeDto,
} from "../schemas/create-user.schema";
import { userApi } from "../api/create-user.api";
import toast from "react-hot-toast";

const roleOptions = [
  {
    value: "Manager",
    label: "Manager",
    description: "Full access & team oversight",
  },
  {
    value: "WarehouseStaff",
    label: "Warehouse Staff",
    description: "Inventory & logistics",
  },
  {
    value: "SalesStaff",
    label: "Sales Staff",
    description: "Orders & customer relations",
  },
];

const CreateUser = () => {
  const [createUser, { isLoading, isSuccess }] =
    userApi.useCreateUserMutation();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<CreateEmployeeDto>({
    resolver: zodResolver(CreateEmployeeSchema),
    defaultValues: { email: "", role: undefined },
  });

  const onSubmit = async (values: CreateEmployeeDto) => {
    setServerError(null);

    const toastId = toast.loading("Creating Employee...");

    try {
      await createUser(values).unwrap();

      toast.success("Tạo nhân viên thành công!", {
        id: toastId,
      });

      form.reset();
    } catch (err: any) {
      const message =
        err?.data?.error || "Có lỗi xảy ra, vui lòng thử lại";

      toast.error(message, {
        id: toastId,
      });

      setServerError(message);
    }
  };

  return (
    <div className="flex pt-10 justify-center bg-gray-100 p-4">
      <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-600 px-6 py-5">
          <p className="text-xs uppercase tracking-widest text-white/50">
            Quản lý nhân viên
          </p>
          <h2 className="text-lg font-bold text-white">
            Tạo nhân viên mới
          </h2>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">
                Email Address
              </label>
              <input
                {...form.register("email")}
                type="email"
                placeholder="user@company.com"
                className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition
                ${form.formState.errors.email
                    ? "border-red-500 focus:ring-2 focus:ring-red-200"
                    : "border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  }`}
              />
              {form.formState.errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-3">
                Assign Role
              </label>

              <div className="space-y-2">
                {roleOptions.map((role) => (
                  <label
                    key={role.value}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer hover:border-green-400 transition"
                  >
                    <input
                      type="radio"
                      value={role.value}
                      {...form.register("role")}
                      className="mt-1 accent-green-600"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {role.label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {role.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {form.formState.errors.role && (
                <p className="text-red-500 text-xs mt-1">
                  {form.formState.errors.role.message}
                </p>
              )}
            </div>

            {/* Success */}
            {isSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 rounded-lg">
                User created successfully!
              </div>
            )}

            {/* Server Error */}
            {serverError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                {serverError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2.5 rounded-lg font-semibold text-sm text-white transition-all duration-200
${isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#00A6F4] hover:bg-[#0090d6] active:scale-[0.98]"
                }`}
            >
              {isLoading ? "Creating..." : "Create User"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateUser;