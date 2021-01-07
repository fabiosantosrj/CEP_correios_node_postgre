const https = require('https')
const { Pool, Client } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cep",
  password: "sup0rte",
  port: "5432"
});


const data = JSON.stringify({
  todo: 'a'
});


async function doSomethingUseful(nStart, nEnd) {
  console.log(nStart + ' ate ' + nEnd);
  for (var i = nStart; i <= nEnd; i++) {//todo possivel intervalo da capital
    var cep = ('000000000' + i).slice(-8); // '11

    //Verifica se já foi consultdo esta registrado na DB!
    const need_registred = await checkCepAtDb(cep);

    //If cep was registered, skip this register
    if (need_registred) {
      console.log(`Consultando CEP: ${cep}, intervalo ${nStart} até ${nEnd}`);

      //console.log(`===============BUSCANDO CEP: ${cep}`);

      //Prepara a URL
      const options = {
        method: "GET",
        hostname: "buscacepinter.correios.com.br",
        path: "/app/cep/carrega-cep.php?mensagem_alerta=&cep=" + cep + "&cepaux=",
        headers: {
          'Content-Type': 'application/json',
        }
      };
      try {
        //chama o WS e espera a resposta
        var retun = await doRequest(options, data, cep);
        //console.log(retun);
        //check if there is response
        if (retun.total > 0) { //cou CEP FROM WS
          //register at DB
          //console.log(`Gravando: ${retun.total} registros`);
          let resullt = await registerDB(retun.dados, cep); //chama o WS e espera a resposta

        } else { //CEP not founded at WS
          //grava status that means cep não exits
          let resullt = await registerStatus(cep); //chama o WS e espera a resposta

          //console.log(retun);
        }
      } catch {
        //console.log("=====================================buscando novamente cep: " + cep)
        doSomethingUseful((i), (i));
      }
    }/*else{
      console.log(`Consultando CEP: ${cep}, intervalo ${nStart} até ${nEnd}...`);
    }*/
  }
}

/*Check if cep was founded at DB*/
async function checkCepAtDb(cep) {
  let response;
  let status1 = false;
  try {
    //verifica se cep esta cadastrado sem sucesso ou não existe no ws do correio
    var queryString = `select * from ceptable where cep = '${cep}' `
    response = await pool.query(queryString);
    if (response.rowCount <= 0) {
      status1 = true;
    }
  }
  catch {
    status1 = true;
  }
  return status1;
}

/**
 * salva cep + status nao exist
 */
async function registerStatus(cep) {
  return new Promise((resolve, reject) => {
    try {
      var queryString = `INSERT INTO ceptable(
        cep,exist_no_ws,data_consulta
        ) VALUES(
          '${cep}','NAO',CURRENT_TIMESTAMP
        )`

      pool.query(queryString, (err, res) => {
        if (err !== undefined) {
          resolve(true); //já existe o cep
        }

        // check if the response is not 'undefined'
        if (res !== undefined) {
          if (res.rowCount > 0) {
            console.log("# of records inserted:", res.rowCount);
          } else {
            //console.log("No records were inserted.");
          }
          resolve(true);
        }
      });
    }
    catch {
      console.log("============================================erro salvar cep: " + cep)
      resolve(false);
    }
  });
}


/**
 * Do a request with options provided.
 *
 */
async function registerDB(data, cep) {
  return new Promise((resolve, reject) => {
    try {
      for (const cepUni of data) {
        //console.log(cepUni.logradouroDNEC);
        //register at DB
        var endereco = cepUni.logradouroDNEC;
        var conplemento = '';
        // Get the index of the last - 
        var lastIndex = endereco.lastIndexOf(' - ');
        // Add the string before the last .
        if (lastIndex > 3) {
          endereco = cepUni.logradouroDNEC.substring(0, cepUni.logradouroDNEC.lastIndexOf(' - '));
          conplemento = cepUni.logradouroDNEC.substr(lastIndex + 3);
        }

        var queryString = `INSERT INTO ceptable(
        cep,logradouro,complemento,bairro,cidade,estado,exist_no_ws,data_consulta,nome_unidade,tipo_cep
        ) VALUES(
          '${cepUni.cep}',
          '${endereco}',
          '${conplemento}',
          '${cepUni.bairro}',
          '${cepUni.localidade}',
          '${cepUni.uf}','SIM',CURRENT_TIMESTAMP,'${cepUni.nomeUnidade}','${cepUni.tipoCep}'
        )`

        pool.query(queryString, (err, res) => {
          if (err !== undefined) {
            // log the error to console
            //console.log("Postgres INSERT error:", err);

            // get the keys for the error
            // var keys = Object.keys(err);
            // console.log("\nkeys for Postgres error:", keys);

            // get the error position of SQL string
            // console.log("Postgres error position:", err.position);
            resolve(true); //já existe o cep
          }

          // check if the response is not 'undefined'
          if (res !== undefined) {
            // log the response to console
            //console.log("Postgres response:", res);

            // get the keys for the response object
            // var keys = Object.keys(res);

            // log the response keys to console
            // console.log("\nkeys type:", typeof keys);
            // console.log("keys for Postgres response:", keys);

            if (res.rowCount > 0) {
              console.log("# of records inserted:", res.rowCount);
            } else {
              //console.log("No records were inserted.");
            }
            resolve(true);
          }
        });

      }
    }
    catch {
      console.log("============================================erro salvar cep: " + cep)
      resolve(false);
    }
  });
}


