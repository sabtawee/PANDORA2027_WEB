-- CreateIndex
CREATE INDEX `User_signupIp_createdAt_idx` ON `User`(`signupIp`, `createdAt`);

-- CreateIndex
CREATE INDEX `User_signupFingerprint_idx` ON `User`(`signupFingerprint`);
