-- IM庫存模組 - 交易數據
USE [oav67];
GO

IF OBJECT_ID(N'[dbo].[物料預留主檔]') IS NULL
BEGIN
    CREATE TABLE [dbo].[物料預留主檔] (
        [預留編號]   NVARCHAR(20) NOT NULL,
        [預留日期]   DATE NOT NULL,
        [工廠代碼]   NVARCHAR(20) NOT NULL,
        [物管編號]   NVARCHAR(20) NOT NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_物料預留主檔] PRIMARY KEY ([預留編號]),
        CONSTRAINT [FK_物料預留主檔_工廠代碼] FOREIGN KEY ([工廠代碼]) REFERENCES [dbo].[工廠代碼維護]([工廠代碼]),
        CONSTRAINT [FK_物料預留主檔_物管編號] FOREIGN KEY ([物管編號]) REFERENCES [dbo].[物管資料維護]([物管編號])
    );
END
GO

IF OBJECT_ID(N'[dbo].[物料預留明細]') IS NULL
BEGIN
    CREATE TABLE [dbo].[物料預留明細] (
        [預留編號]   NVARCHAR(20) NOT NULL,
        [預留項次]   NVARCHAR(04) NOT NULL,
        [物料編號]   NVARCHAR(20) NOT NULL,
        [預留數量]   INT NOT NULL DEFAULT (0),
        [預定交期]   DATE NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_物料預留明細] PRIMARY KEY ([預留編號], [預留項次]),
        CONSTRAINT [FK_物料預留明細_主檔] FOREIGN KEY ([預留編號]) REFERENCES [dbo].[物料預留主檔]([預留編號]),
        CONSTRAINT [FK_物料預留明細_物料編號] FOREIGN KEY ([物料編號]) REFERENCES [dbo].[物料資料維護]([物料編號])
    );
END
GO

IF OBJECT_ID(N'[dbo].[庫存領用主檔]') IS NULL
BEGIN
    CREATE TABLE [dbo].[庫存領用主檔] (
        [領用編號]   NVARCHAR(20) NOT NULL,
        [領用日期]   DATE NOT NULL,
        [工廠代碼]   NVARCHAR(20) NOT NULL,
        [物管編號]   NVARCHAR(20) NOT NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_庫存領用主檔] PRIMARY KEY ([領用編號]),
        CONSTRAINT [FK_庫存領用主檔_工廠代碼] FOREIGN KEY ([工廠代碼]) REFERENCES [dbo].[工廠代碼維護]([工廠代碼]),
        CONSTRAINT [FK_庫存領用主檔_物管編號] FOREIGN KEY ([物管編號]) REFERENCES [dbo].[物管資料維護]([物管編號])
    );
END
GO

IF OBJECT_ID(N'[dbo].[庫存領用明細]') IS NULL
BEGIN
    CREATE TABLE [dbo].[庫存領用明細] (
        [領用編號]   NVARCHAR(20) NOT NULL,
        [領用項次]   NVARCHAR(04) NOT NULL,
        [物料編號]   NVARCHAR(20) NOT NULL,
        [倉庫代碼]   NVARCHAR(20) NOT NULL,
        [領用數量]   INT NOT NULL DEFAULT (0),
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_庫存領用明細] PRIMARY KEY ([領用編號], [領用項次]),
        CONSTRAINT [FK_庫存領用明細_主檔] FOREIGN KEY ([領用編號]) REFERENCES [dbo].[庫存領用主檔]([領用編號]),
        CONSTRAINT [FK_庫存領用明細_物料編號] FOREIGN KEY ([物料編號]) REFERENCES [dbo].[物料資料維護]([物料編號]),
        CONSTRAINT [FK_庫存領用明細_倉庫代碼] FOREIGN KEY ([倉庫代碼]) REFERENCES [dbo].[工廠倉庫維護]([倉庫代碼])
    );
END
GO

IF OBJECT_ID(N'[dbo].[庫存繳庫主檔]') IS NULL
BEGIN
    CREATE TABLE [dbo].[庫存繳庫主檔] (
        [繳庫編號]   NVARCHAR(20) NOT NULL,
        [繳庫日期]   DATE NOT NULL,
        [工廠代碼]   NVARCHAR(20) NOT NULL,
        [物管編號]   NVARCHAR(20) NOT NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_庫存繳庫主檔] PRIMARY KEY ([繳庫編號]),
        CONSTRAINT [FK_庫存繳庫主檔_工廠代碼] FOREIGN KEY ([工廠代碼]) REFERENCES [dbo].[工廠代碼維護]([工廠代碼]),
        CONSTRAINT [FK_庫存繳庫主檔_物管編號] FOREIGN KEY ([物管編號]) REFERENCES [dbo].[物管資料維護]([物管編號])
    );
END
GO

IF OBJECT_ID(N'[dbo].[庫存繳庫明細]') IS NULL
BEGIN
    CREATE TABLE [dbo].[庫存繳庫明細] (
        [繳庫編號]   NVARCHAR(20) NOT NULL,
        [繳庫項次]   NVARCHAR(04) NOT NULL,
        [物料編號]   NVARCHAR(20) NOT NULL,
        [倉庫代碼]   NVARCHAR(20) NOT NULL,
        [繳庫數量]   INT NOT NULL DEFAULT (0),
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_庫存繳庫明細] PRIMARY KEY ([繳庫編號], [繳庫項次]),
        CONSTRAINT [FK_庫存繳庫明細_主檔] FOREIGN KEY ([繳庫編號]) REFERENCES [dbo].[庫存繳庫主檔]([繳庫編號]),
        CONSTRAINT [FK_庫存繳庫明細_物料編號] FOREIGN KEY ([物料編號]) REFERENCES [dbo].[物料資料維護]([物料編號]),
        CONSTRAINT [FK_庫存繳庫明細_倉庫代碼] FOREIGN KEY ([倉庫代碼]) REFERENCES [dbo].[工廠倉庫維護]([倉庫代碼])
    );
END
GO
