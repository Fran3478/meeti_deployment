const Grupos = require('../models/Grupos')
const Meeti = require('../models/Meeti')

const {v4: uuid} = require('uuid')

// Muestra el formulario para nuevos Meeti
exports.formNuevoMeeti = async (req, res) => {
    const grupos = await Grupos.findAll({where: {usuarioId: req.user.id}})
    res.render('nuevo-meeti', {
        nombrePagina: 'Crear Nuevo Meeti',
        grupos
    })
}

// Inserta nuevos Meeti en la BD
exports.crearMeeti = async (req, res) => {
    // obtener los datos
    const meeti = req.body
    console.log(meeti)

    // Asignar el usuario
    meeti.usuarioId = req.user.id

    // Almacena la ubicacion con un point
    const point = {type: 'Point', coordinates : [ parseFloat(req.body.lat), parseFloat(req.body.lng) ]}
    meeti.ubicacion = point

    // Cupo opcional
    if(req.body.cupo === '') {
        meeti.cupo = 0
    }

    meeti.id = uuid()

    // Almacenar en la BD
    try {
        await Meeti.create(meeti)
        req.flash('exito', 'Se ha creado el Meeti Correctamente')
        res.redirect('/administracion')
    } catch (error) {
        const erroresSequelize = Array.isArray(error.errors) ? error.errors.map(err => err.message) : null
        req.flash('error', erroresSequelize)
        res.redirect('nuevo-meeti')
    }
}

// Sanitiza los Meeti
exports.sanitizarMeeti =  (req, res, next) => {
    req.sanitizeBody('titulo')
    req.sanitizeBody('invitado')
    req.sanitizeBody('cupo')
    req.sanitizeBody('fecha')
    req.sanitizeBody('hora')
    req.sanitizeBody('direccion')
    req.sanitizeBody('ciodad')
    req.sanitizeBody('estado')
    req.sanitizeBody('pais')
    req.sanitizeBody('lat')
    req.sanitizeBody('lng')
    req.sanitizeBody('grupoId')
    next()
}

// Muestra el formulario para editar un meeti
exports.formEditarMeeti = async (req, res, next) => {
    const consultas = []
    consultas.push(Grupos.findAll({where: {usuarioId : req.user.id}}))
    consultas.push(Meeti.findByPk(req.params.id))

    // Return un Promise
    const [grupos, meeti] = await Promise.all(consultas)
    if(!grupos || !meeti) {
        req.flash('error', 'Operaci??n no valida')
        res.redirect('/administracion')
        return next()
    }

    // Mostramos la vista
    res.render('editar-meeti', {
        nombrePagina: `Editar Meeti: ${meeti.titulo}`,
        grupos,
        meeti
    })
}

// Almacena los cambios en el meeti (db)
exports.editarMeeti = async (req, res, next) => {
    const meeti = await Meeti.findOne({where: { id: req.params.id, usuarioId: req.user.id}})

    if(!meeti) {
        req.flash('error', 'Operaci??n no valida')
        res.redirect('/administracion')
        return next()
    }

    // Asignar los valores
    const { grupoId, titulo, invitado, fecha, hora, cupo, descripcion, direccion, ciudad, estado, pais, lat, lng} = req.body

    meeti.grupoId = grupoId
    meeti.titulo = titulo
    meeti.invitado = invitado
    meeti.fecha = fecha
    meeti.hora = hora
    meeti.cupo = cupo
    meeti.descripcion = descripcion
    meeti.direccion = direccion
    meeti.ciudad = ciudad
    meeti.estado = estado
    meeti.pais = pais

    // Asignar point (ubicacion)
    const point = { type: 'Point', coordinates: [parseFloat(lat), parseFloat(lng)]}
    meeti.ubicacion = point

    // Almacenarlo en la BD
    await meeti.save()
    req.flash('exito', 'Cambios Guardados Correctamente')
    res.redirect('/administracion')
}

// Muestra un formulario para eliminar meeti??s
exports.formEliminarMeeti = async (req, res, next) => {
    const meeti = await Meeti.findOne({where: {id: req.params.id, usuarioId: req.user.id}})
    
    if(!meeti) {
        req.flash('error', 'Operaci??n no valida')
        res.redirect('/administracion')
        return next()
    }

    // Mostrar la vista
    res.render('eliminar-meeti', {
        nombrePagina: `Eliminar Meeti: ${meeti.titulo}`
    })
}

// Elimina el meeti de la BD
exports.eliminarMeeti = async (req, res) => {
    await Meeti.destroy({
        where:{
            id: req.params.id
        }
    })

    req.flash('exito', 'Meeti Eliminado')
    res.redirect('/administracion')
}