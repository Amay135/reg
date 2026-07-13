"""
Seed script: creates admin user and sample data for demo purposes.
Run: python seed.py
"""
import asyncio
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.config import settings
from app.database import Base, async_session, engine
from app.middleware.auth import hash_password
from app.models.chat import ChatLog, ErrorLog, KnowledgeDoc
from app.models.user import User

SAMPLE_QUESTIONS = [
    {
        "q": "Apa syarat pendaftaran mahasiswa baru?",
        "a": "Syarat pendaftaran mahasiswa baru meliputi: (1) Ijazah SMA/sederajat, (2) Kartu Keluarga, (3) KTP orang tua, (4) Pas foto 3x4, (5) Bukti pembayaran pendaftaran.",
        "docs": [
            {"doc_id": "doc-001", "content": "Pedoman Akademik 2025/2026 - Bab Pendaftaran...", "similarity_score": 0.87},
            {"doc_id": "doc-002", "content": "Kalender Akademik - Jadwal Pendaftaran...", "similarity_score": 0.92},
        ],
    },
    {
        "q": "Kapan jadwal ujian akhir semester ganjil?",
        "a": "Ujian akhir semester ganjil akan dilaksanakan pada tanggal 15-26 Januari 2026 sesuai kalender akademik.",
        "docs": [
            {"doc_id": "doc-002", "content": "Kalender Akademik - Jadwal UAS...", "similarity_score": 0.94},
        ],
    },
    {
        "q": "Bagaimana cara mengajukan cuti akademik?",
        "a": "Cuti akademik dapat diajukan melalui portal mahasiswa dengan mengisi formulir cuti dan melampirkan surat keterangan yang relevan.",
        "docs": [
            {"doc_id": "doc-001", "content": "Pedoman Akademik 2025/2026 - Bab Cuti...", "similarity_score": 0.32},
        ],
    },
    {
        "q": "Berapa biaya SPP untuk program sarjana?",
        "a": "Biaya SPP program sarjana bervariasi antara Rp 2.500.000 - Rp 5.000.000 per semester tergantung program studi.",
        "docs": [
            {"doc_id": "doc-003", "content": "Peraturan Akademik - Biaya Pendidikan...", "similarity_score": 0.78},
        ],
    },
    {
        "q": "Apa saja dokumen yang diperlukan untuk beasiswa?",
        "a": "Dokumen yang diperlukan untuk pengajuan beasiswa: transkrip nilai, surat keterangan tidak mampu, KTM, dan esai motivasi.",
        "docs": [
            {"doc_id": "doc-004", "content": "Panduan Beasiswa - Persyaratan...", "similarity_score": 0.85},
        ],
    },
    {
        "q": "Dimana lokasi kampus utama?",
        "a": "Kampus utama berlokasi di Jl. Pendidikan No. 123, Kota, dengan akses transportasi umum yang memadai.",
        "docs": [
            {"doc_id": "doc-005", "content": "FAQ Kemahasiswaan - Lokasi Kampus...", "similarity_score": 0.91},
        ],
    },
    {
        "q": "Apakah boleh menggunakan sandal ke kampus?",
        "a": "Berdasarkan peraturan akademik, mahasiswa diharapkan berpakaian rapi dan sopan. Penggunaan sandal tidak dianjurkan di area akademik.",
        "docs": [
            {"doc_id": "doc-003", "content": "Peraturan Akademik - Etika Berpakaian...", "similarity_score": 0.32},
        ],
    },
    {
        "q": "Bagaimana prosedur penggantian KTM yang hilang?",
        "a": "Untuk mengganti KTM yang hilang, silakan mengajukan surat kehilangan dari kepolisian dan mengisi formulir di bagian akademik.",
        "docs": [
            {"doc_id": "doc-005", "content": "FAQ Kemahasiswaan - KTM...", "similarity_score": 0.76},
        ],
    },
    {
        "q": "Apakah ada program pertukaran pelajar?",
        "a": "Ya, tersedia program pertukaran pelajar ke beberapa universitas mitra di Asia Tenggara dan Eropa.",
        "docs": [
            {"doc_id": "doc-001", "content": "Pedoman Akademik 2025/2026 - Bab Pertukaran Pelajar...", "similarity_score": 0.83},
        ],
    },
    {
        "q": "Kapan batas akhir pembayaran UKT?",
        "a": "Batas akhir pembayaran UKT adalah tanggal 10 setiap bulannya. Keterlambatan dikenakan denda 2%.",
        "docs": [
            {"doc_id": "doc-003", "content": "Peraturan Akademik - Pembayaran UKT...", "similarity_score": 0.88},
        ],
    },
    {
        "q": "Di mana tempat fotokopi terdekat?",
        "a": "Maaf, saya tidak dapat menemukan informasi mengenai tempat fotokopi di sekitar kampus dalam dokumen yang tersedia.",
        "docs": [],
    },
    {
        "q": "Bagaimana cara mengakses e-learning?",
        "a": "E-learning dapat diakses melalui https://elearning.kampus.ac.id menggunakan NIM dan password SSO.",
        "docs": [
            {"doc_id": "doc-005", "content": "FAQ Kemahasiswaan - E-Learning...", "similarity_score": 0.95},
        ],
    },
    {
        "q": "Ada info magang terbaru?",
        "a": "Maaf, informasi magang terbaru belum tersedia dalam basis dokumen saat ini. Silakan hubungi bagian kemahasiswaan.",
        "docs": [],
    },
    {
        "q": "Kantin tutup jam berapa?",
        "a": "Maaf, informasi mengenai jam operasional kantin tidak tersedia dalam dokumen yang saya miliki.",
        "docs": [
            {"doc_id": "doc-005", "content": "FAQ Kemahasiswaan - Fasilitas...", "similarity_score": 0.35},
        ],
    },
    {
        "q": "Besok libur tidak?",
        "a": "Maaf, saya tidak memiliki informasi mengenai jadwal libur. Silakan cek kalender akademik terbaru.",
        "docs": [
            {"doc_id": "doc-002", "content": "Kalender Akademik - Hari Libur...", "similarity_score": 0.19},
        ],
    },
]

