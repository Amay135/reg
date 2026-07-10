# Design Document — Dashboard Monitoring RAG WhatsApp

## 1. Tujuan

Dashboard untuk memonitor sistem chatbot RAG yang berjalan di WhatsApp: memantau volume percakapan, kualitas jawaban, performa retrieval, dan kesehatan sistem secara real-time.

## 2. Target pengguna

- **Admin/peneliti** — memantau performa sistem, evaluasi kualitas RAG untuk bab hasil skripsi
- **Operator** — memantau chat harian, menandai pertanyaan yang gagal dijawab

## 3. Struktur halaman

### 3.1 Overview (Home)
Ringkasan metrik utama dalam bentuk card + grafik.

| Widget | Isi |
|---|---|
| Total percakapan hari ini | Angka + perbandingan vs kemarin |
| Total user unik | Angka |
| Rata-rata waktu respons | Detik, dari request masuk sampai balasan terkirim |
| Grafik volume chat | Line chart per jam/hari |
| Top 5 pertanyaan sering muncul | Tabel/list |

### 3.2 Riwayat percakapan (Chat logs)
Tabel semua percakapan dengan filter.

- Kolom: waktu, nomor pengirim (bisa di-mask), pertanyaan, jawaban, dokumen sumber, waktu respons, status (berhasil/gagal)
- Filter: rentang tanggal, nomor user, status
- Klik baris → detail: pertanyaan, jawaban lengkap, potongan dokumen yang di-retrieve, skor similarity tiap dokumen

### 3.3 Kualitas RAG (Retrieval quality)
Untuk kebutuhan evaluasi skripsi.

- Grafik distribusi skor similarity retrieval
- Daftar pertanyaan dengan skor retrieval rendah (kandidat "tidak terjawab dengan baik")
- Feedback rating (jika ada tombol 👍👎 di WA) — rasio positif/negatif
- Rata-rata jumlah dokumen yang diambil per query

### 3.4 Kesehatan sistem (System health)
- Status service: WA Gateway, backend, vector DB, LLM API — indikator online/offline
- Rata-rata latency tiap tahap: retrieval, generation, total
- Error log terbaru (timeout, gagal koneksi, dsb)

### 3.5 Manajemen dokumen (Knowledge base)
- List dokumen yang sudah diindex ke vector DB
- Tombol upload dokumen baru / re-index
- Tanggal terakhir update index

## 4. Alur data ke dashboard

```
Backend RAG → simpan log tiap request ke PostgreSQL
                (question, answer, retrieved_docs, similarity_score,
                 response_time_ms, status, timestamp, sender)
                        ↓
Dashboard backend (FastAPI endpoint /api/stats, /api/logs)
                        ↓
Dashboard frontend (React) fetch berkala / polling / websocket
```

## 5. Skema tabel log (PostgreSQL)

```sql
CREATE TABLE chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender VARCHAR(50),
  question TEXT,
  answer TEXT,
  retrieved_docs JSONB,       -- [{doc_id, content, similarity_score}]
  response_time_ms INTEGER,
  status VARCHAR(20),          -- success | failed | low_confidence
  created_at TIMESTAMP DEFAULT now()
);
```

## 6. Tech stack

| Layer | Teknologi |
|---|---|
| Frontend | React / Next.js + Tailwind CSS |
| Chart | Recharts atau Chart.js |
| Backend dashboard API | FastAPI (bisa nempel di backend RAG yang sama) |
| Database | PostgreSQL |
| Realtime (opsional) | WebSocket / polling tiap beberapa detik |
| Auth | JWT sederhana, satu role admin cukup untuk skripsi |

## 7. Prioritas implementasi (untuk skripsi)

1. Chat logs + Overview — wajib, dasar evaluasi
2. Kualitas RAG — penting untuk bab analisis/pembahasan
3. System health — nilai tambah, opsional kalau waktu terbatas
4. Manajemen dokumen — opsional, bisa manual dulu lewat script
