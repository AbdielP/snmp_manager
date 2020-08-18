(function(){
    var App = {
        config:{
            api:{
                baseUrl: "http://172.18.227.128:3000",
                // baseUrl: "http://localhost:3000",
                readFile: function(archivo){
                    return `${App.config.api.baseUrl}/read/${archivo}`;
                },
                addSensor: function(){
                    return `${App.config.api.baseUrl}/agregar/sensor`;
                },
                removeSensor: function(archivo,ip){
                    return `${App.config.api.baseUrl}/remover/sensor/${archivo}/${ip}`;
                }
            }
        },
        htmlElements:{
            formAddSensor: document.querySelector('#form-add-sensor'),
            tablaSensores: document.querySelector("#sensores")
        },
        init: function(){
            App.readSensoresFile(App.getParams());  
            App.htmlElements.formAddSensor.addEventListener("submit",function(e){
                e.preventDefault();
                App.agregarSensor(App.htmlElements.formAddSensor.sensor.value,
                    App.htmlElements.formAddSensor.ubicacion.value)
            })
        },
        events:{
        },
        getParams:function(){
            const queryString = window.location.search;
            const urlParams = new URLSearchParams(queryString);
            const file = urlParams.get('file')
            return file;
        },
        readSensoresFile:function(file){
            async function readData(){
                const response = await App.utils.makeRequest({
                    url: App.config.api.readFile(file)
                })
                // console.log(response.obj.sensores)
                App.dibujarTabla(response.obj.sensores)
            }
            readData();
        },
        agregarSensor: function(ipsensor,ubicacion){
            var form = {ip: ipsensor,planta:ubicacion,archivo:App.getParams()}
            async function sendIpSensor(){
                const response = await App.utils.postSensor({
                    url: App.config.api.addSensor(),
                    body:form
                })
                if(response.ok) App.dibujarTabla(response.sensores.sensores) 
                alert(response.message)
            }
            sendIpSensor();
        },
        borrarSensor:function(ip){
            var archivo = App.getParams()
            async function sendIP(){
                const response = await App.utils.deleteSensor({
                    url: App.config.api.removeSensor(archivo,ip)
                })
                App.dibujarTabla(response.obj.sensores)
            }
            sendIP();
        },
        getSensorIp:function(ip){
            var confirmar = confirm(`Confirmar que desea eliminar el sensor ${ip}`)
            if(!confirmar){
                return false;
            }else{
                App.borrarSensor(ip);
            }
        },
        utils:{
            makeRequest: async function({method = "get", url, body = null}){
                const response = await fetch(url, {
                    method,
                    body: body ? JSON.stringify(body) : null
                });
                return response.json();
            },
            postSensor: async function({method = "post",url, body}){
                const response = await fetch(url, {
                    method,
                    body: JSON.stringify(body),
                    headers:{
                        'Content-Type': 'application/json'
                    }
                })
                return response.json();
            },
            deleteSensor: async function({method = "delete",url, body=null}){
                const response = await fetch(url,{
                    method,
                    body: body ? JSON.stringify(body) : null,
                    headers:{
                        'Content-Type': 'application/json'
                    }
                })
                return response.json();
            }
        },
        dibujarTabla: function(ipsensores){
            let domTabla = "";
            var arrayIps = [];
            ipsensores.forEach(sensor => {
                domTabla += `<tr>
                                <td><a class="link-sensores" href="http://${sensor.ip}/" target="_blank">${sensor.ip}</a></td>
                                <td>${sensor.planta}</td>
                                <td><button class="btn-eliminar-sensor" id="btn-eliminar-${sensor.ip}">Eliminar x</button></td>
                            </tr>`
                App.htmlElements.tablaSensores.innerHTML = domTabla;
                arrayIps.push(sensor.ip)
            });
            this.addEventBorrar(arrayIps);
        },
        addEventBorrar: function(array){
            array.forEach(ip => {
                let btnEliminar = document.getElementById(`btn-eliminar-${ip}`);
                btnEliminar.addEventListener("click",function(){App.getSensorIp(ip)});
            });
        }
    }
    App.init();
})();