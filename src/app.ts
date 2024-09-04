// Cambios para ESM (ECMAScript Modules)
import express from "express";

import cron from "node-cron"; // este es para programar las tareas
import cors from "cors"; // Importa el middleware CORS
import { PORT } from "./config.js";
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
  res.send("App tareas programadas...");
});

// Tareas programas

// *******Primer tiro
// Calcular interes de creditos vencidos de amortizacion
cron.schedule("6 * * * *", async () => {
  console.log("Iniciando credito de amortizacion");

  const fakeReq = {} as express.Request; // Puedes personalizar esto según tus necesidades
  const fakeRes = {
    status: (statusCode) => ({ json: (data) => console.log(data) }),
  } as express.Response;

  await CreditoAmortizador(fakeReq, fakeRes);

  console.log("Terminar credito de amortizacion");
});

// Calcular sanciones
cron.schedule("10 * * * *", async () => {
  console.log("Iniciando tarea de cálculo de sanciones...");

  const fakeReq = {} as express.Request; // Puedes personalizar esto según tus necesidades
  const fakeRes = {
    status: (statusCode) => ({ json: (data) => console.log(data) }),
  } as express.Response;

  await CalcularSanciones(fakeReq, fakeRes);

  console.log("Tarea de cálculo de sanciones completada.");
});

// Nuevo saldo de bolsa
cron.schedule("11 * * * *", async () => {
  console.log("Iniciando bolsas.");

  const fakeReq = {} as express.Request; // Puedes personalizar esto según tus necesidades
  const fakeRes = {
    status: (statusCode) => ({ json: (data) => console.log(data) }),
  } as express.Response;

  await NuevoSaldoAnteriorBolsa(fakeReq, fakeRes);

  console.log("Tarea de bolsas");
});

// // Enviar MSM
cron.schedule("10 * * * *", async () => {
  console.log("Iniciando MSM.");

  const fakeReq = {} as express.Request; // Puedes personalizar esto según tus necesidades
  const fakeRes = {
    status: (statusCode) => ({ json: (data) => console.log(data) }),
  } as express.Response;

  await NotificarMensaje(fakeReq, fakeRes);

  console.log("Tarea de MSM");
});

// // Nuevo saldo de proveedor
cron.schedule("12 * * * *", async () => {
  console.log("Iniciando saldo proveedor.");

  const fakeReq = {} as express.Request;
  const fakeRes = {
    status: (statusCode) => ({ json: (data) => console.log(data) }),
  } as express.Response;

  await NuevoSaldoAnteriorproveedores(fakeReq, fakeRes);

  console.log("finalizado saldo proveedor");
});

// // Nuevo saldo de listado de cobro
cron.schedule("8 * * * 1,4", async () => {
  console.log("Iniciando lista de cobranza");

  const fakeReq = {} as express.Request;
  const fakeRes = {
    status: (statusCode) => ({ json: (data) => console.log(data) }),
  } as express.Response;

  await ListaCobranza(fakeReq, fakeRes);

  console.log("finalizado lista de cobranza");
});

// Nuevo saldo de listado de cobro  actualizar
cron.schedule("22 * * * *", async () => {
  console.log("Iniciando lista de cobranza  actualizar");

  const fakeReq = {} as express.Request;
  const fakeRes = {
    status: (statusCode) => ({ json: (data) => console.log(data) }),
  } as express.Response;

  await listadoCobranzaActualizar(fakeReq, fakeRes);

  console.log("finalizado lista de cobranza actualizar");
});



// Tareas directas a las URL  recordar 0 dias en mora
cron.schedule("15,20 10 * * 1-6", async () => {
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
// cron.schedule("30,35 10 * * 1,3,5", async () => {
//   console.log("Iniciando tareas  recordar mora 30");

//   const fakeReq = {} as express.Request;
//   const fakeRes = {
//     status: (statusCode) => ({ json: (data) => console.log(data) }),
//   } as express.Response;

//   await TareasProgramadasMoraPrimera(fakeReq, fakeRes);

//   console.log("finalizado tareas recordar mora 30");
// });

// Tareas directas a las URL  recordar 30 dias en mora
cron.schedule("30,35 10 * * 1,3,5", async () => {
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
// cron.schedule("30,35 11 * * 1,4,6", async () => {
//   console.log("Iniciando tareas  recordar mora 60");

//   const fakeReq = {} as express.Request;
//   const fakeRes = {
//     status: (statusCode) => ({ json: (data) => console.log(data) }),
//   } as express.Response;

//   await TareasProgramadasMoraSegundo(fakeReq, fakeRes);

//   console.log("finalizado tareas recordar mora 60");
// });

// Tareas directas a las URL  recordar 60 dias en mora
cron.schedule("30,35 11 * * 1,4,6", async () => {
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
// cron.schedule("30,36 13 * * 1,4,6", async () => {
//   console.log("Iniciando tareas  recordar mora 90");

//   const fakeReq = {} as express.Request;
//   const fakeRes = {
//     status: (statusCode) => ({ json: (data) => console.log(data) }),
//   } as express.Response;

//   await TareasProgramadasMoraTercero(fakeReq, fakeRes);

//   console.log("finalizado tareas recordar mora 90");
// });

// Tareas directas a las URL  recordar 90 dias en mora
cron.schedule("30,36 13 * * 1,4,6", async () => {
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
// cron.schedule("30,41 13 * * 1", async () => {
//   console.log("Iniciando tareas  recordar mora 150");

//   const fakeReq = {} as express.Request;
//   const fakeRes = {
//     status: (statusCode) => ({ json: (data) => console.log(data) }),
//   } as express.Response;

//   await TareasProgramadasMoraCuatro(fakeReq, fakeRes);

//   console.log("finalizado tareas recordar mora 150");
// });

// Tareas directas a las URL  recordar 150 dias en mora

cron.schedule("30,41 13 * * 1", async () => {
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
cron.schedule("8 * * * 1,4", async () => {
  console.log("Iniciando lista de cobranza");

  const fakeReq = {} as express.Request;
  const fakeRes = {
    status: (statusCode) => ({ json: (data) => console.log(data) }),
  } as express.Response;

  await ListaCobranza(fakeReq, fakeRes);

  console.log("finalizado lista de cobranza");
});

// Actualizar o sincronizar base de datos GOLDRA
cron.schedule("16 * * * *", async () => {
  console.log("sincronizar MYSQL GOLDRA");

  const fakeReq = {} as express.Request;
  const fakeRes = {
    status: (statusCode) => ({ json: (data) => console.log(data) }),
  } as express.Response;

  await sincronizarMysqlGOLDRA(fakeReq, fakeRes);

  console.log("finalizado sincronizar MYSQL GOLDRA");
});

// Actualizar o sincronizar base de datos SOLUCREDITO
cron.schedule("19 * * * *", async () => {
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
