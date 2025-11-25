-- CreateTable
CREATE TABLE `accion_judicial` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `fechaCreacion` TIMESTAMP(6) NOT NULL,
    `idJurisdiccion` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `corporacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL,
    `idJurisdiccion` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contrato` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipoContrato` VARCHAR(50) NOT NULL,
    `fechaInicio` DATETIME(3) NOT NULL,
    `fechaFin` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dependencia_responsable` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documento_proceso_judicial` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rutaRelativa` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL,
    `creador` VARCHAR(191) NOT NULL,
    `idProcesoJudicial` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estado` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hecho_generador` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(450) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historial_estado` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `estadoNuevo` VARCHAR(191) NOT NULL,
    `estadoAnterior` VARCHAR(191) NOT NULL,
    `idEstado` INTEGER NOT NULL,
    `idInstancia` INTEGER NULL,
    `idSegundaInstancia` INTEGER NULL,
    `idTerceraInstancia` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `instancia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actualizacionInstancia` DATETIME(3) NULL,
    `idProcesoJudicial` INTEGER NOT NULL,
    `idEstado` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jurisdiccion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `fechaCreacion` TIMESTAMP(6) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nivel_riesgo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permiso` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `proceso_judicial` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `radicado` VARCHAR(191) NOT NULL,
    `calidad` ENUM('activo', 'inactivo') NOT NULL,
    `demandante` VARCHAR(191) NOT NULL,
    `demandado` VARCHAR(191) NOT NULL,
    `fechaNotificacion` DATETIME(3) NOT NULL,
    `idSecretariaDespacho` INTEGER NOT NULL,
    `idAccionJudicial` INTEGER NOT NULL,
    `idCorporacion` INTEGER NOT NULL,
    `idUsuarioProceso` INTEGER NOT NULL,
    `idEstado` INTEGER NOT NULL,
    `idDependenciaResponsable` INTEGER NOT NULL,
    `idHechoGenerador` INTEGER NOT NULL,
    `idNivelRiesgo` INTEGER NOT NULL,
    `montoPretension` DOUBLE NULL,
    `tipoPretension` VARCHAR(191) NULL,
    `medidaCautelar` INTEGER NULL,
    `valorMedidaCautelar` DOUBLE NULL,
    `numeroCedula` VARCHAR(191) NULL,
    `sintesis` VARCHAR(191) NULL,
    `fortalezaDefensa` VARCHAR(191) NULL,
    `evidenciaProbatoria` VARCHAR(191) NULL,
    `riesgoProcesal` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `secretaria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `segunda_instancia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `radicado` VARCHAR(191) NULL,
    `idInstancia` INTEGER NOT NULL,
    `idEstado` INTEGER NOT NULL,
    `idProcesoJudicial` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tercera_instancia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `idEstado` INTEGER NOT NULL,
    `idSegundaInstancia` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `apellido` VARCHAR(100) NOT NULL,
    `documento` VARCHAR(50) NOT NULL,
    `tipoDocumento` ENUM('CC', 'TI', 'CE', 'PASAPORTE') NOT NULL,
    `correoElectronico` VARCHAR(120) NOT NULL,
    `telefono` VARCHAR(255) NOT NULL,
    `contrasena` VARCHAR(255) NOT NULL,
    `estado` ENUM('activo', 'inactivo') NOT NULL,
    `idPermiso` INTEGER NOT NULL,
    `idSecretaria` INTEGER NOT NULL,
    `idContrato` INTEGER NOT NULL,
    `fechaRegistro` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuario_proceso` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rol` VARCHAR(191) NOT NULL,
    `fechaVinculacion` DATETIME(3) NOT NULL,
    `idUsuario` INTEGER NOT NULL,
    `idProcesoJudicial` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `accion_judicial` ADD CONSTRAINT `accion_judicial_idJurisdiccion_fkey` FOREIGN KEY (`idJurisdiccion`) REFERENCES `jurisdiccion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `corporacion` ADD CONSTRAINT `corporacion_idJurisdiccion_fkey` FOREIGN KEY (`idJurisdiccion`) REFERENCES `jurisdiccion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documento_proceso_judicial` ADD CONSTRAINT `documento_proceso_judicial_idProcesoJudicial_fkey` FOREIGN KEY (`idProcesoJudicial`) REFERENCES `proceso_judicial`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historial_estado` ADD CONSTRAINT `historial_estado_idEstado_fkey` FOREIGN KEY (`idEstado`) REFERENCES `estado`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historial_estado` ADD CONSTRAINT `historial_estado_idInstancia_fkey` FOREIGN KEY (`idInstancia`) REFERENCES `instancia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historial_estado` ADD CONSTRAINT `historial_estado_idSegundaInstancia_fkey` FOREIGN KEY (`idSegundaInstancia`) REFERENCES `segunda_instancia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historial_estado` ADD CONSTRAINT `historial_estado_idTerceraInstancia_fkey` FOREIGN KEY (`idTerceraInstancia`) REFERENCES `tercera_instancia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instancia` ADD CONSTRAINT `instancia_idProcesoJudicial_fkey` FOREIGN KEY (`idProcesoJudicial`) REFERENCES `proceso_judicial`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `instancia` ADD CONSTRAINT `instancia_idEstado_fkey` FOREIGN KEY (`idEstado`) REFERENCES `estado`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `proceso_judicial` ADD CONSTRAINT `proceso_judicial_idSecretariaDespacho_fkey` FOREIGN KEY (`idSecretariaDespacho`) REFERENCES `secretaria`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `proceso_judicial` ADD CONSTRAINT `proceso_judicial_idAccionJudicial_fkey` FOREIGN KEY (`idAccionJudicial`) REFERENCES `accion_judicial`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `proceso_judicial` ADD CONSTRAINT `proceso_judicial_idCorporacion_fkey` FOREIGN KEY (`idCorporacion`) REFERENCES `corporacion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `proceso_judicial` ADD CONSTRAINT `proceso_judicial_idEstado_fkey` FOREIGN KEY (`idEstado`) REFERENCES `estado`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `proceso_judicial` ADD CONSTRAINT `proceso_judicial_idDependenciaResponsable_fkey` FOREIGN KEY (`idDependenciaResponsable`) REFERENCES `dependencia_responsable`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `proceso_judicial` ADD CONSTRAINT `proceso_judicial_idHechoGenerador_fkey` FOREIGN KEY (`idHechoGenerador`) REFERENCES `hecho_generador`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `proceso_judicial` ADD CONSTRAINT `proceso_judicial_idNivelRiesgo_fkey` FOREIGN KEY (`idNivelRiesgo`) REFERENCES `nivel_riesgo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `segunda_instancia` ADD CONSTRAINT `segunda_instancia_idInstancia_fkey` FOREIGN KEY (`idInstancia`) REFERENCES `instancia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `segunda_instancia` ADD CONSTRAINT `segunda_instancia_idEstado_fkey` FOREIGN KEY (`idEstado`) REFERENCES `estado`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tercera_instancia` ADD CONSTRAINT `tercera_instancia_idEstado_fkey` FOREIGN KEY (`idEstado`) REFERENCES `estado`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tercera_instancia` ADD CONSTRAINT `tercera_instancia_idSegundaInstancia_fkey` FOREIGN KEY (`idSegundaInstancia`) REFERENCES `segunda_instancia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuario` ADD CONSTRAINT `usuario_idPermiso_fkey` FOREIGN KEY (`idPermiso`) REFERENCES `permiso`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuario` ADD CONSTRAINT `usuario_idSecretaria_fkey` FOREIGN KEY (`idSecretaria`) REFERENCES `secretaria`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuario` ADD CONSTRAINT `usuario_idContrato_fkey` FOREIGN KEY (`idContrato`) REFERENCES `contrato`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuario_proceso` ADD CONSTRAINT `usuario_proceso_idUsuario_fkey` FOREIGN KEY (`idUsuario`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuario_proceso` ADD CONSTRAINT `usuario_proceso_idProcesoJudicial_fkey` FOREIGN KEY (`idProcesoJudicial`) REFERENCES `proceso_judicial`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
