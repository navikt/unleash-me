import dotenv from "dotenv";
import { ensureEnv } from "./utils.js";
import {
  IFeature,
  IFeatureDescription,
  IStragegy,
  IStragegyUserWithId,
} from "./types";
import { IUserFeature } from "unleash-me-common/types.js";
dotenv.config();

const env = ensureEnv({
  unleashToken: "UNLEASH_TOKEN",
  unleashServer: "UNLEASH_SERVER",
  unleashProject: "UNLEASH_PROJECT",
  unleashTag: "UNLEASH_TAG",
});

const defaultHeaders = {
  Authorization: env.unleashToken,
  "Content-Type": "application/json",
};

const projectFetch = async (endpoint: string, opts: RequestInit = {}) => {
  const url = `${env.unleashServer}/api/admin/projects/${env.unleashProject}${endpoint}`;
  const headers = { headers: defaultHeaders, ...opts };
  // console.log("Requesting", url);
  // console.log("with headers", headers);
  return await fetch(url, headers).then((resp) => {
    if (resp.ok) {
      return resp.json();
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
    const userWithIdStrategy = feature.environments
      .find((env) => env.name === environment)
      ?.strategies.find((strat) => strat.name === "userWithId");

    if (!userWithIdStrategy) {
      return;
    }
    const activeUsers = userWithIdStrategy.parameters.userIds.split(",");

    return {
      name: feature.name,
      enabled: activeUsers.includes(userId),
      stategyId: userWithIdStrategy.id,
      description: feature.description,
      type: feature.type
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
  console.log(updatedStrategy);
  console.log(featureName);
  return projectFetch(
    `/features/${featureName}/environments/${enviroment}/strategies/${strategyId}`,
    { method: "PUT", body: JSON.stringify(updatedStrategy) }
  );
};

const isWithUserStrategy = (
  strategy: IStragegy
): strategy is IStragegy<IStragegyUserWithId> => {
  return strategy.parameters?.userIds !== undefined;
};

export const setToggle = async (
  enviroment: string,
  userId: string,
  featureName: string,
  strategyId: string,
  enabled: boolean
) => {
  const feature = await getFeature(featureName);
  const strategy = feature.environments
    .find((e) => e.name === enviroment)
    ?.strategies.find((s) => s.id === strategyId);

  return new Promise((resolve, reject) => {
    if (strategy && isWithUserStrategy(strategy)) {
      const activeUsers = strategy.parameters.userIds
        .split(",")
        .filter((user) => !!user);

      const newUsersInList = enabled
        ? [...activeUsers, userId]
        : activeUsers.filter((user) => user !== userId);

      console.log("newUsersInList", newUsersInList);

      updateStrategy(enviroment, featureName, strategyId, {
        ...strategy,
        parameters: {
          ...strategy.parameters,
          userIds: newUsersInList.join(","),
        },
      })
        .then(resolve)
        .catch(reject);
    } else {
      reject();
    }
  });
};
