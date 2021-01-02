const passport = require('passport');
const passportJWT = require('passport-jwt');
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const User = require('../user/user.model');

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_KEY
    },
    function (jwtPayload, done) {
      return User.findOne({ email: jwtPayload.email })
        .then((user) => done(null, user))
        .catch((err) => done(err));
    }
  )
);
