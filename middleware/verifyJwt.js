const jwt = require('jsonwebtoken');
require('dotenv').config();

function verifyJwt (req, res, next) {
    const userJwtToken = req.headers.authorization;
  
  // if the user do not have any token simply return the users with a error status.
    if (!userJwtToken){
      return res.status(401).send({
        success: false,
        message: 'Unauthorized access' 
      })
    }
  // Ok... Now think users given the token but the token is invalid, so we need to verify
  // users token, let's verify
    const token = userJwtToken.split(' ')[1];  // we received token with Bearer, so split and get only token
  // for varification JWT gives us a built in function like-
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded){
      if(err) {
        return res.status(401).send({
          success: false,
          message: 'Forbidden access' 
        })
      }
      req.decoded = decoded;
      next();
    })
  }

  module.exports = verifyJwt;