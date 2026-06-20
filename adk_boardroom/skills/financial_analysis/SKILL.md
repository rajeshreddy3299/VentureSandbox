---
name: financial_analysis
description: Skill to calculate and evaluate startup unit economics, LTV to CAC ratios, payback periods, and cash runway.
---

# Financial Analysis Skill

This skill enables the agent to evaluate the financial feasibility of a startup business model.

## Capabilities
1. **LTV Calculation**: Monthly pricing divided by average monthly churn (default 5%).
2. **LTV:CAC Ratio**: Evaluates customer acquisition efficiency. A healthy business requires a ratio >= 3.
3. **Payback Period**: Months required to recoup Customer Acquisition Cost (CAC). Excellent models recoup CAC in <= 6 months.
4. **Runway Projection**: Starting capital divided by monthly deficit (burn rate).

## Usage
Invoke the `calculate_financial_model` tool with:
- `pricing` (number)
- `target_customers` (number)
- `cac` (number)
- `monthly_expenses` (number)
- `funding_raised` (number, optional)
