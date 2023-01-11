const Meeti = require('../../models/Meeti')
const Grupos = require('../../models/Grupos')
const Usuarios = require('../../models/Usuarios')

const Sequelize = require('sequelize')
const Op = Sequelize.Op
const moment = require('moment')

exports.resultadosBusqueda = async (req, res) => {

    // Leer datos de la url
    const { categoria, titulo, ciudad, pais } = req.query

    // Si la categoria esta vacia
    let meetis
    if(categoria === '') {
        // Filtrar los meetis por los terminos de busqueda
        meetis = await Meeti.findAll({
            where: {
                titulo: {[Op.iLike] : '%' + titulo + '%'},
                ciudad: {[Op.iLike] : '%' + ciudad + '%'},
                pais: {[Op.iLike]: '%' + pais + '%'}
            },
            include: [
                {
                    model: Grupos
                },
                {
                    model: Usuarios,
                    attributes: ['id', 'nombre', 'imagen']
                }
            ]
        })
    } else {
        // Filtrar los meetis por los terminos de busqueda
        meetis = await Meeti.findAll({
            where: {
                titulo: {[Op.iLike] : '%' + titulo + '%'},
                ciudad: {[Op.iLike] : '%' + ciudad + '%'},
                pais: {[Op.iLike]: '%' + pais + '%'}
            },
            include: [
                {
                    model: Grupos,
                    where: {
                        categoriaId : { [Op.eq] : categoria }
                    }
                },
                {
                    model: Usuarios,
                    attributes: ['id', 'nombre', 'imagen']
                }
            ]
        })
    }

    

    // Pasar los resultados a la vista
    res.render('busqueda', {
        nombrePagina: 'Resultados Busqueda',
        meetis,
        moment
    })

}