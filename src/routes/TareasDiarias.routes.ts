import { Router } from "express";
import {
  CalcularSanciones,
  PlazoCredito,
  CreditoAmortizador,
} from "../controllers/TareasDiarias.controllers";

const routes = Router();

// notificacion en general

routes.post("/api/sanciones/calcular", CalcularSanciones);

routes.post("/api/ajustar/plazo", PlazoCredito);

routes.post("/api/crietoamortizador/calcular", CreditoAmortizador);

export default routes;
