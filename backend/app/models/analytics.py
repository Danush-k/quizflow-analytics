"""
Typed Pydantic response models for all analytics endpoints.
Having explicit response schemas:
  - auto-generates accurate OpenAPI/Swagger documentation
  - enforces type safety on serialization
  - makes the API self-describing for any consumer
"""
from pydantic import BaseModel, Field
from typing import List, Optional


class DailyActiveUsers(BaseModel):
    date: str = Field(..., description="Date in YYYY-MM-DD format (IST timezone)")
    active_users: int = Field(..., description="Unique users who started at least one session")


class WeeklyActiveUsers(BaseModel):
    week: str = Field(..., description="Week label e.g. 'Week 21'")
    active_users: int = Field(..., description="Unique users active in that calendar week")


class QuestionsServed(BaseModel):
    total_questions_served: int = Field(..., description="All-time total questions displayed to users")
    total_today: int = Field(..., description="Questions served since midnight UTC")
    average_per_session: int = Field(..., description="Mean questions served per quiz session")


class QuestionsAnswered(BaseModel):
    total_answered: int = Field(..., description="Total response documents submitted")
    correct: int = Field(..., description="Count of correct responses")
    incorrect: int = Field(..., description="Count of incorrect responses")
    accuracy: float = Field(..., description="Overall accuracy percentage (0–100)")


class AvgResponseTime(BaseModel):
    average_response_time_ms: int = Field(..., description="Mean time taken per question in milliseconds")
    median_response_time_ms: int = Field(..., description="Median response time in milliseconds")
    p95_response_time_ms: int = Field(..., description="95th percentile response time in milliseconds")


class CompletionRate(BaseModel):
    total_sessions: int = Field(..., description="Total quiz sessions ever started")
    completed_sessions: int = Field(..., description="Sessions that reached the final question")
    abandoned_sessions: int = Field(..., description="Sessions not completed (interrupted or dropped)")
    completion_rate_percent: float = Field(..., description="Percentage of sessions completed (0–100)")


class DropOffPoint(BaseModel):
    question_number: int = Field(..., description="Question index (1-based)")
    users_reached: int = Field(..., description="Users who reached this question")
    users_answered: int = Field(..., description="Users who answered this question")
    drop_off_percent: float = Field(..., description="Cumulative drop-off % at this question")


class PeakHour(BaseModel):
    hour: int = Field(..., description="Hour of day in IST (0–23)")
    activity: int = Field(..., description="Number of quiz sessions started in this hour")


class AvgQuestionsPerSession(BaseModel):
    average_questions: float = Field(..., description="Mean questions answered per session")
    min_questions: int = Field(..., description="Minimum questions answered in any session")
    max_questions: int = Field(..., description="Maximum questions answered in any session")


class SubjectServed(BaseModel):
    subject: str = Field(..., description="Subject name")
    count: int = Field(..., description="Total questions served from this subject")


class ChapterServed(BaseModel):
    chapter: str = Field(..., description="Chapter name")
    count: int = Field(..., description="Total questions served from this chapter")


class ExamServed(BaseModel):
    exam: str = Field(..., description="Exam name")
    count: int = Field(..., description="Total questions served from this exam")


class DifficultyServed(BaseModel):
    difficulty: str = Field(..., description="Difficulty level: easy / medium / hard")
    count: int = Field(..., description="Total questions served at this difficulty")


class SubjectAccuracy(BaseModel):
    subject: str = Field(..., description="Subject name")
    total: int = Field(..., description="Total questions answered in this subject")
    correct: int = Field(..., description="Correct answers in this subject")
    incorrect: int = Field(..., description="Incorrect answers in this subject")
    accuracy: float = Field(..., description="Accuracy percentage for this subject (0–100)")


class ChapterAccuracy(BaseModel):
    chapter: str = Field(..., description="Chapter name")
    total: int = Field(..., description="Total questions answered in this chapter")
    correct: int = Field(..., description="Correct answers in this chapter")
    incorrect: int = Field(..., description="Incorrect answers in this chapter")
    accuracy: float = Field(..., description="Accuracy percentage for this chapter (0–100)")


class AnalyticsOverview(BaseModel):
    """
    Aggregated dashboard summary — all key metrics in a single response.
    Designed for the analytics dashboard header cards.
    """
    total_users: int = Field(..., description="Total registered/active users")
    total_sessions: int = Field(..., description="Total quiz sessions ever started")
    completed_sessions: int = Field(..., description="Sessions that were fully completed")
    completion_rate_percent: float = Field(..., description="Overall session completion rate")
    total_questions_served: int = Field(..., description="All-time questions displayed")
    total_responses: int = Field(..., description="All-time answers submitted")
    overall_accuracy: float = Field(..., description="Overall correct answer rate across all sessions")
    avg_response_time_ms: int = Field(..., description="Mean per-question response time in ms")
    peak_hour: Optional[int] = Field(None, description="Most active hour of day (IST, 0–23)")
    top_subject: Optional[str] = Field(None, description="Subject with most quiz activity")
