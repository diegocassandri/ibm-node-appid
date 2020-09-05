require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const app = express();
const { v4: uuidv4 } = require('uuid');
const axios = require('axios').default;
app.use(express.json());

const port = process.env.PORT;

const FormData = require('form-data');

app.get('/api/data', (req,res) => {
    res.json({
        data: 123
    });
});


function validateQualitorUSer(username,password){
    if(username === 'teste' && password === 'teste'){ 
        //Monto  o objeto com os dados do usuário para inserir no meu JWT
        const userQualitorInfo = {
            username,
            cdclient: '10',
            cdcontato: 'teste',
        }
        return userQualitorInfo;
    }
}

function generatePrivateJWT(user){
    //leio a chave privada para assinar o jwt
    let privateKey = fs.readFileSync(process.env.PRIVATEKEYPATH);

    //Gero o meu token JWT
    let token =  jwt.sign({
        exp: 100000000000,
        iss: `${process.env.IBMAPPIDBASEURL}${process.env.TENANTID}`,
        aud: `${process.env.IBMAPPIDBASEURL}${process.env.TENANTID}`,
        sub: uuidv4(),
        privateJWTInfo: user
      }, 
      privateKey, 
      { 
          algorithm: 'RS256' 
      },
     );
     return token;
}

async function generateIbmJWT(privateToken){
    var data = new FormData();
    data.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    data.append('assertion', privateToken);
    data.append('audience', `${process.env.IBMAPPIDBASEURL}${process.env.TENANTID}`);
     

    try {
        var config = {
            method: 'post',
            url: `${process.env.IBMAPPIDBASEURL}${process.env.TENANTID}/token`, 
            auth: {
                username: process.env.IBMCLIENTID,
                password: process.env.IBMSECRET
            },
            headers: { 
              ...data.getHeaders()
            },
            data : data
        };
          
        const response = await axios(config);

        const ibmToken = response.data.access_token; 

        return ibmToken;

    } catch (e) {
        console.log(e.message);
    }
}

async function getIbmUSerInfo(ibmToken){
    //Uma vez ja autenticado na IBM e de posse do IBM token, busco informações do perfil do usuário
    const responseUser = await axios.get(`${process.env.IBMAPPIDBASEURL}${process.env.TENANTID}/userInfo`,{
        headers: {
          'Authorization': `Bearer ${ibmToken}`
        }
    });

    const userInfo = responseUser.data;

    return userInfo;
}
 
app.post('/login', async (req,res) => {
    //Pega usuário e senha digitados via body
    const { username , password } = req.body

    //Validar o usuário
    const user = validateQualitorUSer(username,password);

    if(user){ 
        //Gera o meu JWT
        const privateToken = generatePrivateJWT(user);

        //TOKEN IBM
       const ibmToken = await generateIbmJWT(privateToken);

       //Buscar Informações do usuário IBM
       const userInfo = await getIbmUSerInfo(ibmToken);

       return res.json({ibmToken, userInfo});

      }
    
      return res.status(500).json({ message: 'Login inválido!'});

});

//Start Server
app.listen(port, () => {
    console.log(`Listen on http://localhost:${port}`);
});

