import { partition } from "lodash";
import { useEffect, useMemo, useReducer, useState } from "react";
import { IUserFeature } from "unleash-me-common/types";
import Toggle from "./Toggle";
import { BodyShort, Heading } from "@navikt/ds-react";
import { LoadingState } from "./util";
import LoadingWrapper from "./components/loading-wrapper";

interface IState {
  loadingState: LoadingState;
  features: IUserFeature[];
}

const initialState = {
  loadingState: LoadingState.SHOULD_FETCH,
  features: [],
};

type IReducer = React.Reducer<IState, Partial<IState>>;

const stateReducer: IReducer = (state, action) => {
  return { ...state, ...action };
};

const Toggles = ({}) => {
  const [state, reducer] = useReducer(stateReducer, initialState);

  const [experiment, features] = useMemo(() => {
    return partition(
      state.features,
      (feature) => feature.type === "experiment"
    );
  }, [state.features]);

  useEffect(() => {
    if (
      [LoadingState.SHOULD_FETCH, LoadingState.SHOULD_SILENT_FETCH].includes(
        state.loadingState
      )
    ) {
      fetch("/api/features")
        .then((resp: Response) => {
          if (resp.ok) {
            return resp.json();
          } else {
            reducer({ ...initialState, loadingState: LoadingState.FAIL });
          }
        })
        .then((data: IUserFeature[]) => {
          reducer({ loadingState: LoadingState.SUCCESS, features: data });
        });
    }
  }, [state]);

  const updateToggle = async (
    featureName: string,
    stategyId: string,
    enable: boolean
  ) => {
    return fetch(`/api/features/${featureName}/${stategyId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ enable: enable }),
    })
      .then((resp) => {
        if (resp.ok) {
          reducer({ loadingState: LoadingState.SHOULD_SILENT_FETCH });
        }
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() =>
        reducer({ loadingState: LoadingState.SHOULD_SILENT_FETCH })
      );
  };

  return (
    <LoadingWrapper loadingState={state.loadingState}>
      <div>
        {features.map((feature) => (
          <Toggle
            key={feature.name}
            enabled={feature.enabled}
            stategyId={feature.stategyId}
            name={feature.name}
            onChangeFeature={updateToggle}
            type={feature.type}
          >
            {feature.description}
          </Toggle>
        ))}

        {experiment.length > 0 && (
          <div>
            <Heading level="2" size="small">
              Eksperiment
            </Heading>
            <BodyShort>
              Funksjoner som du kan teste før de er helt ferdige
            </BodyShort>

            {experiment.map((feature) => (
              <Toggle
                key={feature.name}
                enabled={feature.enabled}
                stategyId={feature.stategyId}
                name={feature.name}
                onChangeFeature={updateToggle}
                type={feature.type}
              >
                {feature.description}
              </Toggle>
            ))}
          </div>
        )}
      </div>
    </LoadingWrapper>
  );
};

export default Toggles;
