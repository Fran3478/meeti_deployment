const Categorias = require('../models/Categorias')
const Grupos = require('../models/Grupos')

const multer = require('multer')
const shortid = require('shortid')
const { ParameterDescriptionMessage } = require('pg-protocol/dist/messages')
const fs = require('fs')
const {v4: uuid} = require('uuid')

const configuracionMulter = {
    limits : {fileSize : 100000},
    storage: fileStorage = multer.diskStorage({
        destination: (req, file, next) => {
            next(null, __dirname+'/../public/uploads/grupos/')
        },
        filename: (req, file, next) => {
            const extension = file.mimetype.split('/')[1]
            next(null, `${shortid.generate()}.${extension}`)
        }
    }),
    fileFilter(req, file, next) {
        if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            // El formato es valido
            next(null, true)
        } else {
            // El formato no es valido
            next(new Error('Formato no válido'), false)
        }
    }
}

const upload = multer(configuracionMulter).single('imagen')

exports.subirImagen = (req, res, next) => {
    upload(req, res, function(error) {
        if (error) {
            if (error instanceof multer.MulterError) {
                if(error.code === 'LIMIT_FILE_SIZE') {
                    req.flash('error', 'El Archivo es muy grande')
                } else {
                    req.flash('error', error.message)
                }
            } else if(error.hasOwnProperty('message')){
                req.flash('error', error.message)
            }
            res.redirect('back')
            return
        } else {
            next()
        }
    })
}

exports.formNuevoGrupo = async (req, res) => {
    const categorias = await Categorias.findAll()
    res.render('nuevo-grupo', {
        nombrePagina: 'Crea un nuevo grupo',
        categorias
    })
}

// Almacena los grupos en la BD
exports.crearGrupo = async (req, res) => {
    // Sanitizar
    req.sanitizeBody('nombre')
    req.sanitizeBody('url')

    const grupo = req.body

    // ALmacena el usuario autenticado como el creador del grupo
    grupo.usuarioId = req.user.id

    // Leer la imagen
    if(req.file){
        grupo.imagen = req.file.filename
    }

    grupo.id = uuid()
    
    try {
        // Almacenar en la BD
        await Grupos.create(grupo)
        req.flash('exito', 'Se ha creado el Grupo Correctamente')
        res.redirect('/administracion')
    } catch (error) {
        // Extraer el message de los errores
        const erroresSequelize = Array.isArray(error.errors) ? error.errors.map(err => err.message) : null
        req.flash('error', erroresSequelize)
        res.redirect('/nuevo-grupo')
    }
}

exports.formEditarGrupo = async (req, res) => {

    const consultas = []
    consultas.push( Grupos.findByPk(req.params.grupoId) )
    consultas.push( Categorias.findAll() )

    // Promise con await
    const [grupo, categorias] = await Promise.all(consultas)

    res.render('editar-grupo', {
        nombrePagina: `Editar Grupo: ${grupo.nombre}`,
        grupo,
        categorias
    })
}

// Guarda los cambios en la BD

exports.editarGrupo = async (req, res, next) => {
    const grupo = await Grupos.findOne({where: {id: req.params.grupoId, usuarioId: req.user.id}})

    if(!grupo) {
        req.flash('error', 'Operación no válida')
        res.redirect('/administracion')
        return next()
    }

    // Todo bien, leer los valores
    const { nombre, descripcion, categoriaId, url } = req.body

    // Asignar los valores
    grupo.nombre = nombre
    grupo.descripcion = descripcion
    grupo.categoriaId = categoriaId
    grupo.url = url

    // Guardamos en la BD
    await grupo.save()
    req.flash('exito', 'Cambios Almacenados Correctamente')
    res.redirect('/administracion')
}

// Muestra el formulario para editar una imagen de grupo
exports.formEditarImagen = async (req, res) => {
    const grupo = await Grupos.findOne({where: {id: req.params.grupoId, usuarioId: req.user.id}})
    
    res.render('imagen-grupo', {
        nombrePagina: `Editar Imagen Grupo : ${grupo.nombre}`,
        grupo
    })
}

// Modifica la imagen en la BD y elimina la anterior
exports.editarImagen = async (req, res, next) => {
    const grupo= await Grupos.findOne({where: {id:req.params.grupoId, usuarioId: req.user.id}})
    
    // El grupo existe y es valido
    if(!grupo) {
        req.falsh('error', 'Operación no válida')
        req.redirect('/iniciar-sesion')
        return next()
    }

    // Verificar que el archivo sea nuevo
    //if(req.file) {
    //    console.log(req.file.filename)
    //}

    // Revisar que exista un archivo anterior
    //if(grupo.imagen) {
    //    console.log(grupo.imagen)
    //}

    // Si hay imagen anterior y nueva, significa que vamos a borrar la anterior
    if(req.file && grupo.imagen) {
        const imagenAnteriorPath = __dirname + `/../public/uploads/grupos/${grupo.imagen}`
        
        // Eliminar archivo con filesystem
        fs.unlink(imagenAnteriorPath, (error) => {
            if(error){
                console.log(error)
            }
            return
        })
    }

    // Si hay una imagen nueva, la guardamos
    if(req.file) {
        grupo.imagen = req.file.filename
    }

    // Guardar en la BD
    await grupo.save()
    req.flash('exito', 'Cambios Almacenados Correctamente')
    res.redirect('/administracion')
}

// Muestra el formulario para eliminar un grupo
exports.formEliminarGrupo = async (req, res, next) => {
    const grupo = await Grupos.findOne({where: {id: req.params.grupoId, usuarioId: req.user.id}})

    if(!grupo) {
        req.flash('error', 'Operación no válida')
        res.redirect('/administracion')
        return next()
    }

    // Todo bien, ejecutar la vista
    res.render('eliminar-grupo', {
        nombrePagina: `Eliminar Grupo : ${grupo.nombre}`
    })
}

/** ELiminar el grupo e imagen */
exports.eliminarGrupo = async (req, res, next) => {
    const grupo =  await Grupos.findOne({where: {id: req.params.grupoId, usuarioId: req.user.id}})
    if(!grupo) {
        req.flash('error', 'Operación no válida')
        res.redirect('/administracion')
        return next()
    }

    // Si hay una imagen, eliminarla
    if(grupo.imagen) {
        const imagenAnteriorPath = __dirname + `/../public/uploads/grupos/${grupo.imagen}`
        fs.unlink(imagenAnteriorPath, (error) => {
            if(error) {
                console.log(error)
            }
            return
        })
    }

    // Elimiar el grupo
    await Grupos.destroy({
        where: {
            id: req.params.grupoId
        }
    })

    //  Redireccionar al usuario
    req.flash('exito', 'Grupo Eliminado')
    res.redirect('/administracion')
}