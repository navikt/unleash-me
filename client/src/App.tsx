import "@navikt/ds-css";
import "@navikt/ds-css-internal";
import "./App.css";
import Toggles from "./Toggles";
import { Alert, BodyShort, Heading } from "@navikt/ds-react";

function App() {
  return (
    <div className="App">
      <Heading level="1" size="small">
        Funksjoner
      </Heading>

      <BodyShort size="small">
        Her kan du skru av/på funksjoner. Det kan ta opp til ett minutt før
        endringen trer i kraft. Da må du oppdatere siden.
      </BodyShort>

      <Toggles />
    </div>
  );
}

export default App;
