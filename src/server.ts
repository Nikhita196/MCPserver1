import express, { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const server = new McpServer({
  name: "mcp-calculator-server",
  version: "1.0.0",
});

//  Add tool
server.tool(
  "add",
  "Add two numbers",
  {
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  },
  async ({ a, b }) => ({
    content: [
      {
        type: "text",
        text: `Result: ${a + b}`,
      },
    ],
  })
);

//  Subtract tool
server.tool(
  "subtract",
  "Subtract two numbers",
  {
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  },
  async ({ a, b }) => ({
    content: [
      {
        type: "text",
        text: `Result: ${a - b}`,
      },
    ],
  })
);

// Multiply tool
server.tool(
  "multiply",
  "Multiply two numbers",
  {
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
  },
  async ({ a, b }) => ({
    content: [
      {
        type: "text",
        text: `Result: ${a * b}`,
      },
    ],
  })
);

//  Divide tool
server.tool(
  "divide",
  "Divide two numbers",
  {
    a: z.number().describe("Numerator"),
    b: z.number().describe("Denominator"),
  },
  async ({ a, b }) => {
    if (b === 0) {
      return {
        content: [
          {
            type: "text",
            text: "Error: Division by zero is undefined.",
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text",
          text: `Result: ${a / b}`,
        },
      ],
    };
  }
);

// Modulo tool
server.tool(
  "modulo",
  "Find remainder of two numbers",
  {
    a: z.number().describe("Dividend"),
    b: z.number().describe("Divisor"),
  },
  async ({ a, b }) => ({
    content: [
      {
        type: "text",
        text: `Result: ${a % b}`,
      },
    ],
  })
);

// Power tool
server.tool(
  "power",
  "Raise a number to the power of another",
  {
    base: z.number().describe("Base number"),
    exponent: z.number().describe("Exponent"),
  },
  async ({ base, exponent }) => ({
    content: [
      {
        type: "text",
        text: `Result: ${Math.pow(base, exponent)}`,
      },
    ],
  })
);

// Setup Express server
const app = express();
app.use(express.json());

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined, // stateless
});

// Connect MCP server
const setupServer = async () => {
  await server.connect(transport);
};

// POST endpoint for MCP requests
app.post("/mcp", async (req: Request, res: Response) => {
  console.log("Received MCP request:", req.body);
  try {
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

// Disallow GET and DELETE for /mcp
app.get("/mcp", (req: Request, res: Response) => {
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    })
  );
});

app.delete("/mcp", (req: Request, res: Response) => {
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    })
  );
});

// Start the server
const PORT = process.env.PORT || 3000;
setupServer()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`MCP Calculator Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Server setup failed:", error);
    process.exit(1);
  });

