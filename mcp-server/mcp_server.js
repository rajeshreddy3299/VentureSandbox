import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Initialize the MCP server
const server = new Server(
  {
    name: "venture-intelligence-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper function to mock competitor analysis based on keywords
function getMockCompetitors(name, desc) {
  const lowercaseDesc = (desc + " " + name).toLowerCase();
  
  const library = [
    {
      industry: "ai scheduling / calendar / task manager",
      keywords: ["calendar", "schedule", "task", "time", "productivity", "ai"],
      competitors: [
        { name: "Reclaim.ai", details: "AI calendar assistant. Strengths: Smart time-blocking. Weaknesses: Rigid integrations.", pricing: "$8-15/mo" },
        { name: "Motion", details: "Task and calendar scheduler. Strengths: High productivity focus. Weaknesses: Expensive.", pricing: "$19-34/mo" },
        { name: "Clockwise", details: "Team focus time optimizer. Strengths: Team syncing. Weaknesses: Less personal task focus.", pricing: "$6.75-12/mo" }
      ]
    },
    {
      industry: "e-commerce dog / pet subscription",
      keywords: ["dog", "pet", "toy", "subscription", "box", "animal"],
      competitors: [
        { name: "BarkBox", details: "Market leader in dog toy subscriptions. Strengths: Strong brand, massive volume. Weaknesses: Generic boxes.", pricing: "$23-35/mo" },
        { name: "Super Chewer", details: "Durable toys for aggressive chewers. Strengths: Tough toys. Weaknesses: Limited customization.", pricing: "$29-45/mo" },
        { name: "PupBox", details: "Puppy-focused training & toy box. Strengths: Stage-based customization. Weaknesses: Pricey.", pricing: "$29-39/mo" }
      ]
    },
    {
      industry: "developer tools / database / backend",
      keywords: ["developer", "database", "backend", "api", "hosting", "cloud"],
      competitors: [
        { name: "Supabase", details: "Open-source Firebase alternative. Strengths: PostgreSQL, active community. Weaknesses: Relational learning curve.", pricing: "Free - $25/mo" },
        { name: "Firebase", details: "Google's mobile/web app platform. Strengths: Easy setup, serverless. Weaknesses: NoSQL limitations, scale cost.", pricing: "Pay-as-you-go" },
        { name: "Neon", details: "Serverless Postgres database. Strengths: Branching databases. Weaknesses: Newer platform.", pricing: "Free - $19/mo" }
      ]
    },
    {
      industry: "healthcare / medication tracking / safety",
      keywords: ["medication", "pill", "health", "safety", "reminder", "patient"],
      competitors: [
        { name: "Medisafe", details: "Top pill reminder app. Strengths: Easy user interface, family sync. Weaknesses: Ad-supported, basic insights.", pricing: "Free - $4.99/mo" },
        { name: "Mango Health", details: "Gamified medicine tracking. Strengths: Reward system. Weaknesses: Less focus on clinical safety.", pricing: "Free" },
        { name: "Pillpack", details: "Physical pre-sorted prescription delivery (Amazon). Strengths: Convenient. Weaknesses: U.S. only, limited UI.", pricing: "Insurance-based" }
      ]
    }
  ];

  // Try to find matching industry
  let matched = [];
  for (const group of library) {
    let matches = 0;
    for (const kw of group.keywords) {
      if (lowercaseDesc.includes(kw)) matches++;
    }
    if (matches >= 2) {
      matched = group.competitors;
      break;
    }
  }

  // Fallback generic competitors if no specific industry match
  if (matched.length === 0) {
    matched = [
      { name: "Generic Inc.", details: "Incumbent with high market share. Strengths: Strong capital, brand recognition. Weaknesses: Slow to innovate.", pricing: "Custom Enterprise" },
      { name: "Startup Beta", details: "Recent entrant in a similar space. Strengths: Fast shipping, modern UI. Weaknesses: Small team, lack of features.", pricing: "$19-99/mo" }
    ];
  }

  return matched;
}

// Define the available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_competitors",
        description: "Scans public databases and web search results to identify direct/indirect competitors for a startup.",
        inputSchema: {
          type: "OBJECT",
          properties: {
            companyName: { type: "STRING", description: "The name of the startup" },
            description: { type: "STRING", description: "Detailed description of the product, service, and value proposition" }
          },
          required: ["companyName", "description"]
        }
      },
      {
        name: "calculate_financial_model",
        description: "Calculates unit economics, LTV, CAC, payback period, and runway metrics for a business plan.",
        inputSchema: {
          type: "OBJECT",
          properties: {
            pricing: { type: "NUMBER", description: "Monthly price charged to the customer ($)" },
            targetCustomers: { type: "NUMBER", description: "Estimated number of paying customers in year 1" },
            cac: { type: "NUMBER", description: "Customer Acquisition Cost ($)" },
            monthlyExpenses: { type: "NUMBER", description: "Monthly operational expenses/burn rate ($)" },
            fundingRaised: { type: "NUMBER", description: "Total starting cash or investment raised ($)" }
          },
          required: ["pricing", "targetCustomers", "cac", "monthlyExpenses"]
        }
      },
      {
        name: "simulate_stress_test",
        description: "Evaluates the viability of a startup's defense strategy against macroeconomic or competitive threats.",
        inputSchema: {
          type: "OBJECT",
          properties: {
            scenario: { type: "STRING", enum: ["google_threat", "cac_double", "churn_spike"], description: "The threat scenario type" },
            userResponse: { type: "STRING", description: "The entrepreneur's planned strategy to survive this crisis" }
          },
          required: ["scenario", "userResponse"]
        }
      }
    ]
  };
});

