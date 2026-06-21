import AppChrome from "../components/AppChrome.tsx";
import VisitCounter from "../islands/VisitCounter.tsx";
import { getSharedVisitsService } from "../visits_state.ts";

export default function HomePage() {
  const initialState = getSharedVisitsService().getState();

  return (
    <AppChrome>
      <VisitCounter initialState={initialState} />
    </AppChrome>
  );
}
