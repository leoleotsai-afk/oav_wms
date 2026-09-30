-- MM採購模組 - 交易數據
-- 註：規格書原始欄位名為「客戶編號」，已依語意修正為「廠商編號」並關聯至廠商資料維護。
USE [oav67];
GO

IF OBJECT_ID(N'[dbo].[廠商採購主檔]') IS NULL
BEGIN
    CREATE TABLE [dbo].[廠商採購主檔] (
        [採購編號]   NVARCHAR(20) NOT NULL,
        [採購日期]   DATE NOT NULL,
        [採購組織]   NVARCHAR(20) NOT NULL,
        [廠商編號]   NVARCHAR(20) NOT NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_廠商採購主檔] PRIMARY KEY ([採購編號]),
        CONSTRAINT [FK_廠商採購主檔_採購組織] FOREIGN KEY ([採購組織]) REFERENCES [dbo].[採購組織維護]([採購組織]),
        CONSTRAINT [FK_廠商採購主檔_廠商編號] FOREIGN KEY ([廠商編號]) REFERENCES [dbo].[廠商資料維護]([廠商編號])
    );
END
GO

IF OBJECT_ID(N'[dbo].[廠商採購明細]') IS NULL
BEGIN
    CREATE TABLE [dbo].[廠商採購明細] (
        [採購編號]   NVARCHAR(20) NOT NULL,
        [採購項次]   NVARCHAR(04) NOT NULL,
        [物料編號]   NVARCHAR(20) NOT NULL,
        [採購數量]   INT NOT NULL DEFAULT (0),
        [收貨數量]   INT NOT NULL DEFAULT (0),
        [退回數量]   INT NOT NULL DEFAULT (0),
        [預定交期]   DATE NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_廠商採購明細] PRIMARY KEY ([採購編號], [採購項次]),
        CONSTRAINT [FK_廠商採購明細_主檔] FOREIGN KEY ([採購編號]) REFERENCES [dbo].[廠商採購主檔]([採購編號]),
        CONSTRAINT [FK_廠商採購明細_物料編號] FOREIGN KEY ([物料編號]) REFERENCES [dbo].[物料資料維護]([物料編號])
    );
END
GO

IF OBJECT_ID(N'[dbo].[採購收貨主檔]') IS NULL
BEGIN
    CREATE TABLE [dbo].[採購收貨主檔] (
        [收貨編號]   NVARCHAR(20) NOT NULL,
        [收貨日期]   DATE NOT NULL,
        [採購組織]   NVARCHAR(20) NOT NULL,
        [廠商編號]   NVARCHAR(20) NOT NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_採購收貨主檔] PRIMARY KEY ([收貨編號]),
        CONSTRAINT [FK_採購收貨主檔_採購組織] FOREIGN KEY ([採購組織]) REFERENCES [dbo].[採購組織維護]([採購組織]),
        CONSTRAINT [FK_採購收貨主檔_廠商編號] FOREIGN KEY ([廠商編號]) REFERENCES [dbo].[廠商資料維護]([廠商編號])
    );
END
GO

IF OBJECT_ID(N'[dbo].[採購收貨明細]') IS NULL
BEGIN
    CREATE TABLE [dbo].[採購收貨明細] (
        [收貨編號]   NVARCHAR(20) NOT NULL,
        [收貨項次]   NVARCHAR(04) NOT NULL,
        [採購編號]   NVARCHAR(20) NOT NULL,
        [採購項次]   NVARCHAR(04) NOT NULL,
        [物料編號]   NVARCHAR(20) NOT NULL,
        [倉庫代碼]   NVARCHAR(20) NOT NULL,
        [收貨數量]   INT NOT NULL DEFAULT (0),
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_採購收貨明細] PRIMARY KEY ([收貨編號], [收貨項次]),
        CONSTRAINT [FK_採購收貨明細_主檔] FOREIGN KEY ([收貨編號]) REFERENCES [dbo].[採購收貨主檔]([收貨編號]),
        CONSTRAINT [FK_採購收貨明細_採購明細] FOREIGN KEY ([採購編號], [採購項次]) REFERENCES [dbo].[廠商採購明細]([採購編號], [採購項次]),
        CONSTRAINT [FK_採購收貨明細_物料編號] FOREIGN KEY ([物料編號]) REFERENCES [dbo].[物料資料維護]([物料編號]),
        CONSTRAINT [FK_採購收貨明細_倉庫代碼] FOREIGN KEY ([倉庫代碼]) REFERENCES [dbo].[工廠倉庫維護]([倉庫代碼])
    );
END
GO

IF OBJECT_ID(N'[dbo].[收貨退回主檔]') IS NULL
BEGIN
    CREATE TABLE [dbo].[收貨退回主檔] (
        [退回編號]   NVARCHAR(20) NOT NULL,
        [退回日期]   DATE NOT NULL,
        [採購組織]   NVARCHAR(20) NOT NULL,
        [廠商編號]   NVARCHAR(20) NOT NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_收貨退回主檔] PRIMARY KEY ([退回編號]),
        CONSTRAINT [FK_收貨退回主檔_採購組織] FOREIGN KEY ([採購組織]) REFERENCES [dbo].[採購組織維護]([採購組織]),
        CONSTRAINT [FK_收貨退回主檔_廠商編號] FOREIGN KEY ([廠商編號]) REFERENCES [dbo].[廠商資料維護]([廠商編號])
    );
END
GO

IF OBJECT_ID(N'[dbo].[收貨退回明細]') IS NULL
BEGIN
    CREATE TABLE [dbo].[收貨退回明細] (
        [退回編號]   NVARCHAR(20) NOT NULL,
        [退回項次]   NVARCHAR(04) NOT NULL,
        [採購編號]   NVARCHAR(20) NOT NULL,
        [採購項次]   NVARCHAR(04) NOT NULL,
        [物料編號]   NVARCHAR(20) NOT NULL,
        [倉庫代碼]   NVARCHAR(20) NOT NULL,
        [退回數量]   INT NOT NULL DEFAULT (0),
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_收貨退回明細] PRIMARY KEY ([退回編號], [退回項次]),
        CONSTRAINT [FK_收貨退回明細_主檔] FOREIGN KEY ([退回編號]) REFERENCES [dbo].[收貨退回主檔]([退回編號]),
        CONSTRAINT [FK_收貨退回明細_採購明細] FOREIGN KEY ([採購編號], [採購項次]) REFERENCES [dbo].[廠商採購明細]([採購編號], [採購項次]),
        CONSTRAINT [FK_收貨退回明細_物料編號] FOREIGN KEY ([物料編號]) REFERENCES [dbo].[物料資料維護]([物料編號]),
        CONSTRAINT [FK_收貨退回明細_倉庫代碼] FOREIGN KEY ([倉庫代碼]) REFERENCES [dbo].[工廠倉庫維護]([倉庫代碼])
    );
END
GO
