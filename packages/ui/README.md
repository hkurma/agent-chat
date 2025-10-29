# Agents App - Frontend

A modern Next.js frontend application for managing and interacting with intelligent AI agents.

## Prerequisites

- Node.js 18+ and npm
- Backend API running (see `agents-api` README)

## Getting Started

1. **Install dependencies:**

```bash
npm install
```

2. **Configure environment variables:**

   Copy the `.env.example` file to `.env.local`:

```bash
   cp .env.example .env.local
```

   Update the `NEXT_PUBLIC_API_URL` to point to your backend API:

```bash
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

3. **Run the development server:**

```bash
npm run dev
```

4. **Open your browser:**

   Navigate to [http://localhost:3001](http://localhost:3001)

## Project Structure

```bash
agents-app/
├── app/                    # Next.js app directory
│   ├── agents/            # Agent management pages
│   │   ├── [id]/         # Dynamic agent pages
│   │   │   ├── page.tsx          # Agent chat page
│   │   │   ├── documents/        # Document management
│   │   │   ├── integrations/     # OpenAPI integrations
│   │   │   └── settings/         # Agent settings
│   │   └── page.tsx      # Agents list page
│   ├── signin/           # Authentication page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/           # Reusable UI components
│   └── ui/              # shadcn/ui components
├── lib/                 # Utility functions
│   ├── api.ts          # API client
│   ├── config.ts       # Configuration
│   └── utils.ts        # Helper functions
└── public/             # Static assets

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Tech Stack

- **Framework**: Next.js 15.5
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React

## Key Features

### Authentication
- Email-based authentication flow
- Password creation and validation
- JWT token management
- Secure session handling

### Agent Management
- Create and configure agents with names and descriptions
- Delete agents when no longer needed
- View all agents in a grid layout

### Chat Interface
- **Real-time Token Streaming**: See LLM response appear word-by-word in real-time
- **Tool Call Visibility**: Watch the agent call tools with arguments (collapsible)
- **Tool Results**: See the output from each tool execution
- **ReAct Pattern**: Follow the Reasoning + Acting flow
- **Expand/Collapse Tools**: Toggle tool details for a cleaner chat view
- **Auto-scroll**: Automatically scrolls to latest message
- **Visual Indicators**: Different colors for tool calls, results, and responses

### Document Management
- Upload documents (PDF, TXT, etc.)
- View all uploaded documents
- Delete documents
- File size display

### OpenAPI Integrations
- Add external API integrations
- Configure API base URLs and schema URLs
- View all connected integrations
- Delete integrations

## API Integration

The frontend communicates with the backend API through a centralized API client (`lib/api.ts`). All requests include JWT authentication tokens stored in localStorage.

### Streaming Architecture

The chat feature uses Server-Sent Events (SSE) for real-time streaming following the [ReAct pattern](https://docs.langchain.com/oss/javascript/langchain/agents#tool-use-in-the-react-loop).

**Implementation follows [LangChain's dual stream mode](https://docs.langchain.com/oss/javascript/langchain/streaming)**:

1. **Backend**: Uses `streamMode: ["updates", "messages"]` to stream both:
   - Agent step progress (tool calls and results)
   - LLM tokens as they're generated
2. **Frontend**: Reads the stream using the Fetch API's `ReadableStream`
3. **Real-time Updates**: React state updates for each event type

**Stream Format** (following ReAct - Reasoning + Acting):
```
data: {"type":"tool_call","tool":"doc_search","args":{"query":"..."},"id":"call_123"}\n\n
data: {"type":"tool_result","tool":"doc_search","content":"Found: ..."}\n\n
data: {"type":"token","content":"Based"}\n\n
data: {"type":"token","content":" on"}\n\n
data: {"type":"token","content":" the"}\n\n
data: {"type":"token","content":" documents"}\n\n
data: {"type":"token","content":"..."}\n\n
data: {"type":"done"}\n\n
```

**Event Types**:
- `tool_call` - Agent is calling a tool (creates collapsible blue bubble with args)
- `tool_result` - Tool execution result (updates same bubble with result)
- `token` - Individual LLM token (appended to assistant message in real-time)
- `done` - Stream complete

**UI Design**:
- Tool calls and results appear in a **single collapsible blue bubble**
  - Click to expand/collapse full details (args and results)
  - Compact header shows tool name + status icon
  - Shows "Executing..." spinner while waiting for result
  - Green checkmark when complete
- Assistant messages stream token-by-token for smooth typing effect
- No duplicate messages - user messages only shown once

### API Client Methods

```typescript
// Authentication
api.checkUser(email)
api.createPassword(email, password)
api.validatePassword(email, password)

// Agents
api.listAgents()
api.getAgent(id)
api.createAgent(name, description)
api.updateAgent(id, data)
api.deleteAgent(id)

// Documents
api.listDocuments(agentId)
api.uploadDocument(agentId, file)
api.deleteDocument(agentId, documentId)

// OpenAPI Integrations
api.listOpenAPIs(agentId)
api.createOpenAPI(agentId, data)
api.deleteOpenAPI(agentId, openapiId)

// Chat (streaming with tool progress)
api.chatStream(
  agentId, 
  message, 
  onToolCall,    // Called when agent uses a tool
  onToolResult,  // Called when tool completes
  onContent,     // Called with final response
  onComplete,    // Called when stream ends
  onError        // Called on error
)

// Chat (legacy, non-streaming)
api.chat(agentId, message)
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3000/api` |

## Development

### Code Style

- Use TypeScript for type safety
- Follow React best practices and hooks patterns
- Use client components (`"use client"`) for interactive pages
- Keep components focused and reusable

### Component Structure

Components follow a consistent structure:

1. Imports
2. Type definitions
3. Component function
4. State management
5. Effects and callbacks
6. Event handlers
7. Render logic

## Deployment

1. **Build the application:**

   ```bash
   npm run build
   ```

2. **Set production environment variables:**
   Update `.env.local` or configure environment variables in your hosting platform.

3. **Start the production server:**

   ```bash
   npm start
   ```

## Troubleshooting

### API Connection Issues

If you're experiencing connection issues:

1. Verify the backend API is running
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Ensure CORS is configured correctly in the backend
4. Check browser console for detailed error messages

### Authentication Issues

If authentication isn't working:

1. Clear localStorage in your browser
2. Verify JWT token is being stored
3. Check backend JWT configuration
4. Ensure user exists in the database

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
