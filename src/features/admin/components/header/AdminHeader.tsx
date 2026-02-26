import { useLocation,Link } from "react-router-dom";

const AdminHeader = () => {
    const location = useLocation(); //lấy thông tin của url hiện tại 

  const pathnames = location.pathname
    .split("/")  //["", "admin", "user-management", "create"]
    .filter((x) => x); // bỏ chuỗi rỗng
    console.log(pathnames[pathnames.length-1])
    return (
        <div className="flex justify-between p-5">
            <div>
                <div>
                    <nav className="text-sm text-gray-500 mb-1">
                        {pathnames.map((value, index) => {
                            const to = "/" + pathnames.slice(0, index + 1).join("/");  //cắt mảng từ 0 - 1 thì là admin
                            const isLast = index === pathnames.length - 1;  //lấy phần từ cuốix

                            return (
                                <span key={to}>
                                    {!isLast ? (    
                                        <>
                                            <Link to={to} className="hover:text-emerald-700">
                                                {value.charAt(0).toUpperCase() + value.slice(1)}
                                            </Link>
                                            <span className="mx-2">/</span>
                                        </>
                                    ) : (
                                        <span className="font-semibold text-gray-800">
                                            {value.charAt(0).toUpperCase() + value.slice(1)}
                                        </span>
                                    )}
                                </span>
                            );
                        })}
                    </nav>

                    <h1 className="text-md font-bold text-gray-900">
                        {formatTitle(pathnames[pathnames.length - 1]) || "Dashboard"}
                    </h1>
                </div>
            </div>
            <div>
                <input type="text" className="border border-gray-200 p-2 rounded-lg bg-white focus:outline-none 
             focus:ring-1 focus:ring-emerald-950 w-[250px]" placeholder="Type here" />
            </div>
        </div>
    )
}

export default AdminHeader

export const formatTitle = (str = "") =>
   
  str
    .split("-") //dashboard ko có - nên là nó sẽ trả về mỗi mảng chứa ele đó [dashboard]
    .map(
      word => word.charAt(0).toUpperCase() + word.slice(1)  //slice(1): bỏ phần tử đầu lấy tất cả những thứ còn lại
    )
    .join(" ");