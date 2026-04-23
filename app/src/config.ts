/**
 * Re:Earth CMS configuration — read from VITE_* env vars at build time.
 *
 * Two project identifiers are needed:
 *   VITE_CMS_PROJECT       — project ID (KSUID) used by the authenticated write API
 *   VITE_CMS_PROJECT_ALIAS — project alias (e.g. "sanpo") used by the public read API
 *                            Falls back to VITE_CMS_PROJECT if not set.
 */
export const CMS = {
  baseUrl:      import.meta.env.VITE_CMS_BASE_URL          as string | undefined,
  workspace:    import.meta.env.VITE_CMS_WORKSPACE         as string | undefined,
  project:      import.meta.env.VITE_CMS_PROJECT           as string | undefined,
  projectAlias: (import.meta.env.VITE_CMS_PROJECT_ALIAS    as string | undefined)
                ?? (import.meta.env.VITE_CMS_PROJECT       as string | undefined),
  spotModel:    (import.meta.env.VITE_CMS_SPOT_MODEL       as string | undefined) ?? 'sanpo-spot',
  token:        import.meta.env.VITE_CMS_TOKEN             as string | undefined,

  get enabled():  boolean { return !!(this.baseUrl && this.project) },
  get writable(): boolean { return this.enabled && !!this.token },
} as const
