# Global Development Standards for Paul A. Miller

These instructions apply to all projects unless specifically overridden in project documentation.

## Development Environment
- **Platform**: Windows with PowerShell
- **Experience Level**: Intermediate developer, still learning - explain complex patterns
- **Code Presentation**: Show complete functions/methods when suggesting changes, not snippets

## Core Principles

### Modularity First
- Design with clear module boundaries based on functionality or architectural layers
- Minimize coupling between modules
- Keep related code together, separate unrelated code
- When uncertain about module organization, ask before proceeding

### Clarity Over Cleverness
- Prioritize readable code over compact code
- Add comments explaining *why*, not just *what*
- Use descriptive names for variables, functions, and classes
- If a pattern seems too complex, discuss simpler alternatives

### Defensive Coding
- Include type hints/annotations (TypeScript types, Python type hints)
- Validate inputs at module boundaries
- Handle errors explicitly - no silent failures
- Think about edge cases during implementation

## Code Organization

### Functions and Methods
- **Comment every function** with purpose and key relationships
- Keep functions focused on single responsibilities
- Limit complexity - if a function does too many things, break it up
- Helper/utility functions should be clearly marked and scoped appropriately

### Classes (for OOP languages like Python)
- Use classes for related state and behavior
- Include class-level docstrings explaining purpose
- Group methods logically (initialization, public interface, private helpers)
- Consider whether a class is needed vs. simple functions

### File Structure
- Group related code in the same file/module
- Separate concerns across files (UI, business logic, data access)
- Use clear naming conventions for files matching their contents

## Logging and Debugging

### Logging Philosophy
**Log generously** - when in doubt, add a log line
- INFO: Key workflow events, successful operations
- DEBUG: Detailed state information, intermediate values
- WARNING: Recoverable issues, deprecated usage
- ERROR: Failures requiring attention

### For Multi-Module Projects
- Implement a consistent logging system
- Identify log source (module/class name)
- Include relevant context (IDs, parameters, state)

## Error Handling
- **Never fail silently** - log all errors
- Provide actionable error messages
- Use try/catch (or try/except) at appropriate boundaries
- Consider retry logic for external dependencies
- Clean up resources in finally blocks

## Testing Approach
- Write tests for public interfaces
- Test edge cases and error conditions
- Keep tests simple and focused
- Run tests before considering work complete

## Type Safety

### Type Tracking
- Always use type hints/annotations
- Follow argument types through the call chain
- Verify object shapes match between caller and callee
- Comment complex type shapes or transformations

### Common Type Issues to Watch
- Returning None when value expected
- Mixing dictionaries/objects with different structures
- List/array element type mismatches
- Async/Promise handling

## Documentation
- README for project setup and usage
- Architecture decisions in ARCHITECTURE.md
- API contracts for module interfaces
- Inline comments for complex logic

## Claude Code Workflow

### Checkpoints for Human Review
Notify me and pause for review at these stages:
1. **Design Complete** - Architecture and module breakdown ready
2. **Core Implementation Done** - Main functionality working
3. **Tests Written** - Unit tests complete
4. **Integration Complete** - Modules connected and working together
5. **Ready for Review** - Code polished and documented

### When to Ask vs. Proceed
**Ask First:**
- Architecture decisions affecting multiple modules
- Trade-offs between different approaches
- When requirements are ambiguous
- Before major refactoring

**Proceed Confidently:**
- Implementing well-defined specifications
- Following established patterns in the project
- Writing tests for completed code
- Adding logging and documentation

### Handling Uncertainty
- If a requirement is unclear, state assumptions and ask
- If multiple valid approaches exist, present options
- If you make a design decision, explain the reasoning
- Always explain trade-offs when they exist

## Windows/PowerShell Specific
- Use forward slashes or pathlib for cross-platform paths
- Be mindful of case sensitivity differences
- Test commands work in PowerShell when providing examples
- Use PowerShell-compatible syntax for shell commands

## Communication Preferences
- Explain technical concepts at intermediate level
- Show complete functions/methods in code suggestions
- Provide context for changes - the "why" behind the "what"
- Link related concepts to help build mental models
- Don't be afraid to suggest better approaches if I'm headed down a wrong path

# Simple Chat Application - Practice Project

## Project Overview
A learning project to practice Claude Code workflows, covering frontend (React), API layer, and LLM integration. The goal is to build a functional but simple chat interface that demonstrates full-stack development patterns.

**Primary Goal**: Learn Claude Code best practices while building something useful
**Secondary Goal**: Create a reusable chat component for future projects

## Technical Stack
- **Frontend**: React with functional components and hooks (JavaScript)
- **API Layer**: Flask (Python 3.10+)
- **LLM Integration**: Anthropic Claude API (anthropic SDK)
- **Styling**: Tailwind CSS or simple CSS modules

## Project Structure
```
chat-practice/
├── .claude/
│   ├── hooks/
│   └── skills/
├── frontend/                      # React app (JavaScript)
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   └── package.json
├── src/
│   └── api/                       # Flask backend (Python)
│       ├── routes/
│       ├── services/
│       ├── utils/
│       ├── config/
│       └── app.py
├── tests/
├── requirements.txt               # Python dependencies
├── CLAUDE.md (this file)
├── ARCHITECTURE.md
└── PROGRESS.md
```

## Initial Setup Requirements

### Git Configuration
Create a `.gitignore` file with the following exclusions:

