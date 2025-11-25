/*
  Warnings:

  - You are about to drop the column `permisoId` on the `Usuario` table. All the data in the column will be lost.
  - You are about to alter the column `rol` on the `Usuario` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(2))`.

*/
-- AlterTable
ALTER TABLE `Usuario` DROP COLUMN `permisoId`,
    MODIFY `rol` ENUM('GOBERNACION', 'SECRETARIA', 'SUPERVISOR', 'FUNCIONARIO', 'CONTRATISTA') NULL;

-- CreateTable
CREATE TABLE `Actuaciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nroRadicado` VARCHAR(191) NOT NULL,
    `fechaActuacion` DATETIME(3) NOT NULL,
    `actuacion` VARCHAR(191) NOT NULL,
    `anotacion` VARCHAR(191) NOT NULL,
    `fechaInicio` DATETIME(3) NOT NULL,
    `fechaFinalizado` DATETIME(3) NOT NULL,
    `fechaNovedad` DATETIME(3) NOT NULL,
    `fechaRegistro` DATETIME(3) NOT NULL,
    `procesoJuducialId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Actuaciones` ADD CONSTRAINT `Actuaciones_procesoJuducialId_fkey` FOREIGN KEY (`procesoJuducialId`) REFERENCES `ProcesoJudicial`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
