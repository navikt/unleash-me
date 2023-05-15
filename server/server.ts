import { getFeaturesForUser, setToggle } from "./unleash-api.js";
import cors from "cors";
import express, { RequestHandler } from "express";
import dotenv from "dotenv";
import path from 'path'
import { ensureEnv } from "./utils.js";
import jwt from 'jsonwebtoken'

dotenv.config();

const DIR_NAME = path.resolve();

const env = ensureEnv({
  unleashEnvironment: "UNLEASH_ENVIRONMENT",
  wonderwallEncryptionKey: "WONDERWALL_ENCRYPTION_KEY"
});

const PORT = process.env['PORT'] ?? 8080


interface IJwt extends jwt.JwtPayload {
  name: string;
  NAVident: string;
}

const userMiddleware: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization
  if(!authHeader) {
    return res.status(403).send('missing jwt token')
  } else {
    jwt.verify(authHeader, env.wonderwallEncryptionKey, (err, decoded: IJwt) => {
      if(err) return res.status(403).send(err)

      const ident = decoded.NAVident
      if(!ident) return res.status(403).send('Missing NAVIdent')
      res.locals.NavIdent  = ident

      console.log(`User recieved: ${ident}`)
      next()
    })
  }
}


const createServer = async () => {
  const app = express();
  app.use(express.static('public'))

  app.use(cors());
  app.use(express.json());

  app.get("/api/features", userMiddleware, async (req, res) => {
    try{
      const features = await getFeaturesForUser(res.locals.NavIdent, env.unleashEnvironment);
      res.send(features);
    } catch (e) {
      res.status(500).send({error: 'Could not connect to Unleash', reason: e})
    }
  });

  app.post("/api/features", userMiddleware, async (req, res) => {
    const { featureName, strategyId, enabled } = req.body;

    setToggle(env.unleashEnvironment, res.locals.NavIdent, featureName, strategyId, enabled)
      .then((data) => {
        res.send(data);
      })
      .catch((err) => {
        console.log(err)
        res.status(500).send(err);
      });
  });

  app.get('/health', (_req, res) => {
    res.sendStatus(200)
  })

  app.get('/*', (_req, res) => {
    res.sendFile(DIR_NAME + '/public/index.html')
  })

  return { app };
};

createServer().then(({ app }) => {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
});
