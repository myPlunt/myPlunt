interface ImportMetaEnv {
  readonly VITE_API_URL: string
  /** 'staging' on the staging build; shows the staging pill. */
  readonly VITE_APP_VARIANT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
