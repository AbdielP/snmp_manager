import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Servir archivos estáticos desde la raíz del proyecto
app.use(express.static(__dirname))

// Fallback (opcional si usas rutas tipo /algo)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
})

app.listen(process.env.PORT || 80, () => {
    console.log('Server running on port', process.env.PORT || 80)
})