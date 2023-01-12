const express = require('express')
const expressLayouts = require('express-ejs-layouts')
const path = require('path')
const bodyParser = require('body-parser')
const flash = require('connect-flash')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const expressValidator = require('express-validator')
const passport = require('./config/passport')
const router = require('./routes')

// Configuracion y Modelos BD
const db = require('./config/db')
require('./models/Usuarios')
require('./models/Categorias')
require('./models/Grupos')
require('./models/Meeti')
require('./models/Comentarios')
db.sync().then(() => console.log('DB Conectada')).catch((error) => console.log(error))

// Variables de Desarrollo
require('dotenv').config({path: 'variables.env'})

// Aplicacion Principal
const app = express()

// Body parser, leer formularios
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

// Express validator (validacion con bastantes funciones)
app.use(expressValidator())

// Hablitar EJS como template engine
app.use(expressLayouts)
app.set('view engine', 'ejs')

// Ubicación  vistas
app.set('views', path.join(__dirname, './views'))

// Archivos estaticos
app.use(express.static('public'))

// Habilitar cookie parser
app.use(cookieParser())

// Crear la session
app.use(session({
    secret: process.env.SECRETO,
    key: process.env.KEY,
    resave: false,
    saveUninitialized: false
}))

// Inicializar passport
app.use(passport.initialize())
app.use(passport.session())

// Agrega flash messages
app.use(flash())

// Middleware (usuario logueado, flash messages, fecha actual)
app.use((req, res, next) => {
    res.locals.usuario = {...req.user} || null;
    res.locals.mensajes = req.flash()
    const fecha = new Date()
    res.locals.year = fecha.getFullYear()

    next()
})

// Routing
app.use('/', router())

// Leer el host y el puerto
const host = '0.0.0.0'
const port = `PORT`

// Agrega el puerto
app.listen(port, host, () => {
    console.log('El servidor esta funcionando')
})