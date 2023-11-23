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
        },
        bindEvents: () => {},
        initializeData: {
            getUrlSearchParams: () => {
                const queryString = window.location.search;
                const urlParams = new URLSearchParams(queryString);
                App.variables.sensoresFile = urlParams.get('file')
            }
        },
        events: {
            addEventBorrar: (array) => {
                array.forEach(ip => {
                    let btnEliminar = document.getElementById(`btn-eliminar-${ip}`)
                    btnEliminar.addEventListener("click", (event) => { 
                        // FUCKING EVENTPREVENTDEFAULT NO FUNCIONA!
                        event.preventDefault()
                        App.utils.borrarSensor(ip) 
                    })
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
                                <td><button class="btn-eliminar-sensor" id="btn-eliminar-${sensor.ip}">Eliminar x</button></td>
                            </tr>`
                    arrayIps.push(sensor.ip)
                })
                App.htmlElements.tableSensores.innerHTML += dom
                App.events.addEventBorrar(arrayIps)
            },
            borrarSensor: async (ip) => {
                const confirmar = confirm(`Confirmar que desea eliminar el sensor ${ip}`)
                if (!confirmar) {
                    return
                } else {
                    const response = await fetch(`${App.variables.serverUrl}/remover/sensor/${App.variables.sensoresFile}/${ip}`, {
                        method: 'DELETE',
                        headers: {
                            Accept: 'application/json',
                        }
                    })
                    const result = await response.json()
                    console.log(result)
                    // COMO Y DONDE CANCELO EL FUCKING preventDefault!?
                    // BUSCAR COMO HACER DELETE SIN RECARGAR?
                    // App.utils.sensoresDOM(result.obj)
                }
            },
        }
    }
    App.init()
})()