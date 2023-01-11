const Comentarios = require('../../models/Comentarios')
const Meeti = require('../../models/Meeti')

exports.agregarComentario = async ( req, res, next) => {
    // Obtener el comentario
    const { comentario } = req.body
    
    // Crear comentario en la BD
    await Comentarios.create({
        mensaje: comentario,
        usuarioId: req.user.id,
        meetiId: req.params.id
    })

    // Redireccionar a la misma pagina
    res.redirect('back')
    next()
}

// Elimina un comentario de la BD
exports.eliminarComentario = async (req, res, next) => {
    // Tomar el id del comentario
    const { comentarioId } = req.body

    // Consultar el comentario
    const comentario = await Comentarios.findOne({where: { id: comentarioId }})

    // verificar si existe el comentario
    if(!comentario) {
        res.status(404).send('Acción no válida')
        return next()
    }

    // Consultar el Meeti del comentario
    const meeti = await Meeti.findOne({ where: {id: comentario.meetiId}})

    // Verificar que quien lo borra sea el creador
    if(comentario.usuarioId === req.user.id || meeti.usuarioId === req.user.id) {
        await comentario.destroy({where: {
            id: comentario.id
        }})
        res.status(200).send('Eliminado Correctamente')
        return next()
    } else {
        res.status(403).send('Acción no válida')
        return next()
    }
}