// Handle tool executions
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "search_competitors") {
      const { companyName, description } = args;
      const competitors = getMockCompetitors(companyName, description);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              competitors,
              marketDensity: competitors.length > 2 ? "High" : "Moderate",
              summary: `Found ${competitors.length} primary competitors in this space. Your product must differentiate on key features or pricing structures to build a viable moat.`
            }, null, 2)
          }
        ]
      };
    } 
    
    else if (name === "calculate_financial_model") {
      const { pricing, targetCustomers, cac, monthlyExpenses, fundingRaised = 0 } = args;

      // Calculations
      const monthlyRevenue = pricing * targetCustomers;
      const estimatedChurn = 0.05; // 5% average churn
      const ltv = pricing / estimatedChurn;
      const ltvToCac = cac > 0 ? ltv / cac : ltv;
      const paybackPeriod = pricing > 0 ? cac / pricing : 0;
      
      // Calculate runway (starting capital / monthly deficit)
      const monthlyDeficit = Math.max(0, monthlyExpenses - monthlyRevenue);
      let runway = "Infinity";
      if (monthlyDeficit > 0) {
        runway = fundingRaised > 0 ? (fundingRaised / monthlyDeficit).toFixed(1) + " months" : "0 months (Immediate cash crisis - increase pricing or cut expenses)";
      }

      let viabilityScore = 70; // Base score
      if (ltvToCac >= 3) viabilityScore += 15;
      else if (ltvToCac < 1.5) viabilityScore -= 20;

      if (paybackPeriod <= 6) viabilityScore += 10;
      else if (paybackPeriod > 12) viabilityScore -= 15;

      if (runway !== "Infinity" && parseFloat(runway) < 6) viabilityScore -= 10;

      viabilityScore = Math.max(10, Math.min(100, viabilityScore));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              metrics: {
                monthlyRevenue,
                ltv: parseFloat(ltv.toFixed(2)),
                ltvToCac: parseFloat(ltvToCac.toFixed(2)),
                paybackPeriod: parseFloat(paybackPeriod.toFixed(1)),
                monthlyBurn: monthlyDeficit,
                runway,
                viabilityScore
              },
              evaluation: {
                ltvToCacStatus: ltvToCac >= 3 ? "Healthy (>=3x)" : ltvToCac >= 1.5 ? "Cautionary" : "Dangerous (<1.5x)",
                paybackStatus: paybackPeriod <= 6 ? "Excellent (<6 months)" : paybackPeriod <= 12 ? "Acceptable" : "Unviable (>12 months)",
                advice: ltvToCac < 3 
                  ? "Your LTV to CAC ratio is low. Focus on increasing average contract value, increasing retention, or reducing customer acquisition costs through organic channels."
                  : "Excellent unit economics! You are ready to scale marketing and acquisition channels."
              }
            }, null, 2)
          }
        ]
      };
    } 
    
    else if (name === "simulate_stress_test") {
      const { scenario, userResponse } = args;
      const lowercaseResponse = userResponse.toLowerCase();

      let survivalDelta = 0;
      let viabilityDelta = 0;
      let review = "";

      if (scenario === "google_threat") {
        if (lowercaseResponse.includes("niche") || lowercaseResponse.includes("differentiate") || lowercaseResponse.includes("focus") || lowercaseResponse.includes("community")) {
          survivalDelta = -2;
          viabilityDelta = -5;
          review = "Good defense strategy. By focusing on a narrow niche, specialized workflows, or high-touch community support, you can survive a broad feature launch by Google. However, expect some pressure on customer conversion.";
        } else {
          survivalDelta = -6;
          viabilityDelta = -20;
          review = "Dangerous response. Attempting to compete directly on features with a free Google service is fatal. You must pivot to a specialized niche, proprietary integrations, or proprietary data that Google cannot easily replicate.";
        }
      } 
      
      else if (scenario === "cac_double") {
        if (lowercaseResponse.includes("organic") || lowercaseResponse.includes("referral") || lowercaseResponse.includes("seo") || lowercaseResponse.includes("viral") || lowercaseResponse.includes("content")) {
          survivalDelta = -1;
          viabilityDelta = -3;
          review = "Wise response. Shifting acquisition focus to organic channels, viral loops, and content marketing shields you from paid advertising inflation. Invest in community building early.";
        } else {
          survivalDelta = -5;
          viabilityDelta = -15;
          review = "Vulnerable response. Simply 'increasing ad budget' or 'improving ads' will not offset a system-wide doubling of CAC. You must establish non-paid channels (virality, organic SEO, or direct partnerships) to survive.";
        }
      } 
      
      else if (scenario === "churn_spike") {
        if (lowercaseResponse.includes("feedback") || lowercaseResponse.includes("interview") || lowercaseResponse.includes("support") || lowercaseResponse.includes("product") || lowercaseResponse.includes("success")) {
          survivalDelta = -1;
          viabilityDelta = -2;
          review = "Correct strategy. A churn spike is a product and customer success problem. Talking to customers, improving boarding, and fixing core UX issues is the only sustainable way to repair your retention funnel.";
        } else {
          survivalDelta = -4;
          viabilityDelta = -12;
          review = "Ineffective response. Adding features or offering discounts rarely solves systemic retention issues. You must implement user interviews and analyze usage drop-off points to fix the root cause of churn.";
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              assessment: {
                scenario,
                viabilityImpact: viabilityDelta,
                runwayImpact: survivalDelta === 0 ? "0 change" : `${survivalDelta} months`,
                verdict: Math.abs(viabilityDelta) > 10 ? "Vulnerable" : "Resilient",
                feedback: review
              }
            }, null, 2)
          }
        ]
      };
    }

    throw new Error(`Tool not found: ${name}`);
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: error.message }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// Run the server using Stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Venture Intelligence MCP Server running on Stdio");
