import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { VentureMcpClient } from "./mcp_client.js";
import { AGENT_PERSONAS, buildAgentInstruction } from "./agents.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables relative to script directory to ensure key is found
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Initialize Gemini API
const geminiKey = process.env.GEMINI_API_KEY;
if (!geminiKey) {
  console.warn("⚠️ WARNING: GEMINI_API_KEY environment variable is not set. Running in MOCK AI Mode.");
}
const genAI = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;

// Initialize custom MCP Client
const mcpClient = new VentureMcpClient();
let mcpConnected = false;

try {
  await mcpClient.connect();
  mcpConnected = true;
} catch (error) {
  console.error("Failed to connect to custom MCP server:", error);
}

// Session state (supporting one active session for demo purposes)
let sessionState = {
  companyName: "",
  description: "",
  canvas: {
    "Problem": { text: "Undefined", status: "warning", flagReason: "No detail entered yet." },
    "Solution": { text: "Undefined", status: "warning", flagReason: "No detail entered yet." },
    "Value Proposition": { text: "Undefined", status: "warning", flagReason: "No detail entered yet." },
    "Moat/Advantage": { text: "Undefined", status: "warning", flagReason: "No detail entered yet." },
    "Customer Segments": { text: "Undefined", status: "warning", flagReason: "No detail entered yet." },
    "Channels": { text: "Undefined", status: "warning", flagReason: "No detail entered yet." },
    "Cost Structure": { text: "Undefined", status: "warning", flagReason: "No detail entered yet." },
    "Revenue Streams": { text: "Undefined", status: "warning", flagReason: "No detail entered yet." },
    "Key Metrics": { text: "Undefined", status: "warning", flagReason: "No detail entered yet." }
  },
  chatHistory: [],
  competitors: null,
  financials: null,
  viabilityScore: 50
};

// Reset canvas back to defaults
function resetSession(name, desc) {
  sessionState = {
    companyName: name,
    description: desc,
    canvas: {
      "Problem": { text: `User wants to address: ${desc.substring(0, 100)}...`, status: "ok", flagReason: "" },
      "Solution": { text: "Pending definition...", status: "warning", flagReason: "Unrefined" },
      "Value Proposition": { text: "Pending definition...", status: "warning", flagReason: "Unrefined" },
      "Moat/Advantage": { text: "Pending definition...", status: "warning", flagReason: "No competitive moat defined." },
      "Customer Segments": { text: "General market", status: "warning", flagReason: "Identify narrow target niche." },
      "Channels": { text: "Digital marketing / Word of mouth", status: "ok", flagReason: "" },
      "Cost Structure": { text: "Operating expenses, developer salaries", status: "ok", flagReason: "" },
      "Revenue Streams": { text: "SaaS Subscription / Direct Sale", status: "ok", flagReason: "" },
      "Key Metrics": { text: "Active Users, Revenue Growth", status: "ok", flagReason: "" }
    },
    chatHistory: [
      {
        sender: "system",
        avatar: "🔔",
        name: "Boardroom Coordinator",
        message: `Welcome to the Boardroom. We have analyzed your initial startup idea: "${name}". Let's start the evaluation.`,
        timestamp: new Date().toLocaleTimeString()
      }
    ],
    competitors: null,
    financials: null,
    viabilityScore: 50
  };
}

// Fallback mock responses when API key is missing
function generateMockResponse(agentId, prompt) {
  const persona = AGENT_PERSONAS[agentId.toUpperCase()];
  const fallbackMessages = {
    moonshot_vc: "This is a neat feature, but where is the billion-dollar scale? I need a proprietary data flywheel. (Please set your GEMINI_API_KEY to enable full live simulation)",
    bootstrapper: "Do not waste time building a heavy product. Launch a landing page today. Spend zero on advertising. (Please set your GEMINI_API_KEY to enable full live simulation)",
    financial_auditor: "If your average contract value is $20/mo and your customer acquisition cost is $150, you are bleeding money. Let's inspect the math. (Please set your GEMINI_API_KEY to enable full live simulation)",
    customer_advocate: "Have you interviewed 10 real customers? Don't build what you think they want—build what they are complaining about. (Please set your GEMINI_API_KEY to enable full live simulation)"
  };

  return {
    message: fallbackMessages[agentId] || "Interesting idea, let's look closer.",
    canvasUpdates: [
      {
        block: agentId === "moonshot_vc" ? "Moat/Advantage" : agentId === "bootstrapper" ? "Cost Structure" : agentId === "financial_auditor" ? "Revenue Streams" : "Problem",
        text: `Reviewing: ${sessionState.companyName} (${agentId})`,
        status: "warning",
        flagReason: "Gemini API Key missing - running in offline demo mode."
      }
    ],
    toolRequest: null
  };
}

