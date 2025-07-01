//bootstrap express dynamic routing, used for backend edge node for backend-api, 
//please refers to  https://github.com/aiprojectchiwa/backend-api and https://github.com/chiwaworkspace/frontend-api for any docs to get started quickly
//future bootstrap will be migrated to typescript
require('dotenv').config();

const path = require('path')
const express = require('express');
const app = express();
const port = process.env.PORT || 1001;
const session = require('express-session');


app.use(session({
  secret: 'kurukurukirarin',
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > 10 * 1024 * 1024) { 
    return res.status(413).json({ message: 'Payload too large (header)' });
  }
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));


app.use('/', async (req, res) => {

  try {

    const endpoint = require(`./endpoints/${req.path}`);


    const handler = endpoint[req.method.toLowerCase()];
    if (typeof handler !== 'function') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    //this should be provided by frontend api proxy request to handle any spesific cases, eg; feature that only available for vip users
    //https://github.com/chiwaworkspace/frontend-api/blob/4d6b25f142c0a3d3e3cec24fc56a4338882a3b7c/app/api/v1/%5B...route%5D/route.tsx#L167C1-L167C107
    const authHeader = req.headers['x-chiwa-user-data'];
    const auth = JSON.parse(authHeader || '{}');
    await handler(req, res, auth);
    return;
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      return res.status(404).json({ message: 'Endpoint Not Found' });
    }
    console.error(e);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Payload too large' });
  }
  console.error(err);
  res.status(500).json({ message: 'Unexpected Server Error' });
});

app.listen(port, () => {
  console.log(`App run on http://localhost:${port}`);
});

//spaced comment(s) are marked as any unfinished tasks
//so if you build the app into production eslint will throw an error
//mark your finished task with remove the space after comments
//please refer to https://github.com/chiwaworkspace/services-integration-guidlines for any rules to sync all microservices