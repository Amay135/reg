from pydantic import BaseModel


class OverviewStats(BaseModel):
    total_conversations_today: int
    total_conversations_yesterday: int
    unique_users_today: int
    avg_response_time_ms: float


class HourlyVolume(BaseModel):
    hour: str  # "08:00"
    count: int


class TopQuestion(BaseModel):
    question: str
    count: int