// Robust helper to call Gemini with exponential backoff and model fallbacks
async function callGeminiWithRetryAndCleanup(prompt, retries = 3, delay = 1000) {
  const errors = [];
  const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash"];

  for (const modelName of modelsToTry) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: { responseMimeType: "application/json" }
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        // Clean markdown code blocks from the response text
        let cleanedText = text.trim();
        if (cleanedText.startsWith("```")) {
          cleanedText = cleanedText
            .replace(/^```json\s*/i, "")
            .replace(/```$/, "")
            .trim();
        }
        
        return JSON.parse(cleanedText);
      } catch (error) {
        const errorMsg = error.message || error.toString();
        
        // If it's a rate limit, quota exceeded, or resource exhausted error, wait and retry
        const isRateLimit = errorMsg.includes("429") || 
                            errorMsg.includes("Quota") || 
                            errorMsg.includes("limit") || 
                            errorMsg.toLowerCase().includes("exhausted") || 
                            errorMsg.includes("RESOURCE_EXHAUSTED");
                            
        if (isRateLimit) {
          console.warn(`[Gemini Rate Limit] Attempt ${attempt + 1} failed for ${modelName}. Retrying in ${delay * (attempt + 1)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
          continue;
        }
        
        // Save the error for diagnostics
        errors.push(`${modelName}(Attempt ${attempt + 1}): ${errorMsg}`);
        
        // If it's a model error (e.g. model not found), switch model immediately
        if (errorMsg.includes("model") && (errorMsg.includes("not found") || errorMsg.includes("invalid"))) {
          console.warn(`[Model Fallback] Model ${modelName} not available. Trying fallback...`);
          break;
        }
        
        // General error wait and retry
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  throw new Error(errors.length > 0 ? errors.join(" | ") : "Unknown generative error");
}

// Call Gemini for a specific agent persona
async function runAgentTurn(agentId) {
  const persona = Object.values(AGENT_PERSONAS).find(p => p.id === agentId);
  const instruction = buildAgentInstruction(
    agentId,
    sessionState.canvas,
    sessionState.competitors,
    sessionState.financials
  );

  // Compile boardroom dialogue into simplified format
  const dialogueContext = sessionState.chatHistory
    .slice(-10) // Last 10 statements
    .map(c => `${c.name}: ${c.message}`)
    .join("\n");

  const prompt = `${instruction}\n\nRecent boardroom conversation:\n${dialogueContext}\n\n${persona.name}, what is your review? Response:`;

  let responseData;

  if (!genAI) {
    responseData = generateMockResponse(agentId, prompt);
  } else {
    try {
      responseData = await callGeminiWithRetryAndCleanup(prompt);
    } catch (error) {
      console.error(`Gemini call error for ${agentId}:`, error);
      const errMsg = error.message || error.toString();
      responseData = {
        message: `I encountered an API error while analyzing: "${errMsg}". Let's focus on refining the value proposition and economic margins.`,
        canvasUpdates: [],
        toolRequest: null
      };
    }
  }

  // Update conversation log
  sessionState.chatHistory.push({
    sender: agentId,
    avatar: persona.avatar,
    name: persona.name,
    color: persona.color,
    message: responseData.message,
    timestamp: new Date().toLocaleTimeString()
  });

  // Apply Lean Canvas updates
  if (responseData.canvasUpdates && Array.isArray(responseData.canvasUpdates)) {
    for (const update of responseData.canvasUpdates) {
      if (sessionState.canvas[update.block]) {
        sessionState.canvas[update.block] = {
          text: update.text,
          status: update.status || "ok",
          flagReason: update.flagReason || ""
        };
      }
    }
  }

  return responseData;
}

