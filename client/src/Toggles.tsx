import { partition } from "lodash";
import { useEffect, useMemo, useReducer, useState } from "react";
import { IUserFeature } from "unleash-me-common/types";
import Toggle from "./Toggle";
import { Heading } from "@navikt/ds-react";
import { TestFlaskIcon } from "@navikt/aksel-icons";

enum LoadingState {
  "LOADING",
  "SHOULD_FETCH",
  "SUCCESS",
  "FAIL",
}

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
    if (state.loadingState === LoadingState.SHOULD_FETCH) {
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
          reducer({ loadingState: LoadingState.SHOULD_FETCH });
        }
      })
      .catch((e) => {
        console.log(e);
      })
      .finally(() => reducer({ loadingState: LoadingState.SHOULD_FETCH }));
  };

  return (
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

      <Heading level="1" size="small">
        <TestFlaskIcon title="a11y-title" />
        Eksperiment
      </Heading>
      {experiment.length > 0 &&
        experiment.map((feature) => (
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
  );
};

export default Toggles;
