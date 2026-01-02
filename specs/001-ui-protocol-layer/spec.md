# Feature Specification: UI Protocol Layer

**Feature Branch**: `001-ui-protocol-layer`
**Created**: 2026-01-01
**Status**: Draft
**Input**: User description: "Implement A2U Protocol Renderer, AG-UI Event Bus, React Integration, and Full UI Protocol Layer (Phase 2)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Agent Renders Interactive UI Components (Priority: P1)

As a developer building an AI-powered application, I want my agent to automatically render interactive UI components (cards, lists, buttons) so that users can see structured information and take actions without me writing custom rendering logic.

**Why this priority**: This is the core value proposition - agents that can control the UI directly. Without this, all other features have no foundation.

**Independent Test**: Can be fully tested by having an agent generate a JSON response with A2U-formatted UI components and verifying they render correctly in a container element.

**Acceptance Scenarios**:

1. **Given** an agent configured with A2U support, **When** the agent generates a response containing A2U JSON (e.g., a card component), **Then** the card renders in the specified container with title, content, and action buttons
2. **Given** a rendered card with a "Book" action button, **When** the user clicks the button, **Then** the associated tool is called with the correct parameters
3. **Given** an agent response with a list of cards, **When** the response is processed, **Then** all cards render in order with their respective content and actions
4. **Given** an invalid A2U JSON structure, **When** the renderer attempts to parse it, **Then** a meaningful error is displayed and the text fallback is shown

---

### User Story 2 - Real-Time Agent-UI Communication (Priority: P2)

As a developer, I want a standardized event bus for communication between my agent and UI so that I can build reactive interfaces that respond to agent state changes, tool executions, and user actions.

**Why this priority**: Event-based communication enables reactive UIs and is required before React integration can be implemented properly.

**Independent Test**: Can be fully tested by subscribing to events, triggering agent actions, and verifying that the correct events fire with the expected payloads.

**Acceptance Scenarios**:

1. **Given** an event bus connected to an agent, **When** the agent starts generating a response, **Then** a "generation:start" event fires with request context
2. **Given** an event bus subscription to "tool:call" events, **When** the agent executes a tool, **Then** the event fires with tool name, arguments, and result
3. **Given** a UI action (button click) that triggers an event, **When** the event is emitted, **Then** the agent receives and processes it within the conversation context
4. **Given** multiple subscribers to the same event, **When** the event fires, **Then** all subscribers receive the event in registration order

---

### User Story 3 - React Hooks for Agent Integration (Priority: P3)

As a React developer, I want pre-built hooks (`useAgent`, `useAgentStream`) and a pre-built `AgentChat` component so that I can integrate agents into my React application with minimal boilerplate and automatic state management.

**Why this priority**: React is the most popular frontend framework, making this integration highly valuable, but it depends on P1 and P2 being complete.

**Independent Test**: Can be fully tested by creating a React component that uses the hooks and verifying state updates, message handling, and UI rendering.

**Acceptance Scenarios**:

1. **Given** the `useAgent` hook with an agent instance, **When** `sendMessage` is called, **Then** the message appears in the `messages` array and `isLoading` becomes true
2. **Given** an ongoing generation, **When** the agent responds, **Then** `isLoading` becomes false and the response (including UI) appears in `messages`
3. **Given** the `AgentChat` component, **When** rendered with an agent, **Then** it displays a chat interface with input field, message list, and renders A2U components inline
4. **Given** an A2U component in a message, **When** the message renders, **Then** the component is interactive and actions trigger the correct tool calls

---

### User Story 4 - Full Agent-Controlled Flight Booking Demo (Priority: P4)

As a stakeholder evaluating this framework, I want to see a complete demo where an agent controls a flight booking UI so that I can understand the full capabilities and user experience.

**Why this priority**: Demonstrates the complete value chain and serves as documentation/example, but requires all other stories to be complete.

**Independent Test**: Can be tested end-to-end by conversing with the flight agent and completing a mock booking flow.

**Acceptance Scenarios**:

1. **Given** the flight booking demo, **When** a user asks "Find flights to Paris", **Then** the agent displays flight cards with prices, times, and "Book" buttons
2. **Given** displayed flight cards, **When** the user clicks "Book" on a flight, **Then** the agent acknowledges the selection and shows booking confirmation UI
3. **Given** the demo running on a mobile device, **When** interacting with the UI, **Then** all components are responsive and touch-friendly

---

### Edge Cases

- What happens when an agent returns malformed A2U JSON? (Graceful fallback to text display with error logging)
- What happens when a component type is not registered? (Show placeholder with component type name, log warning)
- How does the system handle rapid sequential updates from streaming? (Debounce UI updates, batch renders)
- What happens when the event bus has no subscribers? (Events are silently dropped, no errors)
- How does React integration handle component unmounting during generation? (Cleanup subscriptions, cancel pending updates)
- What happens when WebGPU is unavailable for LLM inference? (WASM fallback with performance warning)
- What happens when multiple agents render to the same container? (Last-write-wins - new render clears previous content automatically)
- What happens when A2U response exceeds component limits? (Render up to limit, log warning, truncate remaining components)