// API: Initialize a session
app.post("/api/initialize", async (req, res) => {
  const { companyName, description } = req.body;
  if (!companyName || !description) {
    return res.status(400).json({ error: "Missing companyName or description" });
  }

  resetSession(companyName, description);

  // Immediately run competitor search in background (if MCP connected)
  if (mcpConnected) {
    try {
      const searchResult = await mcpClient.searchCompetitors(companyName, description);
      sessionState.competitors = searchResult.competitors;
    } catch (err) {
      console.error("Initial competitor search failed:", err);
    }
  }

  // First round of speeches: Customer Advocate kicks off, followed by Moonshot VC
  await runAgentTurn("customer_advocate");
  await runAgentTurn("moonshot_vc");

  res.json(sessionState);
});

// API: User chat/input
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  // Append user message
  sessionState.chatHistory.push({
    sender: "user",
    avatar: "👤",
    name: "Founder (You)",
    color: "#3b82f6", // blue
    message: message,
    timestamp: new Date().toLocaleTimeString()
  });

  // Decide which agents speak next. Usually the Auditor and Bootstrapper.
  const turn1 = await runAgentTurn("financial_auditor");
  
  // If Auditor requests financial model calculation, simulate it
  if (turn1.toolRequest === "calculate_financial_model" && mcpConnected) {
    try {
      // Guess metrics from user prompt or default to reasonable numbers
      const financials = await mcpClient.calculateFinancials(29, 500, 120, 4500, 20000);
      sessionState.financials = financials.metrics;
      sessionState.viabilityScore = financials.metrics.viabilityScore;
    } catch (e) {
      console.error("Financial model tool trigger failed:", e);
    }
  }

  await runAgentTurn("bootstrapper");

  res.json(sessionState);
});

// API: Run Macro Stress Test
app.post("/api/stress-test", async (req, res) => {
  const { scenario, userResponse } = req.body;
  if (!scenario || !userResponse) {
    return res.status(400).json({ error: "Missing scenario or userResponse" });
  }

  // Log the event to chat history
  const scenarioTitles = {
    google_threat: "Google Threat",
    cac_double: "CAC Inflation Event",
    churn_spike: "Retention/Churn Crisis"
  };

  sessionState.chatHistory.push({
    sender: "system",
    avatar: "⚠️",
    name: "Stress Test Engine",
    color: "#ef4444",
    message: `STRESS TEST DETECTED: [${scenarioTitles[scenario]}]. Founder's response: "${userResponse}"`,
    timestamp: new Date().toLocaleTimeString()
  });

  if (mcpConnected) {
    try {
      const assessment = await mcpClient.simulateStressTest(scenario, userResponse);
      const impact = assessment.assessment;
      
      // Apply impact to Viability Score
      sessionState.viabilityScore = Math.max(10, Math.min(100, sessionState.viabilityScore + impact.viabilityImpact));
      
      // System output
      sessionState.chatHistory.push({
        sender: "system",
        avatar: "📊",
        name: "Evaluation Metrics",
        color: "#10b981",
        message: `Evaluation: ${impact.verdict}. Viability Impact: ${impact.viabilityImpact}%. Runway Impact: ${impact.runwayImpact}. feedback: ${impact.feedback}`,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (err) {
      console.error("Stress test tool trigger failed:", err);
    }
  }

  // Run all agents to debate the outcome
  await runAgentTurn("customer_advocate");
  await runAgentTurn("moonshot_vc");

  res.json(sessionState);
});

// API: Fetch current status
app.get("/api/state", (req, res) => {
  res.json(sessionState);
});

// Serve frontend static assets in production
const frontendDistPath = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(frontendDistPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendDistPath, "index.html"));
});

// Shutdown hooks
process.on("SIGINT", () => {
  mcpClient.disconnect();
  process.exit(0);
});

process.on("SIGTERM", () => {
  mcpClient.disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`VentureSandbox Backend listening on port ${PORT}`);
});
