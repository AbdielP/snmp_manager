const fs = require('fs');
dbSensores();

function dbSensores(){
    var obj = {
        sensores:[]
    };

    var objbal = {
        sensores:[]
    };
    /*IPS QUE NO RESPONDEN:
        http://172.18.227.76/
    */
    obj.sensores.push(
        {planta:'PB',ip:'172.18.227.70'},{planta:'PB',ip:'172.18.227.71'},{planta:'PB',ip:'172.18.227.72'},{planta:'PB',ip:'172.18.227.73'},{planta:'PB',ip:'172.18.227.74'},{planta:'PB',ip:'172.18.227.75'},{planta:'PB',ip:'172.18.227.78'},{planta:'PB',ip:'172.18.227.79'},{planta:'PB',ip:'172.18.227.163'},
        {planta:'PA',ip:'172.18.227.63'},{planta:'PA',ip:'172.18.227.64'},{planta:'PA',ip:'172.18.227.65'},{planta:'PA',ip:'172.18.227.66'},{planta:'PA',ip:'172.18.227.67'},{planta:'PA',ip:'172.18.227.68'},{planta:'PA',ip:'172.18.227.69'},{planta:'PA',ip:'172.18.227.162'})
    var json = JSON.stringify(obj);
    /* IPS QUE NO RESPONDEN
        http://172.18.227.125/  ---> Sensor pegado al P2
        http://172.18.227.116/ ----> J5 No detecta el sensor de temp (P1)
        http://172.18.227.114/

        PB
        http://172.18.229.122/ ---> Sensor pegado al P2
         http://172.18.229.120/ ---> TIENE CONTRASEÑA... WTF
         http://172.18.229.119/
         http://172.18.229.118/  ---> Sin sensores en ningún puerto
    */
    objbal.sensores.push(
        {planta:'PA',ip:'172.18.229.114'},{planta:'PA',ip:'172.18.229.115'},{planta:'PA',ip:'172.18.229.116'},{planta:'PA',ip:'172.18.229.117'},{planta:'PA',ip:'172.18.229.123'},{planta:'PA',ip:'172.18.229.124'},{planta:'PA',ip:'172.18.229.125'},{planta:'PA',ip:'172.18.229.126'},{planta:'PA',ip:'172.18.229.127'},
        {planta:'PB',ip:'172.18.229.110'},{planta:'PB',ip:'172.18.229.111'},{planta:'PB',ip:'172.18.229.112'},{planta:'PB',ip:'172.18.229.113'},{planta:'PB',ip:'172.18.229.118'},{planta:'PB',ip:'172.18.229.119'},{planta:'PB',ip:'172.18.229.120'},{planta:'PB',ip:'172.18.229.121'},{planta:'PB',ip:'172.18.229.122'},)
        // {planta:'PA',ip:'172.18.229.115'},{planta:'PA',ip:'172.18.229.125'})
        // {planta:'PA',ip:'172.18.229.114'},{planta:'PA',ip:'172.18.229.115'},{planta:'PA',ip:'172.18.229.116'},{planta:'PA',ip:'172.18.229.117'},{planta:'PA',ip:'172.18.229.123'})

        var jsonbal = JSON.stringify(objbal);

    fs.writeFile('./server/files/sensorespp.txt',json,'utf8',function(err,data){
        if(err) console.log("?",err)
        console.log('Sensores HOW generados.')
    })

    fs.writeFile('./server/files/sensoresbal.txt',jsonbal,'utf8',function(err,data){
        if(err) console.log("?",err)
        console.log('Sensores BAL generados.')
    })
}