## Requirements *(mandatory)*

### Functional Requirements

**A2U Protocol Renderer (Package: `@web-agent/ui-protocol`)**

- **FR-001**: System MUST parse A2U JSON from agent responses, validate against the A2U schema, and support backward-compatible parsing of multiple protocol versions via a version field
- **FR-002**: System MUST render these component types: `card`, `list`, `button`, `text`, `image`, `form`
- **FR-003**: System MUST support nested component hierarchies (components within components)
- **FR-004**: System MUST handle component actions: `navigate`, `submit`, `update`, `call_tool`
- **FR-005**: System MUST provide a component registry with typed API for adding custom component renderers, including schema validation for custom component props
- **FR-006**: System MUST display a text fallback when A2U parsing fails
- **FR-007**: System MUST sanitize rendered content to prevent XSS attacks
- **FR-007a**: System MUST enforce configurable limits on component nesting depth (default: 10 levels) and total component count per response (default: 100 components)

**AG-UI Event Bus (Package: `@web-agent/ui-protocol`)**

- **FR-008**: System MUST support typed events: `generation:start`, `generation:end`, `tool:call`, `tool:result`, `ui:action`, `error`
- **FR-009**: System MUST allow subscribing to events with typed handlers
- **FR-010**: System MUST allow emitting events with type-safe payloads
- **FR-011**: System MUST support unsubscribing individual handlers
- **FR-012**: System MUST provide a `dispose()` method to clean up all subscriptions
- **FR-013**: System MUST integrate with the Agent class to emit events automatically

**React Integration (Package: `@web-agent/react`)**

- **FR-014**: System MUST provide `useAgent` hook returning `{ messages, sendMessage, isLoading, error }`
- **FR-015**: System MUST provide `useAgentStream` hook for streaming responses with chunk-by-chunk updates
- **FR-016**: System MUST provide `AgentChat` component with customizable styling via CSS custom properties (--agent-chat-*) and className override props
- **FR-017**: System MUST provide `A2UComponent` wrapper for rendering A2U JSON in React
- **FR-018**: System MUST automatically manage event subscriptions on mount/unmount
- **FR-019**: System MUST support memory context configuration per component instance

**Integration Requirements**

- **FR-020**: Core agent MUST detect and parse A2U responses in the generate/stream output using JSON extraction patterns (e.g., ```json code blocks or raw JSON objects)
- **FR-021**: Agent response type MUST include optional `ui` field containing parsed A2U component tree
- **FR-022**: All packages MUST work in browser environments without Node.js dependencies

**Observability Requirements**

- **FR-023**: System MUST provide console logging with configurable log levels (debug/info/warn/error)
- **FR-024**: System MUST allow log level configuration at initialization (default: warn in production, debug in development)
- **FR-025**: System MUST log component render failures, event bus errors, and parse failures at appropriate levels

### Key Entities

- **A2UComponent**: Represents a UI component with type, id, props, children, and actions. Nested tree structure.
- **A2UAction**: Represents an action triggered by user interaction (navigate, submit, update, call_tool)
- **AGUIEvent**: Typed event with name, timestamp, and payload. Emitted by agent, consumed by UI.
- **ChatMessage**: Contains role (user/assistant), content (text), optional UI (A2UComponent), and metadata.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can render agent-controlled UI with less than 10 lines of integration code
- **SC-002**: A2U components render within 100ms of agent response completion
- **SC-003**: Event bus adds less than 1ms latency to agent operations
- **SC-004**: React hooks require zero configuration for basic usage
- **SC-005**: Complete flight booking demo works end-to-end in under 30 seconds of user interaction
- **SC-006**: All component types render correctly on Chrome, Firefox, Safari, and Edge (latest 2 versions)
- **SC-007**: Mobile touch interactions work without additional configuration

### Quality Gates

- All public APIs have JSDoc with @example blocks
- Test coverage exceeds 80% for all three packages
- No accessibility violations for rendered components (WCAG 2.1 AA)
- Bundle size: `ui-protocol` < 20KB gzipped, `react` < 15KB gzipped
- Zero runtime errors in the flight booking demo after 100 test interactions

## Clarifications

### Session 2026-01-01

- Q: How should developers add custom components beyond the 6 built-in types? → A: Register custom renderers via typed API with schema validation
- Q: How should A2U protocol versions be handled for forward compatibility? → A: Version field in A2U responses with backward-compatible parsing
- Q: What happens when multiple agents render to the same container? → A: Last-write-wins - new render clears previous content automatically
- Q: What observability/logging should be built into the UI protocol packages? → A: Console logging with configurable log levels (debug/info/warn/error)
- Q: Should there be limits on component nesting depth or count per response? → A: Configurable limits with sensible defaults (max 10 nesting levels, max 100 components)

## Assumptions

- Developers using this framework have basic familiarity with agents, tools, and the core package
- React version 18+ is used for React integration
- Modern browsers with ES2020+ support are targeted
- Agent prompts will be engineered to generate valid A2U JSON when UI control is needed
- The MediaPipe adapter (or equivalent) is already initialized before using UI features
