"""Pre-built survey templates covering common insurance research scenarios."""

DEMO_SURVEYS = [
    {
        "name": "Pricing sensitivity",
        "description": (
            "Tests how customers react to price points and value perception. "
            "Use for premium hikes, discount offers, and value-back programs."
        ),
        "questions": [
            {
                "id": "fair_price",
                "type": "likert",
                "prompt": "Does the price feel fair given what you receive? (1 = expensive, 5 = great deal)",
                "scale_min": 1,
                "scale_max": 5,
            },
            {
                "id": "max_price",
                "type": "open_text",
                "prompt": "What is the absolute maximum you'd pay for this offer monthly?",
            },
            {
                "id": "alternative_action",
                "type": "multi_choice",
                "prompt": "If the price increased by 15%, what would you do?",
                "options": ["accept it", "shop around", "switch carriers", "drop coverage"],
            },
            {
                "id": "value_perception",
                "type": "open_text",
                "prompt": "What makes this feel worth (or not worth) the cost to you specifically?",
            },
        ],
    },
    {
        "name": "Brand trust & switching",
        "description": (
            "Measures loyalty, switching intent, and trust signals. Use before "
            "major brand or policy changes, and for retention scenarios."
        ),
        "questions": [
            {
                "id": "trust_level",
                "type": "likert",
                "prompt": "How much do you trust this insurer to deliver on this offer? (1 = none, 5 = complete)",
                "scale_min": 1,
                "scale_max": 5,
            },
            {
                "id": "switching_likelihood",
                "type": "likert",
                "prompt": "How likely are you to switch carriers because of this? (1 = stay, 5 = switching tomorrow)",
                "scale_min": 1,
                "scale_max": 5,
            },
            {
                "id": "trust_blocker",
                "type": "open_text",
                "prompt": "What single thing would have to change for you to trust this more?",
            },
            {
                "id": "deal_breaker",
                "type": "yes_no",
                "prompt": "Is anything about this offer an outright deal-breaker for you?",
            },
        ],
    },
    {
        "name": "Concept test (new product)",
        "description": (
            "Pre-launch concept validation for new riders, add-ons, and product lines. "
            "Surfaces unmet needs and naming/messaging clarity."
        ),
        "questions": [
            {
                "id": "understanding",
                "type": "likert",
                "prompt": "How clearly did you understand what this offer actually does? (1 = confused, 5 = crystal clear)",
                "scale_min": 1,
                "scale_max": 5,
            },
            {
                "id": "relevance",
                "type": "multi_choice",
                "prompt": "How relevant is this to your life right now?",
                "options": ["highly relevant", "somewhat relevant", "not relevant", "wrong fit"],
            },
            {
                "id": "missing_feature",
                "type": "open_text",
                "prompt": "What one thing is missing that would make this a must-have for you?",
            },
            {
                "id": "purchase_intent",
                "type": "likert",
                "prompt": "If launched tomorrow at the price shown, how likely would you be to buy? (1-5)",
                "scale_min": 1,
                "scale_max": 5,
            },
            {
                "id": "share_with_others",
                "type": "yes_no",
                "prompt": "Would you mention this to friends or family in your situation?",
            },
        ],
    },
    {
        "name": "Messaging & comms test",
        "description": (
            "How well does the wording, framing, and tone land? Use to test "
            "announcement emails, renewal notices, and disclosures."
        ),
        "questions": [
            {
                "id": "tone_fit",
                "type": "multi_choice",
                "prompt": "How does the tone of this offer come across to you?",
                "options": ["respectful", "salesy", "confusing", "patronizing", "transparent"],
            },
            {
                "id": "clarity",
                "type": "likert",
                "prompt": "How easy was it to figure out what you're being asked to do? (1 = hard, 5 = easy)",
                "scale_min": 1,
                "scale_max": 5,
            },
            {
                "id": "missing_info",
                "type": "open_text",
                "prompt": "What information are you missing before you'd make a decision?",
            },
            {
                "id": "emotional_response",
                "type": "open_text",
                "prompt": "What was your gut reaction when you first read this? (one sentence)",
            },
        ],
    },
    {
        "name": "Quick pulse (3-question)",
        "description": (
            "Minimal survey for fast iteration cycles. Covers intent, sentiment, and "
            "blocker in 3 questions. Use when running many variants quickly."
        ),
        "questions": [
            {
                "id": "intent",
                "type": "likert",
                "prompt": "How likely are you to take this offer? (1 = no way, 5 = signing up now)",
                "scale_min": 1,
                "scale_max": 5,
            },
            {
                "id": "feeling",
                "type": "multi_choice",
                "prompt": "How do you feel about it overall?",
                "options": ["love it", "like it", "neutral", "dislike it", "hate it"],
            },
            {
                "id": "blocker",
                "type": "open_text",
                "prompt": "What's the one thing stopping you (if anything)?",
            },
        ],
    },
]
