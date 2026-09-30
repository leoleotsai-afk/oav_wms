-- 修正：廠商採購主檔 原欄位「客戶編號」語意有誤，改為「廠商編號」並關聯廠商資料維護
USE [oav67];
GO

IF COL_LENGTH(N'dbo.廠商採購主檔', N'客戶編號') IS NOT NULL
    AND COL_LENGTH(N'dbo.廠商採購主檔', N'廠商編號') IS NULL
BEGIN
    EXEC sp_rename N'dbo.廠商採購主檔.客戶編號', N'廠商編號', N'COLUMN';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_廠商採購主檔_廠商編號'
)
BEGIN
    ALTER TABLE [dbo].[廠商採購主檔]
        ADD CONSTRAINT [FK_廠商採購主檔_廠商編號] FOREIGN KEY ([廠商編號])
        REFERENCES [dbo].[廠商資料維護]([廠商編號]);
END
GO
