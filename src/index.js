#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import llmfilesResources from './resources/llmfiles-resources.js';

// Access the environment variable
const PROJECT_PATH = process.env.ProjectPath;

// Use it in your code
if (!PROJECT_PATH) {
  console.warn('Warning: Could not determine project path. Reporting only global resources.');
}

let cachedResources = [];

// Scan resources at startup
async function scanResources() {
  try {
    console.debug(`Using project directory: ${PROJECT_PATH}`);
    
    const resources = await llmfilesResources.listResources(PROJECT_PATH);
    cachedResources = resources;
  } catch (error) {
    console.error('Failed to scan resources:', error);
  }
}

const server = new Server(
  {
    name: "llmdotfiles-mcp",
    version: "1.0.0",
    description: "MCP server for scanning dotfiles and LLM rules to enhance AI context awareness",
    usage: "This server provides access to dotfiles and configuration resources that help LLMs understand project context and guidelines."
  },
  {
    capabilities: {
      resources: {}
    }
  }
);

// Handle resource listing - return cached resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: cachedResources
  };
});

// Handle resource reading
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  try {
    // Handle file URI resources and special llmdotfiles URIs
    if (uri.startsWith('file:///') || uri.startsWith('llmfiles://')) {
      const content = await llmfilesResources.readResource(uri);
      
      return {
        contents: [content]
      };
    }
    
    throw new Error(`Unsupported resource URI: ${uri}`);
  } catch (error) {
    console.error(`Error handling resource request: ${error.message}`);
    throw new Error(`Failed to read resource: ${error.message}`);
  }
});

// Start the server
async function runServer() {
  const isTestMode = process.argv.includes('--test');
  
  // Scan resources first
  await scanResources();
  if (isTestMode) {
    const serverConfig = {
      name: "llmdotfiles-mcp",
      version: "1.0.0",
      description: "MCP server for scanning dotfiles and LLM rules to enhance AI context awareness"
    };
    
    console.log('\n===== LLMDotfiles MCP Server Test Mode =====');
    console.log(`Project directory: ${PROJECT_PATH}`);
    console.log('\nScanned resources:');
    if (cachedResources.length === 0) {
      console.log('No resources found. Please check your project structure.');
    } else {
      cachedResources.forEach(resource => {
        console.log(`- ${resource.name} (${resource.uri}): ${resource.description}`);
      });
    }
    console.log('\nServer test completed.');
    process.exit(0);
  }
  
  // Start the MCP server
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
