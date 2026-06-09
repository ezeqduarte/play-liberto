# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

This repository is currently a blank slate. There is no source code, build system, package manifest, test suite, or README yet. The working directory contains only:

- `skills-lock.json` — pins external Claude Code skills used in this project.
- `.claude/.agents/skills/` — local copy of the pinned skills.

It is not a git repository (no `.git/` present), so git-based workflows are unavailable until `git init` is run.

## Pinned skills

`skills-lock.json` pins `frontend-design` from the `anthropics/skills` GitHub source. This signals the project's intended direction is frontend / UI work. When the user asks for design or UI generation, prefer the `frontend-design` skill's workflow.

The Pencil MCP server is configured (see MCP instructions in the session): `.pen` design files must be accessed only through `pencil` MCP tools, never via `Read`/`Grep`. Always call `get_editor_state(include_schema: true)` before other Pencil tools if the schema isn't already in context.

## Before adding code

Because nothing about stack, conventions, or tooling has been established yet, ask the user (or confirm from their first instruction) before assuming:

- Language / framework (the pinned skill suggests a frontend stack, but nothing is fixed).
- Package manager (`npm` / `pnpm` / `yarn` / `bun`).
- Whether to `git init` as part of the first task.

Once a stack is chosen and scaffolded, replace this section with the real build/lint/test commands and an architecture overview.
