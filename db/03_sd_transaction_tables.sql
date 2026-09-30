-- SD訂單模組 - 交易數據
USE [oav67];
GO

IF OBJECT_ID(N'[dbo].[客戶訂單主檔]') IS NULL
BEGIN
    CREATE TABLE [dbo].[客戶訂單主檔] (
        [訂單編號]   NVARCHAR(20) NOT NULL,
        [訂單日期]   DATE NOT NULL,
        [銷售組織]   NVARCHAR(20) NOT NULL,
        [客戶編號]   NVARCHAR(20) NOT NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_客戶訂單主檔] PRIMARY KEY ([訂單編號]),
        CONSTRAINT [FK_客戶訂單主檔_銷售組織] FOREIGN KEY ([銷售組織]) REFERENCES [dbo].[銷售組織維護]([銷售組織]),
        CONSTRAINT [FK_客戶訂單主檔_客戶編號] FOREIGN KEY ([客戶編號]) REFERENCES [dbo].[客戶資料維護]([客戶編號])
    );
END
GO

IF OBJECT_ID(N'[dbo].[客戶訂單明細]') IS NULL
BEGIN
    CREATE TABLE [dbo].[客戶訂單明細] (
        [訂單編號]   NVARCHAR(20) NOT NULL,
        [訂單項次]   NVARCHAR(04) NOT NULL,
        [物料編號]   NVARCHAR(20) NOT NULL,
        [訂單數量]   INT NOT NULL DEFAULT (0),
        [出貨數量]   INT NOT NULL DEFAULT (0),
        [退回數量]   INT NOT NULL DEFAULT (0),
        [預定交期]   DATE NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_客戶訂單明細] PRIMARY KEY ([訂單編號], [訂單項次]),
        CONSTRAINT [FK_客戶訂單明細_主檔] FOREIGN KEY ([訂單編號]) REFERENCES [dbo].[客戶訂單主檔]([訂單編號]),
        CONSTRAINT [FK_客戶訂單明細_物料編號] FOREIGN KEY ([物料編號]) REFERENCES [dbo].[物料資料維護]([物料編號])
    );
END
GO

IF OBJECT_ID(N'[dbo].[訂單出貨主檔]') IS NULL
BEGIN
    CREATE TABLE [dbo].[訂單出貨主檔] (
        [出貨編號]   NVARCHAR(20) NOT NULL,
        [出貨日期]   DATE NOT NULL,
        [銷售組織]   NVARCHAR(20) NOT NULL,
        [客戶編號]   NVARCHAR(20) NOT NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_訂單出貨主檔] PRIMARY KEY ([出貨編號]),
        CONSTRAINT [FK_訂單出貨主檔_銷售組織] FOREIGN KEY ([銷售組織]) REFERENCES [dbo].[銷售組織維護]([銷售組織]),
        CONSTRAINT [FK_訂單出貨主檔_客戶編號] FOREIGN KEY ([客戶編號]) REFERENCES [dbo].[客戶資料維護]([客戶編號])
    );
END
GO

IF OBJECT_ID(N'[dbo].[訂單出貨明細]') IS NULL
BEGIN
    CREATE TABLE [dbo].[訂單出貨明細] (
        [出貨編號]   NVARCHAR(20) NOT NULL,
        [出貨項次]   NVARCHAR(04) NOT NULL,
        [訂單編號]   NVARCHAR(20) NOT NULL,
        [訂單項次]   NVARCHAR(04) NOT NULL,
        [物料編號]   NVARCHAR(20) NOT NULL,
        [倉庫代碼]   NVARCHAR(20) NOT NULL,
        [出貨數量]   INT NOT NULL DEFAULT (0),
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_訂單出貨明細] PRIMARY KEY ([出貨編號], [出貨項次]),
        CONSTRAINT [FK_訂單出貨明細_主檔] FOREIGN KEY ([出貨編號]) REFERENCES [dbo].[訂單出貨主檔]([出貨編號]),
        CONSTRAINT [FK_訂單出貨明細_訂單明細] FOREIGN KEY ([訂單編號], [訂單項次]) REFERENCES [dbo].[客戶訂單明細]([訂單編號], [訂單項次]),
        CONSTRAINT [FK_訂單出貨明細_物料編號] FOREIGN KEY ([物料編號]) REFERENCES [dbo].[物料資料維護]([物料編號]),
        CONSTRAINT [FK_訂單出貨明細_倉庫代碼] FOREIGN KEY ([倉庫代碼]) REFERENCES [dbo].[工廠倉庫維護]([倉庫代碼])
    );
END
GO

IF OBJECT_ID(N'[dbo].[出貨退回主檔]') IS NULL
BEGIN
    CREATE TABLE [dbo].[出貨退回主檔] (
        [退回編號]   NVARCHAR(20) NOT NULL,
        [退回日期]   DATE NOT NULL,
        [銷售組織]   NVARCHAR(20) NOT NULL,
        [客戶編號]   NVARCHAR(20) NOT NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_出貨退回主檔] PRIMARY KEY ([退回編號]),
        CONSTRAINT [FK_出貨退回主檔_銷售組織] FOREIGN KEY ([銷售組織]) REFERENCES [dbo].[銷售組織維護]([銷售組織]),
        CONSTRAINT [FK_出貨退回主檔_客戶編號] FOREIGN KEY ([客戶編號]) REFERENCES [dbo].[客戶資料維護]([客戶編號])
    );
END
GO

IF OBJECT_ID(N'[dbo].[出貨退回明細]') IS NULL
BEGIN
    CREATE TABLE [dbo].[出貨退回明細] (
        [退回編號]   NVARCHAR(20) NOT NULL,
        [退回項次]   NVARCHAR(04) NOT NULL,
        [訂單編號]   NVARCHAR(20) NOT NULL,
        [訂單項次]   NVARCHAR(04) NOT NULL,
        [物料編號]   NVARCHAR(20) NOT NULL,
        [倉庫代碼]   NVARCHAR(20) NOT NULL,
        [退回數量]   INT NOT NULL DEFAULT (0),
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_出貨退回明細] PRIMARY KEY ([退回編號], [退回項次]),
        CONSTRAINT [FK_出貨退回明細_主檔] FOREIGN KEY ([退回編號]) REFERENCES [dbo].[出貨退回主檔]([退回編號]),
        CONSTRAINT [FK_出貨退回明細_訂單明細] FOREIGN KEY ([訂單編號], [訂單項次]) REFERENCES [dbo].[客戶訂單明細]([訂單編號], [訂單項次]),
        CONSTRAINT [FK_出貨退回明細_物料編號] FOREIGN KEY ([物料編號]) REFERENCES [dbo].[物料資料維護]([物料編號]),
        CONSTRAINT [FK_出貨退回明細_倉庫代碼] FOREIGN KEY ([倉庫代碼]) REFERENCES [dbo].[工廠倉庫維護]([倉庫代碼])
    );
END
GO
