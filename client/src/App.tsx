import "@navikt/ds-css";
import "@navikt/ds-css-internal";
import "./App.css";
import Toggles from "./Toggles";
import { Alert, BodyShort, Heading } from "@navikt/ds-react";

function App() {
  return (
    <div className="App">
      <Heading level="1" size="medium">
        Funksjoner
      </Heading>
      <BodyShort>Her kan du skru av/på funksjoner</BodyShort>

      <Toggles />

      <div className="alert">
        <Alert variant="info">
          Det kan ta noen minutter før endringer trer i kraft.
        </Alert>
      </div>
    </div>
  );
}

export default App;
