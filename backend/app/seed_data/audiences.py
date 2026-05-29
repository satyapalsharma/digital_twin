"""Pre-built demo audiences.

These resolve their persona_ids from whatever's currently in the DB so the
seed script remains idempotent across re-runs and persona growth.
"""

DEMO_AUDIENCES = [
    {
        "name": "Young Urban Drivers",
        "description": (
            "22-34 year-olds in major metros, medium-to-high risk tolerance. "
            "Typical first-time auto buyers and renters."
        ),
        "filter": {
            "age_min": 22,
            "age_max": 34,
            "risk_tolerances": ["medium", "high"],
            "regions": ["California", "Texas", "New York", "Washington", "Massachusetts"],
        },
    },
    {
        "name": "Retirees",
        "description": (
            "Age 65+ married or widowed customers. Sensitive to premium changes; "
            "high interest in legacy, life-rider, and health-related products."
        ),
        "filter": {
            "age_min": 65,
            "age_max": 90,
            "marital_statuses": ["married", "widowed"],
        },
    },
    {
        "name": "High-Income Conservatives",
        "description": (
            "$80K+ earners with low risk tolerance. Most receptive to value-back, "
            "wellness, and bundling offers — least receptive to premium hikes."
        ),
        "filter": {
            "income_min": 80000,
            "risk_tolerances": ["low"],
        },
    },
]
