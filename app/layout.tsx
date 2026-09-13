// import type { Metadata } from "next";
// import { Outfit } from "next/font/google"; // Swapped Geist for Outfit
// import "./globals.css";
// import Providers from "./providers";
// import { Toaster } from "react-hot-toast";

// const outfit = Outfit({
//   subsets: ["latin"],
//   variable: "--font-outfit", // Use a variable for Tailwind integration
//   display: "swap",
// });

// export const metadata: Metadata = {
//   title: "Hill Top Resort",
//   description: "Advanced Restaurant & Logistics Management",
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       <body className={`${outfit.variable} font-sans antialiased`}>
//         <Providers>{children}</Providers>
//         <Toaster
//           position="top-right"
//           reverseOrder={false}
//           toastOptions={{ duration: 4000 }}
//         />
//       </body>
//     </html>
//   );
// }

import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "react-hot-toast";
import Script from "next/script"; // ✅ add this

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hill Top Resort",
  description: "Advanced Restaurant & Logistics Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>

        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{ duration: 4000 }}
        />

        {/* ✅ QZ Tray Script */}
        <Script
          src="https://cdn.jsdelivr.net/npm/qz-tray@2.2.5/qz-tray.js"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
