import { Router } from 'express'

// Crea el agrupador de rutas generales del sitio.
const router = Router()

// Obtiene la hora actual para mostrarla en la página de inicio.
const hora = new Date().toLocaleTimeString('es-CO')

// Renderiza la página de contactos.
router.get('/contactos', (req, res) => res.render('contactos', { etiqueta: 'Pagina de contactos empresariales' }))

// Renderiza la página con la información de la empresa.
router.get('/sobre_nosotros', (req, res) => res.render('sobre_nosotros', { etiqueta: 'Nuestra historia' }))
router.get('/recuperacionUsuario', (req, res) => res.render('recuperacionUsuario', { etiqueta: 'Recuperación de usuario' }))
router.get('/recuperacionContrasena', (req, res) => res.render('recuperacionContrasena', { etiqueta: 'Recuperación de contraseña' }))


// Renderiza la página principal y le envía el título y la hora actual.
router.get('/', (req, res) => res.render('index', { etiqueta: 'mi primer sitio web con NODEJS', hora }))

// Exporta las rutas para registrarlas en la aplicación principal.
export default router
