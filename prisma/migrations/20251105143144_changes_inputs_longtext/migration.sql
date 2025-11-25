-- AlterTable
ALTER TABLE `Actuaciones` MODIFY `actuacion` TEXT NOT NULL,
    MODIFY `anotacion` TEXT NOT NULL,
    MODIFY `fechaInicio` DATETIME(3) NULL,
    MODIFY `fechaFinalizado` DATETIME(3) NULL,
    MODIFY `fechaNovedad` DATETIME(3) NULL,
    MODIFY `fechaRegistro` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `ProcesoJudicial` MODIFY `sintesis` TEXT NULL;
