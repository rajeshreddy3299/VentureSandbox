import json
from google.adk.agents import Agent
from google.adk.apps import App
from google.adk.tools import ToolContext

# =====================================================================
# 🛠️ Define ADK Tools (Business Intelligence Engine)
# =====================================================================

async def search_competitors(tool_context: ToolContext, company_name: str, description: str) -> str:
    """
    Scans market databases to identify direct/indirect competitors for a startup.
    
    Args:
        company_name: The name of the startup.
        description: A description of the product or service.
    """
    lowercase_desc = (description + " " + company_name).toLowerCase() if hasattr("", "toLowerCase") else (description + " " + company_name).lower()
    
    # Generic matching logic
    competitors = []
    if "calendar" in lowercase_desc or "schedule" in lowercase_desc or "task" in lowercase_desc:
        competitors = [
            {"name": "Reclaim.ai", "details": "AI calendar time-blocking.", "pricing": "$8-15/mo"},
            {"name": "Motion", "details": "Task and calendar scheduler.", "pricing": "$19-34/mo"}
        ]
    elif "dog" in lowercase_desc or "pet" in lowercase_desc or "toy" in lowercase_desc:
        competitors = [
            {"name": "BarkBox", "details": "Market leader in dog toy subscriptions.", "pricing": "$23-35/mo"},
            {"name": "Super Chewer", "details": "Durable toys for aggressive chewers.", "pricing": "$29-45/mo"}
        ]
    elif "developer" in lowercase_desc or "database" in lowercase_desc or "backend" in lowercase_desc:
        competitors = [
            {"name": "Supabase", "details": "Open-source Firebase alternative.", "pricing": "Free - $25/mo"},
            {"name": "Firebase", "details": "Google backend serverless platform.", "pricing": "Pay-as-you-go"}
        ]
    else:
        competitors = [
            {"name": "Generic Inc.", "details": "Incumbent with high market share.", "pricing": "Custom Enterprise"},
            {"name": "Startup Beta", "details": "Recent entrant in a similar space.", "pricing": "$19-99/mo"}
        ]

    result = {
        "competitors": competitors,
        "marketDensity": "High" if len(competitors) > 1 else "Moderate",
        "verdict": "Identify unique differentiators to compete effectively."
    }
    return json.dumps(result, indent=2)


async def calculate_financial_model(
    tool_context: ToolContext,
    pricing: float,
    target_customers: int,
    cac: float,
    monthly_expenses: float,
    funding_raised: float = 0.0
) -> str:
    """
    Calculates unit economics, LTV, CAC, payback period, and runway metrics for a business plan.
    
    Args:
        pricing: Monthly price charged to the customer ($)
        target_customers: Estimated number of paying customers in year 1
        cac: Customer Acquisition Cost ($)
        monthly_expenses: Monthly operational expenses/burn rate ($)
        funding_raised: Total starting cash or investment raised ($)
    """
    monthly_revenue = pricing * target_customers
    estimated_churn = 0.05
    ltv = pricing / estimated_churn
    ltv_to_cac = ltv / cac if cac > 0 else ltv
    payback_period = cac / pricing if pricing > 0 else 0
    monthly_deficit = max(0.0, monthly_expenses - monthly_revenue)
    
    runway = "Infinity"
    if monthly_deficit > 0:
        runway = f"{funding_raised / monthly_deficit:.1f} months" if funding_raised > 0 else "0 months (Cash crisis)"

    viability_score = 70
    if ltv_to_cac >= 3: viability_score += 15
    elif ltv_to_cac < 1.5: viability_score -= 20
    
    if payback_period <= 6: viability_score += 10
    elif payback_period > 12: viability_score -= 15

    result = {
        "metrics": {
            "monthlyRevenue": monthly_revenue,
            "ltv": ltv,
            "ltvToCac": ltv_to_cac,
            "paybackPeriod": payback_period,
            "monthlyBurn": monthly_deficit,
            "runway": runway,
            "viabilityScore": min(100, max(10, viability_score))
        },
        "evaluation": {
            "status": "Healthy" if ltv_to_cac >= 3 else "Dangerous",
            "advice": "Optimize pricing or lower acquisition costs." if ltv_to_cac < 3 else "Economics are ready to scale."
        }
    }
    return json.dumps(result, indent=2)


