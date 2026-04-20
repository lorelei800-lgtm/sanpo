/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CMS_BASE_URL:   string
  readonly VITE_CMS_PROJECT:    string
  readonly VITE_CMS_SPOT_MODEL: string
  readonly VITE_CMS_TOKEN:      string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
