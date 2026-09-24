// "use client";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import { jwtDecode } from "jwt-decode"; // npm install jwt-decode

// export default function ProtectedRoute({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const router = useRouter();
//   const [isAuthorized, setIsAuthorized] = useState(false);

//   useEffect(() => {
//     const checkAuth = () => {
//       // const token = localStorage.getItem("token");
//       const token = localStorage.getItem("access_token");

//       if (!token) {
//         router.replace("/login");
//         return;
//       }

//       try {
//         const decoded: any = jwtDecode(token);
//         const currentTime = Date.now() / 1000;

//         if (decoded.exp < currentTime) {
//           // Token is expired! Clear it and kick them.
//           // localStorage.removeItem("token");
//           localStorage.removeItem("access_token");

//           localStorage.removeItem("user");
//           router.replace("/login?expired=true");
//         } else {
//           setIsAuthorized(true);
//         }
//       } catch (error) {
//         // Token is malformed
//         // localStorage.removeItem("token");
//         localStorage.removeItem("access_token");
//         localStorage.removeItem("user");

//         router.replace("/login");
//       }
//     };

//     checkAuth();
//   }, [router]);

//   if (!isAuthorized) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-slate-950">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
//       </div>
//     );
//   }

//   return <>{children}</>;
// }

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import api from "@/lib/axios";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        await api.get("/auth/me");

        if (mounted) {
          setIsAuthorized(true);
        }
      } catch (error) {
        if (mounted) {
          router.replace("/login");
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return <>{children}</>;
}
