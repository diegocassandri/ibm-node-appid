require('dotenv').config();
const express = require('express');
//const passport = require('passport');
var jwt = require('jsonwebtoken');
const fs = require('fs');
//const APIStrategy = require('ibmcloud-appid').  APIStrategy;
const app = express();
const { v4: uuidv4 } = require('uuid');


app.use(express.json());

const port = process.env.PORT;

/*app.use(passport.initialize());
passport.use(new APIStrategy({
    oAuthServerUrl: "https://us-south.appid.cloud.ibm.com/oauth/v4/997a91a2-419f-4bf0-b998-03662f0c4233"
}));

app.use(passport.authenticate(APIStrategy.STRATEGY_NAME, {
    session: false
}));*/

app.get('/api/data', (req,res) => {
    res.json({
        data: 123
    });
});
 
app.post('/login',(req,res) => {
    const { username , password } = req.body

    //Validar o usuário
    if(username === 'teste' && password === 'teste'){ 

        const userDataInfo = {
            cdclient: '10',
            cdcontato: 'teste',
        }

        var privateKey = fs.readFileSync(process.env.PRIVATEKEYPATH);
 
        var token =  jwt.sign({
            exp: 100000000000,
            iss: 'https://us-south.appid.cloud.ibm.com/oauth/v4/997a91a2-419f-4bf0-b998-03662f0c4233',
            aud: 'https://us-south.appid.cloud.ibm.com/oauth/v4/997a91a2-419f-4bf0-b998-03662f0c4233',
            sub: uuidv4(),
            data: { username, userDataInfo }
          }, 
          privateKey, 
          { 
              algorithm: 'RS256' 
          },
         );


        return res.send({ auth: true, token: token });
      }
      
      return res.status(500).send('Login inválido!');


});

//Start Server
app.listen(port, () => {
    console.log(`Listen on http://localhost:${port}`);
});

