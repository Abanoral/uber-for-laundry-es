const express = require('express');

const User = require('../models/user');
const LaundryPickup = require('../models/laundry-pickup');

const router = express.Router();

//MIDDLEWARE
//si hay un usuario en la session(logueado) continua con las rutas llamando al next() y retornando
router.use((req, res, next) => {
  if(req.session.currentUser){
    next();
    return;
  }
  // si no hay ning'un usuario le redige al login
  res.redirect('/login')
})
//render laundry/dashboard
// ambia la consulta en función de si eres o no un lavandero. Si el usuario es un lavador de ropa, busca recoger ropa para lavar. De lo contrario, muestra las recogidas de ropa que pidió.
//lama a varios métodos Mongoose para crear una consulta más complicada, que finalice con una llamada al método exec() para proporcionar nuestro callback.
//dado que las propiedades del usuario y del lavandero son referencias a otros documentos, estamos solicitando que esas referencias se rellenen previamente con la propiedad de nombre del modelo User.
//ordena por fecha de recogida en orden ascendente (las fechas más lejanas son las últimas).
//renderiza la plantilla views/laundry/dashboard.hbs como antes pero esta vez dentro del callback.
//pasa los resultados de la consulta (pickupDocs) como la variable local pickups.
router.get('/dashboard', async (req, res, next) => {
  try {
    let query;
  
    if (req.session.currentUser.isLaunderer) {
      query = { launderer: req.session.currentUser._id };
    } else {
      query = { user: req.session.currentUser._id };
    }
    
    const laundryPickup = await LaundryPickup.find(query).populate('user', 'name').populate('launderer', 'name').sort('pickupDate');
    
    res.render('laundry/dashboard', {
      pickups: laundryPickup
    });
    

  } catch (error) {
    console.log(error)
    next(error);
    return;
  }
});

// update launder byID
router.post('/launderers', async (req, res, next) => {
  try {
    // ESTO ES EL PAYLOAD!!!
    const launderInfo = {
      fee: req.body.fee,
      isLaunderer: true
    }
    // req.session.currentUser._id recoge el id del usuario de la sesion
    // se actualiza con el PAYLOAD!!
    // RECUERDA: new: true PARA INFO ACTUALIZADA en el CALLBACK
    const newUser = await User.findByIdAndUpdate(req.session.currentUser._id, launderInfo, { new: true });
    
    req.session.currentUser= newUser;
    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
    next(error);
    return;
  }
})
// get listLaunders
router.get('/launderers', async (req, res, next) => {
  try {
    /// buscas los usuarios cutyo isLaunder is true
    const launderers = await User.find({$and: [
      { isLaunderer: true },
      { _id: { $ne: req.session.currentUser._id } }
    ]});
    //se renderiza la plantilla con la lista de launderers true
    res.render('laundry/launderers', {launderers});
  } catch (error) {
    console.log(error);
    next(eror);
    return
  }
});
// get launder por id
router.get('/launderers/:id', async (req, res, next) => {
  try {
    const theLaunderer = await User.findById(req.params.id)
    res.render('laundry/launderer-profile', {theLaunderer});
  } catch (error) {
    console.log(error)
    next(err);
    return;
  }
});

router.post('/laundry-pickups', async (req, res, next) => {
  
  try {
    console.log(req.body)
    const pickupInfo = {
      pickupDate: req.body.pickupDate,
      launderer: req.body.laundererId,
      user: req.session.currentUser._id
    };
  
    const thePickup = new LaundryPickup(pickupInfo);
    await thePickup.save();
    res.redirect('/dashboard');
    
  } catch (error) {
    console.log(error)
    next(err);
    return;
  }
});

module.exports = router;
