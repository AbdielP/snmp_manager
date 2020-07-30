const fs = require("fs");
const jo = require("javascript-obfuscator");

fs.readFile('./javascript/sensores.js',"UTF-8",function(err,data){
    if(err) return console.log(err);
    var obResult = jo.obfuscate(data);
    fs.writeFile('./javascript/sens-obf.js',obResult.getObfuscatedCode(),function(err){
        if(err) return console.log(err);
    })
    console.log("El archivo SENS fue guardado.")
})

fs.readFile('./javascript/main_temps.js',"UTF-8",function(err,data){
    if(err) return console.log(err);
    var obResult = jo.obfuscate(data);
    fs.writeFile('./javascript/main-obf.js',obResult.getObfuscatedCode(),function(err){
        if(err) return console.log(err);
    })
    console.log("El archivo MAIN fue guardado.")
})

fs.readFile('server/routes/temp_hum.js',"UTF-8",function(err,data){
    if(err) return console.log(err);
    var obResult = jo.obfuscate(data);
    fs.writeFile('server/routes/temp_hum-obf.js',obResult.getObfuscatedCode(),function(err){
        if(err) return console.log(err);
    })
    console.log("El archivo ROUTES TEMP HUM fue guardado.")
})
