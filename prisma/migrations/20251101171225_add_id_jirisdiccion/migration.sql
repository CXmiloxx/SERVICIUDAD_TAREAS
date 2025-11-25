-- AlterTable
ALTER TABLE `ProcesoJudicial` ADD COLUMN `jurisdiccionId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `ProcesoJudicial` ADD CONSTRAINT `ProcesoJudicial_jurisdiccionId_fkey` FOREIGN KEY (`jurisdiccionId`) REFERENCES `Jurisdiccion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
