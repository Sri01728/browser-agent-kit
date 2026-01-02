# Tasks: UI Protocol Layer

**Input**: Design documents from `/specs/001-ui-protocol-layer/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Included per quality gates (>80% coverage required)

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Exact file paths included in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Package scaffolding and monorepo configuration

- [x] T001 [P] Create `packages/ui-protocol/package.json` with dependencies (zod, dompurify)
- [x] T002 [P] Create `packages/ui-protocol/tsconfig.json` extending root config
- [x] T003 [P] Create `packages/ui-protocol/tsup.config.ts` with ESM output
- [x] T004 [P] Create `packages/react/package.json` with peer deps (react 18+)
- [x] T005 [P] Create `packages/react/tsconfig.json` with jsx support
- [x] T006 [P] Create `packages/react/tsup.config.ts` with external react
- [x] T007 Update root `pnpm-workspace.yaml` to include new packages
- [x] T008 [P] Create `packages/ui-protocol/vitest.config.ts` with jsdom environment
- [x] T009 [P] Create `packages/react/vitest.config.ts` with React Testing Library

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, errors, and utilities that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T010 Create `packages/ui-protocol/src/logger.ts` with configurable log levels (FR-023, FR-024) - centralized logger used by A2U parser, renderer, and event bus
- [x] T011 [P] Create `packages/ui-protocol/src/a2u/types.ts` with Zod schemas from contracts/a2u-schema.ts
- [x] T012 [P] Create `packages/ui-protocol/src/a2u/errors.ts` (A2UParseError, ComponentRenderError)
- [x] T013 [P] Create `packages/ui-protocol/src/ag-ui/types.ts` with Zod schemas from contracts/ag-ui-events.ts
- [x] T014 [P] Create `packages/ui-protocol/src/ag-ui/errors.ts` (EventBusError)
- [x] T015 [P] Create `packages/react/src/types.ts` (ChatMessage, hook return types)
- [x] T016 Update `packages/core/src/agent/types.ts` to add optional `ui` field to AgentResponse (FR-021)
- [x] T016a [P] Implement `parseA2UFromText()` in `packages/core/src/agent/a2u-detector.ts` - extracts A2U JSON from LLM text output using pattern matching (FR-020)
- [x] T016b Write tests for `parseA2UFromText()` in `packages/core/src/agent/__tests__/a2u-detector.test.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Agent Renders Interactive UI Components (Priority: P1) 🎯 MVP

**Goal**: Developers can render A2U JSON from agent responses into native DOM elements

**Independent Test**: Pass A2U JSON string → receive rendered DOM tree in container

### Tests for User Story 1

> **Write these tests FIRST, ensure they FAIL before implementation**

- [x] T017 [P] [US1] Unit test for A2U parser in `packages/ui-protocol/src/a2u/__tests__/parser.test.ts`
- [x] T018 [P] [US1] Unit test for A2URenderer in `packages/ui-protocol/src/a2u/__tests__/renderer.test.ts`
- [x] T019 [P] [US1] Unit test for card component in `packages/ui-protocol/src/a2u/components/__tests__/card.test.ts`
- [ ] T020 [P] [US1] Unit test for list component in `packages/ui-protocol/src/a2u/components/__tests__/list.test.ts`
- [ ] T021 [P] [US1] Unit test for button component in `packages/ui-protocol/src/a2u/components/__tests__/button.test.ts`
- [ ] T022 [P] [US1] Unit test for custom component registration in `packages/ui-protocol/src/a2u/__tests__/registry.test.ts`
- [ ] T023 [P] [US1] Integration test for nested components in `packages/ui-protocol/src/a2u/__tests__/integration.test.ts`

### Implementation for User Story 1

