-- 主數據資料表
USE [oav67];
GO

IF OBJECT_ID(N'[dbo].[客戶資料維護]') IS NULL
BEGIN
    CREATE TABLE [dbo].[客戶資料維護] (
        [客戶編號]   NVARCHAR(20) NOT NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_客戶資料維護] PRIMARY KEY ([客戶編號])
    );
END
GO

IF OBJECT_ID(N'[dbo].[廠商資料維護]') IS NULL
BEGIN
    CREATE TABLE [dbo].[廠商資料維護] (
        [廠商編號]   NVARCHAR(20) NOT NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_廠商資料維護] PRIMARY KEY ([廠商編號])
    );
END
GO

IF OBJECT_ID(N'[dbo].[物料資料維護]') IS NULL
BEGIN
    CREATE TABLE [dbo].[物料資料維護] (
        [物料編號]   NVARCHAR(20) NOT NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_物料資料維護] PRIMARY KEY ([物料編號])
    );
END
GO

IF OBJECT_ID(N'[dbo].[物管資料維護]') IS NULL
BEGIN
    CREATE TABLE [dbo].[物管資料維護] (
        [物管編號]   NVARCHAR(20) NOT NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_物管資料維護] PRIMARY KEY ([物管編號])
    );
END
GO

-- 用量清單(BOM)：主階/子階皆為物料
IF OBJECT_ID(N'[dbo].[用量清單維護]') IS NULL
BEGIN
    CREATE TABLE [dbo].[用量清單維護] (
        [主階編號]   NVARCHAR(20) NOT NULL,
        [子階編號]   NVARCHAR(20) NOT NULL,
        [標準用量]   INT NOT NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_用量清單維護] PRIMARY KEY ([主階編號], [子階編號]),
        CONSTRAINT [FK_用量清單維護_主階] FOREIGN KEY ([主階編號])
            REFERENCES [dbo].[物料資料維護]([物料編號]),
        CONSTRAINT [FK_用量清單維護_子階] FOREIGN KEY ([子階編號])
            REFERENCES [dbo].[物料資料維護]([物料編號])
    );
END
GO
