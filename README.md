# LLMDotfiles MCP Server

An MCP (Model Context Protocol) server for scanning AI-related dotfiles and configuration files, and expose them to the agent tool.

## Overview

This MCP server provides access to a variety of dotfiles and configuration resources that help LLMs understand project context and guidelines.
This is an experimental project that seek to detect and exposa all the different rules, guidelines, settings and configuration files the different agentic extensions make use of. This also includes the llm.txt proposal.

## Installation

Requires NodeJS 18.x

Clone the project to any local folder you want.
Do a `npm install` or `pnpm install` to download the dependencies.
Use it as a project/workspace MCP server, this is an example config file:

```json
{
  "mcp": {
    "LLMDotFiles": {
      "command": "npm",
      "args": [
        "start"
      ],
      "env": {
        "ProjectPath": "<ABSOLUTE PROJECT PATH>",
        "externalFolders": "<ABSOLUTE PATH TO EXTRA RULES>;<ANOTHER EXTRA PATH>"
      },
      "cwd": "<MCP SERVER INSTALLATION PATH>"
    }
  }
}
```
It can work as a global server, but since the project path is required, can only serve one project/workspace at a time.

## Resources API

This server implements the MCP Resources API to provide access to dotfiles:

1. **List Resources**: Automatically scans the project to find available dotfiles
2. **Read Resources**: Access the content of specific dotfiles using their URIs
3. **Read ALL Resources**: returns the content of all the files detected by the server, concatenated in a single string.

### Resource URIs

Resources are available using the `file:///` URI scheme:

```
file:///{projectPath}/{filename}
```

The bulk of all resources can be obtained using `LLMfiles:///` URI scheme:

## Files and Folders Scanned

### Project Files
- llms.txt
- ai-instructions.md
- project-context.md
- .github/copilot-instructions.md
- .continuerules
- .clinerules
- .roorules
- .kilocoderules


### Project Folders
- .vscode/rules
- .roo/rules
- .kilocode/rules
- .cursor/rules
- .continue/rules
- .windsurf/rules

### External Folders
- ~/Documents/Cline/Rules

## License

MIT