- [x] T024 [US1] Implement `parseA2UResponse()` in `packages/ui-protocol/src/a2u/parser.ts` (FR-001)
- [x] T025 [US1] Implement A2URenderer class in `packages/ui-protocol/src/a2u/renderer.ts` (FR-003, FR-007a)
- [x] T026 [US1] Implement component registry with typed API in `packages/ui-protocol/src/a2u/renderer.ts` (FR-005)
- [x] T027 [P] [US1] Implement card renderer in `packages/ui-protocol/src/a2u/components/card.ts` (FR-002)
- [x] T028 [P] [US1] Implement list renderer in `packages/ui-protocol/src/a2u/components/list.ts` (FR-002)
- [x] T029 [P] [US1] Implement button renderer in `packages/ui-protocol/src/a2u/components/button.ts` (FR-002)
- [x] T030 [P] [US1] Implement text renderer in `packages/ui-protocol/src/a2u/components/text.ts` (FR-002)
- [x] T031 [P] [US1] Implement image renderer in `packages/ui-protocol/src/a2u/components/image.ts` (FR-002)
- [x] T032 [P] [US1] Implement form renderer in `packages/ui-protocol/src/a2u/components/form.ts` (FR-002)
- [x] T033 [US1] Create component registry index in `packages/ui-protocol/src/a2u/components/index.ts`
- [x] T034 [US1] Implement action handlers (navigate, submit, update, call_tool) in `packages/ui-protocol/src/a2u/actions.ts` (FR-004)
- [x] T035 [US1] Add DOMPurify sanitization in renderer (FR-007)
- [x] T036 [US1] Add text fallback for parse errors in `packages/ui-protocol/src/a2u/renderer.ts` (FR-006)
- [x] T037 [US1] Add JSDoc with @example to all public A2U exports

**Checkpoint**: A2U Renderer is fully functional - can parse and render A2U JSON independently

---

## Phase 4: User Story 2 - Real-Time Agent-UI Communication (Priority: P2)

**Goal**: Developers can subscribe to typed events for agent state changes and tool executions

**Independent Test**: Subscribe to event → trigger agent action → verify event payload

### Tests for User Story 2

> **Write these tests FIRST, ensure they FAIL before implementation**

- [x] T038 [P] [US2] Unit test for AGUIEventBus in `packages/ui-protocol/src/ag-ui/__tests__/event-bus.test.ts`
- [ ] T039 [P] [US2] Unit test for event type safety in `packages/ui-protocol/src/ag-ui/__tests__/types.test.ts`
- [ ] T040 [P] [US2] Unit test for dispose cleanup in `packages/ui-protocol/src/ag-ui/__tests__/dispose.test.ts`
- [ ] T041 [US2] Integration test for agent-event-bus connection in `packages/ui-protocol/src/ag-ui/__tests__/integration.test.ts`

### Implementation for User Story 2

- [x] T042 [US2] Implement AGUIEventBus class in `packages/ui-protocol/src/ag-ui/event-bus.ts` (FR-008, FR-009, FR-010)
- [x] T043 [US2] Implement typed on() subscription method (FR-009)
- [x] T044 [US2] Implement typed emit() method (FR-010)
- [x] T045 [US2] Implement off() unsubscribe method (FR-011)
- [x] T046 [US2] Implement dispose() cleanup method (FR-012)
- [ ] T047 [US2] Add agent integration hook for automatic event emission (FR-013)
- [ ] T048 [US2] Update `packages/core/src/agent/agent.ts` to accept optional eventBus (FR-013)
- [x] T049 [US2] Add JSDoc with @example to all public AG-UI exports

**Checkpoint**: AG-UI Event Bus is fully functional - can subscribe/emit events independently

---

## Phase 5: User Story 3 - React Hooks for Agent Integration (Priority: P3)

**Goal**: React developers can integrate agents with pre-built hooks and components

**Independent Test**: Render hook in component → call sendMessage → verify state updates

### Tests for User Story 3

> **Write these tests FIRST, ensure they FAIL before implementation**

