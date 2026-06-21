# iFactory Product (seed template)

Template for a **factory-managed product repo** — not the orchestrator
(`iFactoryUI`). Agents implement features here via PRs on epic branches; Gate B
merges to `main`.

```bash
deno task dev
deno task test
```

## Register with the factory

1. Create or push this repo under `iLibertyTec`
2. War Room **Projetos** → register `iLibertyTec/<this-repo>` + vision charter
3. Ensure the GitHub App installation includes this repository (or “All repos”)
4. Optional: set `deploy_app` in project config for the product Deno Deploy app

See **`docs/FACTORY_OPERATIONS.md`** and **`docs/GITHUB_APP.md`** in the
orchestrator repo.

Deploy example: Deno Deploy app `ifactory-product`, entrypoint `main.ts`.
