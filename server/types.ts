interface IStrategyConstraints {
  values: string[],
  inverted: true,
  operator: 'IN' | 'NOT_IN',
  contextName: 'userId' | 'appName' | 'sessionId',
  caseInsensitive: false
}

export interface IStragegy<T = any> {
  inverted?: true,
  name: string;
  constraints: IStrategyConstraints[];
  parameters: T;
  sortOrder: number;
  id: string;
}

export interface IFeatureTags {
  value: string;
  type: string;
}
export interface IFeatureEnvironment {
  name: string;
  enabled: boolean;
  type: string;
  sortOrder: number;
  strategies: IStragegy[];
}
export interface IFeature {
  type: string;
  name: string;
  createdAt: string;
  lastSeenAt: string;
  stale: boolean;
  environments: IFeatureEnvironment[];
  tags?: IFeatureTags[];
}

export interface IFeatureDescription {
  environments: IFeatureEnvironment[];
  name: string;
  impressionData: boolean;
  description: string;
  project: string;
  stale: boolean;
  createdAt: string;
  lastSeenAt: string | null;
  type: "release" | "experiment" | "operational" | "kill-switch" | "permission";
  variants: any[];
  archived: false;
}
