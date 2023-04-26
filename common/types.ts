export interface IUserFeature {
  enabled: boolean;
  description: string;
  name: string;
  stategyId: string;
  type: "release" | "experiment" | "operational" | "kill-switch" | "permission";
}
