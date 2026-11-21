-- AlterTable
ALTER TABLE `AuditLog` ADD COLUMN `adminId` VARCHAR(191) NULL,
    ADD COLUMN `after` JSON NULL,
    ADD COLUMN `before` JSON NULL,
    ADD COLUMN `entity` VARCHAR(40) NULL,
    ADD COLUMN `op` ENUM('CREATE', 'UPDATE', 'DELETE', 'ACTION', 'SECURITY') NOT NULL DEFAULT 'ACTION',
    ADD COLUMN `userAgent` VARCHAR(255) NULL;

-- CreateTable
CREATE TABLE `AdminUser` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(40) NOT NULL,
    `displayName` VARCHAR(80) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'EDITOR') NOT NULL DEFAULT 'EDITOR',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `mustChangePassword` BOOLEAN NOT NULL DEFAULT true,
    `failedAttempts` INTEGER NOT NULL DEFAULT 0,
    `lockedUntil` DATETIME(3) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `lastLoginIp` VARCHAR(45) NULL,
    `passwordChangedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AdminUser_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminSession` (
    `id` VARCHAR(191) NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `adminId` VARCHAR(191) NOT NULL,
    `ip` VARCHAR(45) NULL,
    `userAgent` VARCHAR(255) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AdminSession_tokenHash_key`(`tokenHash`),
    INDEX `AdminSession_adminId_idx`(`adminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminLoginLog` (
    `id` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NULL,
    `username` VARCHAR(80) NOT NULL,
    `event` ENUM('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT') NOT NULL,
    `reason` VARCHAR(30) NOT NULL,
    `ip` VARCHAR(45) NULL,
    `userAgent` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AdminLoginLog_createdAt_idx`(`createdAt`),
    INDEX `AdminLoginLog_adminId_createdAt_idx`(`adminId`, `createdAt`),
    INDEX `AdminLoginLog_ip_createdAt_idx`(`ip`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `AuditLog_adminId_createdAt_idx` ON `AuditLog`(`adminId`, `createdAt`);

-- CreateIndex
CREATE INDEX `AuditLog_entity_target_idx` ON `AuditLog`(`entity`, `target`);

-- AddForeignKey
ALTER TABLE `AdminSession` ADD CONSTRAINT `AdminSession_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `AdminUser`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdminLoginLog` ADD CONSTRAINT `AdminLoginLog_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `AdminUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `AdminUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
