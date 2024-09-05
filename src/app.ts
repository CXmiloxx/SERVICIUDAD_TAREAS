// Cambios para ESM (ECMAScript Modules)
import express from "express";

import cron from "node-cron"; // este es para programar las tareas
import cors from "cors"; // Importa el middleware CORS
import { PORT, SERVIDOR } from "./config.js";
import path from "path"; // Cambio en la importación de path
import Holidays from "date-holidays"; // Importa la librería date-holidays

const hd = new Holidays("CO"); // Configura para Colombia

import {
  CalcularSanciones,
  NuevoSaldoAnteriorBolsa,
  NuevoSaldoAnteriorproveedores,
  CreditoAmortizador,
  NotificarMensaje,
  ListaCobranza,
  TareasProgramadasServidor,
  TareasProgramadasSinMora,
  TareasProgramadasMoraPrimera,
  TareasProgramadasMoraSegundo,
  TareasProgramadasMoraTercero,
  TareasProgramadasMoraCuatro,
  listadoCobranzaActualizar,
  sincronizarMysqlGOLDRA,
  sincronizarMysqlSOLUCREDITO,
} from "./controllers/TareasProgramadas/ProgramarSanciones.js";

const app = express();

app.use(
  cors({
    origin: [

        // red de TIGO
  "http://201.236.243.161:3070",
  "http://201.236.243.161:5173",

  "http://192.168.1.150:3070",
  "http://192.168.1.150:5173",

  // red de CLARO
  "http://186.87.165.129:3070",
  "http://186.87.165.129:5173",

  "http://192.168.0.150:3070",
  "http://192.168.0.150:5173",

      "http://localhost:5173",
      "http://localhost:3070",
      "https://pago.solucredito.com.co",
      "https://app.goldraea.com",
      "https://app.solucredito.com.co",
      "https://demo.solucredito.com.co",
      "https://server.solucredito.com.co",
      "https://admin.solucredito.com.co",
      "https://apps.solucredito.com.co",
      "https://tareas.solucredito.com.co",
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200);
  res.send(`Tareas ${SERVIDOR}`);
});

// Tareas programas

const amortizador = process.env.amortizador || '6 * * * *';
const sanciones = process.env.sanciones || '7 * * * *';
const bolsa = process.env.bolsa || '8 * * * *';
const MSM = process.env.MSM || '9 * * * *';
const proveedor = process.env.proveedor || '10 * * * *';
const Lista_cobranza = process.env.Lista_cobranza || '11 * * * 1,4';
const Lista_actualizar = process.env.Lista_actualizar || '12 * * * 1,4';
const Mora_0 = process.env.Mora_0 || '15,20 10 * * 1-6';
const Mora_30 = process.env.Mora_30 || '30,35 10 * * 1,3,5';
const Mora_60 = process.env.Mora_60 || '30,35 11 * * 1,4,6';
const Mora_90 = process.env.Mora_90 || '30,36 13 * * 1,4,6';
const Mora_150 = process.env.Mora_150 || '30,41 13 * * 1';
const Lista_cobranza2 = process.env.Lista_cobranza2 || '8 * * * 1,4';
const mysql_GOLDRA = process.env.mysql_GOLDRA || '30,41 13 * * 1';
const mysql_SOLUCREDITO = process.env.mysql_SOLUCREDITO || '30,41 13 * * 1';


// *******Primer tiro
// Calcular interes de creditos vencidos de amortizacion
cron.schedule(amortizador, async () => {
  console.log("Iniciando credito de amortizacion");

  const fakeReq = {} as express.Request; // Puedes personalizar esto según tus necesidades
  const fakeRes = {
    status: (statusCode) => ({ json: (data) => console.log(data) }),
  } as express.Response;

  await CreditoAmortizador(fakeReq, fakeRes);

  console.log("Terminar credito de amortizacion");
});

// Calcular sanciones
cron.schedule(sanciones, async () => {
  console.log("Iniciando tarea de cálculo de sanciones...");

  const fakeReq = {} as express.Request; // Puedes personalizar esto según tus necesidades
  const fakeRes = {
    status: (statusCode) => ({ json: (data) => console.log(data) }),
  } as express.Response;

  await CalcularSanciones(fakeReq, fakeRes);

  console.log("Tarea de cálculo de sanciones completada.");
});

// Nuevo saldo de bolsa
cron.schedule(bolsa, async () => {
  console.log("Iniciando bolsas.");

  const fakeReq = {} as express.Request; // Puedes personalizar esto según tus necesidades
  const fakeRes = {
    status: (statusCode) => ({ json: (data) => console.log(data) }),
  } as express.Response;

  await NuevoSaldoAnteriorBolsa(fakeReq, fakeRes);

  console.log("Tarea de bolsas");
});

// // Enviar MSM
cron.schedule(MSM, async () => {
  console.log("Iniciando MSM.");

  const fakeReq = {} as express.Request; // Puedes personalizar esto según tus necesidades
  const fakeRes = {
    status: (statusCode) => ({ json: (data) => console.log(data) }),
  } as express.Response;

  await NotificarMensaje(fakeReq, fakeRes);

  console.log("Tarea de MSM");
});

// // Nuevo saldo de proveedor
cron.schedule(proveedor, async () => {
  console.log("Iniciando saldo proveedor.");

  const fakeReq = {} as express.Request;
  const fakeRes = {
    status: (statusCode) => ({ json: (data) => console.log(data) }),
  } as express.Response;

  await NuevoSaldoAnteriorproveedores(fakeReq, fakeRes);

  console.log("finalizado saldo proveedor");
});

// // Nuevo saldo de listado de cobro
cron.schedule(Lista_cobranza, async () => {
  console.log("Iniciando lista de cobranza");

  const fakeReq = {} as express.Request;
  const fakeRes = {
    status: (statusCode) => ({ json: (data) => console.log(data) }),
  } as express.Response;

  await ListaCobranza(fakeReq, fakeRes);

  console.log("finalizado lista de cobranza");
});

// Nuevo saldo de listado de cobro  actualizar
cron.schedule(Lista_actualizar, async () => {
  console.log("Iniciando lista de cobranza  actualizar");

  const fakeReq = {} as express.Request;
  const fakeRes = {
    status: (statusCode) => ({ json: (data) => console.log(data) }),
  } as express.Response;

  await listadoCobranzaActualizar(fakeReq, fakeRes);

  console.log("finalizado lista de cobranza actualizar");
});



// Tareas directas a las URL  recordar 0 dias en mora
cron.schedule(Mora_0, async () => {
  const hoy = new Date();

  // Verificar si hoy es un día festivo en Colombia
  if (!hd.isHoliday(hoy)) {
    console.log("Iniciando tareas  recordar mora 0");

    const fakeReq = {} as express.Request;
    const fakeRes = {
      status: (statusCode) => ({
        json: (data) => console.log(data),
      }),
    } as express.Response;

    await TareasProgramadasSinMora(fakeReq, fakeRes);

    console.log("Tarea de bolsas completada.");
  } else {
    console.log("Hoy es un día festivo. La tarea no se ejecutará.");
  }
});

// Tareas directas a las URL  recordar 30 dias en mora
cron.schedule(Mora_30, async () => {
  const hoy = new Date();

  // Verificar si hoy es un día festivo en Colombia
  if (!hd.isHoliday(hoy)) {
    console.log("Iniciando tareas  recordar mora 30");

    const fakeReq = {} as express.Request;
    const fakeRes = {
      status: (statusCode) => ({
        json: (data) => console.log(data),
      }),
    } as express.Response;

    await TareasProgramadasMoraPrimera(fakeReq, fakeRes);

    console.log("Tarea de bolsas completada.");
  } else {
    console.log("Hoy es un día festivo. La tarea no se ejecutará.");
  }
});

// Tareas directas a las URL  recordar 60 dias en mora
cron.schedule(Mora_60, async () => {
  const hoy = new Date();

  // Verificar si hoy es un día festivo en Colombia
  if (!hd.isHoliday(hoy)) {
    console.log("Iniciando tareas  recordar mora 60");

    const fakeReq = {} as express.Request;
    const fakeRes = {
      status: (statusCode) => ({
        json: (data) => console.log(data),
      }),
    } as express.Response;

    await TareasProgramadasMoraSegundo(fakeReq, fakeRes);

    console.log("Tarea de bolsas completada.");
  } else {
    console.log("Hoy es un día festivo. La tarea no se ejecutará.");
  }
});

// Tareas directas a las URL  recordar 90 dias en mora
cron.schedule(Mora_90, async () => {
  const hoy = new Date();

  // Verificar si hoy es un día festivo en Colombia
  if (!hd.isHoliday(hoy)) {
    console.log("Iniciando tareas  recordar mora 90");

    const fakeReq = {} as express.Request;
    const fakeRes = {
      status: (statusCode) => ({
        json: (data) => console.log(data),
      }),
    } as express.Response;

    await TareasProgramadasMoraTercero(fakeReq, fakeRes);

    console.log("Tarea de bolsas completada.");
  } else {
    console.log("Hoy es un día festivo. La tarea no se ejecutará.");
  }
});

// Tareas directas a las URL  recordar 150 dias en mora

cron.schedule(Mora_150, async () => {
  const hoy = new Date();

  // Verificar si hoy es un día festivo en Colombia
  if (!hd.isHoliday(hoy)) {
    console.log("Iniciando tareas  recordar mora 150");

    const fakeReq = {} as express.Request;
    const fakeRes = {
      status: (statusCode) => ({
        json: (data) => console.log(data),
      }),
    } as express.Response;

    await TareasProgramadasMoraCuatro(fakeReq, fakeRes);

    console.log("Tarea de bolsas completada.");
  } else {
    console.log("Hoy es un día festivo. La tarea no se ejecutará.");
  }
});


// // Nuevo saldo de listado de cobro
cron.schedule(Lista_cobranza2, async () => {
  console.log("Iniciando lista de cobranza");

  const fakeReq = {} as express.Request;
  const fakeRes = {
    status: (statusCode) => ({ json: (data) => console.log(data) }),
  } as express.Response;

  await ListaCobranza(fakeReq, fakeRes);

  console.log("finalizado lista de cobranza");
});

// Actualizar o sincronizar base de datos GOLDRA
cron.schedule(mysql_GOLDRA, async () => {
  console.log("sincronizar MYSQL GOLDRA");

  const fakeReq = {} as express.Request;
  const fakeRes = {
    status: (statusCode) => ({ json: (data) => console.log(data) }),
  } as express.Response;

  await sincronizarMysqlGOLDRA(fakeReq, fakeRes);

  console.log("finalizado sincronizar MYSQL GOLDRA");
});

// Actualizar o sincronizar base de datos SOLUCREDITO
cron.schedule(mysql_SOLUCREDITO, async () => {
  console.log("sincronizar MYSQL SOLUCREDITO");

  const fakeReq = {} as express.Request;
  const fakeRes = {
    status: (statusCode) => ({ json: (data) => console.log(data) }),
  } as express.Response;

  await sincronizarMysqlSOLUCREDITO(fakeReq, fakeRes);

  console.log("finalizado sincronizar MYSQL SOLUCREDITO");
});


app.listen(PORT, () => {
  console.log(`puerto ${PORT}`);
});
