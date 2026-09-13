// "use client";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";

// export default function ProtectedRoute({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const router = useRouter();
//   const [isAuthorized, setIsAuthorized] = useState(false);

//   useEffect(() => {
//     const token = localStorage.getItem("token");

//     if (!token) {
//       // If no token, kick them back to login
//       router.push("/login");
//     } else {
//       // You could also add logic here to decode the JWT
//       // and check if it's expired
//       setIsAuthorized(true);
//     }
//   }, [router]);

//   // Prevent "flicker" of protected content while checking auth
//   if (!isAuthorized) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-50">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   return <>{children}</>;
// }

"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode"; // npm install jwt-decode

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      // const token = localStorage.getItem("token");
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const decoded: any = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          // Token is expired! Clear it and kick them.
          // localStorage.removeItem("token");
          localStorage.removeItem("access_token");

          localStorage.removeItem("user");
          router.replace("/login?expired=true");
        } else {
          setIsAuthorized(true);
        }
      } catch (error) {
        // Token is malformed
        // localStorage.removeItem("token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");

        router.replace("/login");
      }
    };

    checkAuth();
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
