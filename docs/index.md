# Risuai Docs Index

This folder is for internal development context, not end-user documentation.

If a new LLM or engineer enters this repository, read in this order:

1. [overview.md](./overview.md)
2. [llm-workmap.md](./llm-workmap.md)

## What Each Doc Is For

- [overview.md](./overview.md)
  Explains the codebase shape, runtime flow, state model, and architectural boundaries.
- [llm-workmap.md](./llm-workmap.md)
  Explains where to start for each type of task, what files are likely involved, what is risky, and how to verify changes.

## Fast Start

If the task is broad or unclear:

1. Read [overview.md](./overview.md)
2. Find the relevant task type in [llm-workmap.md](./llm-workmap.md)
3. Open the listed entry files first
4. Confirm whether the change touches `DBState.db`, prompt generation, provider requests, plugins, or Tauri

## Project Reality Check

This project is not router-first and not narrowly layered.

- UI state is largely controlled by global Svelte stores.
- Core application data is centralized in `DBState.db`.
- Chat behavior is heavily driven by `src/ts/process`.
- Many features cross UI, storage, request, and plugin boundaries at once.

Do not assume a change is local to one component until you check the full flow.

## Related Planning Docs

- [2026-03-12-codebase-docs-design.md](./plans/2026-03-12-codebase-docs-design.md)
- [2026-03-12-codebase-docs.md](./plans/2026-03-12-codebase-docs.md)
