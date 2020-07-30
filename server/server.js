const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS"); 
    next();
});
require('./config/config');
require('./config/sensoresdb');
//Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(require('./routes/index'));

app.listen(process.env.PORT,function(){
    console.log('Listening: Server on port: ', process.env.PORT);
});

module.exports = app;