"""Pre-built insurance product scenarios for the gallery.

Each scenario has a name, category, scenario_type (which the simulation engine
uses to pick prompt framing), a customer-facing description, and a config
object holding the specific change being tested (price deltas, rider details,
etc.). These are the one-click demos on the landing page.
"""

SCENARIOS = [
    {
        "name": "Auto premium hike — high-claim ZIPs",
        "category": "Auto",
        "scenario_type": "premium_hike",
        "description": (
            "12% increase on auto policy premiums for policyholders in the top "
            "decile of ZIP-code claim frequency. Notification sent 60 days before renewal."
        ),
        "config": {
            "policy_line": "auto",
            "price_change_pct": 12.0,
            "targeting": "top_decile_claim_zips",
            "notice_days": 60,
            "messaging_tone": "transparent_data_driven",
        },
        "is_template": True,
    },
    {
        "name": "Natural-disaster life rider",
        "category": "Life",
        "scenario_type": "new_rider",
        "description": (
            "Optional rider that doubles term-life payout if death occurs during a "
            "federally-declared natural disaster. $8/mo extra. Eligibility: all active "
            "term-life holders."
        ),
        "config": {
            "rider_name": "Disaster Double Payout",
            "rider_cost_monthly": 8.0,
            "payout_multiplier": 2.0,
            "trigger": "federally_declared_disaster",
            "eligible_lines": ["term_life"],
        },
        "is_template": True,
    },
    {
        "name": "Active-app value-back",
        "category": "Retention",
        "scenario_type": "value_back",
        "description": (
            "Customers who open the policy app at least once every 3 days for a "
            "calendar month receive 5% off the following month's premium."
        ),
        "config": {
            "reward_pct": 5.0,
            "activity_requirement": "open_app_every_3_days",
            "evaluation_period_days": 30,
            "applies_to_lines": ["auto", "home", "renters"],
        },
        "is_template": True,
    },
    {
        "name": "Telematics opt-in discount",
        "category": "Auto",
        "scenario_type": "telematics",
        "description": (
            "15% discount on auto premiums for opting into continuous trip-data "
            "sharing via a mobile app or OBD-II dongle. Discount applies after 90 days."
        ),
        "config": {
            "discount_pct": 15.0,
            "data_collected": ["speed", "braking_events", "mileage", "time_of_day"],
            "minimum_period_days": 90,
            "data_retention_days": 365,
        },
        "is_template": True,
    },
    {
        "name": "Home + Auto bundle",
        "category": "Cross-sell",
        "scenario_type": "bundling",
        "description": (
            "10% combined discount when a customer holds both home and auto policies. "
            "Auto-applied at renewal; existing customers can add the second line "
            "with a single-step form."
        ),
        "config": {
            "bundle_lines": ["home", "auto"],
            "combined_discount_pct": 10.0,
            "auto_apply_at_renewal": True,
            "min_eligibility": "active_for_6_months",
        },
        "is_template": True,
    },
    {
        "name": "Self-service mobile claims",
        "category": "Experience",
        "scenario_type": "claims_ux",
        "description": (
            "Replace phone-based claim filing with a mobile-first flow: photo upload, "
            "guided damage description, AI triage, status push notifications. Live agent "
            "available as fallback."
        ),
        "config": {
            "channels_added": ["mobile_app", "web"],
            "ai_triage": True,
            "fallback_channel": "live_agent",
            "estimated_completion_time_min": 8,
        },
        "is_template": True,
    },
    {
        "name": "Pay-per-mile auto pilot",
        "category": "Auto",
        "scenario_type": "new_rider",
        "description": (
            "Optional billing model: $30 base + $0.04/mile, capped at $200/mo. "
            "Pilot offered to low-mileage drivers (<7500 mi/yr) at renewal."
        ),
        "config": {
            "base_monthly": 30.0,
            "per_mile_rate": 0.04,
            "monthly_cap": 200.0,
            "eligibility_mileage_max": 7500,
        },
        "is_template": True,
    },
    {
        "name": "Pet wellness add-on",
        "category": "Pet",
        "scenario_type": "new_rider",
        "description": (
            "$12/mo add-on covering routine vet visits, vaccinations, and dental "
            "cleanings (up to $400/yr). Pitched to existing home/renters policy holders."
        ),
        "config": {
            "monthly_cost": 12.0,
            "annual_benefit_cap": 400.0,
            "covered_services": ["wellness_exams", "vaccinations", "dental"],
            "target_segment": "home_or_renters_policy_holders",
        },
        "is_template": True,
    },
    {
        "name": "Climate-risk premium adjust",
        "category": "Home",
        "scenario_type": "premium_hike",
        "description": (
            "Variable premium tied to climate-risk score (0-100). Homes in 80+ scores "
            "see up to 22% increase phased over 2 years; below 30 see 4% decrease."
        ),
        "config": {
            "score_basis": "climate_risk_score",
            "high_risk_max_increase_pct": 22.0,
            "low_risk_decrease_pct": 4.0,
            "phase_in_years": 2,
        },
        "is_template": True,
    },
    {
        "name": "Loyalty renewal discount",
        "category": "Retention",
        "scenario_type": "discount_offer",
        "description": (
            "Tenure-based discount: 3% off after 3 years continuous, 5% off after 5, "
            "stacked with existing bundling/safe-driver discounts."
        ),
        "config": {
            "tiers": [
                {"years_min": 3, "discount_pct": 3.0},
                {"years_min": 5, "discount_pct": 5.0},
            ],
            "stackable": True,
        },
        "is_template": True,
    },
]
