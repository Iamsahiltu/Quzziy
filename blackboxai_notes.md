Admin auth issue notes:

- AdminAuth uses verifyAdminCredentials(loginId.trim(), loginPass)
- DB stores admin in localStorage key `quiz_contest_admin` with shape { adminId, password, createdAt }
- Potential failure causes:
  - Stored admin payload shape mismatch (older app versions may store {id, pass} or string)
  - Password mismatch due to whitespace; AdminAuth trims ID but not password
  - Stale adminExists / storage sync across tabs isn't reason for wrong creds

Planned fix:

- Add backward-compatible parsing/migration in getAdminAccount/verifyAdminCredentials.
- Normalize inputs: trim both adminId and password (optional but recommended).
- If stored admin payload is invalid/stale, treat as non-existent and force recreate with clear error.
