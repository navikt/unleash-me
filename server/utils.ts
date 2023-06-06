export const ensureEnv = <T extends Record<string, string>>(
  variables: T,
  optional?: (keyof T)[]
) => {
  return Object.entries(variables).reduce(
    (acc: Record<string, string>, [key, value]: [string, string]) => {
      const newVar = process.env[value];
      if (!newVar) {
        if (!optional.includes(key)) {
          console.error(`Could not find env.var. ${value} in env file`);
          process.exit(1);
        } else {
          return acc;
        }
      }
      return {
        ...acc,
        [key]: newVar,
      };
    },
    {}
  ) as T;
};
