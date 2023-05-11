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
});

const PORT = process.env['PORT'] ?? 8080


const createServer = async () => {
  const app = express();
  app.use(express.static('public'))

  app.use(cors());
  app.use(express.json());

  app.get("/api/features", async (_req, res) => {
    try{
      const features = await getFeaturesForUser(userId, env.unleashEnvironment);
      res.send(features);
    } catch (e) {
      res.status(500).send({error: 'Could not connect to Unleash', reason: e})
    }
  });

  app.post("/api/features", async (req, res) => {
    const { featureName, strategyId, enabled } = req.body;

    setToggle(env.unleashEnvironment, userId, featureName, strategyId, enabled)
      .then((data) => {
        res.send(data);
      })
      .catch((err) => {
        console.log(err)
        res.status(500).send(err);
      });
  });

  app.get('/health', (req, res) => {
    res.sendStatus(200)
  })

  app.get('/*', (req, res) => {
    res.sendFile(DIR_NAME + '/public/index.html')
  })

  return { app };
};

createServer().then(({ app }) => {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
});
