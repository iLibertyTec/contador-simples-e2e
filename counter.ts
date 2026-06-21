export type VisitState = {
  visits: number;
  lastVisitor?: string;
  updatedAt: string;
};

export class VisitCounter {
  #visits: number = 0;
  #lastVisitor?: string;

  get state(): VisitState {
    return {
      visits: this.#visits,
      lastVisitor: this.#lastVisitor,
      updatedAt: new Date().toISOString(),
    };
  }

  incrementVisit(): VisitState {
    this.#visits += 1;
    return this.state;
  }

  recordVisit(visitorId?: string): VisitState {
    this.#visits += 1;
    if (visitorId) {
      this.#lastVisitor = visitorId;
    }
    return this.state;
  }

  reset(): void {
    this.#visits = 0;
    this.#lastVisitor = undefined;
  }
}

export function formatCounterMessage(state: VisitState): string {
  const n: number = state.visits;
  if (n === 0) return "Nenhuma visita registrada.";
  if (n === 1) return "Uma visita registrada.";
  return `${n} visitas registradas.`;
}
