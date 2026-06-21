import { useEffect, useState } from "preact/hooks";

export type VisitsState = {
  visits: number;
  lastVisitor?: string;
};

type VisitCounterProps = {
  initialState: VisitsState;
};

export default function VisitCounter(
  { initialState }: VisitCounterProps,
) {
  const [state, setState] = useState<VisitsState>(initialState);

  useEffect((): void => {
    void refresh();
  }, []);

  async function refresh(): Promise<void> {
    const response = await fetch("/api/visits");
    const nextState = await response.json() as VisitsState;
    setState(nextState);
  }

  async function registerVisit(): Promise<void> {
    const response = await fetch("/api/visits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ visitorId: "browser" }),
    });
    const nextState = await response.json() as VisitsState;
    setState(nextState);
  }

  return (
    <>
      <div id="count">{state.visits}</div>
      <p id="msg">{state.lastVisitor ? `Último: ${state.lastVisitor}` : ""}</p>
      <button id="btn" type="button" onClick={registerVisit}>
        Registrar visita
      </button>
    </>
  );
}
