/**
 * WA Gateway — WhatsApp Web Gateway untuk RAG Chatbot
 *
 * Menghubungkan WhatsApp ke backend FastAPI:
 *   1. Menerima pesan WhatsApp via Baileys (WhatsApp Web)
 *   2. Meneruskan ke POST /api/webhook/whatsapp
 *   3. Mengirimkan jawaban kembali ke user WhatsApp
 *
 * Cara pakai:
 *   1. Pastikan backend sudah berjalan di http://127.0.0.1:8000
 *   2. npm install && npm start
 *   3. Pilih metode pairing: scan QR atau pairing code
 *   4. Kirim pesan dari HP lain ke nomor yang terkoneksi → bot akan membalas
 */

const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const qrcode = require("qrcode-terminal");
const readline = require("readline");

// ---- Config ----
const BACKEND_URL = "http://127.0.0.1:8000/api/webhook/whatsapp";
const AUTH_DIR = "./auth_info";

// ---- Logger (simple) ----
const logger = pino({ level: "warn" });

// ---- Helper: prompt user for input ----
function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ---- Global socket ref (for clean reconnect) ----
let sock = null;

// ---- Main ----
async function start() {
  // Clean up old socket
  if (sock) {
    try { sock.end(); } catch {}
    sock = null;
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger.child({ level: "warn" })),
    },
    logger: logger.child({ level: "warn" }),
    browser: ["RAG Monitor", "Chrome", "1.0.0"],
    defaultQueryTimeoutMs: 60000,
    syncFullHistory: false,
  });

  // Ask user how they want to pair
  let pairingStarted = false;
  let pairingTimeout = null;

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // Show QR code if available
    if (qr && !pairingStarted) {
      pairingStarted = true;
      console.log("\n📱 Scan QR code ini dengan WhatsApp:\n");
      qrcode.generate(qr, { small: true });
      console.log('(Kalau QR tidak muncul, tunggu 10 detik untuk pairing code...)\n');
    }

    if (connection === "open") {
      if (pairingTimeout) clearTimeout(pairingTimeout);
      console.log("\n✅ WhatsApp Gateway terhubung!\n");
      console.log("   Kirim pesan WhatsApp ke nomor ini untuk mencoba chatbot.\n");
    }

    if (connection === "close") {
      if (pairingTimeout) clearTimeout(pairingTimeout);
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;

      if (loggedOut) {
        console.log("🚫 Logged out! Hapus folder auth_info/ lalu jalankan ulang.\n");
        return;
      }

      console.log(`⚠️ Koneksi terputus (code: ${statusCode}). Menyambung ulang dalam 3 detik...\n`);
      await new Promise((r) => setTimeout(r, 3000));
      start();
    }
  });

  // After 10 seconds, if no QR appeared, offer pairing code
  pairingTimeout = setTimeout(async () => {
    if (pairingStarted) return;
    pairingStarted = true;

    console.log("\n⚠️ QR code tidak muncul. Gunakan metode Pairing Code.\n");
    const phone = await ask("📞 Masukkan nomor WhatsApp bot (contoh: 62812xxxx): ");

    if (!phone || phone.length < 6) {
      console.log("❌ Nomor tidak valid. Silakan jalankan ulang.\n");
      process.exit(1);
    }

    try {
      const code = await sock.requestPairingCode(phone);
      console.log(`\n📱 Buka WhatsApp di HP, masuk ke:\n   Settings → Linked Devices → Link with Phone Number\n`);
      console.log(`🔢 Masukkan kode ini: ${code}\n`);
    } catch (err) {
      console.log(`❌ Gagal request pairing code: ${err.message}`);
      console.log("   Coba hapus folder auth_info/ dan jalankan ulang.\n");
      process.exit(1);
    }
  }, 15000);

  // Save credentials
  sock.ev.on("creds.update", saveCreds);

  // ---- Handle incoming messages ----
  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      if (msg.key.fromMe) continue;

      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        "";

      if (!text) continue;

      const sender = msg.key.remoteJid;
      const senderPhone = sender.split("@")[0];

      console.log(`📩 [${senderPhone}]: ${text.substring(0, 80)}${text.length > 80 ? "..." : ""}`);

      try {
        const response = await fetch(BACKEND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: text, sender: senderPhone }),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          console.error(`❌ Backend error: ${errBody.detail || response.status}`);
          await sock.sendMessage(sender, {
            text: "⚠️ Maaf, terjadi kesalahan. Silakan coba lagi nanti.",
          });
          continue;
        }

        const data = await response.json();
        const answer = data.answer;
        console.log(`📤 [${senderPhone}]: ${answer.substring(0, 80)}${answer.length > 80 ? "..." : ""}`);

        await sock.sendMessage(sender, { text: answer });
        await sock.readMessages([msg.key]);
      } catch (err) {
        console.error(`❌ Gagal: ${err.message}`);
        try {
          await sock.sendMessage(sender, {
            text: "⚠️ Maaf, layanan sedang tidak tersedia. Silakan coba lagi nanti.",
          });
        } catch {}
      }
    }
  });
}

// ---- Run ----
start().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
