import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../../../app/hook";
import { ROUTES } from "../../../shared/constants/routes";
import {
  Package,
  Truck,
  ShieldCheck,
  Leaf,
  LogIn,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Search,
  Home,
} from "lucide-react";
import { selectIsLoggedIn } from "../../auth/selectors/auth.selectors";
import { useAuth } from "../../auth/hooks/useAuth";
import { AUTH_ROLE, ROLE_DASHBOARD_MAP } from "../../auth/constants/auth.constants";
import type { UserRole } from "../../auth/constants/auth.constants";
import { useGetProductsQuery } from "../../product/api/product.api";

const trustReasons = [
  { icon: ShieldCheck, title: "Uy tín chất lượng", desc: "Hệ thống quản lý chuyên nghiệp, phù hợp doanh nghiệp phân phối hoa quả." },
  { icon: Package, title: "Quản lý tập trung", desc: "Tồn kho, đơn hàng, nhập xuất — một nền tảng thống nhất." },
  { icon: Leaf, title: "Truy xuất nguồn gốc", desc: "QR code, lô hàng, từ nông trại đến điểm bán." },
  { icon: Truck, title: "Nhanh chóng chính xác", desc: "Theo dõi đơn mua, phiếu nhập xuất, giao hàng theo vai trò." },
];

// Banner carousel: ảnh slider từ minhphuongfruit.com (trang chủ)
const BANNER_BASE = "https://minhphuongfruit.com";
const BANNER_IMAGES = [
  `${BANNER_BASE}/thumb/1590x560x1x100/upload/hinhanh/happy-women-day_banner-5497.jpg`,
  `${BANNER_BASE}/thumb/1590x560x1x100/upload/hinhanh/valentine_banner-9715.jpg`,
  `${BANNER_BASE}/thumb/1590x560x1x100/upload/hinhanh/tet-binh-ngo_banner-01-1455.jpg`,
  `${BANNER_BASE}/thumb/1590x560x1x100/upload/hinhanh/banner-hop-qua-1041.jpg`,
  `${BANNER_BASE}/thumb/1590x560x1x100/upload/hinhanh/nho-xanh-uc_banner-7495.jpg`,
  `${BANNER_BASE}/thumb/1590x560x1x100/upload/hinhanh/cherry-01-5316.jpg`,
];
const BANNER_INTERVAL_MS = 5000;

// Chỉ các role có dashboard (Admin, Manager, Warehouse, Sales, Purchasing); Customer không có.
const ROLES_WITH_DASHBOARD: UserRole[] = [
  AUTH_ROLE.ADMIN,
  AUTH_ROLE.MANAGER,
  AUTH_ROLE.WAREHOUSE_STAFF,
  AUTH_ROLE.SALES_STAFF,
  AUTH_ROLE.PURCHASING_STAFF,
];

