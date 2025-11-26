// Minimal stub of react/jsx-runtime for Deno bundling in the Edge Function.
// The server code doesn't render JSX; this file satisfies imports that may be
// injected by tooling and returns a simple object representation.

export function jsx(type: any, props: any, key?: any) {
  return { $$jsx: true, type, props: props || {}, key };
}

export function jsxs(type: any, props: any, key?: any) {
  return { $$jsx: true, type, props: props || {}, key };
}

export function jsxDEV(type: any, props: any, key?: any) {
  return jsx(type, props, key);
}
