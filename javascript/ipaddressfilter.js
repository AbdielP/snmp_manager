const input = document.getElementById('ip')
input.addEventListener('blur', () => {
    ValidateIPaddress(input.value)
})

const ValidateIPaddress = (ipaddress) => {
    input.classList.remove('error')
    if(ipaddress.length > 0) {

        if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress))
        {
            return (true)
        }
        input.className =  `${ input.className } error`
        alert('Verificar dirección IP. Únicamente en formato ipV4 0.0.0.0')
        return (false)
    }
}

