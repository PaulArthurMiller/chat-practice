# Chat Application Architecture

## System Overview

A simple full-stack chat application demonstrating clean separation between presentation, API, and AI integration layers. Built as a learning project for Claude Code workflows.
```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │            React Frontend (Port 3000)              │    │
│  │                                                      │    │
│  │  ChatContainer → MessageList → Message Components  │    │
│  │       ↓              ↑                              │    │
│  │  MessageInput    Display Messages                  │    │
│  │       ↓              ↑                              │    │
│  │  useChatAPI hook → Manages state & API calls       │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓ HTTP/SSE ↑                       │
└──────────────────────────┼───────────┼──────────────────────┘
                           ↓           ↑
┌──────────────────────────┼───────────┼──────────────────────┐
│                    Flask Server (Port 5000)                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │                   Route Layer                       │    │
│  │              POST /api/chat                         │    │
│  │         (routes/chat_routes.py)                    │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   ↓                                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │                Service Layer                        │    │
│  │            ChatService                             │    │
│  │  (services/chat_service.py)                        │    │
│  │  - Manages conversation context                    │    │
│  │  - Calls Claude API                                │    │
│  │  - Handles streaming                               │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   ↓                                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │            Middleware/Utils                         │    │
│  │  - Error handling decorators                       │    │
│  │  - Logging configuration                           │    │
│  │  - Rate limiting                                    │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────┼──────────────────────────────────┘
                           ↓ HTTPS ↑
                ┌──────────────────────────┐
                │   Anthropic Claude API    │
                │    (api.anthropic.com)    │
                └──────────────────────────┘
```

## Component Responsibilities

### Frontend Layer (React)

**ChatContainer** (Main orchestrator)
- Manages overall chat state
- Coordinates message flow
- Handles error display
- **Dependencies**: useChatAPI hook, MessageList, MessageInput

**MessageList** (Display component)
- Renders conversation history
- Auto-scrolls to latest message
- Shows loading indicators
- **Dependencies**: Message component

**MessageInput** (Input component)
- Captures user input
- Handles send action
- Manages input state and validation
- **Dependencies**: None

**useChatAPI** (Custom hook)
- Abstracts API communication
- Manages message state
- Handles streaming responses
- Provides error handling
- **Dependencies**: Fetch API

### API Layer (Flask)

**Routes** (`src/api/routes/chat_routes.py`)
- HTTP endpoint definitions using Flask Blueprints
- Request validation with Flask-CORS
- Response formatting
- **Purpose**: Handle HTTP concerns only
- **Dependencies**: ChatService, Flask request/response objects

**Services** (`src/api/services/chat_service.py`)
- Business logic class: `ChatService`
- Claude API integration
- Conversation context management
- Stream generation using Python generators
- **Purpose**: Core application logic
- **Dependencies**: anthropic SDK, ConversationManager

**Utils** (`src/api/utils/`)
- `error_handlers.py`: Centralized error handling decorators
- `logger.py`: Logging configuration and setup
- `rate_limiter.py`: Simple rate limiting decorator
- **Purpose**: Cross-cutting concerns
- **Dependencies**: functools, logging, time

### Supporting Modules

**ConversationManager** (`src/api/services/conversation_manager.py`)
- Maintains message history per session
- Trims context to token limits
- Formats messages for Claude API
- **Purpose**: Context window management
- **Dependencies**: None (pure Python logic)

**Configuration** (`src/api/config/config.py`)
- Environment variables via python-dotenv
- Configuration class with validation
- Server settings
- **Purpose**: Centralized configuration
- **Dependencies**: os, python-dotenv

**Application Factory** (`src/api/app.py`)
- Flask application creation and configuration
- Blueprint registration
- CORS setup
- Error handler registration
- **Purpose**: App initialization
- **Dependencies**: Flask, Flask-CORS

## Data Flow

### Sending a Message

1. User types message in `MessageInput`
2. Input calls `onSend()` callback to `ChatContainer`
3. `ChatContainer` calls `sendMessage()` from `useChatAPI` hook
4. Hook sends POST to `/api/chat` with JSON payload
5. Flask route validates and forwards to `ChatService.handle_chat()`
6. `ChatService`:
   - Adds message to `ConversationManager`
   - Retrieves conversation context
   - Calls Claude API with context
   - Returns generator for streaming response
7. Flask route yields SSE-formatted chunks from generator
8. Hook receives streamed chunks via EventSource
9. Hook updates state, triggering re-render
10. `MessageList` displays new message chunks
11. On completion, message is finalized

