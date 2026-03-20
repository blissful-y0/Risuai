# Codebase Documentation Design

**Date:** 2026-03-12

## Goal

Create internal documentation that lets a new LLM enter the repository and become productive quickly without re-discovering the project structure from scratch.

## Audience

- primary: LLM agents entering the repository cold
- secondary: engineers doing feature work across unfamiliar parts of the codebase

## Problem

Existing top-level docs describe the product and user-facing features, but they do not provide a reliable development map for runtime entry points, architectural boundaries, and task-to-file routing.

## Proposed Documentation Structure

### `docs/index.md`

Purpose:

- act as the landing page for internal docs
- define reading order
- point to the architecture and workmap documents

### `docs/overview.md`

Purpose:

- explain the codebase shape
- explain startup/runtime flow
- explain the main data and state model
- explain architectural boundaries and extension points

### `docs/llm-workmap.md`

Purpose:

- route task types to likely file entry points
- surface high-risk files and common change patterns
- give verification guidance

## Design Principles

- optimize for fast task entry, not prose completeness
- prefer runtime entry points over directory listing alone
- call out risk and blast radius explicitly
- separate architecture context from task routing
- assume the reader has low project context

## Non-Goals

- exhaustive API reference
- user-facing product documentation
- deep provider-by-provider specs
- historical design narrative

## Success Criteria

- a new LLM can identify the correct starting files for common task types
- a new LLM can avoid wrong assumptions about routing, state ownership, and request flow
- the docs reduce repeated codebase rediscovery during sub-feature work
