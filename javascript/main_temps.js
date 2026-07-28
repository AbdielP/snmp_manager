(function () {
    var App = {
        variables: {
            activeIDC: null,
            refreshTimer: null,
            devicesIndex: new Map(), // domId -> { domId, ip, modelo, planta, name }
            fullDeviceList: [],
            sortMode: "AZ",
            filterPlanta: "ALL",
            filterTipo: "ALL" // ALL | AKCP | PDU
        },
        config: {
            api: {
                // baseUrl: "http://localhost:3000",
                baseUrl: "/api",
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
            // Botones filtro
            btnSortAZ: document.querySelector("#sort-az"),
            btnSortZA: document.querySelector("#sort-za"),
            btnFilterAll: document.querySelector("#filter-all"),
            btnFilterPA: document.querySelector("#filter-pa"),
            btnFilterPB: document.querySelector("#filter-pb"),
            btnFilterTipoAll: document.querySelector("#filter-tipo-all"),
            btnFilterTipoAKCP: document.querySelector("#filter-akcp"),
            btnFilterTipoPDU: document.querySelector("#filter-pdu"),
        },

        init: function () {
            App.htmlElements.btnIdcPp.addEventListener("click", function () {
                App.readSensores("sensorespp", "IDC Panamá Pacífico")
            })
            App.htmlElements.btnIdcBal.addEventListener("click", function () {
                App.readSensores("sensoresbal", "IDC Balboa")
            })
            // Sorting A-Z
            App.htmlElements.btnSortAZ.addEventListener("click", function () {
                App.variables.sortMode = "AZ"
                App.utils.applyFiltersAndRender()
                App.utils.updateFilterButtons()
            })

            // Sorting Z-A
            App.htmlElements.btnSortZA.addEventListener("click", function () {
                App.variables.sortMode = "ZA"
                App.utils.applyFiltersAndRender()
                App.utils.updateFilterButtons()
            })

            // Filtro: Todos
            App.htmlElements.btnFilterAll.addEventListener("click", function () {
                App.variables.filterPlanta = "ALL"
                App.utils.applyFiltersAndRender()
                App.utils.updateFilterButtons()
            })

            // Filtro: Solo PA
            App.htmlElements.btnFilterPA.addEventListener("click", function () {
                App.variables.filterPlanta = "PA"
                App.utils.applyFiltersAndRender()
                App.utils.updateFilterButtons()
            })

            // Filtro: Solo PB
            App.htmlElements.btnFilterPB.addEventListener("click", function () {
                App.variables.filterPlanta = "PB"
                App.utils.applyFiltersAndRender()
                App.utils.updateFilterButtons()
            })

            App.htmlElements.btnFilterTipoAll.addEventListener("click", () => {
                App.variables.filterTipo = "ALL"
                App.utils.applyFiltersAndRender()
                App.utils.updateFilterButtons()
            })

            App.htmlElements.btnFilterTipoAKCP.addEventListener("click", () => {
                App.variables.filterTipo = "AKCP"
                App.utils.applyFiltersAndRender()
                App.utils.updateFilterButtons()
            })

            App.htmlElements.btnFilterTipoPDU.addEventListener("click", () => {
                App.variables.filterTipo = "PDU"
                App.utils.applyFiltersAndRender()
                App.utils.updateFilterButtons()
            })

            App.utils.updateFilterButtons()
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
                        .makeRequest({ url: App.config.api.getTemp(s.ip, s.modelo), showReconnect: false })
                        .then((r) => ({ config: s, response: r ? { ...r, planta: s.planta } : null }))
                        .catch(() => ({ config: s, response: null }))
                )
                const responses = await Promise.all(requests)
                if (App.variables.activeIDC !== idc) return

                // 2) Expandir todos los sensores usando el domId del backend
                const devices = responses
                    .flatMap(({ config, response: r }) => {
                        const tipo =
                            config.modelo === "SP2" || config.modelo === "SP2+"
                                ? "AKCP"
                                : "PDU"

                        if (!r || !r.device || !r.device.name) {
                            return [
                                {
                                    ip: config.ip,
                                    domId: `${config.ip}-s1`,
                                    modelo: config.modelo,
                                    tipo,
                                    planta: config.planta,
                                    name: config.ip,
                                    device: { name: config.ip, location: "" },
                                    sensor: { temperature: "-", humidity: "-" },
                                    disconnected: true,
                                },
                            ]
                        }

                        if (Array.isArray(r.sensors) && r.sensors.length > 0) {
                            return r.sensors.map((s) => ({
                                ip: r.ip, // IP real
                                domId: s.domId, // viene del backend
                                modelo: r.modelo,
                                tipo,
                                planta: r.planta,
                                name: s.name || r.device.name,
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
                                domId: `${r.ip}-s1`,
                                modelo: r.modelo,
                                tipo,
                                planta: r.planta,
                                name: r.device.name,
                                device: r.device,
                                sensor: { temperature: "-", humidity: "-" },
                                disconnected: true,
                            },
                        ]
                    })

                // Guardar lista completa para sorting/filtrado en frontend
                App.variables.fullDeviceList = devices.slice()


                // 3) Ordenar A–Z por nombre dentro de cada planta
                App.utils.applyFiltersAndRender();

                // 4) Guardar índice de actualización
                devices.forEach((d) =>
                    App.variables.devicesIndex.set(d.domId, {
                        domId: d.domId,
                        ip: d.ip,
                        modelo: d.modelo,
                        planta: d.planta,
                        name: d.name,
                        disconnected: d.disconnected === true,
                    })
                )

                App.removerAnimacionConectando()

                // 5) Refrescador periódico (solo actualiza valores)
                App.variables.refreshTimer = setInterval(async () => {
                    if (App.variables.activeIDC !== idc) {
                        clearInterval(App.variables.refreshTimer)
                        return
                    }

                    const serverStatus = await App.utils.makeRequest({ url: App.config.api.readFile(archivo) })
                    if (!serverStatus?.obj?.sensores || !Array.isArray(serverStatus.obj.sensores)) {
                        App.animacionReconectando()
                        return
                    }

                    const list = Array.from(App.variables.devicesIndex.values())
                    const uniqueIPs = [...new Set(list.map((d) => d.ip))]

                    const tickReq = uniqueIPs.map((ip) => {
                        const any = list.find((d) => d.ip === ip)
                        return App.utils
                            .makeRequest({ url: App.config.api.getTemp(ip, any.modelo), showReconnect: false })
                            .then((r) => ({ ip, response: r }))
                            .catch(() => ({ ip, response: null }))
                    })

                    const tickRes = await Promise.all(tickReq)
                    if (App.variables.activeIDC !== idc) return

                    tickRes.forEach(({ ip, response: r }) => {
                        const entriesByIp = list.filter((d) => d.ip === ip)
                        if (!r || !Array.isArray(r.sensors) || r.sensors.length === 0) {
                            entriesByIp.forEach((entry) => {
                                App.utils.updateCardValues({
                                    domId: entry.domId,
                                    ip: entry.ip,
                                    name: entry.name,
                                    temperatura: "-",
                                    humedad: "-",
                                    disconnected: true,
                                })
                            })
                            return
                        }

                        const updatedDomIds = new Set()
                        const newSensors = []

                        r.sensors.forEach((s) => {
                            const domId = s.domId
                            const entry = App.variables.devicesIndex.get(domId)
                            if (!entry) {
                                newSensors.push(s)
                                return
                            }
                            updatedDomIds.add(domId)
                            entry.disconnected = false
                            App.utils.updateCardValues({
                                domId,
                                ip: entry.ip,
                                name: entry.name,
                                temperatura: s.temperature ?? "-",
                                humedad: s.humidity ?? "-",
                                disconnected: false,
                            })
                        })

                        if (newSensors.length > 0) {
                            const refEntry = entriesByIp[0]
                            const planta = refEntry?.planta
                            const modelo = refEntry?.modelo
                            const tipo = modelo === "SP2" || modelo === "SP2+" ? "AKCP" : "PDU"
                            const contenedor = planta === "PA"
                                ? App.htmlElements.contenedorSensorPA
                                : App.htmlElements.contenedorSensorPB

                            entriesByIp.forEach((entry) => {
                                if (!updatedDomIds.has(entry.domId)) {
                                    const card = document.querySelector(`[id$=" ${entry.domId}"]`)
                                    if (card) card.remove()
                                    App.variables.devicesIndex.delete(entry.domId)
                                    App.variables.fullDeviceList = App.variables.fullDeviceList.filter(d => d.domId !== entry.domId)
                                }
                            })

                            newSensors.forEach((s) => {
                                const domId = s.domId
                                const name = s.name || r.device?.name || ip
                                App.variables.fullDeviceList.push({ ip, domId, modelo, tipo, planta, name, device: r.device, sensor: { temperature: s.temperature ?? "-", humidity: s.humidity ?? "-" }, disconnected: false })
                                App.variables.devicesIndex.set(domId, { domId, ip, modelo, planta, name, disconnected: false })

                                const wrapper = document.createElement('div')
                                wrapper.innerHTML = `<div class="contenedor-sensor" id="${planta} ${domId}">
    <div class="contenedor-titulo-sensor"><h3 id="h3-${domId}"><a class="link-titulo-sensor" href="http://${ip}/" target="_blank">${name}</a></h3></div>
    <div class="contenedor-sensores-cuerpo" id="sensores-cuerpo-${domId}">
        <div class="contenedor-sensor-temp">
            <div id="div-sensor-temp-icon-${domId}" class="div-sensor-temp-icon"><img src="./assets/img/TEMP.png" width="20"></div>
            <div class="div-sensor-temp-centro"><button id="btn-temp-${domId}">Temperatura</button></div>
            <div class="div-sensor-temp-temperatura"><h2 id="h2-temp-${domId}">-</h2></div>
        </div>
        <div class="contenedor-sensor-hum">
            <div id="div-sensor-hum-icon-${domId}" class="div-sensor-hum-icon"><img src="./assets/img/HUM.png" width="16"></div>
            <div class="div-sensor-hum-centro"><button id="btn-hum-${domId}">Humedad</button></div>
            <div class="div-sensor-hum-porcentaje"><h2 id="h2-hum-${domId}">-</h2></div>
        </div>
    </div>
</div>`
                                contenedor.appendChild(wrapper.firstElementChild)
                                App.utils.updateCardValues({ domId, ip, name, temperatura: s.temperature ?? "-", humedad: s.humidity ?? "-", disconnected: false })
                            })
                        }

                        entriesByIp
                            .filter((entry) => !updatedDomIds.has(entry.domId) && App.variables.devicesIndex.has(entry.domId))
                            .forEach((entry) => {
                                App.utils.updateCardValues({
                                    domId: entry.domId,
                                    ip: entry.ip,
                                    name: entry.name,
                                    temperatura: "-",
                                    humedad: "-",
                                    disconnected: true,
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
            if (App.htmlElements.contenedor_reconnect) {
                App.htmlElements.contenedor_reconnect.style.display = "flex"
            }
            if (App.htmlElements.contenedor) {
                App.htmlElements.contenedor.style.opacity = 0.1
            }
        },
        removerAnimacionReconectando: function () {
            if (App.htmlElements.contenedor_reconnect) {
                App.htmlElements.contenedor_reconnect.style.display = "none"
            }
            if (App.htmlElements.contenedor) {
                App.htmlElements.contenedor.style.opacity = 1
            }
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
            makeRequest: async function ({ method = "get", url, body = null, showReconnect = true }) {
                try {
                    const response = await fetch(url, {
                        method,
                        body: body ? JSON.stringify(body) : null,
                    })
                    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`)
                    if (showReconnect) App.removerAnimacionReconectando()
                    return response.json()
                } catch (error) {
                    if (showReconnect) App.animacionReconectando()
                    console.log(error)
                    return null
                }
            },

            renderCardsBulk: function (devicesPA, devicesPB) {
                const buildCard = (d) => `
        <div class="contenedor-sensor${d.disconnected ? " sensor-disconnected" : ""}" id="${d.planta} ${d.domId}">
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
                        disconnected: d.disconnected === true,
                    })
                })
            },

            updateCardValues: function ({ domId, ip, name, temperatura, humedad, disconnected = false }) {
                const card = document.querySelector(`[id$=" ${domId}"]`)
                const iconoTemp = document.getElementById(`div-sensor-temp-icon-${domId}`)
                const iconoHum = document.getElementById(`div-sensor-hum-icon-${domId}`)
                const botonTemp = document.getElementById(`btn-temp-${domId}`)
                const botonHum = document.getElementById(`btn-hum-${domId}`)
                const tituloCard = document.getElementById(`h3-${domId}`)
                const textoTemp = document.getElementById(`h2-temp-${domId}`)
                const textoHum = document.getElementById(`h2-hum-${domId}`)

                if (!iconoTemp || !botonTemp) return

                const cachedDevice = App.variables.fullDeviceList.find((d) => d.domId === domId)
                if (cachedDevice) {
                    cachedDevice.disconnected = disconnected
                    cachedDevice.sensor = {
                        temperature: disconnected ? "-" : temperatura,
                        humidity: disconnected ? "-" : humedad,
                    }
                }
                const indexedDevice = App.variables.devicesIndex.get(domId)
                if (indexedDevice) indexedDevice.disconnected = disconnected

                if (card) card.classList.toggle("sensor-disconnected", disconnected)
                tituloCard.innerHTML = `<a class="link-titulo-sensor${disconnected ? " warning-color" : ""}" href="http://${ip}/" target="_blank">${name || ip}</a>`

                if (!disconnected && temperatura !== "-" && temperatura !== undefined) {
                    App.setColoresTemp(temperatura, iconoTemp, botonTemp)
                    textoTemp.innerHTML = `${temperatura}°F`
                    iconoTemp.closest('.contenedor-sensor-temp')?.classList.remove('nodata')
                } else {
                    App.removerClases(iconoTemp, botonTemp)
                    textoTemp.innerHTML = "-"
                    if (!disconnected) iconoTemp.closest('.contenedor-sensor-temp')?.classList.add('nodata')
                    else iconoTemp.closest('.contenedor-sensor-temp')?.classList.remove('nodata')
                }

                if (!disconnected && humedad !== "-" && humedad !== undefined) {
                    App.setColoresHum(humedad, iconoHum, botonHum)
                    textoHum.innerHTML = `${humedad}%`
                    iconoHum.closest('.contenedor-sensor-hum')?.classList.remove('nodata')
                } else {
                    App.removerClases(iconoHum, botonHum)
                    textoHum.innerHTML = "-"
                    if (!disconnected) iconoHum.closest('.contenedor-sensor-hum')?.classList.add('nodata')
                    else iconoHum.closest('.contenedor-sensor-hum')?.classList.remove('nodata')
                }
            },
            applyFiltersAndRender: function () {
                // 1. Copiar lista completa
                let list = [...App.variables.fullDeviceList]

                // 2. FILTRO POR PLANTA
                if (App.variables.filterPlanta === "PA") {
                    list = list.filter(d => d.planta === "PA")
                } else if (App.variables.filterPlanta === "PB") {
                    list = list.filter(d => d.planta === "PB")
                }

                // 2.5 FILTRAR POR TIPO ← AQUÍ
                if (App.variables.filterTipo !== "ALL") {
                    list = list.filter(d => d.tipo === App.variables.filterTipo)
                }

                // 3. SORT
                if (App.variables.sortMode === "AZ") {
                    list.sort((a, b) => a.name.localeCompare(b.name))
                } else if (App.variables.sortMode === "ZA") {
                    list.sort((a, b) => b.name.localeCompare(a.name))
                }

                // 4. DIVIDIR POR PLANTA
                const pa = list.filter(d => d.planta === "PA")
                const pb = list.filter(d => d.planta === "PB")

                // 5. RENDER
                App.utils.renderCardsBulk(pa, pb)
            },
            updateFilterButtons: function () {
                // IDs a limpiar
                const ids = [
                    "sort-az", "sort-za",
                    "filter-all", "filter-pa", "filter-pb",
                    "filter-tipo-all", "filter-akcp", "filter-pdu"
                ]

                ids.forEach((id) => {
                    const btn = document.getElementById(id)
                    if (btn) btn.classList.remove("btn-active")
                })

                // SORT
                if (App.variables.sortMode === "AZ") {
                    document.getElementById("sort-az")?.classList.add("btn-active")
                } else {
                    document.getElementById("sort-za")?.classList.add("btn-active")
                }

                // PLANTA
                if (App.variables.filterPlanta === "ALL") {
                    document.getElementById("filter-all")?.classList.add("btn-active")
                } else if (App.variables.filterPlanta === "PA") {
                    document.getElementById("filter-pa")?.classList.add("btn-active")
                } else if (App.variables.filterPlanta === "PB") {
                    document.getElementById("filter-pb")?.classList.add("btn-active")
                }

                // TIPO
                if (App.variables.filterTipo === "ALL") {
                    document.getElementById("filter-tipo-all")?.classList.add("btn-active")
                } else if (App.variables.filterTipo === "AKCP") {
                    document.getElementById("filter-akcp")?.classList.add("btn-active")
                } else if (App.variables.filterTipo === "PDU") {
                    document.getElementById("filter-pdu")?.classList.add("btn-active")
                }
            }
        }
    }
    App.init()
})()
