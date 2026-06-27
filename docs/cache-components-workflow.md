# Cache Components Workflow

Use this when adding public server-rendered data.

1. Put shared public Convex reads in `lib/cached-public-data.ts`.
2. Add `'use cache'` and `cacheLife("minutes")` inside each cached helper.
3. Keep request-specific redirects, auth, and dashboard reads uncached.
4. Use `Promise.all` for independent page reads.
5. Keep default `<Link>` prefetch under `partialPrefetching`; only add `prefetch={true}` when the destination has cached content worth downloading before click.
6. Do not use `prefetch = "allow-runtime"` unless the route has useful request-dependent cached content and enough traffic to justify per-link server work.
7. Run `npm run lint` and `npm run build` after cache changes.

Until Next cache tags are invalidated from Convex writes, avoid `hours` or `days` for editable public content.