/**
 * Do a request with options provided.
 *
 * @param {Object} options
 * @param {Object} data
 * @return {Promise} a promise of request
 */
function doRequest(options, data, cep) {
  return new Promise((resolve, reject) => {
    try {
      const req = https.request(options, (res) => {
        res.setEncoding('utf8');
        let responseBody = '';

        res.on('data', (chunk) => {
          responseBody += chunk;
        });

        res.on('end', () => {
          //check return is json, if error return to catch
          try{
            let retval = JSON.parse(responseBody);
            resolve(retval);
          }catch{
            console.log("============================================erro json cep: " + cep)
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.write(data)
      req.end();

      //return data
    }
    catch {
      console.log("============================================erro consulta cep: " + cep)
    }
  });
}


function runMany() {
  var interval = [
    //[1000000,19999999],//SP Espectro	1000000 a 19999999
    [1000000, 5999999],//SP Capital 1000000 a 5999999
    [6000000, 8000000],//SP Área Metropolitana 6000000 a 8000000
    [8000000, 9999999],//SP Capital 8000000 a 9999999
    [10000000, 11999999],//SP Litoral	10000000 a 11999999
    [12000000, 15999999],//SP Interior	12000000 a 19999999
    [15999999, 19999999],//SP Interior	12000000 a 19999999
    //[20000000,28999999],//RJ Espectro	20000000 a 28999999
    [20000000, 23799999],//RJ Capital	20000000 a 23799999
    [23799999, 26600999],//RJ Área Metropolitana	20000000 a 26600999
    [26600999, 28999999],//RJ Interior	26601000 a 28999999
    [29000000, 29999999],//ES Espectro	29000000 a 29999999
    [30000000, 39999999],//MG Espectro	30000000 a 39999999
    [40000000, 48999999],//BA Espectro	40000000 a 48999999
    [49000000, 49999999],//SE Espectro	49000000 a 49999999
    [50000000, 56999999],//PE Espectro	50000000 a 56999999
    [57000000, 57999999],//AL Espectro	57000000 a 57999999
    [58000000, 58999999],//PB Espectro	58000000 a 58999999
    [59000000, 59999999],//RN Espectro	59000000 a 59999999
    [60000000, 63999999],//CE Espectro	60000000 a 63999999
    [64000000, 64999999],//PI Espectro	64000000 a 64999999
    [65000000, 65999999],//MA Espectro	65000000 a 65999999
    [66000000, 68899999],//PA Espectro	66000000 a 68899999
    [68900000, 68999999],//AP Espectro	68900000 a 68999999
    [69300000, 69389999],//RR Espectro	69300000 a 69389999
    [69400000, 69899999],//AM Espectro	69400000 a 69899999
    [69900000, 69999999],//AC Espectro	69900000 a 69999999
    [70000000, 73699999],//DF Espectro	70000000 a 73699999
    [72800000, 76799999],//GO Espectro 72800000 a 76799999
    [77000000, 77995999],//TO Espectro	77000000 a 77995999
    [78000000, 78899999],//MT Espectro	78000000 a 78899999
    [78900000, 78999999],//RO Espectro	78900000 a 78999999
    [79000000, 79999999],//MS Espectro	79000000 a 79999999
    [80000000, 87999999],//PR Espectro	80000000 a 87999999
    [88000000, 89999999],//SC Espectro	88000000 a 89999999
    [90000000, 99999999],//RS Espectro	90000000 a 99999999
    [99989989, 99999999]//RS Espectro	90000000 a 99999999
  ]

  for (const cepUni of interval) {  
    doSomethingUseful(cepUni[0],cepUni[1]);
  }

  //Dividir 1Mio para cada thread
  for (var i = 1; i<=99999999; i= i+147990) {  
     doSomethingUseful(i,i+147990);
   }

  doSomethingUseful(1, 99999999); //todo intervalo, rodar no final apenas


}


runMany();


