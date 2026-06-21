import type { ComponentChildren } from "preact";

type AppChromeProps = {
  children: ComponentChildren;
};

export default function AppChrome(
  { children }: AppChromeProps,
) {
  return (
    <div class="card">
      <h1>Visit Analytics</h1>
      <p>Evolved by the iFactory autonomous team.</p>
      {children}
      <div class="badge">iFactory Product · Deno Deploy</div>
    </div>
  );
}
