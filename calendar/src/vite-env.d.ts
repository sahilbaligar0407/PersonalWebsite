/// <reference types="vite/client" />

// The front end carries no secrets and no configurable env: everything it needs
// comes from the server over same-origin /api calls. The one value it does read
// is Vite's own BASE_URL, which is "/Calendar/" in production and "/" in dev.
interface ImportMetaEnv {
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
