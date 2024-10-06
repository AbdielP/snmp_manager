const input = document.getElementById('ip')
const btnSubmit = document.getElementById('btn-add-sensor')

input.addEventListener('blur', () => {
    ValidateIPaddress(input.value)
})

const ValidateIPaddress = (ipaddress) => {
    if(btnSubmit.disabled) {
        btnSubmit.disabled = false
        btnSubmit.innerHTML = 'Agregar sensor'
        input.classList.remove('error')
    }
    if(ipaddress.length > 0) {
        if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress))
        { return (true) }
        btnSubmit.disabled = true
        btnSubmit.innerHTML = 'IP No Valida'
        input.className = `${ input.className } error`
        // console.log(btnSubmit)
        alert('Verificar dirección IP. Únicamente en formato ipV4 0.0.0.0')
        return (false)
    }
}
