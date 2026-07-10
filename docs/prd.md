# Product Requirements Document (PRD)

## Chatbot RAG berbasis WhatsApp dengan Dashboard Monitoring

**Versi:** 1.0
**Status:** Draft skripsi

---

## 1. Latar belakang

Kebutuhan akses informasi cepat via kanal yang sudah familiar bagi pengguna (WhatsApp), didukung jawaban akurat berbasis dokumen sumber (Retrieval Augmented Generation), serta kebutuhan pemantauan performa sistem oleh admin/peneliti.

## 2. Tujuan produk

- Menyediakan chatbot yang menjawab pertanyaan user berdasarkan basis dokumen tertentu (bukan jawaban umum LLM)
- Chatbot dapat diakses lewat WhatsApp tanpa instalasi aplikasi tambahan
- Admin dapat memonitor performa sistem dan kualitas jawaban lewat dashboard

## 3. Target pengguna

| Role | Kebutuhan |
|---|---|
| End user | Bertanya via WA, dapat jawaban cepat dan relevan |
| Admin/peneliti | Monitor performa, evaluasi kualitas RAG, kelola dokumen sumber |

## 4. Lingkup (scope)

### 4.1 Termasuk (in scope)
- Integrasi WhatsApp (terima & kirim pesan)
- Pipeline RAG: chunking dokumen, embedding, vector search, generation jawaban via LLM
- Logging seluruh percakapan ke database
- Dashboard web untuk monitoring metrik dan riwayat chat
- Manajemen dokumen sumber (upload, index ulang)

### 4.2 Tidak termasuk (out of scope)
- Multi-bahasa (fase awal: Bahasa Indonesia saja)
- Voice message / gambar sebagai input
- Multi-tenant (banyak organisasi dalam satu sistem)
- Autentikasi user WA (semua nomor bisa akses)

## 5. Functional requirements

| ID | Requirement | Prioritas |
|---|---|---|
| FR-1 | Sistem menerima pesan teks dari WhatsApp | Must |
| FR-2 | Sistem melakukan retrieval dokumen relevan berdasarkan pertanyaan | Must |
| FR-3 | Sistem menghasilkan jawaban menggunakan LLM berdasarkan dokumen yang diretrieve | Must |
| FR-4 | Sistem mengirim balasan kembali ke nomor WA pengirim | Must |
| FR-5 | Sistem mencatat setiap percakapan (pertanyaan, jawaban, dokumen sumber, waktu respons) | Must |
| FR-6 | Dashboard menampilkan ringkasan metrik (volume chat, rata-rata waktu respons) | Must |
| FR-7 | Dashboard menampilkan riwayat percakapan dengan filter tanggal/status | Must |
| FR-8 | Dashboard menampilkan skor similarity retrieval per percakapan | Should |
| FR-9 | Admin dapat upload dokumen baru dan memicu re-index | Should |
| FR-10 | Dashboard menampilkan status kesehatan tiap service (gateway, backend, vector DB, LLM) | Could |
| FR-11 | User dapat memberi feedback (like/dislike) atas jawaban | Could |

## 6. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-1 | Waktu respons chatbot < 10 detik untuk 90% request |
| NFR-2 | Dashboard dapat diakses hanya oleh admin (autentikasi login) |
| NFR-3 | Data percakapan disimpan minimal 3 bulan untuk kebutuhan evaluasi |
| NFR-4 | Sistem dapat menangani minimal 20 request bersamaan tanpa gagal |
| NFR-5 | Nomor WA user di dashboard ditampilkan sebagian tersamar untuk privasi |

## 7. Arsitektur singkat

```
WhatsApp → WA Gateway (Node.js/Baileys) → Backend RAG (Python/FastAPI)
                                              ├── Vector DB (retrieval)
                                              ├── LLM (generation)
                                              └── PostgreSQL (log)
                                                       ↓
                                          Dashboard (React) via REST API
```

## 8. Tech stack

- WA Gateway: Node.js + Baileys
- Backend/RAG: Python, FastAPI, LangChain/LlamaIndex
- Vector DB: ChromaDB / FAISS
- LLM: OpenAI / Claude / Ollama (lokal)
- Database log: PostgreSQL
- Dashboard: React/Next.js + Tailwind + Recharts

## 9. Metrik keberhasilan (success metrics)

- Akurasi jawaban (evaluasi manual/human judgment) minimal 80% relevan
- Rata-rata waktu respons di bawah target NFR-1
- Retrieval similarity score rata-rata di atas ambang batas yang ditentukan (misal 0.7)
- Dashboard berhasil merepresentasikan seluruh metrik yang dibutuhkan untuk bab evaluasi skripsi

## 10. Risiko & batasan

| Risiko | Mitigasi |
|---|---|
| Baileys (WA unofficial) rawan diblokir/putus koneksi | Siapkan mekanisme reconnect otomatis, dokumentasikan sebagai keterbatasan penelitian |
| Kualitas jawaban tergantung kelengkapan dokumen sumber | Kurasi dokumen sumber sebelum indexing |
| Biaya API LLM jika pakai model berbayar | Sediakan opsi model open-source lokal (Ollama) sebagai alternatif |

## 11. Roadmap implementasi

1. Setup WA Gateway + koneksi dasar ke backend
2. Bangun pipeline RAG (chunking, embedding, retrieval, generation)
3. Integrasi end-to-end WA ↔ backend ↔ RAG
4. Bangun logging ke database
5. Bangun dashboard (overview + chat logs)
6. Tambah fitur kualitas RAG & system health di dashboard
7. Evaluasi & pengujian untuk bab hasil skripsi
