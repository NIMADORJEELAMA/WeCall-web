// "use client";
// import { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { Loader2 } from "lucide-react";

// export default function RootPage() {
//   const router = useRouter();

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       router.push("/login");
//     } else {
//       router.push("/dashboard");
//     }
//   }, [router]);

//   return (
//     <div className="h-screen w-full flex items-center justify-center bg-white">
//       <div className="flex flex-col items-center gap-3">
//         {/* Simple, clean Indigo spinner */}
//         <Loader2 className="animate-spin text-indigo-600" size={32} />
//       </div>
//     </div>
//   );
// }

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // const token = localStorage.getItem("token");
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.replace("/login"); // ✅ better
    } else {
      router.replace("/dashboard/user"); // ✅ better
    }
  }, [router]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );
}
