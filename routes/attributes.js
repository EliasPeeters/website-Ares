let fs = require('fs')

app.get('/attributes', (req, res) => {
    console.log(req.body)
    let server = req.body.server == undefined? 'external':req.body.server;    
    let attributes = JSON.parse(fs.readFileSync('assets/data.json'));
    let url = 'https://eliaspeeters.de/ares/assets/images/';
    if (server == 'external') {
        url = 'https://eliaspeeters.de/ares/assets/images/'
    }

    for (let element in attributes) {
        attributes[element].image = url + attributes[element].image;
    }

    res.send(attributes);
});