export default function HomePage() {
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const auth = useAuth();
  const role = auth.user?.roles?.[0] as UserRole | undefined;
  const hasDashboard = isLoggedIn && role != null && ROLES_WITH_DASHBOARD.includes(role);
  const dashboardPath = role ? ROLE_DASHBOARD_MAP[role] : null;

  const { data: products = [], isLoading: productsLoading } = useGetProductsQuery(undefined, {
    skip: !isLoggedIn, // chỉ gọi API khi đã đăng nhập (tránh 401 nếu BE yêu cầu auth)
  });

  const displayProducts = products.filter((p) => p.isActive !== false).slice(0, 8);

  // Carousel: chuyển banner mỗi BANNER_INTERVAL_MS
  const [bannerIndex, setBannerIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((i) => (i + 1) % BANNER_IMAGES.length);
    }, BANNER_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar — dòng chữ chạy bám bờ (marquee liên tục) */}
      <div className="bg-[#1a5f2a] text-white text-sm overflow-hidden">
        <style>{`
          @keyframes marquee-bam {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0 overflow-hidden flex items-center h-6">
            <div
              className="inline-flex items-center font-medium whitespace-nowrap gap-16 leading-none"
              style={{ animation: "marquee-bam 18s linear infinite" }}
            >
              <span className="align-middle">AgriIDMS — Hệ thống quản lý kho phân phối hoa quả</span>
              <span className="align-middle">AgriIDMS — Hệ thống quản lý kho phân phối hoa quả</span>
            </div>
          </div>
          {!isLoggedIn ? (
            <div className="flex items-center gap-4">
              <Link to={ROUTES.LOGIN} className="hover:underline">Đăng nhập</Link>
              <Link to={ROUTES.REGISTER} className="hover:underline">Đăng ký</Link>
            </div>
          ) : hasDashboard ? (
            <Link to={dashboardPath!} className="hover:underline flex items-center gap-1">
              <LayoutDashboard size={14} /> Vào hệ thống
            </Link>
          ) : null}
        </div>
      </div>

      {/* Main header — kiểu menu Minh Phương: logo + tagline trái, nav giữa, icon + link phải */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-6">
          {/* Logo + brand (trái) */}
          <Link to={ROUTES.HOME} className="flex items-center gap-3 flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-[#1a5f2a] flex items-center justify-center flex-shrink-0">
              <Leaf size={26} className="text-white" />
            </div>
            <div>
              <div className="text-base font-bold text-[#1a5f2a] uppercase tracking-tight leading-tight">
                AgriIDMS
              </div>
              <div className="text-xs text-slate-500 leading-tight hidden sm:block">
                Quản lý kho & phân phối hoa quả
              </div>
            </div>
          </Link>

          {/* Nav giữa — Trang chủ (icon nhà), Giới thiệu, Sản phẩm, Tin tức, Hệ thống, Liên hệ */}
          <nav className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center flex-1 min-w-0">
            <Link
              to={ROUTES.HOME}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#1a5f2a] hover:bg-slate-50 rounded transition-colors"
              title="Trang chủ"
            >
              <Home size={14} className="text-[#1a5f2a]" />
              Trang chủ
            </Link>
            <Link
              to={ROUTES.GIOI_THIEU}
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#1a5f2a] hover:bg-slate-50 rounded transition-colors"
            >
              Giới thiệu
            </Link>
            <a
              href="#san-pham"
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#1a5f2a] hover:bg-slate-50 rounded transition-colors"
            >
              Sản phẩm
            </a>
            <a
              href="#vi-sao-chon"
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#1a5f2a] hover:bg-slate-50 rounded transition-colors hidden sm:inline-block"
            >
              Tin tức
            </a>
            {hasDashboard ? (
              <Link
                to={dashboardPath!}
                className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#1a5f2a] hover:bg-slate-50 rounded transition-colors"
              >
                Hệ thống
              </Link>
            ) : (
              <Link
                to={ROUTES.LOGIN}
                className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#1a5f2a] hover:bg-slate-50 rounded transition-colors"
              >
                Hệ thống
              </Link>
            )}
            <a
              href="#lien-he"
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#1a5f2a] hover:bg-slate-50 rounded transition-colors"
            >
              Liên hệ
            </a>
          </nav>

          {/* Phải: icon Tìm kiếm + Đăng nhập / Đăng ký hoặc Vào hệ thống */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <a
              href="#san-pham"
              className="p-2 text-slate-600 hover:text-[#1a5f2a] rounded-lg hover:bg-slate-50 transition-colors"
              aria-label="Tìm kiếm"
            >
              <Search size={20} className="text-[#1a5f2a]" />
            </a>
            {!isLoggedIn ? (
              <>
                <Link
                  to={ROUTES.LOGIN}
                  className="text-sm font-medium text-slate-700 hover:text-[#1a5f2a] hidden sm:inline"
                >
                  Đăng nhập
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#1a5f2a] hover:bg-[#145026] transition-colors"
                >
                  <UserPlus size={16} />
                  Đăng ký
                </Link>
              </>
            ) : hasDashboard ? (
              <Link
                to={dashboardPath!}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#1a5f2a] hover:bg-[#145026] transition-colors"
              >
                <LayoutDashboard size={16} />
                Vào hệ thống
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      {/* Banner carousel — kiểu Minh Phương: full width, nút trái/phải, chấm */}
      <section className="relative w-full overflow-hidden bg-slate-100">
        <div className="relative w-full aspect-[1920/500] min-h-[280px] max-h-[420px] sm:min-h-[320px]">
          {BANNER_IMAGES.map((src, i) => (
            <div
              key={src}
              className="absolute inset-0 w-full transition-opacity duration-600 ease-in-out"
              style={{
                opacity: i === bannerIndex ? 1 : 0,
                zIndex: i === bannerIndex ? 1 : 0,
              }}
            >
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
            </div>
          ))}
        </div>
        {/* Nút trái / phải — như slider Minh Phương */}
        <button
          type="button"
          aria-label="Banner trước"
          onClick={() => setBannerIndex((i) => (i - 1 + BANNER_IMAGES.length) % BANNER_IMAGES.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          type="button"
          aria-label="Banner sau"
          onClick={() => setBannerIndex((i) => (i + 1) % BANNER_IMAGES.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
        >
          <ChevronRight size={24} />
        </button>
        {/* Chấm điều hướng — dưới cùng giữa */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {BANNER_IMAGES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Banner ${i + 1}`}
              onClick={() => setBannerIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === bannerIndex ? "w-6 bg-white shadow" : "w-2 bg-white/60 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Hero — title + CTA (Trang chủ không có phần Giới thiệu) */}
      <section className="bg-gradient-to-b from-[#e8f5e9] to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
            QUẢN LÝ KHO PHÂN PHỐI <span className="text-[#1a5f2a]">HOA QUẢ</span> TẬP TRUNG
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Tất cả quy trình từ mua hàng, nhập kho, quản lý sản phẩm đến phân phối — một hệ thống duy nhất.
          </p>
          {!isLoggedIn ? (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to={ROUTES.LOGIN}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-base font-semibold text-white bg-[#1a5f2a] hover:bg-[#145026] transition-colors shadow-md hover:shadow-lg"
              >
                <LogIn size={20} />
                Đăng nhập
              </Link>
              <Link
                to={ROUTES.REGISTER}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-base font-semibold text-[#1a5f2a] bg-white border-2 border-[#1a5f2a] hover:bg-[#e8f5e9] transition-colors"
              >
                <UserPlus size={20} />
                Tạo tài khoản
              </Link>
            </div>
          ) : hasDashboard ? (
            <div className="mt-10">
              <Link
                to={dashboardPath!}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-base font-semibold text-white bg-[#1a5f2a] hover:bg-[#145026] transition-colors shadow-md hover:shadow-lg"
              >
                <LayoutDashboard size={20} />
                Vào hệ thống
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      {/* Section: Sản phẩm — lấy từ list product (API có sẵn) */}
      <section id="san-pham" className="py-16 border-t border-slate-100 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center uppercase tracking-wide">
            Sản phẩm
          </h2>
          <p className="mt-2 text-slate-600 text-center max-w-2xl mx-auto">
            Một số sản phẩm hoa quả trong hệ thống.
          </p>

          {!isLoggedIn ? (
            <p className="mt-8 text-center text-slate-500">Đăng nhập để xem danh sách sản phẩm.</p>
          ) : productsLoading ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 h-64 animate-pulse" />
              ))}
            </div>
          ) : displayProducts.length === 0 ? (
            <p className="mt-8 text-center text-slate-500">Chưa có sản phẩm nào.</p>
          ) : (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {displayProducts.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-[#1a5f2a]/30 transition-all"
                >
                  <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Leaf className="text-slate-300" size={48} />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 line-clamp-2">{p.name}</h3>
                    {p.category && (
                      <p className="mt-1 text-sm text-slate-500">{p.category}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Vì sao chọn */}
      <section id="vi-sao-chon" className="py-16 bg-slate-50 border-t border-slate-200 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center uppercase tracking-wide">
            Vì sao chọn AgriIDMS
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {trustReasons.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="text-center">
                  <div className="inline-flex h-16 w-16 rounded-full bg-white border-2 border-[#1a5f2a]/20 items-center justify-center text-[#1a5f2a] mb-4">
                    <Icon size={28} />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="lien-he" className="bg-slate-900 text-slate-300 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Leaf size={24} className="text-[#4ade80]" />
                <span className="font-bold text-white text-lg">AgriIDMS</span>
              </div>
              <p className="text-sm text-slate-400">
                Hệ thống quản lý kho và phân phối hoa quả — từ nông trại đến điểm bán.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Liên kết</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to={ROUTES.HOME} className="hover:text-white">Trang chủ</Link></li>
                <li><Link to={ROUTES.GIOI_THIEU} className="hover:text-white">Giới thiệu</Link></li>
                <li><Link to={ROUTES.LOGIN} className="hover:text-white">Đăng nhập</Link></li>
                <li><Link to={ROUTES.REGISTER} className="hover:text-white">Đăng ký</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Liên hệ</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Phone size={14} /> 0834 70 11 55</li>
                <li className="flex items-center gap-2"><Mail size={14} /> agriidms@example.com</li>
                <li className="flex items-center gap-2"><MapPin size={14} /> TP. Hồ Chí Minh</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Hệ thống</h4>
              <p className="text-sm text-slate-400">
                Quản lý kho • Đơn mua hàng • Phiếu nhập xuất • Truy xuất nguồn gốc
              </p>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-slate-700 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} AgriIDMS — Quản lý kho phân phối hoa quả. Toàn bộ bản quyền thuộc AgriIDMS.
          </div>
        </div>
      </footer>
    </div>
  );
}