### Error Flow

**Frontend Error:**
- Hook catches error from fetch
- Updates error state
- `ChatContainer` displays error message
- User can retry

**API Error:**
- Caught by error handler decorator
- Logged with full context and stack trace
- Returns JSON error response with appropriate HTTP status
- Frontend receives and displays user-friendly message

## Technology Decisions

### Why Flask?
- Simpler than FastAPI for learning basics
- Excellent for streaming with Python generators
- Clean decorator-based routing
- Aligns with Python backend experience
- Easy to test and debug

### Why Server-Sent Events (SSE)?
- Simpler than WebSockets for one-way streaming
- Built-in reconnection in EventSource API
- Works over HTTP (no protocol upgrade needed)
- Perfect for AI response streaming
- Flask supports via generator functions

**Important Implementation Note:** 
SSE uses `\n\n` as message delimiters. All streamed content must be 
JSON-encoded to prevent content containing newlines from breaking the 
stream. See CLAUDE.md SSE section for details.

### Why Python Generators for Streaming?
- Natural fit for SSE in Flask
- Memory efficient (yields chunks as available)
- Clean error handling with try/finally
- Easy to understand flow control

### Why Custom Hook for API?
- Encapsulates complex async logic
- Reusable across components
- Testable in isolation
- Clean separation of concerns

## State Management

### Frontend State
```typescript
interface ChatState {
  messages: IMessage[];          // Conversation history
  isLoading: boolean;            // Waiting for response
  error: string | null;          // Error message if any
  streamingMessage: string;      // Partial message being received
}
```

### Backend State
- No persistent storage (stateless API)
- Conversation context managed in-memory per session
- Session identified by client-generated ID (optional Phase 2 feature)

## API Contract

### POST /api/chat

**Request:**
```json
{
  "message": "Hello, Claude!",
  "conversation_id": "optional-session-id"
}
```

**Response:** Server-Sent Events stream
```
data: {"type": "content", "text": "Hello"}

data: {"type": "content", "text": " there"}

data: {"type": "done"}
```

**Error Response:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "status": 500
}
```

## Python/JavaScript Interface Considerations

### Critical Integration Points

**1. Data Type Compatibility**
- Python `dict` ↔ JavaScript `Object`
- Python `list` ↔ JavaScript `Array`
- Python `None` ↔ JavaScript `null`
- Python `True/False` ↔ JavaScript `true/false`

**2. JSON Serialization**
- Flask automatically serializes dict → JSON
- Use `jsonify()` for consistent serialization
- Date handling: ISO 8601 strings (Python `datetime.isoformat()`)

**3. Error Handling Across Boundary**
- Python exceptions → HTTP status codes
- Consistent error object shape: `{error, code, status}`
- Never expose Python stack traces to frontend

**4. Streaming Format**
- SSE requires specific format: `data: {json}\n\n`
- Python generators yield strings, not objects
- Must JSON serialize each chunk before yielding

**5. CORS Configuration**
- Development: Allow `http://localhost:3000`
- Production: Restrict to deployed frontend domain
- Handle preflight OPTIONS requests

### Verification Steps for Python/JS Interface

**When reviewing/testing API endpoints:**
1. Verify JSON serialization (no Python-specific types leak through)
2. Test error responses match expected frontend shape
3. Confirm CORS headers present in response
4. Validate SSE format (proper `data:` prefix and double newline)
5. Check type hints match expected frontend TypeScript types

**When modifying data structures:**
1. Update Python type hints
2. Update TypeScript interfaces
3. Verify serialization in both directions
4. Test with actual HTTP calls, not just unit tests

## Project Structure
```
chat-practice/
├── .claude/
│   ├── hooks/
│   │   ├── post-change/
│   │   └── pre-commit/
│   └── skills/
├── frontend/                      # React app
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatContainer.jsx
│   │   │   ├── MessageList.jsx
│   │   │   ├── MessageInput.jsx
│   │   │   └── Message.jsx
│   │   ├── hooks/
│   │   │   └── useChatAPI.js
│   │   ├── types/
│   │   │   └── chat.types.js     # TypeScript-style JSDoc types
│   │   └── App.jsx
│   └── package.json
├── src/
│   └── api/                       # Flask backend
│       ├── routes/
│       │   ├── __init__.py
│       │   └── chat_routes.py
│       ├── services/
│       │   ├── __init__.py
│       │   ├── chat_service.py
│       │   └── conversation_manager.py
│       ├── utils/
│       │   ├── __init__.py
│       │   ├── error_handlers.py
│       │   ├── logger.py
│       │   └── rate_limiter.py
│       ├── config/
│       │   ├── __init__.py
│       │   └── config.py
│       ├── app.py                 # Flask app factory
│       └── run.py                 # Development server entry
├── tests/
│   ├── test_chat_service.py
│   ├── test_conversation_manager.py
│   └── test_api_endpoints.py
├── .env.example
├── .gitignore
├── requirements.txt
├── CLAUDE.md
├── ARCHITECTURE.md
├── PROGRESS.md
└── README.md
```

