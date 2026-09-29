# Coding Standards

TypeScript strict mode; avoid `any`, unchecked casts, hidden globals, and non-null assertions without invariant proof. Prefer small modules, pure domain functions, explicit result/error types, dependency injection at edges, and structured logging. Validate at trust boundaries and narrow types afterward.

React components are semantic, keyboard accessible, responsive, and respect reduced motion. Effects clean up. Server state, form state, and offline state stay distinct. SQL uses parameters and tenant predicates. Tests name behavior, avoid shared mutable fixtures, and cover failure/state transitions—not implementation trivia.
