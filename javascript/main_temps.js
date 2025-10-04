(function () {
    var App = {
        config: {
            api: {
                // baseUrl: "http://172.18.227.178:3000",
                baseUrl: "http://localhost:3000",
                readFile: function (archivo) {
                    return `${App.config.api.baseUrl}/read/${archivo}`
                },
                getTemp: function (ip, modelo) {
                    // console.log(modelo)
                    if (modelo == 'SP2')
                        return `${App.config.api.baseUrl}/temp/sp2/${ip}`
                    else if (modelo == 'SP2+')
                        return `${App.config.api.baseUrl}/temp/sp2plus/${ip}`
                    else
                        return `${App.config.api.baseUrl}/temp/ap8841/${ip}`
                }
            }
        },
        htmlElements: {
            contenedor: document.querySelector('.contenedor'),
            contenedor_reconnect: document.querySelector('.contenedor-reconectando'),
            headerDatacenter: document.querySelector('.header-datacenter'),
            btnIdcPp: document.querySelector('#btn-idc-pp'),
            btnIdcBal: document.querySelector('#btn-idc-bal'),
            contenedorLoading: document.getElementsByClassName('contenedor-loading'),
            contenedorSensorPA: document.querySelector('#main-contenedor-sensor'),
            contenedorSensorPB: document.querySelector('#main-contenedor-sensor-pb'),

        }, init: function () {
            App.htmlElements.btnIdcPp.addEventListener("click", function () { App.readSensores('sensorespp', 'IDC Panamá Pacífico') })
            App.htmlElements.btnIdcBal.addEventListener("click", function () { App.readSensores('sensoresbal', 'IDC Balboa') })
        },
        events: {},
        //Leer documento de sensores
        readSensores: function (archivo, idc) {
            App.clearSensoresDOM()
            App.animacionConectando()
            async function readData() {
                const response = await App.utils.makeRequest({
                    url: App.config.api.readFile(archivo)
                })
                // console.log(response)
                if (response) {
                    App.utils.dibujarSensor(response.obj.sensores)
                    App.scanSensores(response.obj.sensores, idc, archivo)
                    App.removerAnimacionConectando()
                } else {
                    App.removerAnimacionConectando()
                    App.htmlElements.contenedorSensorPB.innerHTML = `<h3><i class="fas fa-exclamation-triangle"></i> --- SIN CONEXIÓN CON EL SERVIDOR --- <i class="fas fa-exclamation-triangle"></h3>`
                    App.htmlElements.contenedorSensorPA.innerHTML = `<h3><i class="fas fa-exclamation-triangle"></i> --- SIN CONEXIÓN CON EL SERVIDOR --- <i class="fas fa-exclamation-triangle"></h3>`
                    window.setTimeout(readData, 5000)
                }
            }
            readData()
        },
        //GET sensores data
        scanSensores: function (sensores, idc, archivo) {
            sensores.forEach(sensor => {
                // console.log(sensor.ip)
                async function getData() {
                    const response = await App.utils.makeRequest({
                        url: App.config.api.getTemp(sensor.ip, sensor.modelo)
                    }, idc, archivo)
                    console.log(response)
                    if (response) {
                        App.utils.actualizarSensor(response, idc)
                        window.setTimeout(getData, 20000)
                    } else {
                        App.animacionReconectando()
                        window.setTimeout(function () { getData() }, 10000)
                    }
                }
                getData()
            })
        },
        clearSensoresDOM: function () {
            App.htmlElements.contenedorSensorPB.innerHTML = ""
            App.htmlElements.contenedorSensorPA.innerHTML = ""
        },
        animacionConectando: function () {
            for (let contenedor of App.htmlElements.contenedorLoading) contenedor.style.display = "flex"
        },
        removerAnimacionConectando: function () {
            for (let contenedor of App.htmlElements.contenedorLoading) contenedor.style.display = "none"
        },
        animacionReconectando: function () {
            // App.htmlElements.contenedor_reconnect.removeProperty('dislay')
            App.htmlElements.contenedor_reconnect.style.display = "block"
            App.htmlElements.contenedor.style.opacity = .1
        },
        removerAnimacionReconectando: function () {
            App.htmlElements.contenedor_reconnect.style.display = "none"
            App.htmlElements.contenedor.style.opacity = 1
        },
        setColoresTemp: function (valores, contenedor, boton) {
            valores = parseInt(valores)
            App.removerClases(contenedor, boton)
            if (valores >= 87) {
                contenedor.classList.add('sensor-high-critical')
                boton.classList.add('sensor-high-critical')
            }
            else if (valores <= 86 && valores >= 78) {
                contenedor.classList.add('sensor-high-warning')
                boton.classList.add('sensor-high-warning')
            }
            else if (valores <= 77 && valores >= 67) {
                contenedor.classList.add('sensor-normal')
                boton.classList.add('sensor-normal')
            }
            else if (valores >= 58 && valores <= 66) {
                contenedor.classList.add('sensor-low-warning')
                boton.classList.add('sensor-low-warning')
            }
            else if (valores <= 57) {
                contenedor.classList.add('sensor-low-critical')
                boton.classList.add('sensor-low-critical')
            } else {
                App.removerClases(contenedor, boton)
            }
        },
        setColoresHum: function (valores, contenedor, boton) {
            App.removerClases(contenedor, boton)
            if (valores >= 80) {
                App.removerClases(contenedor, boton)
                contenedor.classList.add('sensor-high-critical')
                boton.classList.add('sensor-high-critical')
            }
            else if (valores <= 79 && valores >= 66) {
                App.removerClases(contenedor, boton)
                contenedor.classList.add('sensor-high-warning')
                boton.classList.add('sensor-high-warning')
            }
            else if (valores >= 45 && valores <= 65) {
                App.removerClases(contenedor, boton)
                contenedor.classList.add('sensor-normal')
                boton.classList.add('sensor-normal')
            }
            else if (valores >= 30 && valores <= 44) {
                App.removerClases(contenedor, boton)
                contenedor.classList.add('sensor-low-warning')
                boton.classList.add('sensor-low-warning')
            } else if (valores <= 29) {
                contenedor.classList.add('sensor-low-critical')
                boton.classList.add('sensor-low-critical')
            }
            else {
                App.removerClases(contenedor, boton)
            }
        },
        removerClases: function (contenedor, boton) {
            contenedor.classList.remove('sensor-high-critical')
            contenedor.classList.remove('sensor-high-warning')
            contenedor.classList.remove('sensor-normal')
            contenedor.classList.remove('sensor-low-warning')
            contenedor.classList.remove('sensor-low-critical')

            boton.classList.remove('sensor-high-critical')
            boton.classList.remove('sensor-high-warning')
            boton.classList.remove('sensor-normal')
            boton.classList.remove('sensor-low-warning')
            boton.classList.remove('sensor-low-critical')
        },
        utils: {
            makeRequest: async function ({ method = "get", url, body = null }, idc, archivo) {
                try {
                    const response = await fetch(url, {
                        method,
                        body: body ? JSON.stringify(body) : null
                    })
                    App.removerAnimacionReconectando()
                    return response.json()
                } catch (error) {
                    //este try ctch no hace nada realmente
                    console.log(error)
                }
            },
            dibujarSensor: function (sensores) {
                App.clearSensoresDOM()
                let domSensorPA = ""
                let domSensorPB = ""
                sensores.forEach(sensor => {
                    if (sensor.planta == 'PA') {
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
                        App.htmlElements.contenedorSensorPA.innerHTML = domSensorPA
                    }
                    if (sensor.planta == 'PB') {
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
                        App.htmlElements.contenedorSensorPB.innerHTML = domSensorPB
                    }
                })
                // App.htmlElements.contenedorSensorPA.innerHTML = domSensor
            },
            actualizarSensor: function (response, idc) {
                const { ip, modelo, device, sensors } = response

                App.htmlElements.headerDatacenter.innerHTML = `Temperatura y Humedad ${idc}.`

                sensors.forEach(sensorItem => {
                    const sensorId = sensorItem.id ?? 0
                    const temperatura = sensorItem.temperature ?? "-"
                    const humedad = sensorItem.humidity ?? "-"
                    const nombreSensor = sensorItem.name || ip

                    const iconoTemp = document.getElementById(`div-sensor-temp-icon-${ip}`)
                    const iconoHum = document.getElementById(`div-sensor-hum-icon-${ip}`)
                    const botonTemp = document.getElementById(`btn-temp-${ip}`)
                    const botonHum = document.getElementById(`btn-hum-${ip}`)
                    const tituloCard = document.getElementById(`h3-${ip}`)
                    const cuerpoCard = document.getElementById(`sensores-cuerpo-${ip}`)
                    const textoTemp = document.getElementById(`h2-temp-${ip}`)
                    const textoHum = document.getElementById(`h2-hum-${ip}`)

                    if (!iconoTemp || !botonTemp) {
                        console.warn(`No se encontró el contenedor del sensor ${ip}`)
                        return
                    }

                    if (temperatura !== "-") {
                        App.setColoresTemp(temperatura, iconoTemp, botonTemp)
                        textoTemp.innerHTML = `${temperatura}°F`
                    } else {
                        textoTemp.innerHTML = "-"
                    }

                    if (humedad !== "-") {
                        App.setColoresHum(humedad, iconoHum, botonHum)
                        textoHum.innerHTML = `${humedad}%`
                    } else {
                        textoHum.innerHTML = "-"
                    }
                    tituloCard.innerHTML = `<a class="link-titulo-sensor" href="http://${ip}/" target="_blank">${device.name || nombreSensor}</a>`
                    cuerpoCard?.classList.remove("opacidad")
                })
            }

        }
    }
    App.init()
})()