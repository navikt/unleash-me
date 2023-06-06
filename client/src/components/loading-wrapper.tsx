import { Loader } from "@navikt/ds-react";
import { LoadingState } from "../util";

interface IProps {
  children: React.ReactElement;
  loadingState: LoadingState;
}
const LoadingWrapper: React.FC<IProps> = ({ loadingState, children }) => {
  if (
    [LoadingState.SHOULD_FETCH, LoadingState.LOADING].includes(loadingState)
  ) {
    return (
      <div className="loader">
        <Loader size="xlarge" title="laster..." />
      </div>
    );
  }

  return children;
};

export default LoadingWrapper;
