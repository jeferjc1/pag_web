import { Router } from 'express'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto'
import { fileURLToPath } from 'url'

// Agrupa las rutas y la lógica de registro, inicio y cierre de sesión.
const router = Router()

// Define la ubicación absoluta del archivo que almacena los usuarios.
const __dirname = dirname(fileURLToPath(import.meta.url))
const usersFile = join(__dirname, '../../data/usuarios.json')

// Mantiene las sesiones activas mientras el servidor está ejecutándose.
const sessions = new Map()

// Lee los usuarios guardados; si el archivo aún no existe, devuelve una lista vacía.
function readUsers() {
  if (!existsSync(usersFile)) return []
  return JSON.parse(readFileSync(usersFile, 'utf8'))
}

// Crea la carpeta de datos y guarda la lista actualizada de usuarios.
function saveUsers(users) {
  mkdirSync(dirname(usersFile), { recursive: true })
  writeFileSync(usersFile, JSON.stringify(users, null, 2))
}

// Genera un hash seguro de la contraseña usando una sal aleatoria.
function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

// Compara una contraseña recibida con el hash almacenado sin comparar texto plano.
function passwordMatches(password, storedPassword) {
  const [salt, storedHash] = storedPassword.split(':')
  if (!salt || !storedHash) return false
  const hash = scryptSync(password, salt, 64)
  return timingSafeEqual(hash, Buffer.from(storedHash, 'hex'))
}

// Busca en memoria la sesión indicada por la cookie del navegador.
function authenticatedUser(req) {
  const sessionId = req.headers.cookie?.match(/(?:^|;\s*)sessionId=([^;]+)/)?.[1]
  return sessionId ? sessions.get(sessionId) : null
}

// Renderiza el registro y, si existe, muestra el error de validación recibido.
function renderRegistration(res, error = null) {
  return res.render('registro', { etiqueta: 'Registro de Usuario', error })
}

// Muestra el formulario de inicio de sesión.
router.get('/login', (req, res) => {
  res.render('login', { etiqueta: 'Vista inicio de sesion', mensaje: null })
})

// Valida las credenciales, crea una sesión y dirige al menú privado.
router.post('/login', (req, res) => {
  const { usuario, contrasena } = req.body
  const user = readUsers().find((candidate) =>
    candidate.correo.toLowerCase() === String(usuario || '').trim().toLowerCase()
  )

  if (!user || !passwordMatches(String(contrasena || ''), user.contrasena)) {
    return res.render('login', {
      etiqueta: 'Vista de inicio de sesion',
      mensaje: 'Usuario o contraseña incorrectos'
    })
  }

  const sessionId = randomUUID()
  sessions.set(sessionId, { nombre: user.nombre, correo: user.correo })
  res.setHeader('Set-Cookie', `sessionId=${sessionId}; HttpOnly; SameSite=Lax; Path=/`)
  return res.redirect('/menu')
})

// Invalida la sesión actual, elimina su cookie y vuelve al login.
router.get('/logout', (req, res) => {
  const sessionId = req.headers.cookie?.match(/(?:^|;\s*)sessionId=([^;]+)/)?.[1]
  if (sessionId) sessions.delete(sessionId)
  res.setHeader('Set-Cookie', 'sessionId=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0')
  return res.redirect('/login')
})

// Protege el menú: solo lo renderiza cuando existe una sesión válida.
router.get('/menu', (req, res) => {
  const user = authenticatedUser(req)
  if (!user) return res.redirect('/login')
  return res.render('menu', { etiqueta: 'Menu Empresarial', usuario: user })
})

// Muestra el formulario de registro sin datos de error iniciales.
router.get('/registro', (req, res) => renderRegistration(res))

// Valida, protege y guarda los datos enviados desde el formulario de registro.
router.post('/registro', (req, res) => {
  const {
    tipoDocumento, numeroDocumento, primerNombre, segundoNombre,
    primerApellido, segundoApellido, fechaNacimiento, correo,
    confirmarCorreo, contrasena
  } = req.body
  const normalizedEmail = String(correo || '').trim().toLowerCase()

  // Evita registrar dos correos que no coincidan entre sí.
  if (normalizedEmail !== String(confirmarCorreo || '').trim().toLowerCase()) {
    return renderRegistration(res, 'Los correos electrónicos no coinciden.')
  }

  const users = readUsers()
  // Impide duplicar el correo o el número de documento de otro usuario.
  if (users.some((user) => user.correo === normalizedEmail || user.numeroDocumento === numeroDocumento)) {
    return renderRegistration(res, 'El correo o número de documento ya está registrado.')
  }

  // Guarda la información del usuario y la contraseña únicamente como hash.
  users.push({
    tipoDocumento,
    numeroDocumento,
    primerNombre,
    segundoNombre,
    primerApellido,
    segundoApellido,
    fechaNacimiento,
    correo: normalizedEmail,
    nombre: [primerNombre, segundoNombre].filter(Boolean).join(' '),
    contrasena: hashPassword(String(contrasena || ''))
  })
  saveUsers(users)
  return res.redirect('/login')
})

// Exporta las rutas de autenticación para conectarlas en src/index.js.
export default router
