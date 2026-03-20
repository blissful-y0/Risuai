# Codebase Documentation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create internal docs that let a new LLM quickly understand the repository and locate the right files for common feature work.

**Architecture:** Use a three-document structure under `docs/`: one landing page, one architecture overview, and one task-routing workmap. Keep architecture context separate from execution guidance so a new agent can scan or dive as needed.

**Tech Stack:** Markdown, repository source files, existing README and project structure

---

### Task 1: Create the internal docs entrypoint

**Files:**
- Create: `docs/index.md`
- Reference: `README.md`

**Step 1: Write the landing-page outline**

Include:

- folder purpose
- reading order
- what each document is for
- fast-start instructions for new LLM sessions

**Step 2: Save the file**

Write `docs/index.md` with links to `overview.md` and `llm-workmap.md`.

**Step 3: Review for discoverability**

Confirm a new reader can understand what to read first in less than 30 seconds.

### Task 2: Create the architecture overview

**Files:**
- Create: `docs/overview.md`
- Reference: `src/main.ts`
- Reference: `src/App.svelte`
- Reference: `src/ts/bootstrap.ts`
- Reference: `src/ts/stores.svelte.ts`
- Reference: `src/ts/storage/database.svelte.ts`
- Reference: `src/ts/process/index.svelte.ts`
- Reference: `src/ts/process/request/request.ts`
- Reference: `src/ts/model/modellist.ts`

**Step 1: Capture the runtime flow**

Describe:

- startup sequence
- top-level app composition
- chat request flow
- state ownership

**Step 2: Capture major directory responsibilities**

Summarize key folders without trying to list every file.

**Step 3: Capture extension points and boundaries**

Document:

- plugins
- modules
- MCP
- memory systems
- Tauri and server boundaries

**Step 4: Review for wrong-assumption prevention**

Make sure the document warns about:

- lack of router-first architecture
- centralized mutable state
- wide blast radius of process-layer changes

### Task 3: Create the LLM workmap

**Files:**
- Create: `docs/llm-workmap.md`
- Reference: `src/lib/ChatScreens/*`
- Reference: `src/lib/Setting/*`
- Reference: `src/ts/process/*`
- Reference: `src/ts/plugins/*`
- Reference: `src-tauri/src/main.rs`
- Reference: `server/node/server.cjs`

**Step 1: Build task-to-file routing**

Add sections for:

- chat UI
- settings
- prompting/generation
- providers
- plugins
- memory/lorebook
- import/export
- desktop/native
- server behavior

**Step 2: Add risk guidance**

List the files and modules that are easy to break and why.

**Step 3: Add verification guidance**

Document baseline commands such as:

```bash
pnpm check
pnpm test
```

**Step 4: Review for execution usefulness**

Confirm a new LLM can map a task to a first reading list quickly.

### Task 4: Record the design and planning artifacts

**Files:**
- Create: `docs/plans/2026-03-12-codebase-docs-design.md`
- Create: `docs/plans/2026-03-12-codebase-docs.md`

**Step 1: Save the approved design**

Document goal, audience, structure, principles, and success criteria.

**Step 2: Save the implementation plan**

Document the concrete document-writing tasks and review goals.

**Step 3: Cross-check paths**

Confirm all referenced output files match the final doc structure.

### Task 5: Validate the docs

**Files:**
- Review: `docs/index.md`
- Review: `docs/overview.md`
- Review: `docs/llm-workmap.md`

**Step 1: Check internal consistency**

Verify:

- file names match
- reading order is coherent
- overview and workmap do not duplicate excessively

**Step 2: Run repository-safe validation**

Run:

```bash
test -f docs/index.md
test -f docs/overview.md
test -f docs/llm-workmap.md
```

**Step 3: Optional follow-up**

If this doc set proves useful, add future docs for:

- provider-specific deep dives
- persistence/save compatibility notes
- plugin system internals
