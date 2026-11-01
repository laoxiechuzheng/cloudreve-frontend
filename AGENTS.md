Requirements ledger: [REQUIREMENTS.md](REQUIREMENTS.md) (private, untracked on public checkouts).

# Frontend Notes

- Based on the exact frontend submodule for Cloudreve 3.8.3; preserve API contracts, permission checks and all route formats.
- The accepted public share theme lives in public/share-ui; regular app uses React 16 and Material UI 4. Reuse dependencies and icons.
- New app UI uses indigo primary, neutral surfaces, teal/amber status accents, light/dark modes and responsive operational layouts. No marketing hero.
- Verify behavioral additions with tests, then build and render desktop/mobile/dark views. Do not commit secrets, user data or requirements ledgers.
