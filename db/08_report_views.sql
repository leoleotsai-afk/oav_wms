-- SD / MM 報表輸出：視圖
USE [oav67];
GO

CREATE OR ALTER VIEW [dbo].[已訂未出明細] AS
    SELECT *
    FROM [dbo].[客戶訂單明細]
    WHERE [訂單數量] - [出貨數量] + [退回數量] > 0;
GO

-- 含單據日期/客戶編號(join 主檔)，供樞紐分析依年度/客戶彙總使用
CREATE OR ALTER VIEW [dbo].[訂單出退分析] AS
    SELECT
        N'出貨' AS [單據類別],
        d.[出貨編號] AS [單據編號],
        d.[出貨項次] AS [單據項次],
        h.[出貨日期] AS [單據日期],
        h.[客戶編號],
        d.[訂單編號],
        d.[訂單項次],
        d.[物料編號],
        d.[倉庫代碼],
        d.[出貨數量] AS [數量],
        d.[備註說明]
    FROM [dbo].[訂單出貨明細] d
    INNER JOIN [dbo].[訂單出貨主檔] h ON h.[出貨編號] = d.[出貨編號]
    UNION ALL
    SELECT
        N'退回' AS [單據類別],
        d.[退回編號] AS [單據編號],
        d.[退回項次] AS [單據項次],
        h.[退回日期] AS [單據日期],
        h.[客戶編號],
        d.[訂單編號],
        d.[訂單項次],
        d.[物料編號],
        d.[倉庫代碼],
        d.[退回數量] AS [數量],
        d.[備註說明]
    FROM [dbo].[出貨退回明細] d
    INNER JOIN [dbo].[出貨退回主檔] h ON h.[退回編號] = d.[退回編號];
GO

CREATE OR ALTER VIEW [dbo].[已採未交明細] AS
    SELECT *
    FROM [dbo].[廠商採購明細]
    WHERE [採購數量] - [收貨數量] + [退回數量] > 0;
GO

-- 含單據日期/廠商編號(join 主檔)，供樞紐分析依年度/廠商彙總使用
CREATE OR ALTER VIEW [dbo].[採購收退分析] AS
    SELECT
        N'收貨' AS [單據類別],
        d.[收貨編號] AS [單據編號],
        d.[收貨項次] AS [單據項次],
        h.[收貨日期] AS [單據日期],
        h.[廠商編號],
        d.[採購編號],
        d.[採購項次],
        d.[物料編號],
        d.[倉庫代碼],
        d.[收貨數量] AS [數量],
        d.[備註說明]
    FROM [dbo].[採購收貨明細] d
    INNER JOIN [dbo].[採購收貨主檔] h ON h.[收貨編號] = d.[收貨編號]
    UNION ALL
    SELECT
        N'退回' AS [單據類別],
        d.[退回編號] AS [單據編號],
        d.[退回項次] AS [單據項次],
        h.[退回日期] AS [單據日期],
        h.[廠商編號],
        d.[採購編號],
        d.[採購項次],
        d.[物料編號],
        d.[倉庫代碼],
        d.[退回數量] AS [數量],
        d.[備註說明]
    FROM [dbo].[收貨退回明細] d
    INNER JOIN [dbo].[收貨退回主檔] h ON h.[退回編號] = d.[退回編號];
GO
