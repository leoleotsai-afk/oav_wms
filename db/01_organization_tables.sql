-- 組織架構資料表
USE [oav67];
GO

IF OBJECT_ID(N'[dbo].[銷售組織維護]') IS NULL
BEGIN
    CREATE TABLE [dbo].[銷售組織維護] (
        [銷售組織]   NVARCHAR(20) NOT NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_銷售組織維護] PRIMARY KEY ([銷售組織])
    );
END
GO

IF OBJECT_ID(N'[dbo].[採購組織維護]') IS NULL
BEGIN
    CREATE TABLE [dbo].[採購組織維護] (
        [採購組織]   NVARCHAR(20) NOT NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_採購組織維護] PRIMARY KEY ([採購組織])
    );
END
GO

IF OBJECT_ID(N'[dbo].[工廠代碼維護]') IS NULL
BEGIN
    CREATE TABLE [dbo].[工廠代碼維護] (
        [工廠代碼]   NVARCHAR(20) NOT NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_工廠代碼維護] PRIMARY KEY ([工廠代碼])
    );
END
GO

-- 倉庫代碼須為唯一值(跨工廠不重複)
IF OBJECT_ID(N'[dbo].[工廠倉庫維護]') IS NULL
BEGIN
    CREATE TABLE [dbo].[工廠倉庫維護] (
        [工廠代碼]   NVARCHAR(20) NOT NULL,
        [倉庫代碼]   NVARCHAR(20) NOT NULL,
        [備註說明]   NVARCHAR(20) NULL,
        CONSTRAINT [PK_工廠倉庫維護] PRIMARY KEY ([倉庫代碼]),
        CONSTRAINT [FK_工廠倉庫維護_工廠代碼] FOREIGN KEY ([工廠代碼])
            REFERENCES [dbo].[工廠代碼維護]([工廠代碼])
    );
END
GO
