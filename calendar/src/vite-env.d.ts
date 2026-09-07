/// <reference types="vite/client" />

// No client-side secrets anymore — auth, DB and AI all go through the backend API.
interface ImportMetaEnv {
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
