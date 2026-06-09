# TODO

- [ ] Fix admin authentication failing with "Invalid admin credentials" even after creating admin.
  - [ ] Review localStorage admin key usage and verify credentials logic.
  - [ ] Add migration/reset behavior for mismatched stored admin payloads.
  - [ ] Improve AdminAuth error messaging to guide user to recreate admin when payload shape is stale.
- [ ] Run `npm test` / `npm run build` (or equivalent) and verify admin login flow manually.
