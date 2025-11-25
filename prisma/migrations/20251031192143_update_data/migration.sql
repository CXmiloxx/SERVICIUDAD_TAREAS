/*
  Warnings:

  - You are about to drop the `accion_judicial` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `contrato` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `corporacion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `dependencia_responsable` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `documento_proceso_judicial` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `estado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hecho_generador` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `historial_estado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `instancia` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `jurisdiccion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `nivel_riesgo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `permiso` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `proceso_judicial` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `secretaria` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `segunda_instancia` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tercera_instancia` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `usuario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `usuario_proceso` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `accion_judicial` DROP FOREIGN KEY `accion_judicial_idJurisdiccion_fkey`;

-- DropForeignKey
ALTER TABLE `corporacion` DROP FOREIGN KEY `corporacion_idJurisdiccion_fkey`;

-- DropForeignKey
ALTER TABLE `documento_proceso_judicial` DROP FOREIGN KEY `documento_proceso_judicial_idProcesoJudicial_fkey`;

-- DropForeignKey
ALTER TABLE `historial_estado` DROP FOREIGN KEY `historial_estado_idEstado_fkey`;

-- DropForeignKey
ALTER TABLE `historial_estado` DROP FOREIGN KEY `historial_estado_idInstancia_fkey`;

-- DropForeignKey
ALTER TABLE `historial_estado` DROP FOREIGN KEY `historial_estado_idSegundaInstancia_fkey`;

-- DropForeignKey
ALTER TABLE `historial_estado` DROP FOREIGN KEY `historial_estado_idTerceraInstancia_fkey`;

-- DropForeignKey
ALTER TABLE `instancia` DROP FOREIGN KEY `instancia_idEstado_fkey`;

-- DropForeignKey
ALTER TABLE `instancia` DROP FOREIGN KEY `instancia_idProcesoJudicial_fkey`;

-- DropForeignKey
ALTER TABLE `proceso_judicial` DROP FOREIGN KEY `proceso_judicial_idAccionJudicial_fkey`;

-- DropForeignKey
ALTER TABLE `proceso_judicial` DROP FOREIGN KEY `proceso_judicial_idCorporacion_fkey`;

-- DropForeignKey
ALTER TABLE `proceso_judicial` DROP FOREIGN KEY `proceso_judicial_idDependenciaResponsable_fkey`;

-- DropForeignKey
ALTER TABLE `proceso_judicial` DROP FOREIGN KEY `proceso_judicial_idEstado_fkey`;

-- DropForeignKey
ALTER TABLE `proceso_judicial` DROP FOREIGN KEY `proceso_judicial_idHechoGenerador_fkey`;

-- DropForeignKey
ALTER TABLE `proceso_judicial` DROP FOREIGN KEY `proceso_judicial_idNivelRiesgo_fkey`;

-- DropForeignKey
ALTER TABLE `proceso_judicial` DROP FOREIGN KEY `proceso_judicial_idSecretariaDespacho_fkey`;

-- DropForeignKey
ALTER TABLE `segunda_instancia` DROP FOREIGN KEY `segunda_instancia_idEstado_fkey`;

-- DropForeignKey
ALTER TABLE `segunda_instancia` DROP FOREIGN KEY `segunda_instancia_idInstancia_fkey`;

-- DropForeignKey
ALTER TABLE `tercera_instancia` DROP FOREIGN KEY `tercera_instancia_idEstado_fkey`;

-- DropForeignKey
ALTER TABLE `tercera_instancia` DROP FOREIGN KEY `tercera_instancia_idSegundaInstancia_fkey`;

-- DropForeignKey
ALTER TABLE `usuario` DROP FOREIGN KEY `usuario_idContrato_fkey`;

-- DropForeignKey
ALTER TABLE `usuario` DROP FOREIGN KEY `usuario_idPermiso_fkey`;

-- DropForeignKey
ALTER TABLE `usuario` DROP FOREIGN KEY `usuario_idSecretaria_fkey`;

-- DropForeignKey
ALTER TABLE `usuario_proceso` DROP FOREIGN KEY `usuario_proceso_idProcesoJudicial_fkey`;

-- DropForeignKey
ALTER TABLE `usuario_proceso` DROP FOREIGN KEY `usuario_proceso_idUsuario_fkey`;

-- DropTable
DROP TABLE `accion_judicial`;

-- DropTable
DROP TABLE `contrato`;

-- DropTable
DROP TABLE `corporacion`;

-- DropTable
DROP TABLE `dependencia_responsable`;

-- DropTable
DROP TABLE `documento_proceso_judicial`;

-- DropTable
DROP TABLE `estado`;

-- DropTable
DROP TABLE `hecho_generador`;

-- DropTable
DROP TABLE `historial_estado`;

-- DropTable
DROP TABLE `instancia`;

-- DropTable
DROP TABLE `jurisdiccion`;

-- DropTable
DROP TABLE `nivel_riesgo`;

-- DropTable
DROP TABLE `permiso`;

-- DropTable
DROP TABLE `proceso_judicial`;

-- DropTable
DROP TABLE `secretaria`;

-- DropTable
DROP TABLE `segunda_instancia`;

-- DropTable
DROP TABLE `tercera_instancia`;

-- DropTable
DROP TABLE `usuario`;

-- DropTable
DROP TABLE `usuario_proceso`;

-- CreateTable
CREATE TABLE `Usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `apellido` VARCHAR(191) NOT NULL,
    `documento` VARCHAR(191) NOT NULL,
    `tipoDocumento` ENUM('CC', 'TI', 'CE', 'PASAPORTE') NOT NULL,
    `correoElectronico` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NULL,
    `contrasena` VARCHAR(191) NOT NULL,
    `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
    `fechaRegistro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `permisoId` INTEGER NULL,
    `secretariaId` INTEGER NULL,
    `contratoId` INTEGER NULL,
    `rol` VARCHAR(191) NULL,

    UNIQUE INDEX `Usuario_correoElectronico_key`(`correoElectronico`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Secretaria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contrato` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipoContrato` ENUM('contratista', 'funcionario') NOT NULL,
    `fechaInicio` DATETIME(3) NOT NULL,
    `fechaFin` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProcesoJudicial` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `radicado` VARCHAR(191) NOT NULL,
    `calidad` ENUM('demandado', 'demandante') NOT NULL,
    `demandante` VARCHAR(191) NOT NULL,
    `demandado` VARCHAR(191) NOT NULL,
    `fechaNotificacion` DATETIME(3) NULL,
    `secretariaDespachoId` INTEGER NULL,
    `accionJudicialId` INTEGER NULL,
    `corporacionId` INTEGER NULL,
    `montoPretension` DOUBLE NULL,
    `usuarioProcesoId` INTEGER NULL,
    `tipoPretension` ENUM('determinada', 'indeterminada') NOT NULL,
    `medidaCautelar` BOOLEAN NULL DEFAULT false,
    `valorMedidaCautelar` DOUBLE NULL,
    `estadoId` INTEGER NULL,
    `numeroCedula` VARCHAR(191) NULL,
    `despachoJudicial` VARCHAR(191) NULL,
    `sintesis` VARCHAR(191) NULL,
    `dependenciaResponsableId` INTEGER NULL,
    `hechoGeneradorId` INTEGER NULL,
    `fechaProbableFallo` DATETIME(3) NULL,
    `fortalezaDefensaId` INTEGER NULL,
    `fortalezaProbatoriaId` INTEGER NULL,
    `riesgoProcesalId` INTEGER NULL,
    `nivelJurisprudenciaId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NivelRiesgo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UsuarioProceso` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fechaVinculacion` DATETIME(3) NOT NULL,
    `usuarioId` INTEGER NOT NULL,
    `procesoJudicialId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Estado` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Instancia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actualizacionInstancia` DATETIME(3) NOT NULL,
    `procesoJudicialId` INTEGER NOT NULL,
    `estadoId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SegundaInstancia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `radicado` VARCHAR(191) NOT NULL,
    `instanciaId` INTEGER NOT NULL,
    `estadoId` INTEGER NOT NULL,
    `procesoJudicialId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TerceraInstancia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `estadoId` INTEGER NOT NULL,
    `segundaInstanciaId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Jurisdiccion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Corporacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL,
    `jurisdiccionId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DependenciaResponsable` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HechoGenerador` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AccionJudicial` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `jurisdiccionId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentoProcesoJudicial` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rutaRelativa` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creador` VARCHAR(191) NOT NULL,
    `procesoJudicialId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HistorialEstado` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `estadoNuevo` VARCHAR(191) NOT NULL,
    `estadoAnterior` VARCHAR(191) NOT NULL,
    `estadoId` INTEGER NOT NULL,
    `instanciaId` INTEGER NULL,
    `segundaInstanciaId` INTEGER NULL,
    `terceraInstanciaId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_secretariaId_fkey` FOREIGN KEY (`secretariaId`) REFERENCES `Secretaria`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_contratoId_fkey` FOREIGN KEY (`contratoId`) REFERENCES `Contrato`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcesoJudicial` ADD CONSTRAINT `ProcesoJudicial_secretariaDespachoId_fkey` FOREIGN KEY (`secretariaDespachoId`) REFERENCES `Secretaria`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcesoJudicial` ADD CONSTRAINT `ProcesoJudicial_accionJudicialId_fkey` FOREIGN KEY (`accionJudicialId`) REFERENCES `AccionJudicial`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcesoJudicial` ADD CONSTRAINT `ProcesoJudicial_corporacionId_fkey` FOREIGN KEY (`corporacionId`) REFERENCES `Corporacion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcesoJudicial` ADD CONSTRAINT `ProcesoJudicial_estadoId_fkey` FOREIGN KEY (`estadoId`) REFERENCES `Estado`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcesoJudicial` ADD CONSTRAINT `ProcesoJudicial_dependenciaResponsableId_fkey` FOREIGN KEY (`dependenciaResponsableId`) REFERENCES `DependenciaResponsable`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcesoJudicial` ADD CONSTRAINT `ProcesoJudicial_hechoGeneradorId_fkey` FOREIGN KEY (`hechoGeneradorId`) REFERENCES `HechoGenerador`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcesoJudicial` ADD CONSTRAINT `ProcesoJudicial_fortalezaDefensaId_fkey` FOREIGN KEY (`fortalezaDefensaId`) REFERENCES `NivelRiesgo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcesoJudicial` ADD CONSTRAINT `ProcesoJudicial_fortalezaProbatoriaId_fkey` FOREIGN KEY (`fortalezaProbatoriaId`) REFERENCES `NivelRiesgo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcesoJudicial` ADD CONSTRAINT `ProcesoJudicial_riesgoProcesalId_fkey` FOREIGN KEY (`riesgoProcesalId`) REFERENCES `NivelRiesgo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcesoJudicial` ADD CONSTRAINT `ProcesoJudicial_nivelJurisprudenciaId_fkey` FOREIGN KEY (`nivelJurisprudenciaId`) REFERENCES `NivelRiesgo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UsuarioProceso` ADD CONSTRAINT `UsuarioProceso_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UsuarioProceso` ADD CONSTRAINT `UsuarioProceso_procesoJudicialId_fkey` FOREIGN KEY (`procesoJudicialId`) REFERENCES `ProcesoJudicial`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Instancia` ADD CONSTRAINT `Instancia_procesoJudicialId_fkey` FOREIGN KEY (`procesoJudicialId`) REFERENCES `ProcesoJudicial`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Instancia` ADD CONSTRAINT `Instancia_estadoId_fkey` FOREIGN KEY (`estadoId`) REFERENCES `Estado`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SegundaInstancia` ADD CONSTRAINT `SegundaInstancia_instanciaId_fkey` FOREIGN KEY (`instanciaId`) REFERENCES `Instancia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SegundaInstancia` ADD CONSTRAINT `SegundaInstancia_estadoId_fkey` FOREIGN KEY (`estadoId`) REFERENCES `Estado`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SegundaInstancia` ADD CONSTRAINT `SegundaInstancia_procesoJudicialId_fkey` FOREIGN KEY (`procesoJudicialId`) REFERENCES `ProcesoJudicial`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TerceraInstancia` ADD CONSTRAINT `TerceraInstancia_estadoId_fkey` FOREIGN KEY (`estadoId`) REFERENCES `Estado`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TerceraInstancia` ADD CONSTRAINT `TerceraInstancia_segundaInstanciaId_fkey` FOREIGN KEY (`segundaInstanciaId`) REFERENCES `SegundaInstancia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Corporacion` ADD CONSTRAINT `Corporacion_jurisdiccionId_fkey` FOREIGN KEY (`jurisdiccionId`) REFERENCES `Jurisdiccion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccionJudicial` ADD CONSTRAINT `AccionJudicial_jurisdiccionId_fkey` FOREIGN KEY (`jurisdiccionId`) REFERENCES `Jurisdiccion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentoProcesoJudicial` ADD CONSTRAINT `DocumentoProcesoJudicial_procesoJudicialId_fkey` FOREIGN KEY (`procesoJudicialId`) REFERENCES `ProcesoJudicial`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HistorialEstado` ADD CONSTRAINT `HistorialEstado_estadoId_fkey` FOREIGN KEY (`estadoId`) REFERENCES `Estado`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