## Module Dependencies
```
Frontend:
  ChatContainer → useChatAPI → Fetch API / EventSource
             → MessageList → Message
             → MessageInput

Backend:
  app.py → chat_routes (Blueprint)
        → error_handlers
        → CORS configuration
        
  chat_routes → ChatService.handle_chat()
              → error handler decorators
              → rate limiter decorators
              
  ChatService → ConversationManager
              → anthropic.Anthropic client
              → logger
              
  ConversationManager → (standalone, no dependencies)
```

## Testing Strategy

### Unit Tests (Python)
- `test_conversation_manager.py`: Context management logic
- `test_chat_service.py`: Mock Anthropic SDK, test message handling
- Use `pytest` with fixtures for setup

### Integration Tests (Python)
- `test_api_endpoints.py`: Test routes with mocked service layer
- Verify SSE streaming format
- Test error handling across layers

### Frontend Tests (JavaScript)
- `useChatAPI`: Mock fetch/EventSource, test state transitions
- Component tests with React Testing Library

### Manual Testing
- End-to-end with real Claude API
- Network error scenarios
- Rate limiting behavior
- Cross-browser SSE compatibility

## Performance Considerations

- Conversation context trimmed to last 10 messages (configurable)
- Streaming reduces perceived latency
- Frontend re-renders optimized with React.memo where needed
- Python generators are memory efficient for streaming
- No blocking I/O in main request thread

## Logging Strategy

**Frontend:**
- Console errors only (development)
- User-facing error messages (production)

**Backend (Python):**
- Custom logger configured in `utils/logger.py`
- Log format: `[%(asctime)s] %(levelname)s in %(module)s: %(message)s`
- INFO: Request received, response sent, conversation context size
- DEBUG: Message content (sanitized), API call details
- ERROR: Exceptions with full stack traces
- Logs include: timestamp, level, module, message
- Optional: Log to file in production

## Security Considerations

- API key stored in environment variables (never in code)
- `.env` file in `.gitignore`
- Rate limiting decorator to prevent abuse
- Input validation on all endpoints (Flask request validation)
- CORS configured for frontend origin only
- No sensitive data in logs (sanitize message content in DEBUG)
- Type hints help prevent type-related vulnerabilities

## Configuration

**Environment Variables (.env):**
```
ANTHROPIC_API_KEY=sk-ant-...
FLASK_ENV=development
PORT=5000
MAX_CONTEXT_MESSAGES=10
RATE_LIMIT_CALLS=10
RATE_LIMIT_PERIOD=60
CORS_ORIGINS=http://localhost:3000
```

**Configuration Class (config.py):**
```python
class Config:
    ANTHROPIC_API_KEY: str
    PORT: int
    MAX_CONTEXT_MESSAGES: int
    RATE_LIMIT_CALLS: int
    RATE_LIMIT_PERIOD: int
    CORS_ORIGINS: list[str]
```

## Scalability Considerations

**Current Design (Phase 1):**
- Single Flask instance with development server
- In-memory conversation storage (dict)
- Simple time-based rate limiting

**Future Enhancements:**
- Production WSGI server (Gunicorn)
- Redis for conversation storage (multi-worker support)
- Database for conversation history persistence
- Token bucket rate limiting
- Async workers for Claude API calls (Celery)

## Open Questions

- [ ] Should we persist conversation history? (Phase 2?)
- [ ] Session management approach (cookies vs client ID)?
- [ ] How to handle very long responses (pagination)?
- [ ] Need for conversation list UI?
- [ ] Use Gunicorn in development or stick with Flask dev server?

## Evolution Path

**Phase 1** (Current): Basic chat working
- Flask dev server
- In-memory state
- Simple decorators for cross-cutting concerns

**Phase 2**: Add conversation persistence
- SQLite database
- Multiple conversation support

**Phase 3**: Production ready
- Gunicorn with multiple workers
- Redis for session state
- Comprehensive error handling

**Phase 4**: Advanced features
- User authentication
- Conversation sharing
- Advanced rate limiting