import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateEmployeeSchema, type CreateEmployeeDto } from "../schemas/create-user.schema";
import { userApi } from "../api/create-user.api";

const CreateUser = () => {
  const [createUser, { isLoading, error, isSuccess }] = userApi.useCreateUserMutation();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<CreateEmployeeDto>({
    resolver: zodResolver(CreateEmployeeSchema),
    defaultValues: {
      email: "",
      role: undefined,
    },
  });

  const onSubmit = async (values: CreateEmployeeDto) => {
    try {
      const response = await createUser(values).unwrap();
      console.log("User created successfully:", response);
      form.reset();
    } catch (err: any) {
      // LẤY MESSAGE TỪ BACKEND
      setServerError(err?.data?.error || "Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  return (
    <div className="px-5">
      <div className="bg-white h-auto rounded-[15px] p-9">
        <h1 className="text-center pt-2 font-bold text-2xl">CREATE USER</h1>

        <div className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="font-medium" htmlFor="email">Email</label>
              <input
                {...form.register("email")}
                id="email"
                type="email"
                placeholder="ex: user@example.com"
                className="w-full p-3 focus:ring-2 focus:outline-none focus:ring-amber-400 rounded-xl border border-gray-300"
              />
              {form.formState.errors.email && (
                <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
              )}
            </div>

            {/* Role */}
            <div className="flex flex-col gap-2">
              <label className="font-medium" htmlFor="role">Role</label>
              <select
                {...form.register("role")}
                id="role"
                className="p-3 focus:ring-2 focus:outline-none focus:ring-amber-400 rounded-xl border border-gray-300 bg-white"
              >
                <option value="">Select role</option>
                <option value="Manager">Manager</option>
                <option value="WarehouseStaff">Warehouse Staff</option>
                <option value="SalesStaff">Sales Staff</option>
              </select>
              {form.formState.errors.role && (
                <p className="text-red-500 text-sm">{form.formState.errors.role.message}</p>
              )}
            </div>

            {error && (
              <p className="text-red-500 text-sm">Failed to create user. Please try again.</p>
            )}

            {isSuccess && (
              <p className="text-green-500 text-sm">User created successfully!</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 bg-[#7FBB35] p-4 rounded-xl text-white font-medium hover:bg-amber-700 transition disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Submit"}
            </button>
            {serverError && (
              <p className="text-red-500 text-sm">{serverError}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateUser;