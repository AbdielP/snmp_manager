(function(){
 var App = {
    config: {
        api:{
            // baseUrl: "http://172.18.227.128:3000",
            baseUrl: "http://localhost:3000",
            readFile: function(archivo){
                return `${App.config.api.baseUrl}/read/${archivo}`;
            },
            getTemp: function(ip, modelo) {
                // console.log(modelo)
                if(modelo == 'SP2') {
                    return `${App.config.api.baseUrl}/temp/sp2/${ip}`
                } else {
                    return `${App.config.api.baseUrl}/temp/sp2plus/${ip}`
                }
            }
        }
    },
    htmlElements:{
        contenedor: document.querySelector('.contenedor'),
        contenedor_reconnect: document.querySelector('.contenedor-reconectando'),
        headerDatacenter: document.querySelector('.header-datacenter'),
        btnIdcPp: document.querySelector('#btn-idc-pp'),
        btnIdcBal: document.querySelector('#btn-idc-bal'),
        contenedorLoading: document.getElementsByClassName('contenedor-loading'),
        contenedorSensorPA: document.querySelector('#main-contenedor-sensor'),
        contenedorSensorPB: document.querySelector('#main-contenedor-sensor-pb'),

    },init: function(){   
        App.htmlElements.btnIdcPp.addEventListener("click",function(){App.readSensores('sensorespp','IDC Panamá Pacífico')})
        App.htmlElements.btnIdcBal.addEventListener("click",function(){App.readSensores('sensoresbal','IDC Balboa')})
    },
    events:{},
    //Leer documento de sensores
    readSensores:function(archivo,idc){
        App.clearSensoresDOM();
        App.animacionConectando();
        async function readData(){
            const response = await App.utils.makeRequest({
                url: App.config.api.readFile(archivo)
            })
            // console.log(response)
            if(response){
                App.utils.dibujarSensor(response.obj.sensores);
                App.scanSensores(response.obj.sensores,idc,archivo);
                App.removerAnimacionConectando();
            }else{
                App.removerAnimacionConectando();
                App.htmlElements.contenedorSensorPB.innerHTML = `<h3><i class="fas fa-exclamation-triangle"></i> --- SIN CONEXIÓN CON EL SERVIDOR --- <i class="fas fa-exclamation-triangle"></h3>`;
                App.htmlElements.contenedorSensorPA.innerHTML = `<h3><i class="fas fa-exclamation-triangle"></i> --- SIN CONEXIÓN CON EL SERVIDOR --- <i class="fas fa-exclamation-triangle"></h3>`;
                window.setTimeout(readData, 5000);
            }
        }
        readData();
    },
    //GET sensores data
    scanSensores:function(sensores,idc,archivo){
        sensores.forEach(sensor=>{
            // console.log(sensor.ip)
            async function getData(){
                const response = await App.utils.makeRequest({
                    url: App.config.api.getTemp(sensor.ip, sensor.modelo)
                },idc,archivo)
                if(response){
                    App.utils.actualizarSensor(response,idc);
                    window.setTimeout(getData, 20000);
                    // window.setTimeout(getData, 1500);
                }else{
                    App.animacionReconectando();
                    window.setTimeout(function(){ getData()},10000)
                }
            }
            getData();
        })
    },
    clearSensoresDOM:function(){
        App.htmlElements.contenedorSensorPB.innerHTML = ""
        App.htmlElements.contenedorSensorPA.innerHTML = "";
    },
    animacionConectando:function(){
        for (let contenedor of App.htmlElements.contenedorLoading) contenedor.style.display = "flex"; 
    },
    removerAnimacionConectando:function(){
        for (let contenedor of App.htmlElements.contenedorLoading) contenedor.style.display = "none"; 
    },
    animacionReconectando:function(){
        // App.htmlElements.contenedor_reconnect.removeProperty('dislay');
        App.htmlElements.contenedor_reconnect.style.display = "block";
        App.htmlElements.contenedor.style.opacity = .1;
    },
    removerAnimacionReconectando:function(){
        App.htmlElements.contenedor_reconnect.style.display = "none";
        App.htmlElements.contenedor.style.opacity = 1;
    },
    setColoresTemp: function(valores,contenedor,boton) {
        // !!!! PROBLEMA AQUÍ:
        App.removerClases(contenedor,boton);
        if(valores >= 87){
            contenedor.classList.add('sensor-high-critical');
            boton.classList.add('sensor-high-critical');
        } 
        else if(valores <= 86 && valores >= 78){
            App.removerClases(contenedor,boton);
            contenedor.classList.add('sensor-high-warning');
            boton.classList.add('sensor-high-warning');
        } 
        else if(valores <= 77 && valores >= 67){
            App.removerClases(contenedor,boton);
            contenedor.classList.add('sensor-normal');
            boton.classList.add('sensor-normal');
        } 
        else if(valores >= 58 && valores <= 66){
            App.removerClases(contenedor,boton);
            contenedor.classList.add('sensor-low-warning');
            boton.classList.add('sensor-low-warning');
        } else if(valores <= 57){
            App.removerClases(contenedor,boton);
            contenedor.classList.add('sensor-low-critical');
            boton.classList.add('sensor-low-critical');
        }else{
            console.log('MAL!?')
            App.removerClases(contenedor,boton);
        }
    },
    setColoresHum:function(valores,contenedor,boton){
        App.removerClases(contenedor,boton);
        if(valores >= 80){
            App.removerClases(contenedor,boton);
            contenedor.classList.add('sensor-high-critical');
            boton.classList.add('sensor-high-critical');
        } 
        else if(valores <= 79 && valores >= 66){
            App.removerClases(contenedor,boton);
            contenedor.classList.add('sensor-high-warning');
            boton.classList.add('sensor-high-warning');
        } 
        else if(valores >= 45 && valores <= 65){
            App.removerClases(contenedor,boton);
            contenedor.classList.add('sensor-normal');
            boton.classList.add('sensor-normal');
        } 
        else if(valores >= 30 && valores <= 44){
            App.removerClases(contenedor,boton);
            contenedor.classList.add('sensor-low-warning');
            boton.classList.add('sensor-low-warning');
        } else if(valores <= 29){
            contenedor.classList.add('sensor-low-critical');
            boton.classList.add('sensor-low-critical');
        }
        else{
            App.removerClases(contenedor,boton);
        }
    },
    removerClases:function(contenedor,boton){
        contenedor.classList.remove('sensor-high-critical');
        contenedor.classList.remove('sensor-high-warning');
        contenedor.classList.remove('sensor-normal');
        contenedor.classList.remove('sensor-low-warning');
        contenedor.classList.remove('sensor-low-critical');

        boton.classList.remove('sensor-high-critical');
        boton.classList.remove('sensor-high-warning');
        boton.classList.remove('sensor-normal');
        boton.classList.remove('sensor-low-warning');
        boton.classList.remove('sensor-low-critical');
    },
    utils: {
        makeRequest: async function({method = "get", url, body = null},idc,archivo){
            try {
                const response = await fetch(url, {
                    method,
                    body: body ? JSON.stringify(body) : null
                });
                App.removerAnimacionReconectando();
                return response.json();
            } catch (error) {   
                //este try ctch no hace nada realmente
                console.log(error)        
            }
        },
        dibujarSensor: function(sensores){
            App.clearSensoresDOM();
            let domSensorPA = "";
            let domSensorPB = "";
            sensores.forEach(sensor => {
                if(sensor.planta == 'PA'){
                    domSensorPA += `<div class="contenedor-sensor" id="PA ${sensor.ip}">
                                <div class="contenedor-titulo-sensor">
                                    <h3 id="h3-${sensor.ip}">-</h3>
                                </div>
                                <div class="contenedor-sensores-cuerpo opacidad" id="sensores-cuerpo-${sensor.ip}">
                                    <div class="contenedor-sensor-temp">
                                    <div id="div-sensor-temp-icon-${sensor.ip}" class="div-sensor-temp-icon">
                                        <img src="./assets/img/TEMP.png" alt="*" width="20">
                                    </div>
                                    <div class="div-sensor-temp-centro">
                                        <button id="btn-temp-${sensor.ip}">Temperatura</button>
                                    </div>
                                    <div class="div-sensor-temp-temperatura">
                                        <h2 id="h2-temp-${sensor.ip}">-</h2>
                                    </div>
                                    </div>
                                    <div class="contenedor-sensor-hum">
                                        <div id="div-sensor-hum-icon-${sensor.ip}" class="div-sensor-hum-icon">
                                            <img src="./assets/img/HUM.png" alt="*" width="16">
                                        </div>
                                        <div class="div-sensor-hum-centro">
                                            <button id="btn-hum-${sensor.ip}">Humedad</button>
                                        </div>
                                        <div class="div-sensor-hum-porcentaje">
                                            <h2 id="h2-hum-${sensor.ip}">-</h2>
                                        </div>
                                    </div>
                                </div>
                            </div>`
                 App.htmlElements.contenedorSensorPA.innerHTML = domSensorPA;
                }
                if(sensor.planta == 'PB'){
                    domSensorPB += `<div class="contenedor-sensor" id="PB ${sensor.ip}">
                                        <div class="contenedor-titulo-sensor">
                                            <h3 id="h3-${sensor.ip}">-</h3>
                                        </div>
                                        <div class="contenedor-sensores-cuerpo opacidad" id="sensores-cuerpo-${sensor.ip}">
                                            <div class="contenedor-sensor-temp">
                                            <div id="div-sensor-temp-icon-${sensor.ip}" class="div-sensor-temp-icon">
                                                <img src="./assets/img/TEMP.png" alt="*" width="20">
                                            </div>
                                            <div class="div-sensor-temp-centro">
                                                <button id="btn-temp-${sensor.ip}">Temperatura</button>
                                            </div>
                                            <div class="div-sensor-temp-temperatura">
                                                <h2 id="h2-temp-${sensor.ip}">-</h2>
                                            </div>
                                            </div>
                                            <div class="contenedor-sensor-hum">
                                                <div id="div-sensor-hum-icon-${sensor.ip}" class="div-sensor-hum-icon">
                                                    <img src="./assets/img/HUM.png" alt="*" width="16">
                                                </div>
                                                <div class="div-sensor-hum-centro">
                                                    <button id="btn-hum-${sensor.ip}">Humedad</button>
                                                </div>
                                                <div class="div-sensor-hum-porcentaje">
                                                    <h2 id="h2-hum-${sensor.ip}">-</h2>
                                                </div>
                                            </div>
                                        </div>
                                    </div>`
                App.htmlElements.contenedorSensorPB.innerHTML = domSensorPB;
                }
            });
            // App.htmlElements.contenedorSensorPA.innerHTML = domSensor;
        },
        actualizarSensor: function(sensores,idc){
            var response_array = [];
            var objectValues = Object.values(sensores)
            response_array.push(objectValues)
            response_array.forEach(sensor=>{
                // console.log(sensor)
                var contenedorTempIcono = document.getElementById(`div-sensor-temp-icon-${sensor[1]}`);
                var contenedorHumIcon = document.getElementById(`div-sensor-hum-icon-${sensor[1]}`);
                var btnTemp = document.getElementById(`btn-temp-${sensor[1]}`);
                var btnHum = document.getElementById(`btn-hum-${sensor[1]}`);

                var tituloSensor = document.getElementById(`h3-${sensor[1]}`);
                var cuerpoSensor = document.getElementById(`sensores-cuerpo-${sensor[1]}`)
                var h3Temperatura = document.getElementById(`h2-temp-${sensor[1]}`);
                var h3Humedad = document.getElementById(`h2-hum-${sensor[1]}`);

                if(sensores.modelo == 'SP2+') {
                    // console.log(sensor[0][2])
                    App.setColoresTemp(Number(sensor[0][2]/10),contenedorTempIcono,btnTemp);
                    App.setColoresHum(sensor[0][3],contenedorHumIcon,btnHum);
                } else {
                    App.setColoresTemp(sensor[0][2],contenedorTempIcono,btnTemp);
                    App.setColoresHum(sensor[0][4],contenedorHumIcon,btnHum);
                }
               
                tituloSensor.innerHTML = `<a class="link-titulo-sensor" href="http://${sensor[1]}/" target="_blank">${sensor[0][0]}</a>`;
                if(sensores.modelo == 'SP2+') {
                    h3Temperatura.innerHTML = `${sensor[0][2]/10}F°`;
                    h3Humedad.innerHTML = `${sensor[0][3]}%`;
                } else {
                    h3Temperatura.innerHTML = `${sensor[0][2]}F°`;
                    h3Humedad.innerHTML = `${sensor[0][4]}%`;
                }
                cuerpoSensor.classList.remove('opacidad');
                if(sensor[2] != ""){
                    cuerpoSensor.classList.add('opacidad');
                    h3Temperatura.innerHTML = '<i class="fas fa-exclamation-circle warning-color"></i>';
                    h3Humedad.innerHTML = '<i class="fas fa-exclamation-circle warning-color"></i>';
                    tituloSensor.innerHTML = `<a class="warning-color" href="http://${sensor[1]}/" target="_blank">${sensor[1]}</a>`;
                } 
            })
            // console.log(headerDatacenter);
            App.htmlElements.headerDatacenter.innerHTML = `Temperatura y Humedad ${idc}.`;
        }
    }
 }
 App.init();
})();