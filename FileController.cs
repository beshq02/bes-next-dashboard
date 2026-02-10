using Microsoft.AspNetCore.Mvc;

namespace bes_week.Controllers
{
    public class FileController : BaseController
    {
        public IActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public IActionResult GetWkFile(int fileId)
        {
            if (Settings.UserID == null) return Unauthorized();

            DBFunc db = new DBFunc();

            var f = db.query<dynamic>("erp", @"
        SELECT file_id, nas_path, file_path, file_name, file_text
        FROM bes_wk_criticalpath_file
        WHERE file_id = :fileId
    ", new { fileId }).FirstOrDefault();

            if (f == null) return NotFound();

            // 若是文字（你 UI 用 FILE_TEXT），就不用讀檔
            if (!string.IsNullOrWhiteSpace((string?)f.FILE_TEXT))
                return Content((string)f.FILE_TEXT, "text/plain; charset=utf-8");

            var nasPath = ((string)f.NAS_PATH ?? "").Trim();
            var filePath = ((string)f.FILE_PATH ?? "").Trim().Replace('/', '\\').Trim('\\');
            var fileName = ((string)f.FILE_NAME ?? "").Trim();

            if (string.IsNullOrWhiteSpace(nasPath) || string.IsNullOrWhiteSpace(filePath) || string.IsNullOrWhiteSpace(fileName))
                return NotFound();

            // 重要：避免前台同時載入多張圖片時，因為每次都建立/釋放 NAS 連線而觸發 Win32 1219
            // 這裡只會針對 \\server\\share 建立一次連線並共用（細節在 NetworkCopier.EnsureConnected）
            var nc = new NetworkCopier(domain: null, userid: null, passwd: null, path: nasPath);
            nc.EnsureConnected(nasPath);

            var full = System.IO.Path.Combine(nasPath.TrimEnd('\\'), filePath, fileName);
            if (!System.IO.File.Exists(full)) return NotFound();

            var ext = System.IO.Path.GetExtension(full).ToLowerInvariant();
            var contentType = ext switch
            {
                ".pdf" => "application/pdf",
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".gif" => "image/gif",
                ".webp" => "image/webp",
                _ => "application/octet-stream"
            };

            // PDF/大檔建議開 Range，體感會差很多
            return PhysicalFile(full, contentType, enableRangeProcessing: true);
        }

    }
}
