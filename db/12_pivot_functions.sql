-- 樞紐分析：輸入年度，縱軸為客戶/廠商編號，橫軸為月份，統計欄位為數量(出貨+退回 或 收貨+退回)。
-- 全部在 SQL Server 端用參數化 Table-Valued Function 完成，前端只需傳年度、渲染結果。
USE [oav67];
GO

CREATE OR ALTER FUNCTION [dbo].[fn_訂單出退分析_樞紐] (@年度 INT)
RETURNS TABLE
AS
RETURN
(
    SELECT
        [客戶編號],
        SUM(CASE WHEN MONTH([單據日期]) = 1  THEN [數量] ELSE 0 END) AS [1月],
        SUM(CASE WHEN MONTH([單據日期]) = 2  THEN [數量] ELSE 0 END) AS [2月],
        SUM(CASE WHEN MONTH([單據日期]) = 3  THEN [數量] ELSE 0 END) AS [3月],
        SUM(CASE WHEN MONTH([單據日期]) = 4  THEN [數量] ELSE 0 END) AS [4月],
        SUM(CASE WHEN MONTH([單據日期]) = 5  THEN [數量] ELSE 0 END) AS [5月],
        SUM(CASE WHEN MONTH([單據日期]) = 6  THEN [數量] ELSE 0 END) AS [6月],
        SUM(CASE WHEN MONTH([單據日期]) = 7  THEN [數量] ELSE 0 END) AS [7月],
        SUM(CASE WHEN MONTH([單據日期]) = 8  THEN [數量] ELSE 0 END) AS [8月],
        SUM(CASE WHEN MONTH([單據日期]) = 9  THEN [數量] ELSE 0 END) AS [9月],
        SUM(CASE WHEN MONTH([單據日期]) = 10 THEN [數量] ELSE 0 END) AS [10月],
        SUM(CASE WHEN MONTH([單據日期]) = 11 THEN [數量] ELSE 0 END) AS [11月],
        SUM(CASE WHEN MONTH([單據日期]) = 12 THEN [數量] ELSE 0 END) AS [12月],
        SUM([數量]) AS [合計]
    FROM [dbo].[訂單出退分析]
    WHERE YEAR([單據日期]) = @年度
    GROUP BY [客戶編號]
);
GO

CREATE OR ALTER FUNCTION [dbo].[fn_採購收退分析_樞紐] (@年度 INT)
RETURNS TABLE
AS
RETURN
(
    SELECT
        [廠商編號],
        SUM(CASE WHEN MONTH([單據日期]) = 1  THEN [數量] ELSE 0 END) AS [1月],
        SUM(CASE WHEN MONTH([單據日期]) = 2  THEN [數量] ELSE 0 END) AS [2月],
        SUM(CASE WHEN MONTH([單據日期]) = 3  THEN [數量] ELSE 0 END) AS [3月],
        SUM(CASE WHEN MONTH([單據日期]) = 4  THEN [數量] ELSE 0 END) AS [4月],
        SUM(CASE WHEN MONTH([單據日期]) = 5  THEN [數量] ELSE 0 END) AS [5月],
        SUM(CASE WHEN MONTH([單據日期]) = 6  THEN [數量] ELSE 0 END) AS [6月],
        SUM(CASE WHEN MONTH([單據日期]) = 7  THEN [數量] ELSE 0 END) AS [7月],
        SUM(CASE WHEN MONTH([單據日期]) = 8  THEN [數量] ELSE 0 END) AS [8月],
        SUM(CASE WHEN MONTH([單據日期]) = 9  THEN [數量] ELSE 0 END) AS [9月],
        SUM(CASE WHEN MONTH([單據日期]) = 10 THEN [數量] ELSE 0 END) AS [10月],
        SUM(CASE WHEN MONTH([單據日期]) = 11 THEN [數量] ELSE 0 END) AS [11月],
        SUM(CASE WHEN MONTH([單據日期]) = 12 THEN [數量] ELSE 0 END) AS [12月],
        SUM([數量]) AS [合計]
    FROM [dbo].[採購收退分析]
    WHERE YEAR([單據日期]) = @年度
    GROUP BY [廠商編號]
);
GO
