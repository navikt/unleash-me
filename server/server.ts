import { getFeaturesForUser, setToggle } from "./unleash-api.js";
import cors from "cors";
import express, { RequestHandler } from "express";
import dotenv from "dotenv";
import path from "path";
import { ensureEnv } from "./utils.js";
import jwt from "jsonwebtoken";
import jwks from "jwks-rsa";
import logger from "./logger.js";

dotenv.config();

const NODE_ENV = process.env["NODE_ENV"];
const DIR_NAME = path.resolve();
const PORT = process.env["PORT"] ?? 8080;

const env = ensureEnv(
  {
    unleashEnvironment: "UNLEASH_ENVIRONMENT",
    azureTennant: "AZURE_APP_TENANT_ID",
  },
  NODE_ENV ? ["azureTennant"] : []
);

interface IJwtPayload extends jwt.JwtPayload {
  NAVident: string;
  name: string;
}
interface IJwt {
  header: jwt.JwtHeader;
  payload: IJwtPayload;
  signature: string;
}

const jwkClient = jwks({
  jwksUri: `https://login.microsoftonline.com/${env.azureTennant}/discovery/v2.0/keys`,
});

const userMiddleware: RequestHandler = async (req, res, next) => {
  logger.log("info", { method: req.method, url: req.url });
  if (NODE_ENV === "development") {
    res.locals.NavIdent = "bjorn";
    next();
  } else {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(403).send("missing jwt token");
    } else {
      const token = authHeader.split(" ")[1];
      const decodedToken = jwt.decode(token, { complete: true }) as IJwt;
      const key = await jwkClient.getSigningKey(decodedToken.header.kid);
      const sigingkey = key.getPublicKey();

      jwt.verify(token, sigingkey, (err) => {
        if (err) return res.status(403).send(err);
      });

      if (decodedToken) {
        const ident = decodedToken.payload.NAVident;
        if (!ident) return res.status(403).send("Missing NAVIdent");
        res.locals.NavIdent = ident;
        next();
      }
    }
  }
};

const createServer = async () => {
  const app = express();
  app.use(express.static("public"));

  app.use(cors());
  app.use(express.json());

  app.get("/api/features", userMiddleware, async (_req, res) => {
    try {
      const features = await getFeaturesForUser(
        res.locals.NavIdent,
        env.unleashEnvironment
      );
      res.send(features);
    } catch (e) {
      logger.log("error", {
        message: "Could not connect to Unleash",
        error: e,
      });
      res.status(500).send({
        error: "Could not connect to Unleash",
        reason: JSON.stringify(e),
      });
    }
  });

  app.put(
    "/api/features/:featureName/:strategyId",
    userMiddleware,
    async (req, res) => {
      const { featureName, strategyId } = req.params;
      const { enable } = req.body;

      setToggle(
        env.unleashEnvironment,
        res.locals.NavIdent,
        featureName,
        strategyId,
        enable
      )
        .then((_resp: any) => {
          res.sendStatus(201);
        })
        .catch((err) => {
          res.status(500).send(err);
        });
    }
  );

  app.get("/health", (_req, res) => {
    res.sendStatus(200);
  });

  app.get("/*", (_req, res) => {
    res.sendFile(DIR_NAME + "/public/index.html");
  });

  return { app };
};

createServer().then(({ app }) => {
  app.listen(PORT, () => {
    logger.log("info", `Server listening on port ${PORT}`);
  });
});