async def simulate_stress_test(tool_context: ToolContext, scenario: str, user_response: str) -> str:
    """
    Evaluates the viability of a startup's defense strategy against macroeconomic or competitive threats.
    
    Args:
        scenario: The threat type ('google_threat', 'cac_double', 'churn_spike')
        user_response: How the entrepreneur plans to handle it.
    """
    response_lower = user_response.lower()
    viability_impact = 0
    feedback = ""

    if scenario == "google_threat":
        if "niche" in response_lower or "focus" in response_lower or "differentiate" in response_lower:
            viability_impact = -5
            feedback = "Solid defense. Niche focusing shields you from Google's broad feature launches."
        else:
            viability_impact = -20
            feedback = "Dangerous. Direct feature competition with a free Google service is fatal."
    elif scenario == "cac_double":
        if "organic" in response_lower or "referral" in response_lower or "seo" in response_lower:
            viability_impact = -3
            feedback = "Wise. Shifting focus to organic loops mitigates rising ad prices."
        else:
            viability_impact = -15
            feedback = "Vulnerable. Paid advertising budgets won't survive a doubled CAC."
    else:
        viability_impact = -10
        feedback = "Assess user onboarding and customer support quality to fix churn."

    result = {
        "scenario": scenario,
        "viabilityImpact": viability_impact,
        "feedback": feedback
    }
    return json.dumps(result, indent=2)

# =====================================================================
# 👥 Define specialized ADK Boardroom Agents
# =====================================================================

model_id = "gemini-2.5-flash"  # Standard model ID for Gemini API

astra_vc = Agent(
    name="Astra_Moonshot_VC",
    model=model_id,
    description="A demanding Venture Capitalist looking for $10B opportunities with deep moats.",
    instruction=(
        "You are Astra, a bold Venture Capitalist. "
        "Focus strictly on scale (TAM) and defensible moats. Reject average or boutique business models. "
        "Tell the entrepreneur why their idea is too small or easily copied, and demand they think 100x bigger."
    )
)

rex_bootstrapper = Agent(
    name="Rex_The_Bootstrapper",
    model=model_id,
    description="A cash-flow obsessed bootstrapper who hates venture capital and expensive MVPs.",
    instruction=(
        "You are Rex, a pragmatic bootstrapper. "
        "Focus on immediate profitability, low overhead, and organic marketing. "
        "Reject reliance on VC funding, tell the user to simplify their product, and demand they launch within 30 days."
    )
)

elena_auditor = Agent(
    name="Elena_Financial_Auditor",
    model=model_id,
    description="An analytical MBA graduate obsessed with unit economics and margins.",
    instruction=(
        "You are Elena, a sharp financial auditor. "
        "Focus on LTV, CAC, payback periods, and margins. "
        "Use the calculate_financial_model tool to analyze pricing or cost proposals. "
        "Point out unsustainable unit economics and demand math-based answers."
    ),
    tools=[calculate_financial_model]
)

maya_advocate = Agent(
    name="Maya_Customer_Advocate",
    model=model_id,
    description="A user-centered designer focused entirely on customer validation and pain points.",
    instruction=(
        "You are Maya, a product designer and customer advocate. "
        "Focus on whether the startup solves a real, validated problem or is just a nice-to-have toy. "
        "Use the search_competitors tool to find potential competitors and challenge the user to prove customer pain."
    ),
    tools=[search_competitors]
)

# =====================================================================
# 👑 Define the Coordinator Agent (Hierarchical Team)
# =====================================================================

boardroom_coordinator = Agent(
    name="Boardroom_Coordinator",
    model=model_id,
    description="The moderator of the boardroom debate who coordinates comments and guides the founder.",
    instruction=(
        "You are the Boardroom Coordinator. "
        "Introduce the boardroom panel to the founder and summarize the startup idea. "
        "Coordinate the debate by calling sub-agents to critique the pitch (e.g., 'Maya, audit their problem statement', "
        "'Astra, check their moat', 'Elena, inspect the financials'). "
        "Provide a summary of the panel's concerns and ask the founder to defend their model."
    ),
    sub_agents=[maya_advocate, astra_vc, elena_auditor, rex_bootstrapper],
    tools=[simulate_stress_test]
)

# =====================================================================
# 📦 Define the ADK App Container
# =====================================================================

app = App(
    name="adk_boardroom",
    root_agent=boardroom_coordinator
)
