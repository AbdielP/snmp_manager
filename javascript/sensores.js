<<<<<<< HEAD
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
=======
(() => {
    const App = {
        variables: {
            sensoresFile: '',
            serverUrl: 'http://172.18.227.178:3000'
            // serverUrl: 'http://localhost:3000'
        },
        htmlElements: {
            formSensores: document.querySelector('#form-add-sensor'),
            tableSensores: document.querySelector('#sensores')
        },
        init: () => {
            App.initializeData.getUrlSearchParams()
            App.utils.getSensores()
            App.bindEvents()
        },
        bindEvents: () => {
            App.htmlElements.formSensores.addEventListener('submit', App.events.addEventNewSensor)
            
        },
        initializeData: {
            getUrlSearchParams: () => {
                const queryString = window.location.search;
                const urlParams = new URLSearchParams(queryString);
                App.variables.sensoresFile = urlParams.get('file')
            }
        },
        events: {
            addEventNewSensor: (event) => {
                event.preventDefault()
                // return console.log('wtf!....')
                const form = App.htmlElements.formSensores
                const formData = new FormData(form)
                formData.append("archivo", App.variables.sensoresFile)
                const formPayload = new URLSearchParams(formData)
                // console.log(formPayload)
                App.utils.postSensor(formPayload)
            },
            AddEventBorrar: (arrayIps) => {
                arrayIps.map(ip => {
                    const btnEliminar = document.getElementById(`btn-eliminar-${ip}`);
                    btnEliminar.addEventListener("click", () => App.utils.borrarSensor(ip));
                })
            }
        },
        utils: {
            getSensores: async () => {
                const sensores = await fetch(`${App.variables.serverUrl}/read/${App.variables.sensoresFile}`, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                    }
                })
                const result = await sensores.json()
                App.utils.sensoresDOM(result.obj)
            },
            sensoresDOM: ({sensores}) => {
                let dom = ''
                let arrayIps = [];
                sensores.map( sensor => {
                    dom += `<tr>
                                <td><a class="link-sensores" href="http://${sensor.ip}/" target="_blank">${sensor.ip}</a></td>
                                <td>${sensor.planta}</td>
                                <td>${sensor.modelo}</td>
                                <td><button type="submit" class="btn-eliminar-sensor" id="btn-eliminar-${sensor.ip}">Eliminar x</button></td>
                            </tr>`
                    arrayIps.push(sensor.ip)
                })
                App.htmlElements.tableSensores.innerHTML += dom
                App.events.AddEventBorrar(arrayIps)

            },
            postSensor: async (form) => {
                // return console.log(form)
                const newsensor = await fetch(`${App.variables.serverUrl}/agregar/sensor`, {
                    method: "POST",
                    body: form
                })
                // if(response.ok) App.utils.sensoresDOM(response.sensores.sensores) 
            },
            borrarSensor: async (ip) => {
                const confirmar = confirm(`Confirmar que desea eliminar el sensor ${ip}`)
                if (!confirmar) { return false }
                else {
                    // console.log(ip)
                    const archivo = App.variables.sensoresFile
                    const response = await fetch(`${App.variables.serverUrl}/remover/sensor/${archivo}/${ip}`,{
                        method: "delete",
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    // App.dibujarTabla(response.obj.sensores)
                }
            }
        }
    }
    App.init()
})()
>>>>>>> 8c7e3f5569398656830e7d4cbb3953133482e86c
