import { spawn } from "child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class VentureMcpClient {
  constructor() {
    this.client = null;
    this.process = null;
  }

  async connect() {
    console.log("Spawning custom MCP Server...");
    
    const serverPath = path.join(__dirname, "..", "mcp-server", "mcp_server.js");
    
    // Spawn the node process running our custom MCP server
    this.process = spawn("node", [serverPath], {
      env: { ...process.env }
    });

    // Capture standard error for debugging
    this.process.stderr.on("data", (data) => {
      console.log(`[MCP Server Log] ${data.toString().trim()}`);
    });

    this.process.on("error", (err) => {
      console.error("Failed to start MCP server subprocess:", err);
    });

    this.client = new Client(
      {
        name: "venture-sandbox-backend-client",
        version: "1.0.0"
      },
      {
        capabilities: {}
      }
    );

    const transport = new StdioClientTransport({
      input: this.process.stdout,
      output: this.process.stdin
    });

    await this.client.connect(transport);
    console.log("Connected to custom MCP Server via Stdio Transport!");
  }

  async searchCompetitors(companyName, description) {
    try {
      const response = await this.client.callTool({
        name: "search_competitors",
        arguments: { companyName, description }
      });
      return JSON.parse(response.content[0].text);
    } catch (error) {
      console.error("Error calling search_competitors tool:", error);
      return { error: error.message };
    }
  }

  async calculateFinancials(pricing, targetCustomers, cac, monthlyExpenses, fundingRaised) {
    try {
      const response = await this.client.callTool({
        name: "calculate_financial_model",
        arguments: { pricing, targetCustomers, cac, monthlyExpenses, fundingRaised }
      });
      return JSON.parse(response.content[0].text);
    } catch (error) {
      console.error("Error calling calculate_financial_model tool:", error);
      return { error: error.message };
    }
  }

  async simulateStressTest(scenario, userResponse) {
    try {
      const response = await this.client.callTool({
        name: "simulate_stress_test",
        arguments: { scenario, userResponse }
      });
      return JSON.parse(response.content[0].text);
    } catch (error) {
      console.error("Error calling simulate_stress_test tool:", error);
      return { error: error.message };
    }
  }

  disconnect() {
    if (this.process) {
      this.process.kill();
      console.log("MCP Server subprocess terminated.");
    }
  }
}
