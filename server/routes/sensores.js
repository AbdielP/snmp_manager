const express = require('express');
const fs = require('fs');
const app = express();

app.post('/agregar/sensor',function(req,res){
    var body = req.body;
    var newSensor = {planta:body.planta,ip:body.ip}
    fs.readFile(`./server/files/${body.archivo}.txt`,'utf8',function(err,data){
        if(err){
            return console.log(err)
        }
        var sensores = JSON.parse(data)
        sensores.sensores.push(newSensor)
        sensores.sensores.sort(function(a,b){
            return a - b;
        });
        // console.log(sensores)
        fs.writeFile(`./server/files/${body.archivo}.txt`,sensores,'utf8',function(err,results){
            if(err) return console.log(err)
            console.log(`Sensor ${body.ip} agregado en ${body.planta}`)
            return res.status(200).json({ok:true,results})
        })
    })
})

module.exports = app;