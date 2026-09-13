"use client";
import { useState, useCallback, useEffect } from "react";
import { RefreshCw, Printer, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    qz: any;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function PrinterSelector() {
  const [printers, setPrinters] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "connected" | "error"
  >("idle");

  // ✅ 1. Wait until QZ is available on window
  const waitForQZ = async () => {
    let attempts = 0;

    while (attempts < 15) {
      if (window.qz) return;
      await sleep(300);
      attempts++;
    }

    throw new Error("QZ Tray not found");
  };

  // ✅ 2. Setup QZ Security (VERY IMPORTANT)
  const setupQZSecurity = () => {
    window.qz.security.setCertificatePromise((resolve: any) => {
      resolve(`-----BEGIN CERTIFICATE-----
MIIFDjCCA/agAwIBAgIGAZz/lpSSMA0GCSqGSIb3DQEBCwUAMIGaMQswCQYDVQQGEwJVUzELMAkG
A1UECAwCTlkxEjAQBgNVBAcMCUNhbmFzdG90YTEbMBkGA1UECgwSUVogSW5kdXN0cmllcywgTExD
MRswGQYDVQQLDBJRWiBJbmR1c3RyaWVzLCBMTEMxHDAaBgkqhkiG9w0BCQEWDXN1cHBvcnRAcXou
aW8xEjAQBgNVBAMMCWxvY2FsaG9zdDAeFw0yNjAzMTcwNjE2MjRaFw0yODA2MTkwNjE2MjRaMIGa
MQswCQYDVQQGEwJVUzELMAkGA1UECAwCTlkxEjAQBgNVBAcMCUNhbmFzdG90YTEbMBkGA1UECgwS
UVogSW5kdXN0cmllcywgTExDMRswGQYDVQQLDBJRWiBJbmR1c3RyaWVzLCBMTEMxHDAaBgkqhkiG
9w0BCQEWDXN1cHBvcnRAcXouaW8xEjAQBgNVBAMMCWxvY2FsaG9zdDCCASIwDQYJKoZIhvcNAQEB
BQADggEPADCCAQoCggEBAMQnI55QfhWBHk4eyc1TssAVA8CGgZfr6uKrQtrGcXVvTY+h4ziFCqbt
aoqqrIbYFOo4m0m50d9/4nEBxsqpd+2JxUW62SRZEe/IIipFePs3350aBgNSiJ6KiaS+Zgs4wGWU
f2WHCFpqGErasvepgL7YX+Ao7kQU4kVyOVRMr6r6TY7w3BrtZqfP6eDf2Vv/2J9usEJ3v/y52QRi
ScogwyI+P4fkpF1KIaidEwiFaYARqC57/sbWf5Oq+1mgE4No1jWPE29tfua1UcaI49brGN4TyGsd
QzsXQvluvxPLEB79S0HgNGdgLvd+Y1OZN08zYBMJAzrKTG0ylotpsquPYGMCAwEAAaOCAVYwggFS
MIHMBgNVHSMEgcQwgcGAFAbXcrlrbitsd5MeMP/yzcNSHZRKoYGgpIGdMIGaMQswCQYDVQQGEwJV
UzELMAkGA1UECAwCTlkxEjAQBgNVBAcMCUNhbmFzdG90YTEbMBkGA1UECgwSUVogSW5kdXN0cmll
cywgTExDMRswGQYDVQQLDBJRWiBJbmR1c3RyaWVzLCBMTEMxHDAaBgkqhkiG9w0BCQEWDXN1cHBv
cnRAcXouaW8xEjAQBgNVBAMMCWxvY2FsaG9zdIIGAZz/lpOWMAwGA1UdEwEB/wQCMAAwDgYDVR0P
AQH/BAQDAgWgMB0GA1UdJQQWMBQGCCsGAQUFBwMBBggrBgEFBQcDAjAlBgNVHREEHjAcgglsb2Nh
bGhvc3SCD2xvY2FsaG9zdC5xei5pbzAdBgNVHQ4EFgQU3C9aYvUWhr6REf62VMaw85I0ODgwDQYJ
KoZIhvcNAQELBQADggEBAClOsYJ/fvZK8HRjc5d5a7Z5Ghy/SFV1JOOHTtfJAkY5NAK1RSySS5gg
dbtnHLx7es/FZnDuYScm7AmM2dfUh95wjmBlJDXnuHQotQ2UPa2ODt+09hCsF7uk8CMKA5RReykY
vOPvzXj4KBfXV3r2MpZKFxG33uYVD+1BqyfGZLBX4L8YHHMERA4mMok/ZKP4nx1lL7ciipDyT0B2
c7VZAdU++GxG6BI7rvkTx4NGihe65BWkMX4izBGq42lV/QHXf/9izkxhKL8K0loi+U5rUdsj1KIK
HlQIKTXw1YER5AougWJ+f/nfc6y/eWU3dZ56LNqNMIVD/WlQhx6dQ6FyGeo=
-----END CERTIFICATE-----
`);
    });

    // ⚠️ DEV MODE (no signing)
    window.qz.security.setSignaturePromise(() => {
      return (resolve: any) => resolve();
    });
  };

  // ✅ 3. Connect with retry
  const connectQZ = async () => {
    if (window.qz.websocket.isActive()) return;

    let retries = 3;
    let delay = 500;

    while (retries > 0) {
      try {
        await window.qz.websocket.connect();
        return;
      } catch (err) {
        console.warn("Retrying QZ connect...");
        await sleep(delay);
        delay *= 2;
        retries--;
      }
    }

    throw new Error("Failed to connect to QZ Tray");
  };

  // ✅ 4. REAL handshake check (not fake)
  const waitForHandshake = async () => {
    let attempts = 0;

    while (attempts < 15) {
      if (window.qz?.websocket?.isActive()) {
        try {
          // 🔥 This ensures QZ is ACTUALLY ready
          await window.qz.printers.getDefault();
          return;
        } catch {
          // still initializing
        }
      }

      await sleep(400);
      attempts++;
    }

    throw new Error("QZ handshake failed");
  };

  // ✅ 5. Load printers (FINAL FLOW)
  const loadPrinters = useCallback(async () => {
    setStatus("loading");

    try {
      await waitForQZ();

      setupQZSecurity(); // 🔥 REQUIRED

      await connectQZ();

      await waitForHandshake();

      const list = await window.qz.printers.find();

      const printerList = Array.isArray(list) ? list : list ? [list] : [];

      setPrinters(printerList);
      setStatus("connected");

      // Restore saved printer
      const saved = localStorage.getItem("printer");
      if (saved && printerList.includes(saved)) {
        setSelected(saved);
      }
    } catch (err) {
      console.error("QZ Error:", err);
      setStatus("error");
    }
  }, []);

  // ✅ 6. Auto reconnect (VERY IMPORTANT)
  useEffect(() => {
    const interval = setInterval(() => {
      if (window.qz && !window.qz.websocket.isActive()) {
        console.warn("QZ disconnected. Reconnecting...");
        loadPrinters();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [loadPrinters]);

  // 🚀 Initial load
  useEffect(() => {
    loadPrinters();
  }, [loadPrinters]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelected(value);
    localStorage.setItem("printer", value);
  };

  return (
    <div className="flex flex-col gap-3 p-4 border rounded-xl bg-white shadow-sm border-slate-200 w-full max-w-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Printer size={18} className="text-slate-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Printer Settings
          </span>
        </div>

        {status === "connected" ? (
          <CheckCircle2 size={16} className="text-green-500" />
        ) : status === "error" ? (
          <AlertTriangle size={16} className="text-red-500" />
        ) : null}
      </div>

      <div className="flex gap-2">
        <select
          value={selected}
          onChange={handleChange}
          disabled={status === "loading"}
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-black transition-all disabled:opacity-50"
        >
          <option value="">
            {status === "loading" ? "Searching..." : "-- Select Printer --"}
          </option>

          {printers.map((p, i) => (
            <option key={i} value={p}>
              {p}
            </option>
          ))}
        </select>

        <Button
          variant="secondary"
          size="icon"
          onClick={loadPrinters}
          disabled={status === "loading"}
        >
          <RefreshCw
            size={16}
            className={status === "loading" ? "animate-spin" : ""}
          />
        </Button>
      </div>

      {status === "error" && (
        <p className="text-[11px] text-red-500 bg-red-50 p-2 rounded">
          Failed to connect. Ensure <strong>QZ Tray</strong> is running and
          allowed by firewall.
        </p>
      )}

      {selected && status === "connected" && (
        <p className="text-[10px] text-green-600 font-medium px-1">
          ✓ Ready to print to: {selected}
        </p>
      )}
    </div>
  );
}
