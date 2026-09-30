-- PP生產模組 - 交易數據
USE [oav67];
GO

IF OBJECT_ID(N'[dbo].[生產工單主檔]') IS NULL
BEGIN
    CREATE TABLE [dbo].[生產工單主檔] (
        [工單編號]   NVARCHAR(20) NOT NULL,
        [工單日期]   DATE NOT NULL,
        [工廠代碼]   NVARCHAR(20) NOT NULL,
        [預定完工]   DATE NULL,
        [生產數量]   INT NOT NULL DEFAULT (0),
        [入庫數量]   INT NOT NULL DEFAULT (0),
        [物管編號]   NVARCHAR(20) NOT NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_生產工單主檔] PRIMARY KEY ([工單編號]),
        CONSTRAINT [FK_生產工單主檔_工廠代碼] FOREIGN KEY ([工廠代碼]) REFERENCES [dbo].[工廠代碼維護]([工廠代碼]),
        CONSTRAINT [FK_生產工單主檔_物管編號] FOREIGN KEY ([物管編號]) REFERENCES [dbo].[物管資料維護]([物管編號])
    );
END
GO

-- 加上 (工單編號,物料編號) 唯一鍵，供領料依「工單+物料」歸戶累加已領用量
IF OBJECT_ID(N'[dbo].[生產工單明細]') IS NULL
BEGIN
    CREATE TABLE [dbo].[生產工單明細] (
        [工單編號]   NVARCHAR(20) NOT NULL,
        [工單項次]   NVARCHAR(04) NOT NULL,
        [物料編號]   NVARCHAR(20) NOT NULL,
        [應領用量]   INT NOT NULL DEFAULT (0),
        [已領用量]   INT NOT NULL DEFAULT (0),
        [預定領料]   DATE NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_生產工單明細] PRIMARY KEY ([工單編號], [工單項次]),
        CONSTRAINT [UQ_生產工單明細_工單物料] UNIQUE ([工單編號], [物料編號]),
        CONSTRAINT [FK_生產工單明細_主檔] FOREIGN KEY ([工單編號]) REFERENCES [dbo].[生產工單主檔]([工單編號]),
        CONSTRAINT [FK_生產工單明細_物料編號] FOREIGN KEY ([物料編號]) REFERENCES [dbo].[物料資料維護]([物料編號])
    );
END
GO

IF OBJECT_ID(N'[dbo].[工單入庫主檔]') IS NULL
BEGIN
    CREATE TABLE [dbo].[工單入庫主檔] (
        [入庫編號]   NVARCHAR(20) NOT NULL,
        [入庫日期]   DATE NOT NULL,
        [工廠代碼]   NVARCHAR(20) NOT NULL,
        [物管編號]   NVARCHAR(20) NOT NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_工單入庫主檔] PRIMARY KEY ([入庫編號]),
        CONSTRAINT [FK_工單入庫主檔_工廠代碼] FOREIGN KEY ([工廠代碼]) REFERENCES [dbo].[工廠代碼維護]([工廠代碼]),
        CONSTRAINT [FK_工單入庫主檔_物管編號] FOREIGN KEY ([物管編號]) REFERENCES [dbo].[物管資料維護]([物管編號])
    );
END
GO

IF OBJECT_ID(N'[dbo].[工單入庫明細]') IS NULL
BEGIN
    CREATE TABLE [dbo].[工單入庫明細] (
        [入庫編號]   NVARCHAR(20) NOT NULL,
        [入庫項次]   NVARCHAR(04) NOT NULL,
        [工單編號]   NVARCHAR(20) NOT NULL,
        [物料編號]   NVARCHAR(20) NOT NULL,
        [倉庫代碼]   NVARCHAR(20) NOT NULL,
        [入庫數量]   INT NOT NULL DEFAULT (0),
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_工單入庫明細] PRIMARY KEY ([入庫編號], [入庫項次]),
        CONSTRAINT [FK_工單入庫明細_主檔] FOREIGN KEY ([入庫編號]) REFERENCES [dbo].[工單入庫主檔]([入庫編號]),
        CONSTRAINT [FK_工單入庫明細_工單編號] FOREIGN KEY ([工單編號]) REFERENCES [dbo].[生產工單主檔]([工單編號]),
        CONSTRAINT [FK_工單入庫明細_物料編號] FOREIGN KEY ([物料編號]) REFERENCES [dbo].[物料資料維護]([物料編號]),
        CONSTRAINT [FK_工單入庫明細_倉庫代碼] FOREIGN KEY ([倉庫代碼]) REFERENCES [dbo].[工廠倉庫維護]([倉庫代碼])
    );
END
GO

IF OBJECT_ID(N'[dbo].[工單領料主檔]') IS NULL
BEGIN
    CREATE TABLE [dbo].[工單領料主檔] (
        [領料編號]   NVARCHAR(20) NOT NULL,
        [領料日期]   DATE NOT NULL,
        [工廠代碼]   NVARCHAR(20) NOT NULL,
        [物管編號]   NVARCHAR(20) NOT NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_工單領料主檔] PRIMARY KEY ([領料編號]),
        CONSTRAINT [FK_工單領料主檔_工廠代碼] FOREIGN KEY ([工廠代碼]) REFERENCES [dbo].[工廠代碼維護]([工廠代碼]),
        CONSTRAINT [FK_工單領料主檔_物管編號] FOREIGN KEY ([物管編號]) REFERENCES [dbo].[物管資料維護]([物管編號])
    );
END
GO

IF OBJECT_ID(N'[dbo].[工單領料明細]') IS NULL
BEGIN
    CREATE TABLE [dbo].[工單領料明細] (
        [領料編號]   NVARCHAR(20) NOT NULL,
        [領料項次]   NVARCHAR(04) NOT NULL,
        [工單編號]   NVARCHAR(20) NOT NULL,
        [物料編號]   NVARCHAR(20) NOT NULL,
        [倉庫代碼]   NVARCHAR(20) NOT NULL,
        [領料數量]   INT NOT NULL DEFAULT (0),
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_工單領料明細] PRIMARY KEY ([領料編號], [領料項次]),
        CONSTRAINT [FK_工單領料明細_主檔] FOREIGN KEY ([領料編號]) REFERENCES [dbo].[工單領料主檔]([領料編號]),
        CONSTRAINT [FK_工單領料明細_工單物料] FOREIGN KEY ([工單編號], [物料編號]) REFERENCES [dbo].[生產工單明細]([工單編號], [物料編號]),
        CONSTRAINT [FK_工單領料明細_倉庫代碼] FOREIGN KEY ([倉庫代碼]) REFERENCES [dbo].[工廠倉庫維護]([倉庫代碼])
    );
END
GO
