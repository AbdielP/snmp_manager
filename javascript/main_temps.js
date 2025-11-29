(function () {
    var App = {
        variables: {
            activeIDC: null,
            refreshTimer: null,
            devicesIndex: new Map(), // domId -> { domId, ip, modelo, planta, name }
        },
        config: {
            api: {
                baseUrl: "http://localhost:3000",
                readFile: function (archivo) {
                    return `${App.config.api.baseUrl}/read/${archivo}`
                },
                getTemp: function (ip, modelo) {
                    if (modelo == "SP2")
                        return `${App.config.api.baseUrl}/temp/sp2/${ip}`
                    else if (modelo == "SP2+")
                        return `${App.config.api.baseUrl}/temp/sp2plus/${ip}`
                    else
                        return `${App.config.api.baseUrl}/temp/ap8841/${ip}`
                },
            },
        },
        htmlElements: {
            contenedor: document.querySelector(".contenedor"),
            contenedor_reconnect: document.querySelector(".contenedor-reconectando"),
            headerDatacenter: document.querySelector(".header-datacenter"),
            btnIdcPp: document.querySelector("#btn-idc-pp"),
            btnIdcBal: document.querySelector("#btn-idc-bal"),
            contenedorLoading: document.getElementsByClassName("contenedor-loading"),
            contenedorSensorPA: document.querySelector("#main-contenedor-sensor"),
            contenedorSensorPB: document.querySelector("#main-contenedor-sensor-pb"),
        },

        init: function () {
            App.htmlElements.btnIdcPp.addEventListener("click", function () {
                App.readSensores("sensorespp", "IDC Panamá Pacífico")
            })
            App.htmlElements.btnIdcBal.addEventListener("click", function () {
                App.readSensores("sensoresbal", "IDC Balboa")
            })
        },

        // Entrada principal
        readSensores: function (archivo, idc) {
            App.variables.activeIDC = idc;
            App.htmlElements.headerDatacenter.innerHTML = `Temperatura y Humedad ${idc}.`

            // limpiar UI y estados
            App.clearSensoresDOM()
            App.animacionConectando()
            if (App.variables.refreshTimer) {
                clearInterval(App.variables.refreshTimer)
                App.variables.refreshTimer = null
            }
            if (!(App.variables.devicesIndex instanceof Map)) {
                App.variables.devicesIndex = new Map()
            } else {
                App.variables.devicesIndex.clear()
            }

            (async function loadAndRender() {
                const base = await App.utils.makeRequest({ url: App.config.api.readFile(archivo) })
                if (!base?.obj?.sensores || !Array.isArray(base.obj.sensores)) {
                    App.removerAnimacionConectando()
                    App.showNoServer()
                    return
                }

                // 1) Pedimos TODO en paralelo
                const requests = base.obj.sensores.map((s) =>
                    App.utils
                        .makeRequest({ url: App.config.api.getTemp(s.ip, s.modelo) })
                        .then((r) => (r ? { ...r, planta: s.planta } : null))
                        .catch(() => null)
                )
                const responses = await Promise.all(requests)
                if (App.variables.activeIDC !== idc) return

                // 2) Expandir todos los sensores usando el domId del backend
                const devices = responses
                    .filter((r) => r && r.device && r.device.name)
                    .flatMap((r) => {
                        if (Array.isArray(r.sensors) && r.sensors.length > 0) {
                            return r.sensors.map((s) => ({
                                ip: r.ip, // IP real
                                domId: s.domId, // ← viene del backend
                                modelo: r.modelo,
                                planta: r.planta,
                                name: r.device.name,
                                device: r.device,
                                sensor: {
                                    temperature: s.temperature ?? "-",
                                    humidity: s.humidity ?? "-",
                                },
                            }))
                        }
                        return [
                            {
                                ip: r.ip,
                                domId: `${r.ip}-s0`,
                                modelo: r.modelo,
                                planta: r.planta,
                                name: r.device.name,
                                device: r.device,
                                sensor: { temperature: "-", humidity: "-" },
                            },
                        ]
                    })

                // 3) Ordenar A–Z por nombre dentro de cada planta
                const devicesPA = devices
                    .filter((d) => d.planta === "PA")
                    .sort((a, b) => a.name.localeCompare(b.name))
                const devicesPB = devices
                    .filter((d) => d.planta === "PB")
                    .sort((a, b) => a.name.localeCompare(b.name))

                // 4) Pintar todas las cards en un solo lote
                App.utils.renderCardsBulk(devicesPA, devicesPB)

                // 5) Guardar índice de actualización
                devices.forEach((d) =>
                    App.variables.devicesIndex.set(d.domId, {
                        domId: d.domId,
                        ip: d.ip,
                        modelo: d.modelo,
                        planta: d.planta,
                        name: d.name,
                    })
                )

                App.removerAnimacionConectando()

                // 6) Refrescador periódico (solo actualiza valores)
                App.variables.refreshTimer = setInterval(async () => {
                    if (App.variables.activeIDC !== idc) {
                        clearInterval(App.variables.refreshTimer)
                        return
                    }

                    const list = Array.from(App.variables.devicesIndex.values())
                    const uniqueIPs = [...new Set(list.map((d) => d.ip))]

                    const tickReq = uniqueIPs.map((ip) => {
                        const any = list.find((d) => d.ip === ip)
                        return App.utils
                            .makeRequest({ url: App.config.api.getTemp(ip, any.modelo) })
                            .catch(() => null)
                    })

                    const tickRes = await Promise.all(tickReq)
                    if (App.variables.activeIDC !== idc) return

                    tickRes
                        .filter(Boolean)
                        .forEach((r) => {
                            if (!Array.isArray(r.sensors)) return
                            r.sensors.forEach((s) => {
                                const domId = s.domId // ← ya viene del backend
                                const entry = App.variables.devicesIndex.get(domId)
                                if (!entry) return
                                App.utils.updateCardValues({
                                    domId,
                                    ip: entry.ip,
                                    name: entry.name,
                                    temperatura: s.temperature ?? "-",
                                    humedad: s.humidity ?? "-",
                                })
                            })
                        })
                }, 20000)
            })()
        },

        clearSensoresDOM: function () {
            App.htmlElements.contenedorSensorPB.innerHTML = ""
            App.htmlElements.contenedorSensorPA.innerHTML = ""
        },

        animacionConectando: function () {
            for (let c of App.htmlElements.contenedorLoading) c.style.display = "flex"
        },
        removerAnimacionConectando: function () {
            for (let c of App.htmlElements.contenedorLoading) c.style.display = "none"
        },
        animacionReconectando: function () {
            App.htmlElements.contenedor_reconnect.style.display = "block"
            App.htmlElements.contenedor.style.opacity = 0.1
        },
        removerAnimacionReconectando: function () {
            App.htmlElements.contenedor_reconnect.style.display = "none"
            App.htmlElements.contenedor.style.opacity = 1
        },

        showNoServer: function () {
            const msg =
                `<h3><i class="fas fa-exclamation-triangle"></i> --- SIN CONEXIÓN CON EL SERVIDOR --- <i class="fas fa-exclamation-triangle"></h3>`
            App.htmlElements.contenedorSensorPA.innerHTML = msg
            App.htmlElements.contenedorSensorPB.innerHTML = msg
        },

        setColoresTemp: function (valores, contenedor, boton) {
            valores = parseInt(valores)
            App.removerClases(contenedor, boton)
            if (valores >= 87) {
                contenedor.classList.add("sensor-high-critical")
                boton.classList.add("sensor-high-critical")
            } else if (valores <= 86 && valores >= 78) {
                contenedor.classList.add("sensor-high-warning")
                boton.classList.add("sensor-high-warning")
            } else if (valores <= 77 && valores >= 67) {
                contenedor.classList.add("sensor-normal")
                boton.classList.add("sensor-normal")
            } else if (valores >= 58 && valores <= 66) {
                contenedor.classList.add("sensor-low-warning")
                boton.classList.add("sensor-low-warning")
            } else if (valores <= 57) {
                contenedor.classList.add("sensor-low-critical")
                boton.classList.add("sensor-low-critical")
            } else {
                App.removerClases(contenedor, boton)
            }
        },

        setColoresHum: function (valores, contenedor, boton) {
            App.removerClases(contenedor, boton)
            if (valores >= 80) {
                contenedor.classList.add("sensor-high-critical")
                boton.classList.add("sensor-high-critical")
            } else if (valores <= 79 && valores >= 66) {
                contenedor.classList.add("sensor-high-warning")
                boton.classList.add("sensor-high-warning")
            } else if (valores >= 45 && valores <= 65) {
                contenedor.classList.add("sensor-normal")
                boton.classList.add("sensor-normal")
            } else if (valores >= 30 && valores <= 44) {
                contenedor.classList.add("sensor-low-warning")
                boton.classList.add("sensor-low-warning")
            } else if (valores <= 29) {
                contenedor.classList.add("sensor-low-critical")
                boton.classList.add("sensor-low-critical")
            }
        },

        removerClases: function (contenedor, boton) {
            contenedor.classList.remove(
                "sensor-high-critical",
                "sensor-high-warning",
                "sensor-normal",
                "sensor-low-warning",
                "sensor-low-critical"
            );
            boton.classList.remove(
                "sensor-high-critical",
                "sensor-high-warning",
                "sensor-normal",
                "sensor-low-warning",
                "sensor-low-critical"
            );
        },

        utils: {
            makeRequest: async function ({ method = "get", url, body = null }) {
                try {
                    const response = await fetch(url, {
                        method,
                        body: body ? JSON.stringify(body) : null,
                    })
                    App.removerAnimacionReconectando()
                    return response.json()
                } catch (error) {
                    console.log(error)
                }
            },

            renderCardsBulk: function (devicesPA, devicesPB) {
                const buildCard = (d) => `
        <div class="contenedor-sensor" id="${d.planta} ${d.domId}">
            <div class="contenedor-titulo-sensor">
                <h3 id="h3-${d.domId}">
                    <a class="link-titulo-sensor" href="http://${d.ip}/" target="_blank">${d.name}</a>
                </h3>
            </div>
            <div class="contenedor-sensores-cuerpo" id="sensores-cuerpo-${d.domId}">
                <div class="contenedor-sensor-temp">
                    <div id="div-sensor-temp-icon-${d.domId}" class="div-sensor-temp-icon">
                        <img src="./assets/img/TEMP.png" width="20">
                    </div>
                    <div class="div-sensor-temp-centro">
                        <button id="btn-temp-${d.domId}">Temperatura</button>
                    </div>
                    <div class="div-sensor-temp-temperatura">
                        <h2 id="h2-temp-${d.domId}">-</h2>
                    </div>
                </div>
                <div class="contenedor-sensor-hum">
                    <div id="div-sensor-hum-icon-${d.domId}" class="div-sensor-hum-icon">
                        <img src="./assets/img/HUM.png" width="16">
                    </div>
                    <div class="div-sensor-hum-centro">
                        <button id="btn-hum-${d.domId}">Humedad</button>
                    </div>
                    <div class="div-sensor-hum-porcentaje">
                        <h2 id="h2-hum-${d.domId}">-</h2>
                    </div>
                </div>
            </div>
        </div>`

                App.htmlElements.contenedorSensorPA.innerHTML = devicesPA.map(buildCard).join("")
                App.htmlElements.contenedorSensorPB.innerHTML = devicesPB.map(buildCard).join("")

                devicesPA.concat(devicesPB).forEach((d) => {
                    App.utils.updateCardValues({
                        domId: d.domId,
                        ip: d.ip,
                        name: d.name,
                        planta: d.planta,
                        temperatura: d.sensor?.temperature ?? "-",
                        humedad: d.sensor?.humidity ?? "-",
                    })
                })
            },

            updateCardValues: function ({ domId, ip, name, temperatura, humedad }) {
                const iconoTemp = document.getElementById(`div-sensor-temp-icon-${domId}`)
                const iconoHum = document.getElementById(`div-sensor-hum-icon-${domId}`)
                const botonTemp = document.getElementById(`btn-temp-${domId}`)
                const botonHum = document.getElementById(`btn-hum-${domId}`)
                const tituloCard = document.getElementById(`h3-${domId}`)
                const textoTemp = document.getElementById(`h2-temp-${domId}`)
                const textoHum = document.getElementById(`h2-hum-${domId}`)

                if (!iconoTemp || !botonTemp) return

                tituloCard.innerHTML = `<a class="link-titulo-sensor" href="http://${ip}/" target="_blank">${name}</a>`

                if (temperatura !== "-" && temperatura !== undefined) {
                    App.setColoresTemp(temperatura, iconoTemp, botonTemp)
                    textoTemp.innerHTML = `${temperatura}°F`
                } else {
                    textoTemp.innerHTML = "-"
                }

                if (humedad !== "-" && humedad !== undefined) {
                    App.setColoresHum(humedad, iconoHum, botonHum)
                    textoHum.innerHTML = `${humedad}%`
                } else {
                    textoHum.innerHTML = "-"
                }
            },
        },
    }
    App.init()
})()
