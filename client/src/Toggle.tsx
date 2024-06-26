import { Switch } from "@navikt/ds-react";
import { useState } from "react";
import { IUserFeature } from "unleash-me-common/types";

interface IProps {
  enabled: boolean;
  name: string;
  stategyId: string;
  children: string;
  type: IUserFeature["type"];
  onChangeFeature: (
    featureName: string,
    stategyId: string,
    newState: boolean
  ) => Promise<void>;
}

const Toggle: React.FC<IProps> = ({
  enabled,
  name,
  stategyId,
  children,
  onChangeFeature,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const onClick = () => {
    setIsLoading(true);
    onChangeFeature(name, stategyId, !enabled).finally(() =>
      setIsLoading(false)
    );
  };

  const [title, description] = children.split(";");

  return (
    <Switch
      className="toggle"
      loading={isLoading}
      defaultChecked={enabled}
      onClick={onClick}
      description={description}
    >
      {title}
    </Switch>
  );
};

export default Toggle;
