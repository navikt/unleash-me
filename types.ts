export interface IUserFeature {
  enabled: boolean;
  description: string;
  name: string;
  stategyId: string;
  type: 'kill-switch' | 'release';
}