**Python/Flask:**
```
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/
.venv
pip-log.txt
pip-delete-this-directory.txt
instance/
.pytest_cache/
.coverage
htmlcov/
```

**Node/React:**
```
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnp
.pnp.js
build/
dist/
```

**Environment & Secrets:**
```
.env
.env.local
*.key
*.pem
```

**IDEs & Editors:**
```
.vscode/
.idea/
*.swp
*.swo
*.sublime-workspace
```

**OS Files:**
```
.DS_Store
Thumbs.db
desktop.ini
```

**Logs:**
```
*.log
logs/
```

### Environment Variables
Create a `.env.example` file as a template:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
FLASK_ENV=development
PORT=5000
MAX_CONTEXT_MESSAGES=10
RATE_LIMIT_CALLS=10
RATE_LIMIT_PERIOD=60
CORS_ORIGINS=http://localhost:3000
```

Never commit the actual `.env` file - it should be in `.gitignore`.
```

## Python/JavaScript Interface Management

**Critical Integration Points:**
This project has a Python backend (Flask) communicating with a JavaScript frontend (React). Pay special attention to:

1. **JSON Serialization**
   - Python `dict` must serialize cleanly to JSON
   - Use `jsonify()` for all Flask responses
   - No Python-specific types (datetime, Decimal, etc.) without conversion

2. **Type Consistency**
   - Python type hints should align with frontend expectations
   - Document expected shapes in both Python docstrings and frontend JSDoc
   - Test serialization in both directions

3. **Error Handling**
   - Python exceptions → HTTP status codes → Frontend error handling
   - Consistent error object shape: `{error: str, code: str, status: int}`
   - Never expose Python tracebacks to frontend

4. **Streaming Format**
   - SSE requires exact format: `data: {json}\n\n`
   - Python generators yield formatted strings
   - Frontend EventSource parses these correctly

5. **CORS Configuration**
   - Flask-CORS must allow frontend origin
   - Handle preflight OPTIONS requests
   - Verify in browser DevTools network tab

**Verification Checklist for Python/JS Boundary:**
- [ ] All Flask routes return valid JSON or SSE format
- [ ] Error responses match frontend TypeScript interfaces
- [ ] CORS headers present and correct
- [ ] Type hints in Python align with JSDoc in frontend
- [ ] Test with actual HTTP requests, not just unit tests
- [ ] No Python-specific objects leak to JSON responses

## Development Phases

### Phase 1: Foundation
- [ ] Project setup
  - [ ] Frontend: npm project with React
  - [ ] Backend: Python venv, Flask app, requirements.txt
  - [ ] Environment configuration (.env, .env.example)
- [ ] Basic structure
  - [ ] React app with placeholder UI
  - [ ] Flask app factory with health check endpoint (`/api/health`)
  - [ ] CORS configuration
- **Checkpoint**: Basic structure review, verify Python/JS can communicate

### Phase 2: Core Chat Flow
- [ ] Frontend Components
  - [ ] ChatContainer (main state management)
  - [ ] MessageList (display messages)
  - [ ] MessageInput (capture input)
  - [ ] useChatAPI hook (API communication)
- [ ] Backend Services
  - [ ] POST /api/chat route (Blueprint)
  - [ ] ChatService class (Claude integration)
  - [ ] ConversationManager class (context management)
- [ ] Wire together: Test message → API → Claude → streamed response
- **Checkpoint**: Basic chat working end-to-end, verify streaming works

### Phase 3: Enhanced Features
- [ ] Streaming implementation
  - [ ] Python generator for SSE format
  - [ ] Frontend EventSource handling
  - [ ] Proper cleanup on errors
- [ ] Conversation context (maintain message history)
- [ ] Error handling at all layers
- [ ] Loading states and user feedback
- [ ] Logging implementation (Python logger)
- **Checkpoint**: Full functionality review, test error scenarios

### Phase 4: Polish
- [ ] Rate limiting decorator
- [ ] Input validation
- [ ] Styling improvements
- [ ] Code cleanup and documentation
- [ ] Unit tests for critical paths
- **Checkpoint**: Final review, deployment readiness check

## Testing Strategy
- **Frontend**: Test key components with React Testing Library
- **Backend (Python)**: pytest for services and routes
  - Mock Anthropic SDK responses
  - Test conversation context management
  - Test SSE formatting
- **Integration**: Test full flow with real API (using test key)
- **Manual**: Verify streaming, error handling, UI responsiveness

## Success Criteria
1. Can send a message and receive a streamed response
2. Conversation context is maintained across messages
3. Errors are handled gracefully at all layers
4. Python/JS boundary is clean and well-tested
5. Code is well-organized and documented
6. I understand the full flow from UI → Flask → Claude → UI

## Learning Focus Areas
- React hooks for managing async state
- Flask generators for SSE streaming
- Python type hints and their relationship to frontend types
- Managing Python/JavaScript data serialization
- CORS and cross-origin requests
- Error handling across language boundaries
- 
## Questions to Resolve
- [ ] How many messages to maintain in context?
- [ ] Local storage for conversation history?

## Project-Specific Conventions
- Use async/await throughout (no callbacks)
- Prefix interface names with 'I' (IMessage, IChatRequest)
- Keep components under 200 lines
- One component per file

## Reference Documentation
- [Anthropic API Docs](https://docs.anthropic.com)
- [React Hooks Guide](https://react.dev/reference/react)
- [Express.js Streaming](https://expressjs.com/en/api.html)