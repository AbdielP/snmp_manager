(function () {
    var App = {
        variables: {
            activeIDC: null
        },
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
        // Leer documento de sensores
        readSensores: function (archivo, idc) {
            // Marca el IDC activo dentro del módulo
            App.variables.activeIDC = idc

            // Limpia el DOM y muestra animación
            App.clearSensoresDOM()
            App.animacionConectando()

            async function readData() {
                const response = await App.utils.makeRequest({
                    url: App.config.api.readFile(archivo)
                })

                if (response && response.obj && Array.isArray(response.obj.sensores)) {
                    // No dibujamos nada aquí; los cards se crearán al recibir data real
                    App.scanSensores(response.obj.sensores, idc, archivo)
                    App.removerAnimacionConectando()
                } else {
                    App.removerAnimacionConectando()
                    App.htmlElements.contenedorSensorPB.innerHTML =
                        `<h3><i class="fas fa-exclamation-triangle"></i> --- SIN CONEXIÓN CON EL SERVIDOR --- <i class="fas fa-exclamation-triangle"></h3>`
                    App.htmlElements.contenedorSensorPA.innerHTML =
                        `<h3><i class="fas fa-exclamation-triangle"></i> --- SIN CONEXIÓN CON EL SERVIDOR --- <i class="fas fa-exclamation-triangle"></h3>`
                    window.setTimeout(readData, 5000)
                }
            }
            readData()
        },
        scanSensores: function (sensores, idc, archivo) {
            sensores.forEach(sensorBase => {
                async function getData() {
                    // Si cambió de datacenter, abortar este ciclo
                    if (App.variables.activeIDC !== idc) return

                    const response = await App.utils.makeRequest({
                        url: App.config.api.getTemp(sensorBase.ip, sensorBase.modelo)
                    }, idc, archivo)

                    // Aborta si cambió el IDC mientras cargaba
                    if (App.variables.activeIDC !== idc) return

                    if (response) {
                        // Si el dispositivo tiene múltiples sensores (PDU)
                        if (Array.isArray(response.sensors) && response.sensors.length > 1) {
                            response.sensors.forEach(sensorItem => {
                                // ID interno (solo para el DOM)
                                const domId = `${response.ip}_s${sensorItem.id}`
                                const cardId = `${sensorBase.planta} ${domId}`

                                // Crear card si no existe
                                if (!document.getElementById(cardId)) {
                                    const newCard = {
                                        planta: sensorBase.planta,
                                        ip: domId,  // usado solo como ID
                                        modelo: response.modelo
                                    }
                                    App.utils.dibujarSensor([newCard])
                                }

                                // Actualizar datos visuales
                                App.utils.actualizarSensor({
                                    ip: domId,
                                    modelo: response.modelo,
                                    device: response.device,
                                    sensors: [sensorItem]
                                }, idc)

                                // Corrige el link del título para usar la IP real
                                const titulo = document.getElementById(`h3-${domId}`)
                                if (titulo)
                                    titulo.innerHTML = `<a class="link-titulo-sensor" href="http://${response.ip}/" target="_blank">${response.device.name}</a>`
                            })
                        } else {
                            // SP2 / SP2+
                            const cardId = `${sensorBase.planta} ${response.ip}`
                            if (!document.getElementById(cardId)) {
                                App.utils.dibujarSensor([sensorBase])
                            }
                            App.utils.actualizarSensor(response, idc)
                        }

                        if (App.variables.activeIDC === idc)
                            window.setTimeout(getData, 20000)
                    } else {
                        if (App.variables.activeIDC === idc) {
                            App.animacionReconectando()
                            window.setTimeout(() => getData(), 10000)
                        }
                    }
                }
                getData()
            })
        }, clearSensoresDOM: function () {
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
                let domSensorPA = App.htmlElements.contenedorSensorPA.innerHTML
                let domSensorPB = App.htmlElements.contenedorSensorPB.innerHTML

                sensores.forEach(sensor => {
                    const cardHTML = `
        <div class="contenedor-sensor" id="${sensor.planta} ${sensor.ip}">
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

                    if (sensor.planta === 'PA')
                        domSensorPA += cardHTML
                    else if (sensor.planta === 'PB')
                        domSensorPB += cardHTML
                })

                App.htmlElements.contenedorSensorPA.innerHTML = domSensorPA
                App.htmlElements.contenedorSensorPB.innerHTML = domSensorPB
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