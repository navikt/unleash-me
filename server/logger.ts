import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  defaultMeta: { application: "unleash-me" },
  transports: [
    new winston.transports.Console({
      format: winston.format.json(),
    }),
  ],
});

export default logger;
