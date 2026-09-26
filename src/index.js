import express from 'express'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

// Importa las rutas generales y las rutas relacionadas con autenticación.
import indexRoutes from './routes/index.js'
import authRoutes from './routes/autenticacion.js'

// Crea la aplicación principal de Express.
const app = express()

// Obtiene la carpeta absoluta de este archivo para construir rutas confiables.
const __dirname = dirname(fileURLToPath(import.meta.url))
console.log(join(__dirname, '/view'))

// Configura EJS como motor de plantillas y define dónde están las vistas.
app.set('views', join(__dirname, 'views'))
app.set('view engine', 'ejs')

// Permite recibir datos enviados por formularios y solicitudes JSON.
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// Registra las rutas generales y las de registro, login, menú y logout.
app.use(indexRoutes)
app.use(authRoutes)

// Publica archivos estáticos como imágenes, hojas de estilo y scripts.
app.use(express.static(join(__dirname,'public')))

// Inicia el servidor y lo deja escuchando en el puerto 5000.
app.listen(5000, () => {
  console.log('Servidor corriendo en http://localhost:5000')
})



