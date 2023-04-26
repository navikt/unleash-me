import { getFeaturesForUser, setToggle } from "./unleash-api.js";
import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import path from 'path'
import { ensureEnv } from "./utils.js";

dotenv.config();

const DIR_NAME = path.resolve();

// TODO: Testdata, remove
const userId = "BJORN";

const env = ensureEnv({
  unleashEnvironment: "UNLEASH_ENVIRONMENT",
  port: "PORT"
});


const createServer = async () => {
  const app = express();
  app.use(express.static('public'))

  app.use(cors());
  app.use(express.json());

  app.get("/api/features", async (_req, res) => {
    const features = await getFeaturesForUser(userId, env.unleashEnvironment);
    res.send(features);
  });

  app.post("/api/features", async (req, res) => {
    const { featureName, strategyId, enabled } = req.body;

    setToggle(env.unleashEnvironment, userId, featureName, strategyId, enabled)
      .then((data) => {
        res.send(data);
      })
      .catch((err) => {
        res.status(500).send(err);
      });
  });

  app.get('/*', (req, res) => {
    res.sendFile(DIR_NAME + 'public/index.html')
  })

  return { app };
};

createServer().then(({ app }) => {
  app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });
});
