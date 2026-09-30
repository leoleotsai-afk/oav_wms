-- 數量欄位一律大於 0，由 SQL Server 擋下不合理輸入，前端不必自行檢查。
USE [oav67];
GO

DECLARE @defs TABLE ([table] NVARCHAR(64), [column] NVARCHAR(64), [name] NVARCHAR(128));
INSERT INTO @defs VALUES
    (N'客戶訂單明細', N'訂單數量', N'CK_客戶訂單明細_訂單數量'),
    (N'訂單出貨明細', N'出貨數量', N'CK_訂單出貨明細_出貨數量'),
    (N'出貨退回明細', N'退回數量', N'CK_出貨退回明細_退回數量'),
    (N'廠商採購明細', N'採購數量', N'CK_廠商採購明細_採購數量'),
    (N'採購收貨明細', N'收貨數量', N'CK_採購收貨明細_收貨數量'),
    (N'收貨退回明細', N'退回數量', N'CK_收貨退回明細_退回數量'),
    (N'物料預留明細', N'預留數量', N'CK_物料預留明細_預留數量'),
    (N'庫存領用明細', N'領用數量', N'CK_庫存領用明細_領用數量'),
    (N'庫存繳庫明細', N'繳庫數量', N'CK_庫存繳庫明細_繳庫數量'),
    (N'生產工單主檔', N'生產數量', N'CK_生產工單主檔_生產數量'),
    (N'生產工單明細', N'應領用量', N'CK_生產工單明細_應領用量'),
    (N'工單入庫明細', N'入庫數量', N'CK_工單入庫明細_入庫數量'),
    (N'工單領料明細', N'領料數量', N'CK_工單領料明細_領料數量'),
    (N'用量清單維護', N'標準用量', N'CK_用量清單維護_標準用量');

DECLARE @t NVARCHAR(64), @c NVARCHAR(64), @n NVARCHAR(128), @sql NVARCHAR(MAX);
DECLARE cur CURSOR LOCAL FAST_FORWARD FOR SELECT [table], [column], [name] FROM @defs;
OPEN cur;
FETCH NEXT FROM cur INTO @t, @c, @n;
WHILE @@FETCH_STATUS = 0
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = @n)
    BEGIN
        SET @sql = N'ALTER TABLE [dbo].[' + @t + N'] ADD CONSTRAINT [' + @n + N'] CHECK ([' + @c + N'] > 0);';
        EXEC sp_executesql @sql;
    END
    FETCH NEXT FROM cur INTO @t, @c, @n;
END
CLOSE cur;
DEALLOCATE cur;
GO
