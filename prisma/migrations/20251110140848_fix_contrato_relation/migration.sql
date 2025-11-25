/*
  Warnings:

  - You are about to drop the column `contratoId` on the `Usuario` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[usuarioId]` on the table `Contrato` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `usuarioId` to the `Contrato` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Usuario` DROP FOREIGN KEY `Usuario_contratoId_fkey`;

-- DropIndex
DROP INDEX `Usuario_contratoId_fkey` ON `Usuario`;

-- AlterTable
ALTER TABLE `Contrato` ADD COLUMN `usuarioId` INTEGER NOT NULL,
    MODIFY `tipoContrato` ENUM('contratista', 'funcionario') NOT NULL DEFAULT 'funcionario',
    MODIFY `fechaInicio` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Usuario` DROP COLUMN `contratoId`;

-- CreateIndex
CREATE UNIQUE INDEX `Contrato_usuarioId_key` ON `Contrato`(`usuarioId`);

-- AddForeignKey
ALTER TABLE `Contrato` ADD CONSTRAINT `Contrato_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
