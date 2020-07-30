const express = require('express');
const fs = require('fs');
const app = express();

app.get('/read/:archivo',function(req,res){
    var archivo = req.params.archivo;
    fs.readFile(`./server/files/${archivo}.txt`,'utf8',function(err,data){
        if(err){
            console.log("read_files L9 - ",err)
        }
        var obj = JSON.parse(data)
        // console.log(obj)
        return res.status(200).json({ok:true,obj})
    })
})

module.exports = app;