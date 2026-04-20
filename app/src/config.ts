/**
 * Re:Earth CMS configuration — read from VITE_* env vars at build time.
 */
export const CMS = {
  baseUrl:   import.meta.env.VITE_CMS_BASE_URL       as string | undefined,
  workspace: import.meta.env.VITE_CMS_WORKSPACE      as string | undefined,
  project:   import.meta.env.VITE_CMS_PROJECT        as string | undefined,
  spotModel: (import.meta.env.VITE_CMS_SPOT_MODEL    as string | undefined) ?? 'sanpo-spot',
  token:     import.meta.env.VITE_CMS_TOKEN          as string | undefined,

  get enabled():  boolean { return !!(this.baseUrl && this.project) },
  get writable(): boolean { return this.enabled && !!this.token },
} as const
