/// <reference types="vite/client" />

declare const __XR_ENV_BASE__: string;

declare namespace React {
  interface HTMLAttributes<T> {
    'enable-xr'?: boolean;
    'enable-xr-monitor'?: boolean;
  }
}
