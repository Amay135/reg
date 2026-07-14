"""Buat admin user — jalankan sekali setelah database tersedia."""
import asyncio
import uuid

from app.database import async_session
from app.middleware.auth import hash_password
from app.models.user import User


async def create_admin():
    async with async_session() as db:
        admin = User(
            id=uuid.uuid4(),
            email="admin@example.com",
            password_hash=hash_password("admin123"),
        )
        db.add(admin)
        await db.commit()
        print("✅ Admin created: admin@example.com / admin123")


if __name__ == "__main__":
    asyncio.run(create_admin())
