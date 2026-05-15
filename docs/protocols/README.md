# Protocol-Driven Development (PDD) — ChordThing

This directory contains machine-enforceable protocol specifications for ChordThing components.

Inspired by [Protocol-Driven Development](https://arxiv.org/abs/2605.12981) (He & Yu, 2026), each protocol defines the admissible implementation space for a component through structural, behavioral, and operational invariants.

> **Code is transient; protocol is sovereign.**

## Protocol Format

Each protocol follows the triplet **P = (S, B, O)**:

| Invariant | Description | Verified By |
|-----------|-------------|-------------|
| **S** — Structural | Type contracts, DOM shape, data formats | TypeScript compiler, DOM assertions |
| **B** — Behavioral | Semantic properties that must hold for all inputs | Unit tests, property-based tests (fast-check), E2E tests |
| **O** — Operational | Performance, side-effect, resource boundaries | Performance tests, mutation testing, manual review |

## Protocol Index

| Protocol | Module | Status | Tests |
|----------|--------|--------|-------|
| [Typer](typer.md) | `frontend/src/typer.ts` | Draft | `frontend/src/typer.test.ts` |
| [Text Renderer](text-renderer.md) | `frontend/src/textRenderer.ts` | Draft | `frontend/src/textRenderer.test.ts` |
| [Chord Serialization](chord-serialization.md) | `frontend/src/device/chordSerialization.ts` | Draft | `frontend/src/device/chordSerialization.test.ts` |
| [Chord Manager](chord-manager.md) | `frontend/src/chordManager.ts` | Draft | — |

## Relationship to Other Docs

- **`TEST_ORACLE.md`** at repo root — Implementation-specific correctness criteria for a particular change (e.g., Issue #12). Oracles are temporary; protocols are permanent.
- **`docs/adr/`** — Records *decisions* (why we chose X). Protocols record *contracts* (what X must satisfy).
- **`frontend/CONTEXT.md`** — Domain glossary and high-level invariants. Protocols are formalized, testable refinements of those invariants.

## When to Write a Protocol

1. A module has behavior that must be preserved across refactors
2. A module handles untrusted input (user data, device output, network responses)
3. A module is a candidate for AI-generated or alternative implementations
4. Mutation testing reveals weak oracles

## Evidence Chain

Each protocol links to its verification artifacts:
- Test file(s)
- Mutation score (Stryker / cargo-mutants)
- Property-based test coverage
