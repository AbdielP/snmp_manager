(() => {
    const App = {
        variables: {
            sensoresFile: '',
            // serverUrl: 'http://172.18.227.128:3000'
            serverUrl: 'http://localhost:3000'
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
                // const form = {
                //     ip: App.htmlElements.formSensores.sensor.value,
                //     planta: App.htmlElements.formSensores.ubicacion.value,
                //     modelo: App.htmlElements.formSensores.modelo.value,
                //     archivo: App.variables.sensoresFile
                // }
                const form = new FormData(App.htmlElements.formSensores)
                // ESTA MIERDA SIGUE RECARGANDO LA PAGINA...
                // App.utils.postSensor({
                //     url: `${App.variables.serverUrl}/agregar/sensor`,
                //     body: form
                // })
                // console.log(form)
                App.utils.postSensor(form)
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
                                <td><button type="submit" class="btn-eliminar-sensor" id="btn-eliminar-${sensor.ip}">Eliminar x</button></td>
                            </tr>`
                    arrayIps.push(sensor.ip)
                })
                App.htmlElements.tableSensores.innerHTML += dom
                // App.events.addEventBorrar(arrayIps)
            },
            postSensor: async (form) => {
                console.log(form.get('sensor'))
                const newsensor = await fetch(`${App.variables.serverUrl}/agregar/sensor`, {
                    method: "POST",
                    header: {
                        "Content-type": "application/json; charset=UTF-8"
                    },
                    body: form
                })
                return console.log(newsensor)
                const response = await newsensor.json();
                // if(response.ok) App.utils.sensoresDOM(response.sensores.sensores) 
                if(response.ok) console.log(response)
                alert(response.message)
            }
        }
    }
    App.init()
})()