- [x] T050 [P] [US3] Unit test for useAgent hook in `packages/react/src/hooks/__tests__/use-agent.test.tsx`
- [ ] T051 [P] [US3] Unit test for useAgentStream hook in `packages/react/src/hooks/__tests__/use-agent-stream.test.tsx`
- [x] T052 [P] [US3] Unit test for AgentChat component in `packages/react/src/components/__tests__/AgentChat.test.tsx`
- [ ] T053 [P] [US3] Unit test for A2UComponent wrapper in `packages/react/src/components/__tests__/A2UComponent.test.tsx`
- [ ] T054 [US3] Integration test for full chat flow in `packages/react/src/__tests__/integration.test.tsx`

### Implementation for User Story 3

- [x] T055 [US3] Implement useAgent hook in `packages/react/src/hooks/use-agent.ts` (FR-014, FR-018, FR-019)
- [x] T056 [US3] Implement useAgentStream hook in `packages/react/src/hooks/use-agent-stream.ts` (FR-015) with requestAnimationFrame batching for DOM updates
- [x] T057 [US3] Implement A2UComponent wrapper in `packages/react/src/components/A2UComponent.tsx` (FR-017)
- [x] T058 [US3] Implement AgentChat component in `packages/react/src/components/AgentChat.tsx` (FR-016)
- [x] T059 [US3] Add automatic subscription cleanup on unmount (FR-018)
- [x] T060 [US3] Add memory context configuration support (FR-019)
- [x] T061 [US3] Add customizable styling props to AgentChat (FR-016): CSS custom properties (--agent-chat-bg, --agent-chat-text, etc.) + className/style prop passthrough
- [x] T062 [US3] Create `packages/react/src/index.ts` with public exports
- [x] T063 [US3] Add JSDoc with @example to all public React exports

**Checkpoint**: React integration is fully functional - hooks and components work independently

---

## Phase 6: User Story 4 - Flight Booking Demo (Priority: P4)

**Goal**: Complete demo showcasing all framework capabilities

**Independent Test**: User can search flights → view cards → click Book → see confirmation

### Implementation for User Story 4

- [x] T064 [P] [US4] Create `examples/flight-booking/package.json` with Vite + React
- [x] T065 [P] [US4] Create `examples/flight-booking/vite.config.ts`
- [x] T066 [P] [US4] Create `examples/flight-booking/index.html`
- [x] T067 [US4] Implement search-flights tool in `examples/flight-booking/src/tools/search-flights.ts`
- [x] T068 [US4] Implement book-flight tool in `examples/flight-booking/src/tools/book-flight.ts`
- [x] T069 [US4] Create flight-agent in `examples/flight-booking/src/agents/flight-agent.ts`
- [x] T070 [US4] Create App component in `examples/flight-booking/src/App.tsx` using AgentChat
- [x] T071 [US4] Create main entry in `examples/flight-booking/src/main.tsx`
- [x] T072 [US4] Add responsive CSS styles for mobile support (SC-007)
- [x] T073 [US4] Add example A2U prompts for flight cards in agent instructions

**Checkpoint**: Demo is fully functional - complete flight booking flow works end-to-end

---

## Phase 7: Polish & Documentation

**Purpose**: Quality gates, documentation, and cross-cutting improvements

- [x] T074 [P] Create `packages/ui-protocol/README.md` with API reference and examples
- [x] T075 [P] Create `packages/react/README.md` with API reference and examples
- [x] T076 [P] Create `examples/flight-booking/README.md` with setup instructions
- [x] T077 Update `packages/ui-protocol/src/index.ts` with all public exports
- [ ] T078 Verify bundle size: ui-protocol < 20KB gzipped (Quality Gate)
- [ ] T079 Verify bundle size: react < 15KB gzipped (Quality Gate)
- [ ] T080 Run full test suite and verify >80% coverage (Quality Gate)
- [ ] T081 Run accessibility audit on demo (WCAG 2.1 AA)
- [ ] T082 Validate quickstart.md examples work with implementation
- [ ] T083 Add CHANGELOG.md entries for new packages
- [ ] T084 Run `tsup` analyze to verify no Node.js polyfills in browser bundles (FR-022)
- [ ] T085 Add bundle size check to CI using `size-limit` or equivalent

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup ────────────────────────────────────────┐
                                                       │
