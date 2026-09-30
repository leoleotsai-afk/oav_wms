-- IM / PP 報表輸出：實體資料表
-- 規格書僅列出資料表名稱，未給欄位定義；以下依業務語意設計初版欄位，
-- 未來由過帳程序 / 排程寫入，本階段僅先建表。
USE [oav67];
GO

IF OBJECT_ID(N'[dbo].[庫存異動明細]') IS NULL
BEGIN
    CREATE TABLE [dbo].[庫存異動明細] (
        [異動序號]     INT IDENTITY(1,1) NOT NULL,
        [異動日期]     DATE NOT NULL,
        [物料編號]     NVARCHAR(20) NOT NULL,
        [倉庫代碼]     NVARCHAR(20) NOT NULL,
        [異動類別]     NVARCHAR(20) NOT NULL,
        [異動數量]     INT NOT NULL,
        [來源單據編號] NVARCHAR(20) NULL,
        [來源單據項次] NVARCHAR(04) NULL,
        [備註說明]     NVARCHAR(20) NULL,
        CONSTRAINT [PK_庫存異動明細] PRIMARY KEY ([異動序號]),
        CONSTRAINT [FK_庫存異動明細_物料編號] FOREIGN KEY ([物料編號]) REFERENCES [dbo].[物料資料維護]([物料編號]),
        CONSTRAINT [FK_庫存異動明細_倉庫代碼] FOREIGN KEY ([倉庫代碼]) REFERENCES [dbo].[工廠倉庫維護]([倉庫代碼])
    );
END
GO

IF OBJECT_ID(N'[dbo].[每日庫存餘額]') IS NULL
BEGIN
    CREATE TABLE [dbo].[每日庫存餘額] (
        [日期]       DATE NOT NULL,
        [物料編號]   NVARCHAR(20) NOT NULL,
        [倉庫代碼]   NVARCHAR(20) NOT NULL,
        [期初數量]   INT NOT NULL DEFAULT (0),
        [本期入庫]   INT NOT NULL DEFAULT (0),
        [本期出庫]   INT NOT NULL DEFAULT (0),
        [期末數量]   INT NOT NULL DEFAULT (0),
        CONSTRAINT [PK_每日庫存餘額] PRIMARY KEY ([日期], [物料編號], [倉庫代碼]),
        CONSTRAINT [FK_每日庫存餘額_物料編號] FOREIGN KEY ([物料編號]) REFERENCES [dbo].[物料資料維護]([物料編號]),
        CONSTRAINT [FK_每日庫存餘額_倉庫代碼] FOREIGN KEY ([倉庫代碼]) REFERENCES [dbo].[工廠倉庫維護]([倉庫代碼])
    );
END
GO

IF OBJECT_ID(N'[dbo].[庫存在途明細]') IS NULL
BEGIN
    CREATE TABLE [dbo].[庫存在途明細] (
        [工單編號]   NVARCHAR(20) NOT NULL,
        [物料編號]   NVARCHAR(20) NOT NULL,
        [工廠代碼]   NVARCHAR(20) NOT NULL,
        [在途數量]   INT NOT NULL DEFAULT (0),
        [預定完工]   DATE NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_庫存在途明細] PRIMARY KEY ([工單編號], [物料編號]),
        CONSTRAINT [FK_庫存在途明細_工單編號] FOREIGN KEY ([工單編號]) REFERENCES [dbo].[生產工單主檔]([工單編號]),
        CONSTRAINT [FK_庫存在途明細_物料編號] FOREIGN KEY ([物料編號]) REFERENCES [dbo].[物料資料維護]([物料編號]),
        CONSTRAINT [FK_庫存在途明細_工廠代碼] FOREIGN KEY ([工廠代碼]) REFERENCES [dbo].[工廠代碼維護]([工廠代碼])
    );
END
GO

IF OBJECT_ID(N'[dbo].[每日供需餘額]') IS NULL
BEGIN
    CREATE TABLE [dbo].[每日供需餘額] (
        [日期]       DATE NOT NULL,
        [物料編號]   NVARCHAR(20) NOT NULL,
        [工廠代碼]   NVARCHAR(20) NOT NULL,
        [在手數量]   INT NOT NULL DEFAULT (0),
        [供給入庫]   INT NOT NULL DEFAULT (0),
        [需求入庫]   INT NOT NULL DEFAULT (0),
        [可用數量]   INT NOT NULL DEFAULT (0),
        CONSTRAINT [PK_每日供需餘額] PRIMARY KEY ([日期], [物料編號], [工廠代碼]),
        CONSTRAINT [FK_每日供需餘額_物料編號] FOREIGN KEY ([物料編號]) REFERENCES [dbo].[物料資料維護]([物料編號]),
        CONSTRAINT [FK_每日供需餘額_工廠代碼] FOREIGN KEY ([工廠代碼]) REFERENCES [dbo].[工廠代碼維護]([工廠代碼])
    );
END
GO
