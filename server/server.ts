import { getFeaturesForUser, setToggle } from "./unleash-api.js";
import cors from "cors";
import express, { RequestHandler } from "express";
import dotenv from "dotenv";
import path from 'path'
import { ensureEnv } from "./utils.js";
import jwt from 'jsonwebtoken'
import jwks from 'jwks-rsa'

dotenv.config();

const DIR_NAME = path.resolve();

const env = ensureEnv({
  unleashEnvironment: "UNLEASH_ENVIRONMENT",
  azureTennant: "AZURE_APP_TENANT_ID"
});

const PORT = process.env['PORT'] ?? 8080


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
  jwksUri: `https://login.microsoftonline.com/${env.azureTennant}/discovery/v2.0/keys`
})

const userMiddleware: RequestHandler = async (req, res, next) => {
  // For debugging
  // res.locals.NavIdent  = 'bjorn'
  // next()
  // return

  const authHeader = req.headers.authorization
  if(!authHeader) {
    return res.status(403).send('missing jwt token')
  } else {

    const token = authHeader.split(' ')[1]
    const decodedToken = jwt.decode(token, { complete: true }) as IJwt
    const key = await jwkClient.getSigningKey(decodedToken.header.kid)
    const sigingkey = key.getPublicKey()

    console.log(`NavId: ${decodedToken.payload.NAVident}`)

    jwt.verify(token, sigingkey, (err) => {
      if(err) return res.status(403).send(err)
    })

    if(decodedToken) {
      const ident = decodedToken.payload.NAVident
      if(!ident) return res.status(403).send('Missing NAVIdent')
      res.locals.NavIdent  = ident

      console.log(`User recieved: ${ident}`)
      next()
    }
  }
}


const createServer = async () => {
  const app = express();
  app.use(express.static('public'))

  app.use(cors());
  app.use(express.json());

  app.get("/api/features", userMiddleware, async (_req, res) => {
    try{
      const features = await getFeaturesForUser(res.locals.NavIdent, env.unleashEnvironment);
      res.send(features);
    } catch (e) {
      res.status(500).send({error: 'Could not connect to Unleash', reason: JSON.stringify(e)})
    }
  });

  app.put("/api/features/:featureName/:strategyId", userMiddleware, async (req, res) => {

    const { featureName, strategyId } = req.params
    const { enable } = req.body

    setToggle(env.unleashEnvironment, res.locals.NavIdent, featureName, strategyId, enable)
      .then(() => {
        res.sendStatus(201)
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
