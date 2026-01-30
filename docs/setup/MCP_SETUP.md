# Model Context Protocol (MCP) Setup Guide

> **Purpose**: Supercharge your AI coding assistant (Gemini, Claude, Cursor) with direct access to Supabase, GitHub, and PostgreSQL.

---

## 🚀 Recommended MCP Servers (Tier 1)

For the **Sihat TCM** project, we recommend installing the following MCP servers:

| MCP Server | Usage |
|------------|-------|
| **`@supabase/mcp-server`** | Manage Supabase projects, tables, and Edge Functions. |
| **`@modelcontextprotocol/server-github`** | Manage GitHub issues, PRs, and view file history. |
| **`@modelcontextprotocol/server-postgres`** | Direct SQL query capability for complex database operations. |
| **`@modelcontextprotocol/server-brave-search`** | Web search capability to find docs, libraries, and coding solutions. |

---

## 🛠️ Installation & Configuration

### 1. Prerequisites
- Node.js installed (`npx` command available)
- Valid API Keys (see below)

### 2. Configuration for Gemini CLI
Add the following to your `~/.gemini/settings.json` (Windows: `C:\Users\YOUR_USER\.gemini\settings.json`):

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "your_supabase_pat_here"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_github_pat_here"
      }
    },
    "postgres": {
      "command": "npx",
      "args": [
        "-y", 
        "@modelcontextprotocol/server-postgres", 
        "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
      ]
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your_brave_api_key_here"
      }
    }
  }
}
```

### 3. Getting Your Keys

#### 🔑 Supabase Personal Access Token (PAT)
- **Go to**: [Supabase Dashboard > Account > Tokens](https://supabase.com/dashboard/account/tokens)
- **Action**: Generate a new token.
- **Note**: Do NOT use the Service Role Key for the MCP server; use a PAT.

#### 🔑 GitHub Personal Access Token (PAT)
- **Go to**: [GitHub Settings > tokens](https://github.com/settings/tokens)
- **Type**: Fine-grained token or Classic (Repo + User scopes).

#### 🔑 Postgres Connection String
- **Format**: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`
- **Password**: This is your **Database Password** (set during project creation), NOT your Supabase login password.
- **Project Ref**: Found in your Supabase project URL (`https://app.supabase.com/project/PROJECT_REF`).

#### 🔑 Brave Search API Key
- **Go to**: [https://brave.com/search/api/](https://brave.com/search/api/)
- **Action**: Click "Get started for free", sign up, and create a new API key.
- **Cost**: Free tier includes 2,000 queries per month (plenty for coding assistance).

---

## 💡 Capabilities

Once installed, your AI assistant can:

**Supabase:**
- "List all tables in my Supabase project"
- "Show me the logs for the `analyze-image` edge function"

**GitHub:**
- "Create an issue for 'Fix login bug' assigned to me"
- "List all open PRs"

**PostgreSQL:**
- "Check the schema of the `profiles` table"
- "Run a query to count active diagnosis sessions"
