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
                const response = await newsensor.json();
                if(response.ok) App.utils.sensoresDOM(response.sensores.sensores) 
                // if(response.ok) console.log(response)
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
                    return console.log(response.json())
                    // App.dibujarTabla(response.obj.sensores)
                }
            }
        }
    }
    App.init()
})()
