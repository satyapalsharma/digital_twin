"""SQLAlchemy models.

Importing `all_models` from `app.db.init_db` ensures every model class is
registered with the metadata before `create_all` runs.
"""

from app.models.persona import Persona  # noqa: F401
from app.models.audience import Audience  # noqa: F401
from app.models.product import Product  # noqa: F401
from app.models.survey import Survey  # noqa: F401
from app.models.simulation import Simulation, AgentResponse, Insight  # noqa: F401

all_models = (Persona, Audience, Product, Survey, Simulation, AgentResponse, Insight)
