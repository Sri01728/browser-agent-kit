# Data Model: UI Protocol Layer

**Feature**: 001-ui-protocol-layer
**Date**: 2026-01-01

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        A2U Response                              │
│  ┌─────────┐                                                    │
│  │ version │ "1.0"                                              │
│  │ type    │ "ui" | "text"                                      │
│  │ ui?     │ ─────────────┐                                     │
│  │ text?   │              │                                     │
│  └─────────┘              ▼                                     │
│                    ┌──────────────┐                             │
│                    │ A2UComponent │◄────────────────┐           │
│                    ├──────────────┤                 │           │
│                    │ type         │ string          │ children  │
│                    │ id?          │ string          │           │
│                    │ props?       │ Record<K,V>     │           │
│                    │ children?    │ ────────────────┘           │
│                    │ actions?     │ ─────┐                      │
│                    └──────────────┘      │                      │
│                                          ▼                      │
│                                   ┌────────────┐                │
│                                   │ A2UAction  │                │
│                                   ├────────────┤                │
│                                   │ type       │ ActionType     │
│                                   │ target?    │ string         │
│                                   │ params?    │ Record<K,V>    │
│                                   └────────────┘                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        AG-UI Events                              │
│                                                                  │
│  ┌─────────────┐         ┌─────────────────┐                    │
│  │ AGUIEvent   │         │ AGUIEventBus    │                    │
│  ├─────────────┤         ├─────────────────┤                    │
│  │ type        │ ◄────── │ on(type, fn)    │                    │
│  │ timestamp   │         │ off(type, fn)   │                    │
│  │ payload     │         │ emit(type, pl)  │                    │
│  └─────────────┘         │ dispose()       │                    │
│                          └─────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        React Integration                         │
│                                                                  │
│  ┌──────────────┐        ┌─────────────────┐                    │
│  │ ChatMessage  │◄───────│ useAgent()      │                    │
│  ├──────────────┤        ├─────────────────┤                    │
│  │ id           │        │ messages[]      │                    │
│  │ role         │        │ sendMessage()   │                    │
│  │ content      │        │ isLoading       │                    │
│  │ ui?          │        │ error           │                    │
│  │ timestamp    │        └─────────────────┘                    │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
```

## Entity Definitions

### A2UResponse

The top-level response from an agent that may contain UI components.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| version | string | Yes | Protocol version (e.g., "1.0") |
| type | "ui" \| "text" | Yes | Response type discriminator |
| ui | A2UComponent | No | Root UI component (when type="ui") |
| text | string | No | Text content (when type="text") |

**Validation Rules**:
- If type="ui", ui field MUST be present
- If type="text", text field MUST be present
- version MUST match pattern `^\d+\.\d+$`

### A2UComponent

A renderable UI component with optional children and actions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | ComponentType | Yes | Component type identifier |
| id | string | No | Unique identifier for the component |
| props | Record<string, unknown> | No | Component-specific properties |
| children | A2UComponent[] | No | Nested child components |
| actions | A2UAction[] | No | Available user interactions |

**Component Types (Built-in)**:
- `card` - Container with title, content, actions
- `list` - Vertical list of items
- `button` - Clickable action trigger
- `text` - Text content with optional formatting
- `image` - Image display with alt text
- `form` - Input form with fields

**Validation Rules**:
- type MUST be a registered component type
- children depth MUST NOT exceed configured limit (default: 10)
- Total component count MUST NOT exceed configured limit (default: 100)
- id, if provided, MUST be unique within the response

### A2UAction

An action that can be triggered by user interaction.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | ActionType | Yes | Action type identifier |
| target | string | No | Navigation URL or element ID |
| params | Record<string, unknown> | No | Action parameters |

**Action Types**:
- `navigate` - Navigate to a URL (target required)
- `submit` - Submit form data (params contains form data)
- `update` - Update component state (params contains updates)
- `call_tool` - Invoke agent tool (params.tool, params.args)

**Validation Rules**:
- type MUST be one of allowed action types
- navigate action MUST have target field
- call_tool action MUST have params.tool field

### AGUIEvent

A typed event for agent-UI communication.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | EventType | Yes | Event type identifier |
| timestamp | number | Yes | Unix timestamp in milliseconds |
| payload | T | Yes | Type-specific payload |

**Event Types**:
- `generation:start` - Agent started generating (payload: { requestId, prompt })
- `generation:end` - Agent finished generating (payload: { requestId, response })
- `tool:call` - Tool invocation started (payload: { toolId, args })
- `tool:result` - Tool returned result (payload: { toolId, result, error? })
- `ui:action` - User triggered UI action (payload: { action, componentId })
- `error` - Error occurred (payload: { code, message, context })

### ChatMessage

A message in a conversation, used by React integration.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique message identifier |
| role | "user" \| "assistant" | Yes | Message sender role |
| content | string | Yes | Text content |
| ui | A2UComponent | No | Rendered UI component |
| timestamp | number | Yes | Unix timestamp |

## State Transitions

### A2URenderer State

```
[Idle] ──render()──> [Parsing] ──success──> [Rendering] ──complete──> [Idle]
                         │                       │
                         └──error──> [Error] ────┘
```

### AGUIEventBus State

```
[Active] ──dispose()──> [Disposed]
    │
    └─── on/off/emit cycle (no state change)
```

### React Hook State (useAgent)

```
[Idle] ──sendMessage()──> [Loading] ──response──> [Idle]
                              │
                              └──error──> [Error] ──retry/dismiss──> [Idle]
```

## Indexes and Lookups

### Component Registry
- Key: component type (string)
- Value: ComponentRenderer function
- Lookup: O(1) via Map

### Event Subscriptions
- Key: event type (string)
- Value: Set of handler functions
- Lookup: O(1) for type, O(n) for handlers

### Message History (React)
- Key: message id (string)
- Value: ChatMessage object
- Ordered by timestamp (ascending)