SAMPLE_ERRORS = [
    {"service": "WA Gateway", "message": "Connection timeout after 30s — reconnecting"},
    {"service": "LLM API", "message": "Rate limit exceeded — retry in 5s"},
    {"service": "Vector DB", "message": "Slow query detected (>500ms) on similarity search"},
    {"service": "WA Gateway", "message": "QR code expired — waiting for new scan"},
]

SAMPLE_DOCS = [
    {"filename": "pedoman-akademik-2025.pdf", "size_bytes": 2_400_000, "chunks": 156},
    {"filename": "kalender-akademik-2025-2026.pdf", "size_bytes": 850_000, "chunks": 42},
    {"filename": "peraturan-akademik.pdf", "size_bytes": 3_200_000, "chunks": 210},
    {"filename": "panduan-beasiswa.pdf", "size_bytes": 1_100_000, "chunks": 68},
    {"filename": "faq-kemahasiswaan.pdf", "size_bytes": 620_000, "chunks": 35},
    {"filename": "skripsi-template.docx", "size_bytes": 180_000, "chunks": 12},
]

SENDERS = [
    "6281212345678",
    "6281212345679",
    "6281212345680",
    "6281212345681",
    "6281212345682",
    "6281212345683",
    "6281212345684",
    "6281212345685",
    "6281212345686",
    "6281212345687",
    "6281212345688",
    "6281212345689",
    "6281212345690",
    "6281212345691",
    "6281212345692",
    "6281212345693",
    "6281212345694",
    "6281212345695",
    "6281212345696",
    "6281212345697",
    "6281212345698",
    "6281212345699",
    "6281212345700",
    "6281212345701",
    "6281212345702",
    "6281212345703",
    "6281212345704",
    "6281212345705",
    "6281212345706",
    "6281212345707",
    "6281212345708",
    "6281212345709",
    "6281212345710",
    "6281212345711",
    "6281212345712",
    "6281212345713",
    "6281212345714",
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # Check if already seeded
        existing = await db.scalar(select(User).limit(1))
        if existing:
            print("Database already seeded. Skipping.")
            return

        # Create admin user
        admin = User(
            id=uuid.uuid4(),
            email=settings.admin_email,
            password_hash=hash_password(settings.admin_password),
        )
        db.add(admin)
        print(f"Admin user created: {settings.admin_email}")

        # Create chat logs spanning multiple days
        now = datetime.now(timezone.utc)
        feedbacks = [None, None, "like", None, "dislike", None, None, "like"]

        def _get_status(docs: list[dict]) -> str:
            if not docs:
                return "low_confidence"
            score = docs[0]["similarity_score"]
            if score >= 0.6:
                return "success"
            elif score >= 0.3:
                return "low_confidence"
            return "failed"

        for i in range(80):
            # Spread over last 3 days
            days_ago = i % 3
            hour = (i * 3) % 24
            minute = (i * 7) % 60
            second = (i * 13) % 60

            ts = now - timedelta(days=days_ago)
            ts = ts.replace(hour=hour, minute=minute, second=second, microsecond=0)

            sample = SAMPLE_QUESTIONS[i % len(SAMPLE_QUESTIONS)]
            sender = SENDERS[i % len(SENDERS)]

            log = ChatLog(
                id=uuid.uuid4(),
                sender=sender,
                question=sample["q"],
                answer=sample["a"],
                retrieved_docs=sample["docs"],
                response_time_ms=2500 + (i * 137 % 4000),
                status=_get_status(sample["docs"]),
                feedback=feedbacks[i % len(feedbacks)],
                created_at=ts,
            )
            db.add(log)

        print(f"80 sample chat logs created")

        # Create error logs
        for i, err in enumerate(SAMPLE_ERRORS):
            error_log = ErrorLog(
                id=uuid.uuid4(),
                service=err["service"],
                message=err["message"],
                created_at=now - timedelta(hours=i * 3, minutes=i * 15),
            )
            db.add(error_log)

        print(f"{len(SAMPLE_ERRORS)} error logs created")

        # Create knowledge docs
        for i, doc in enumerate(SAMPLE_DOCS):
            kd = KnowledgeDoc(
                id=uuid.uuid4(),
                filename=doc["filename"],
                file_path=f"./uploads/{doc['filename']}",
                size_bytes=doc["size_bytes"],
                chunks=doc["chunks"],
                indexed_at=now - timedelta(days=3 - i),
            )
            db.add(kd)

        print(f"{len(SAMPLE_DOCS)} knowledge documents created")

        await db.commit()
        print("\nSeeding complete!")
        print(f"   Login: {settings.admin_email} / {settings.admin_password}")


if __name__ == "__main__":
    asyncio.run(seed())
