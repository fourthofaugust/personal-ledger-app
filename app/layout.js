import { Outfit } from "next/font/google";
import "./globals.css";
import { LedgerProvider } from "@/contexts/LedgerContext";
import { AuthProvider } from "@/contexts/AuthContext";
import AddTransactionFAB from "@/components/AddTransactionFAB";
import ThemeProvider from "@/components/ThemeProvider";
import AuthGuard from "@/components/AuthGuard";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata = {
  title: "Personal Ledger",
  description: "Track your income and expenses",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${outfit.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <AuthGuard>
              <LedgerProvider>
                {children}
                <AddTransactionFAB />
              </LedgerProvider>
            </AuthGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
