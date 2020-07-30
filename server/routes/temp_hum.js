const express = require('express');
const snmp = require("net-snmp");
const app = express();

var oids = ["1.3.6.1.2.1.1.5.0", "1.3.6.1.2.1.1.6.0",
"1.3.6.1.4.1.3854.1.2.2.1.16.1.3.0", "1.3.6.1.4.1.3854.1.2.2.1.16.1.4.0",
"1.3.6.1.4.1.3854.1.2.2.1.17.1.3.0", "1.3.6.1.4.1.3854.1.2.2.1.17.1.4.0"];

app.get('/temp/:ip',function(req,res){
    var ip = req.params.ip;
    var session = snmp.createSession(ip, "public");
    var results = [];
    var err_message = "";

    session.get(oids,function(error,varbinds){
        if(error){
            //console.log(`L17, IP: ${ip} - ${error}`)
            err_message = error;
            // res.status(500).json({ok:false,error})
        }else{
            for(var i = 0; i < varbinds.length; i++){
                if(snmp.isVarbindError(varbinds[i]))
                    //console.log(snmp.varbindError(varbinds[i]))
                    {}
                else
                    results.push(`${varbinds[i].value}`);
                }
        }
        session.close();
        return res.status(200).json({results,ip,err_message})
    });
    
    session.trap(snmp.TrapType.LinkDown,function(error){
        if(error){}
            // console.log(`L34, IP: ${ip} - ${error}`)
            // res.status(500).json({ok:false,error})
    });
})

// app.get('/temp',function(req,res){
//     var datacenter = req.params.datacenter;
//     async function snmpTemperaturas(){
//         try{
            
//             const results = await session.get(oids,function(error,varbinds){
//                 for(var i = 0; i < varbinds.length; i++){
//                     if(snmp.isVarbindError(varbinds[i]))
//                         console.log(snmp.varbindError(varbinds[i]))
//                     else
//                         console.log (`${varbinds[i].oid} = ${varbinds[i].value}`);
//                 }
//                 session.close();
//                 return res.status(200).json({ok:true,results})
//             })

//             session.trap(snmp.TrapType.LinkDown,function(error){
//                 if(error)
//                     console.log(`L28 - ${error}`)
//                     return res.status(500).json({ok: false,error})
//             });
   
//         }catch(error){
//             console.log(`Error- L133 temp_hum.js: ${error}`)
//             return res.status(500).json({ok: false,error})
//         }
//     }
//     snmpTemperaturas();
// })


module.exports = app;