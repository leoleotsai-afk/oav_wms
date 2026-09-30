-- 過帳累加觸發器：明細異動時，自動把數量累加回上游單據，
-- 前端完全不需自行計算「已出貨/已收貨/已領用」等數量。
USE [oav67];
GO

CREATE OR ALTER TRIGGER [dbo].[trg_訂單出貨明細_sync] ON [dbo].[訂單出貨明細]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    ;WITH affected AS (
        SELECT 訂單編號, 訂單項次 FROM inserted
        UNION
        SELECT 訂單編號, 訂單項次 FROM deleted
    )
    UPDATE d
        SET [出貨數量] = ISNULL((
            SELECT SUM(s.[出貨數量]) FROM [dbo].[訂單出貨明細] s
            WHERE s.[訂單編號] = d.[訂單編號] AND s.[訂單項次] = d.[訂單項次]
        ), 0)
    FROM [dbo].[客戶訂單明細] d
    INNER JOIN affected a ON a.[訂單編號] = d.[訂單編號] AND a.[訂單項次] = d.[訂單項次];
END
GO

CREATE OR ALTER TRIGGER [dbo].[trg_出貨退回明細_sync] ON [dbo].[出貨退回明細]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    ;WITH affected AS (
        SELECT 訂單編號, 訂單項次 FROM inserted
        UNION
        SELECT 訂單編號, 訂單項次 FROM deleted
    )
    UPDATE d
        SET [退回數量] = ISNULL((
            SELECT SUM(s.[退回數量]) FROM [dbo].[出貨退回明細] s
            WHERE s.[訂單編號] = d.[訂單編號] AND s.[訂單項次] = d.[訂單項次]
        ), 0)
    FROM [dbo].[客戶訂單明細] d
    INNER JOIN affected a ON a.[訂單編號] = d.[訂單編號] AND a.[訂單項次] = d.[訂單項次];
END
GO

CREATE OR ALTER TRIGGER [dbo].[trg_採購收貨明細_sync] ON [dbo].[採購收貨明細]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    ;WITH affected AS (
        SELECT 採購編號, 採購項次 FROM inserted
        UNION
        SELECT 採購編號, 採購項次 FROM deleted
    )
    UPDATE d
        SET [收貨數量] = ISNULL((
            SELECT SUM(s.[收貨數量]) FROM [dbo].[採購收貨明細] s
            WHERE s.[採購編號] = d.[採購編號] AND s.[採購項次] = d.[採購項次]
        ), 0)
    FROM [dbo].[廠商採購明細] d
    INNER JOIN affected a ON a.[採購編號] = d.[採購編號] AND a.[採購項次] = d.[採購項次];
END
GO

CREATE OR ALTER TRIGGER [dbo].[trg_收貨退回明細_sync] ON [dbo].[收貨退回明細]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    ;WITH affected AS (
        SELECT 採購編號, 採購項次 FROM inserted
        UNION
        SELECT 採購編號, 採購項次 FROM deleted
    )
    UPDATE d
        SET [退回數量] = ISNULL((
            SELECT SUM(s.[退回數量]) FROM [dbo].[收貨退回明細] s
            WHERE s.[採購編號] = d.[採購編號] AND s.[採購項次] = d.[採購項次]
        ), 0)
    FROM [dbo].[廠商採購明細] d
    INNER JOIN affected a ON a.[採購編號] = d.[採購編號] AND a.[採購項次] = d.[採購項次];
END
GO

CREATE OR ALTER TRIGGER [dbo].[trg_工單入庫明細_sync] ON [dbo].[工單入庫明細]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    ;WITH affected AS (
        SELECT 工單編號 FROM inserted
        UNION
        SELECT 工單編號 FROM deleted
    )
    UPDATE h
        SET [入庫數量] = ISNULL((
            SELECT SUM(s.[入庫數量]) FROM [dbo].[工單入庫明細] s
            WHERE s.[工單編號] = h.[工單編號]
        ), 0)
    FROM [dbo].[生產工單主檔] h
    INNER JOIN affected a ON a.[工單編號] = h.[工單編號];
END
GO

CREATE OR ALTER TRIGGER [dbo].[trg_工單領料明細_sync] ON [dbo].[工單領料明細]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    ;WITH affected AS (
        SELECT 工單編號, 物料編號 FROM inserted
        UNION
        SELECT 工單編號, 物料編號 FROM deleted
    )
    UPDATE d
        SET [已領用量] = ISNULL((
            SELECT SUM(s.[領料數量]) FROM [dbo].[工單領料明細] s
            WHERE s.[工單編號] = d.[工單編號] AND s.[物料編號] = d.[物料編號]
        ), 0)
    FROM [dbo].[生產工單明細] d
    INNER JOIN affected a ON a.[工單編號] = d.[工單編號] AND a.[物料編號] = d.[物料編號];
END
GO
