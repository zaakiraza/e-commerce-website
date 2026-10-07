# Seed / UI data (not API)

Put catalogs, enums, and static lists here (e.g. `categories.ts`).

Do **not** export these from `src/api.ts` or `src/mock/api.ts` as fake operationIds —
Deploy rewrites `api.ts` to the OpenAPI live client and mock-only exports break the build.