Phase 2: Foundational ─────────────────────────────────┤
         (BLOCKS ALL USER STORIES)                     │
                                                       ▼
         ┌─────────────────────────────────────────────┴───────────────────┐
         │                                                                 │
Phase 3: US1 (A2U Renderer) ──┬── Phase 4: US2 (Event Bus) ──┬── Phase 5: US3 (React)
         │ P1 - MVP           │   P2                          │   P3
         │                    │                               │
         └────────────────────┴───────────────────────────────┘
                                                       │
                                                       ▼
Phase 6: US4 (Demo) ───────── Requires US1, US2, US3 complete
         P4
                                                       │
                                                       ▼
Phase 7: Polish ────────────── Requires all user stories
```

### User Story Dependencies

| Story | Depends On | Can Parallelize With |
|-------|------------|---------------------|
| US1 (A2U) | Phase 2 only | US2 (Event Bus) |
| US2 (Event Bus) | Phase 2 only | US1 (A2U) |
| US3 (React) | Phase 2 + US1 + US2 | None (needs both) |
| US4 (Demo) | US1 + US2 + US3 | None |

### Parallel Opportunities

**Phase 1 (all parallel)**:
```bash
T001, T002, T003, T004, T005, T006, T008, T009  # All package setup
```

**Phase 2 (types parallel)**:
```bash
T011, T012, T013, T014, T015  # All type/error definitions
```

**Phase 3 Tests (all parallel)**:
```bash
T017, T018, T019, T020, T021, T022, T023  # All US1 tests
```

**Phase 3 Components (all parallel)**:
```bash
T027, T028, T029, T030, T031, T032  # All component renderers
```

**Phase 4 Tests (all parallel)**:
```bash
T038, T039, T040  # All US2 tests
```

**Phase 5 Tests (all parallel)**:
```bash
T050, T051, T052, T053  # All US3 tests
```

---

## Implementation Strategy

### MVP First (US1 Only)
1. Complete Phase 1 + Phase 2
2. Complete Phase 3: US1 (A2U Renderer)
3. **VALIDATE**: Test A2U parsing and rendering independently
4. Developers can now render agent UI components

### Incremental Delivery
1. **Setup + Foundation** → Infrastructure ready
2. **Add US1** → A2U Renderer → Developers can render agent UI
3. **Add US2** → Event Bus → Developers can track agent state
4. **Add US3** → React → React developers have zero-config integration
5. **Add US4** → Demo → Complete showcase for stakeholders

### Quality Gates Per Story

| Story | Coverage | Bundle | A11y | Docs |
|-------|----------|--------|------|------|
| US1 | >80% | <15KB | N/A | JSDoc ✓ |
| US2 | >80% | <5KB | N/A | JSDoc ✓ |
| US3 | >80% | <15KB | WCAG AA | JSDoc ✓ |
| US4 | N/A | N/A | WCAG AA | README ✓ |

---

## Task Count Summary

| Phase | Tasks | Parallel Tasks | Test Tasks |
|-------|-------|----------------|------------|
| 1: Setup | 9 | 8 | 0 |
| 2: Foundation | 9 | 6 | 1 |
| 3: US1 (A2U) | 21 | 13 | 7 |
| 4: US2 (Events) | 12 | 3 | 4 |
| 5: US3 (React) | 14 | 4 | 5 |
| 6: US4 (Demo) | 10 | 3 | 0 |
| 7: Polish | 12 | 3 | 0 |
| **Total** | **87** | **40** | **17** |

---

## Notes

- [P] = different files, no dependencies - can run in parallel
- [US#] = maps to user story for traceability
- Tests MUST fail before implementation (TDD)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All public APIs require JSDoc with @example

