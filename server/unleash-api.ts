import dotenv from "dotenv";
import { ensureEnv } from "./utils.js";
import { IFeature, IFeatureDescription, IStragegy } from "./types";
import { IUserFeature } from "unleash-me-common/types.js";
import lodash from "lodash";
import logger from "./logger.js";
dotenv.config();

const env = ensureEnv({
  unleashToken: "UNLEASH_TOKEN",
  unleashApi: "UNLEASH_API",
  unleashProject: "UNLEASH_PROJECT",
  unleashTag: "UNLEASH_TAG",
});

const defaultHeaders = {
  Authorization: env.unleashToken,
  "Content-Type": "application/json",
};

const projectFetch = async (endpoint: string, opts: RequestInit = {}) => {
  const url = `${env.unleashApi}/admin/projects/${env.unleashProject}${endpoint}`;
  const headers = { headers: defaultHeaders, ...opts };
  logger.log("info", { url, method: "GET" });
  return await fetch(url, headers).then((resp) => {
    if (resp.ok) {
      return resp.json();
    } else {
      return resp.text().then((err) => {
        logger.log("error", { url, message: err });
        throw new Error(err);
      });
    }
  });
};

const getAllFeaturesForProject = async () => {
  return await projectFetch("/features").then(
    (data: { features: IFeature[]; version: number }) => {
      return data.features;
    }
  );
};

const getFeature = async (featureName: string) => {
  return await projectFetch(`/features/${featureName}`).then(
    (data: IFeatureDescription) => {
      return data;
    }
  );
};

export const getStrategy = async (
  featureName: string,
  enviroment: string,
  strategyId: string
) => {
  const feature = await getFeature(featureName);
  const env = feature.environments.find((curEnv) => curEnv.name === enviroment);
  if (!env) throw new Error("Enviroment not found");
  const strategy = env.strategies.find((strat) => strat.id === strategyId);
  return strategy;
};

const filterFeatures =
  (enviroment: string, unleashTag: string) =>
  (feature: IFeature): boolean => {
    return (
      !feature.stale &&
      !!feature.tags &&
      feature.tags.some((tag) => tag.value === unleashTag) &&
      feature.environments
        .filter((env) => env.name === enviroment)
        .filter((env) => env.enabled).length > 0
    );
  };

const createUserFeature =
  (userId: string, environment: string) =>
  (feature: IFeatureDescription): IUserFeature | undefined => {
    const firstStrategyWithUserConstraint = lodash.first(
      feature.environments
        .find((env) => env.name === environment)
        ?.strategies.filter((strat) =>
          strat.constraints.find(
            (constraint) => constraint.contextName === "userId"
          )
        )
    );

    if (!firstStrategyWithUserConstraint) {
      throw new Error("No suitable strategy found");
    }

    const activeConstraint = firstStrategyWithUserConstraint.constraints.find(
      (constraint) => constraint.contextName === "userId"
    );

    return {
      name: feature.name,
      enabled: activeConstraint.inverted
        ? !activeConstraint.values.includes(userId)
        : activeConstraint.values.includes(userId),
      stategyId: firstStrategyWithUserConstraint.id,
      description: feature.description,
      type: feature.type,
    };
  };

export const getFeaturesForUser = async (
  userId: string,
  enviroment: string
) => {
  const features = await getAllFeaturesForProject()
    .then((features) =>
      features.filter(filterFeatures(enviroment, env.unleashTag))
    )
    .then((features) =>
      Promise.all(features.map((feat) => getFeature(feat.name)))
    );

  const userFeatures = features
    .map(createUserFeature(userId, enviroment))
    .filter((feat) => !!feat);

  return userFeatures;
};

export const updateStrategy = async (
  enviroment: string,
  featureName: string,
  strategyId: string,
  updatedStrategy: IStragegy
) => {
  return projectFetch(
    `/features/${featureName}/environments/${enviroment}/strategies/${strategyId}`,
    { method: "PUT", body: JSON.stringify(updatedStrategy) }
  );
};

const updateConstraint = async (
  enviroment: string,
  featureName: string,
  userId: string,
  strategy: IStragegy,
  enable: boolean
) => {
  const constraintValues = strategy.constraints[0].values;
  const newConstraintValues =
    enable !== strategy.constraints[0].inverted
      ? lodash.uniq([...constraintValues, userId])
      : constraintValues.filter((user) => userId != user);

  const newStrategy = {
    ...strategy,
    constraints: [
      {
        ...strategy.constraints[0],
        values: newConstraintValues,
      },
    ],
  };

  return projectFetch(
    `/features/${featureName}/environments/${enviroment}/strategies/${strategy.id}`,
    {
      method: "PUT",
      body: JSON.stringify(newStrategy),
    }
  ).then(() => {
    logger.log("info", {
      user: userId,
      unleashFeatureName: featureName,
      unleashEnabled: enable,
      unleashToggle: enable ? 1 : -1,
      message: "Unleash toggle changed",
    });
  });
};

export const setToggle = async (
  enviroment: string,
  userId: string,
  featureName: string,
  strategyId: string,
  enable: boolean
) => {
  const feature = await getFeature(featureName);
  const strategy = feature.environments
    .find((e) => e.name === enviroment)
    ?.strategies.find((s) => s.id === strategyId);

  return updateConstraint(enviroment, feature.name, userId, strategy, enable);
};
