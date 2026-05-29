"""Default survey questions used when a simulation is started without a survey_id.

Five standard questions that work for any insurance product test. The
SimEngine sends these to every agent and collects structured responses.
"""

DEFAULT_SURVEY_QUESTIONS = [
    {
        "id": "purchase_intent",
        "type": "likert",
        "prompt": "On a scale of 1-5, how likely are you to take up this offer?",
        "scale_min": 1,
        "scale_max": 5,
    },
    {
        "id": "sentiment",
        "type": "multi_choice",
        "prompt": "What is your overall sentiment about this offer?",
        "options": ["positive", "neutral", "negative"],
    },
    {
        "id": "top_concern",
        "type": "open_text",
        "prompt": "What is your single biggest concern about this offer?",
    },
    {
        "id": "top_positive",
        "type": "open_text",
        "prompt": "What do you like most about this offer (if anything)?",
    },
    {
        "id": "would_recommend",
        "type": "multi_choice",
        "prompt": "Would you recommend this offer to a similar customer?",
        "options": ["yes", "no", "maybe"],
    },
]
