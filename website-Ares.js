let express = require('express');
let bodyParser = require('body-parser');

app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/ares/assets', express.static('assets'))

// Routes
let statusRoute = require('./routes/status');
let attributesRoute = require('./routes/attributes');

const port = 8088;
app.listen(port, console.log(`Running on ${port}`))