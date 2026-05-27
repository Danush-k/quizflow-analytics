from pydantic import BaseModel
from typing import Optional

class AnalyticsResponse(BaseModel):
    metric_type: str
    value: Optional[int] = None
    data: Optional[list] = None
    timestamp: str
