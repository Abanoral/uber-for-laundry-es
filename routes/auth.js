const express = require('express');
const bcrypt = require('bcryptjs');

const User = require('./../models/user');

const router = express.Router();
const bcryptSalt = 10;

// GET /signup ===> renderizar el formulario de signup
router.get('/signup', (req, res, next) => {
  // console.log('Entra en signup');
  res.render('auth/signup', { errorMessage: '' });
})

// POST /signup ===> recoger los datos del formulario y crear un nuevo usuario en la BDD
// con ASYNC AWAIT
router.post('/signup', async (req, res, next) => {
  console.log('req.body', req.body);
  const { name, email, password } = req.body;
  // Comprobar que los campos email y password no esten en blanco
  if(email === "" || password === "") {
    res.render('auth/signup', { errorMessage: "Enter both email and password "});
    return;
  }
  try {
      // Comprobar que no existe ningun usuario con este email en la BDD
    const foundUser = await User.findOne({ email })
    if(foundUser) {
      res.render('auth/signup', { errorMessage: `There's already an account with the email ${email}`});
      return;
    }
    // no existe el usuario, encriptar la contraseña
    const salt = bcrypt.genSaltSync(bcryptSalt);
    const hashedPassword = bcrypt.hashSync(password, salt);
    // guardar el usuario en la BDD
    await User.create({ name, email, password: hashedPassword })
    res.redirect('/login');
  } 
  catch (error) {
    res.render('auth/signup', { errorMessage: "Error while creating account. Please try again."})
  }
})

router.get('/login', (req, res, next) => {
  res.render('auth/login', {
    errorMessage: ''
  })
});

router.post('/login', async (req, res, next) => {

  const {email , password } = req.body;

  if (email === '' || password === '') {
    res.render('auth/login', {
      errorMessage: 'Enter both email and password to log in.'
    });
    return;
  }

  try {
    //encuentra al usuario por su email MOLAAAAAAA
    const user = await User.findOne({email});
    if(!user){
      res.render('auth/login', {
        errorMessage: `There isn't an account with email ${email}.`
      });
      return;
    }
    // magic, como compara un hash salteado x veces y te lo mira con un string...
    if (!bcrypt.compareSync(password, user.password)) {
      res.render('auth/login', {
        errorMessage: 'Invalid password.'
      });
      return;
    }
    // GUARDAMOS LA SESSION EN CURRENTUSER ¡¡HABEMUS "PERSISTENCIA" DE DATOS!!
    req.session.currentUser = user;
    res.redirect('/');
  
  } catch (error) {
    console.log(error)
  }
});

router.get('/logout', (req, res, next) => {
  // si no existe un usuario en la sesion
  if (!req.session.currentUser) {
    res.redirect('/');
    return;
  }
  // destruyes la sesion
  req.session.destroy((err) => {
    if (err) {
      next(err);
      return;
    }
    // redirecciona cuando haya terminado de destruir la sesion
    res.redirect('/');
  });
});


module.exports = router;
