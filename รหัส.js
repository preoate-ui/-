/**
 * ระบบเว็บแอปสำหรับลางาน (Leave Management System)
 * พัฒนาด้วย Google Apps Script และ Google Sheets
 */

// โหลดหน้าจอหลัก
function doGet(e) {
  // ดำเนินการตรวจสอบและสร้างฐานข้อมูลโดยอัตโนมัติหากหน้าเว็บถูกเข้าถึง
  try {
    initDatabase();
  } catch (err) {
    Logger.log("Error initializing database: " + err.toString());
  }

  // หากมีการกดอนุมัติ/ปฏิเสธผ่านลิงก์อีเมล (e.parameter.action มีอยู่)
  if (e.parameter.action && e.parameter.id) {
    return handleEmailAction(e);
  }

  var template = HtmlService.createTemplateFromFile('Index');
  
  // กำหนดระดับความปลอดภัยในการแสดงผล (รองรับ Mobile 100%)
  return template.evaluate()
    .setTitle('ระบบเว็บแอปสำหรับลางาน | Leave Management System')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, shrink-to-fit=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ฟังก์ชันสำหรับดำเนินการเมื่อหัวหน้างานคลิกลิงก์จากในอีเมล
function handleEmailAction(e) {
  var action = e.parameter.action;
  var id = e.parameter.id;
  var approver = e.parameter.approver ? decodeURIComponent(e.parameter.approver) : "";
  
  var htmlOutput = HtmlService.createHtmlOutput();
  htmlOutput.addMetaTag('viewport', 'width=device-width, initial-scale=1, shrink-to-fit=no');
  
  // สไตล์ CSS ธีมสีส้ม-เทารองรับโทรศัพท์มือถือ สำหรับหน้าจอยืนยันผ่านเมล
  var style = `
    <style>
      body {
        font-family: 'Sarabun', sans-serif;
        background-color: #f5f7fa;
        color: #37474f;
        margin: 0;
        padding: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 90vh;
      }
      .container {
        background-color: #ffffff;
        border-radius: 16px;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
        padding: 30px;
        max-width: 460px;
        width: 100%;
        text-align: center;
        border-top: 6px solid #e65100;
        border-bottom: 1px solid rgba(0,0,0,0.05);
      }
      h2 {
        color: #e65100;
        margin-top: 0;
        font-size: 20px;
      }
      p {
        font-size: 14px;
        line-height: 1.6;
        color: #546e7a;
        margin-bottom: 20px;
      }
      .btn {
        display: inline-block;
        padding: 10px 24px;
        border-radius: 8px;
        font-weight: bold;
        text-decoration: none;
        cursor: pointer;
        border: none;
        font-size: 14px;
        transition: all 0.2s;
        box-sizing: border-box;
      }
      .btn-primary {
        background-color: #e65100;
        color: white;
      }
      .btn-primary:hover {
        background-color: #f57c00;
      }
      .btn-secondary {
        background-color: #eceff1;
        color: #37474f;
      }
      .btn-secondary:hover {
        background-color: #cfd8dc;
      }
      .btn-danger {
        background-color: #c62828;
        color: white;
      }
      .btn-danger:hover {
        background-color: #b71c1c;
      }
      textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid #cfd8dc;
        border-radius: 8px;
        font-family: 'Sarabun', sans-serif;
        height: 100px;
        margin-bottom: 15px;
        resize: none;
        outline: none;
        box-sizing: border-box;
        font-size: 14px;
      }
      textarea:focus {
        border-color: #e65100;
        box-shadow: 0 0 0 3px #ffe0b2;
      }
      .success-icon {
        font-size: 54px;
        margin-bottom: 15px;
      }
      .error-icon {
        font-size: 54px;
        margin-bottom: 15px;
      }
    </style>
  `;

  if (action === 'approve') {
    try {
      // ดำเนินการอนุมัติใบลา
      approveOrRejectRequest(approver, id, 'Approved', 'อนุมัติทันทีผ่านลิงก์อีเมล');
      
      htmlOutput.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
          ${style}
        </head>
        <body>
          <div class="container">
            <div class="success-icon">🟢</div>
            <h2>อนุมัติใบลาสำเร็จแล้ว</h2>
            <p>ระบบได้ทำการบันทึกสถานะการอนุมัติสำหรับใบลาเลขที่ <strong>${id}</strong> เรียบร้อยแล้ว พร้อมส่งอีเมลแจ้งผลให้กับครูผู้ยื่นใบลาโดยอัตโนมัติ</p>
            <p style="font-size: 11px; color: #90a4ae;">ดำเนินการโดยผู้อนุมัติ: ${approver}</p>
            <button class="btn btn-secondary" onclick="window.close(); alert('คุณสามารถปิดหน้าต่างนี้ได้แล้ว');">ปิดหน้าจอนี้</button>
          </div>
        </body>
        </html>
      `);
      return htmlOutput;
    } catch (err) {
      htmlOutput.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
          ${style}
        </head>
        <body>
          <div class="container" style="border-top-color: #c62828;">
            <div class="error-icon">❌</div>
            <h2 style="color: #c62828;">เกิดข้อผิดพลาด</h2>
            <p>ไม่สามารถอนุมัติการลาได้เนื่องจาก: <br><strong style="color: #c62828;">${err.toString()}</strong></p>
            <button class="btn btn-secondary" onclick="window.close();">ปิดหน้าจอนี้</button>
          </div>
        </body>
        </html>
      `);
      return htmlOutput;
    }
  } else if (action === 'reject') {
    // โหลดหน้าฟอร์มกรอกคำชี้แจง / เหตุผลปฏิเสธ
    var webAppUrl = "";
    try {
      webAppUrl = ScriptApp.getService().getUrl();
    } catch(err) {}
    
    htmlOutput.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
        ${style}
      </head>
      <body>
        <div class="container" style="border-top-color: #c62828;">
          <div class="success-icon">🚫</div>
          <h2 style="color: #c62828;">ระบุเหตุผลการปฏิเสธ</h2>
          <p>กรุณาระบุความคิดเห็นหรือเหตุผลที่ไม่สามารถอนุมัติใบลาเลขที่ <strong>${id}</strong> ได้ เพื่อส่งอีเมลชี้แจงกลับไปให้พนักงาน</p>
          <form action="${webAppUrl}" method="get">
            <input type="hidden" name="action" value="confirm_reject">
            <input type="hidden" name="id" value="${id}">
            <input type="hidden" name="approver" value="${encodeURIComponent(approver)}">
            <textarea name="comment" placeholder="พิมพ์เหตุผลส่งกลับ เช่น ติดภารกิจด่วน หรือกรุณามาพูดคุยรายละเอียดที่ห้องแผนก..." required></textarea>
            <button type="submit" class="btn btn-danger" style="width: 100%;">❌ ยืนยันปฏิเสธคำขอลา</button>
          </form>
        </div>
      </body>
      </html>
    `);
    return htmlOutput;
  } else if (action === 'confirm_reject') {
    var comment = e.parameter.comment ? decodeURIComponent(e.parameter.comment) : "ปฏิเสธผ่านลิงก์อีเมล";
    try {
      // ดำเนินการปฏิเสธใบลา
      approveOrRejectRequest(approver, id, 'Rejected', comment);
      
      htmlOutput.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
          ${style}
        </head>
        <body>
          <div class="container" style="border-top-color: #c62828;">
            <div class="success-icon">🔴</div>
            <h2 style="color: #c62828;">ปฏิเสธใบลาเรียบร้อยแล้ว</h2>
            <p>ระบบได้บันทึกการปฏิเสธใบลาเลขที่ <strong>${id}</strong> เรียบร้อยแล้ว พร้อมส่งเหตุผลชี้แจงกลับไปยังอีเมลครูผู้ขอลา</p>
            <p style="font-size: 13px; color: #78909c; font-style: italic;">เหตุผล: "${comment}"</p>
            <button class="btn btn-secondary" onclick="window.close();">ปิดหน้าจอนี้</button>
          </div>
        </body>
        </html>
      `);
      return htmlOutput;
    } catch (err) {
      htmlOutput.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
          ${style}
        </head>
        <body>
          <div class="container" style="border-top-color: #c62828;">
            <div class="error-icon">❌</div>
            <h2 style="color: #c62828;">เกิดข้อผิดพลาด</h2>
            <p>ไม่สามารถปฏิเสธการลาได้เนื่องจาก: <br><strong style="color: #c62828;">${err.toString()}</strong></p>
            <button class="btn btn-secondary" onclick="window.close();">ปิดหน้าจอนี้</button>
          </div>
        </body>
        </html>
      `);
      return htmlOutput;
    }
  }
}

// ฟังก์ชันดึงไฟล์สเปรดชีต
function getSpreadsheet() {
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    return active;
  }
  
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SPREADSHEET_ID');
  if (id) {
    try {
      return SpreadsheetApp.openById(id);
    } catch (e) {
      props.deleteProperty('SPREADSHEET_ID');
    }
  }
  
  // หากเป็นสแตนด์อโลนและยังไม่มีสเปรดชีต ให้สร้างใหม่
  var newSS = SpreadsheetApp.create('ระบบลางานวิทยาลัย (Leave Management System)');
  props.setProperty('SPREADSHEET_ID', newSS.getId());
  return newSS;
}

// ฟังก์ชันสร้างชีตฐานข้อมูล (เฉพาะโครงสร้างตารางและหัวข้อคอลัมน์ โดยไม่แทรกข้อมูลจำลองใดๆ)
function initDatabase() {
  var ss = getSpreadsheet();
  
  // 1. ตารางข้อมูลบุคลากร (Employees) - 10 คอลัมน์
  
  // 2. ตารางข้อมูลบุคลากร (Employees) - 10 คอลัมน์
  var sheetEmployees = ss.getSheetByName('Employees');
  if (!sheetEmployees) {
    sheetEmployees = ss.insertSheet('Employees');
    var headers = ['username', 'emp_id', 'prefix', 'first_name', 'last_name', 'department', 'position', 'emp_type', 'password', 'line_user_id'];
    sheetEmployees.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  } else if (sheetEmployees.getLastColumn() > 0) {
    // อัปเดตหัวตารางคอลัมน์แรกให้เป็น username หากยังเป็น email
    var col1Val = sheetEmployees.getRange(1, 1).getValue().toString().trim();
    if (col1Val === 'email' || col1Val === '') {
      sheetEmployees.getRange(1, 1).setValue('username').setFontWeight('bold');
    }
    // ตรวจสอบและลบคอลัมน์ approver_email ออกจากแผ่นงาน Employees อัตโนมัติ
    var empHeaders = sheetEmployees.getRange(1, 1, 1, sheetEmployees.getLastColumn()).getValues()[0];
    var approverIdx = empHeaders.indexOf('approver_email');
    if (approverIdx !== -1) {
      sheetEmployees.deleteColumn(approverIdx + 1);
    }
  }
  
  // 3. ตารางการขออนุมัติลา (Leave_Requests)
  var sheetRequests = ss.getSheetByName('Leave_Requests');
  if (!sheetRequests) {
    sheetRequests = ss.insertSheet('Leave_Requests');
    var headers = [
      'request_id', 'timestamp', 'email', 'leave_type', 'start_date', 'end_date', 
      'total_days', 'reason', 'contact_address', 'attachment_url', 'status', 'approver_comment'
    ];
    sheetRequests.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  }
  
  // 4. ตารางสิทธิ์วันลาคงเหลือประจำปี (Leave_Balances)
  var sheetBalances = ss.getSheetByName('Leave_Balances');
  if (!sheetBalances) {
    sheetBalances = ss.insertSheet('Leave_Balances');
    var headers = [
      'fiscal_year', 'email', 
      'prefix', 'first_name', 'last_name', 'department', 'position',
      'sick_leave_used', 'personal_leave_used', 'vacation_leave_used'
    ];
    sheetBalances.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  }
  
  // 5. ตารางหัวหน้าแผนก/ฝ่าย (Department_Heads)
  var sheetDeptHeads = ss.getSheetByName('Department_Heads');
  if (!sheetDeptHeads) {
    sheetDeptHeads = ss.insertSheet('Department_Heads');
    var headers = ['department', 'head_email', 'head_name', 'line_user_id'];
    sheetDeptHeads.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  } else {
    // อัปเดตหัวตารางคอลัมน์ที่ 4 เป็น line_user_id หากยังไม่มี
    if (sheetDeptHeads.getLastColumn() < 4 || sheetDeptHeads.getRange(1, 4).getValue().toString().trim() === "") {
      sheetDeptHeads.getRange(1, 4).setValue('line_user_id').setFontWeight('bold');
    }
  }

  // ลบชีตดีฟอลต์ (Sheet1) ออกหากมี
  var sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1) {
    try {
      ss.deleteSheet(sheet1);
    } catch(e) {}
  }
  
  // ซิงก์ข้อมูลหัวหน้าแผนกที่มีอยู่ใน Employees ลงแผ่นงาน Department_Heads อัตโนมัติ
  try { syncAllDepartmentHeads(); } catch(e) {}

  // ตรวจสอบและตัดรอบปีงบประมาณอัตโนมัติ
  checkAndAutoResetFiscalYear();
  
  // อัปเดตสูตรการคำนวณวันลาใน Leave_Balances ให้อัตโนมัติ
  try { syncLeaveBalanceFormulas(); } catch(e) {}
}

// ฟังก์ชันซิงก์อัปเดตสูตรวันลาอื่นๆ (ไม่ใช่ลาป่วยและลากิจ) ลงชีต Leave_Balances ทั้งหมด
function syncLeaveBalanceFormulas() {
  try {
    var ss = getSpreadsheet();
    var sheetBal = ss.getSheetByName('Leave_Balances');
    if (!sheetBal || sheetBal.getLastRow() <= 1) return;
    
    var data = sheetBal.getDataRange().getValues();
    var headers = data[0].map(function(h) { return h ? h.toString().trim() : ""; });
    
    var idxVacationUsed = headers.indexOf('vacation_leave_used');
    if (idxVacationUsed === -1) idxVacationUsed = headers.length >= 13 ? 12 : 9;
    
    for (var i = 1; i < data.length; i++) {
      var rowIdx = i + 1;
      var newFormula = '=SUMIFS(Leave_Requests!G:G, Leave_Requests!C:C, B' + rowIdx + ', Leave_Requests!D:D, "<>ลาป่วย", Leave_Requests!D:D, "<>ลากิจส่วนตัว", Leave_Requests!K:K, "Approved")';
      sheetBal.getRange(rowIdx, idxVacationUsed + 1).setFormula(newFormula);
    }
  } catch (err) {
    Logger.log("Error syncing leave balance formulas: " + err.toString());
  }
}

// -------------------------------------------------------------
// ระบบลงทะเบียน และเข้าสู่ระบบ (AUTH APIS)
// -------------------------------------------------------------

// ฟังก์ชันเข้าสู่ระบบ ตรวจสอบ Username และ Password ใน Google Sheets
function loginUser(username, password) {
  if (!username || !password) {
    return { success: false, message: "กรุณากรอก Username และ Password ให้ครบถ้วน" };
  }
  
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Employees');
  var data = sheet.getDataRange().getValues();
  
  var searchUser = username.toString().toLowerCase().trim();
  var searchPass = password.toString().trim();
  
  for (var i = 1; i < data.length; i++) {
    var sheetUsername = data[i][0] ? data[i][0].toString().toLowerCase().trim() : ""; // คอลัมน์ A (username)
    var sheetEmpId = data[i][1] ? data[i][1].toString().toLowerCase().trim() : ""; // คอลัมน์ B (emp_id)
    var sheetPassword = data[i][8] ? data[i][8].toString().trim() : ""; // คอลัมน์ I (password)
    
    // ตรวจสอบทั้งการกรอก Username (คอลัมน์ A) หรือ รหัสประจำตัวครู (คอลัมน์ B) คู่กับ Password (คอลัมน์ I)
    if ((sheetUsername === searchUser || (sheetEmpId && sheetEmpId === searchUser)) && sheetPassword === searchPass) {
      var userRole = getUserRole(data[i][0]);
      userRole.success = true;
      return userRole;
    }
  }
  
  return { success: false, message: "Username หรือ Password ไม่ถูกต้อง" };
}

// ฟังก์ชันลงทะเบียนบุคลากรใหม่ บันทึกลงตารางชีต และสร้างสิทธิ์ลาสะสมทันที
function registerUser(empData) {
  var username = empData.username ? empData.username.toString().trim() : (empData.national_id ? empData.national_id.toString().trim() : "");
  var password = empData.password ? empData.password.toString().trim() : "";
  
  if (!username || !password || !empData.first_name || !empData.last_name) {
    return { success: false, message: "กรุณากรอกข้อมูลส่วนตัว Username และ Password ให้ครบถ้วน" };
  }
  
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Employees');
  var data = sheet.getDataRange().getValues();
  
  // ตรวจสอบ Username ซ้ำในตารางพนักงาน (คอลัมน์ A)
  for (var i = 1; i < data.length; i++) {
    var sheetUser = data[i][0] ? data[i][0].toString().toLowerCase().trim() : "";
    if (sheetUser === username.toLowerCase()) {
      return { success: false, message: "Username \"" + username + "\" นี้ได้รับการลงทะเบียนในระบบแล้ว กรุณาใช้ Username อื่น" };
    }
  }
  
  var empId = empData.emp_id ? empData.emp_id.trim() : "";
  
  // บันทึกข้อมูลพนักงาน (10 คอลัมน์)
  var newRow = [
    username, // คอลัมน์ A (username)
    empId, // คอลัมน์ B (emp_id)
    empData.prefix,
    empData.first_name.trim(),
    empData.last_name.trim(),
    empData.department,
    empData.position,
    empData.emp_type,
    password, // คอลัมน์ I (password)
    "" // คอลัมน์ J (line_user_id)
  ];
  
  sheet.appendRow(newRow);
  
  // หากตำแหน่งเป็นหัวหน้า ให้ซิงก์ข้อมูลไปแผ่นงาน Department_Heads อัตโนมัติ
  if (empData.position && empData.position.indexOf('หัวหน้า') !== -1) {
    var fullName = (empData.prefix || "") + empData.first_name.trim() + " " + empData.last_name.trim();
    syncDepartmentHeadSheet(empData.department, username, fullName);
  }
  
  // สร้างยอดสิทธิ์วันลาคงเหลือประจำปีงบประมาณ 2569
  try {
    generateEmployeeBalance(username, empData.emp_type, '2569');
  } catch (err) {
    Logger.log("Failed to seed balances for new registered user: " + err.toString());
  }
  
  return { success: true, message: "ลงทะเบียนสำเร็จ เรียบร้อยแล้ว" };
}

// -------------------------------------------------------------
// ระบบจัดการดึงข้อมูลและดำเนินการตามบทบาท (ROLE BASED APIS)
// -------------------------------------------------------------

// ดึงข้อมูลบทบาทและสิทธิ์ของพนักงานตามอีเมลที่ล็อกอิน
function getUserRole(email) {
  if (!email) {
    return {
      email: "",
      exists: false,
      role: "Guest",
      isAdmin: false,
      isApprover: false,
      message: "ไม่ระบุเซสชันการล็อกอิน"
    };
  }
  
  // แปลงเป็น string ป้องกัน TypeError จากกรณีที่อ่านได้เป็นค่าตัวเลข (เช่น เลขประจำตัวประชาชน)
  email = email.toString().trim();
  
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Employees');
  var data = sheet.getDataRange().getValues();
  
  // ค้นหาอีเมลในพนักงาน
  var user = null;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString().toLowerCase().trim() === email.toLowerCase()) {
      user = {
        email: data[i][0].toString(),
        emp_id: data[i][1] ? data[i][1].toString() : "",
        prefix: data[i][2] ? data[i][2].toString() : "",
        first_name: data[i][3] ? data[i][3].toString() : "",
        last_name: data[i][4] ? data[i][4].toString() : "",
        department: data[i][5] ? data[i][5].toString() : "",
        position: data[i][6] ? data[i][6].toString() : "",
        emp_type: data[i][7] ? data[i][7].toString() : "",
        approver_email: getApproverEmailByDepartment(data[i][5] ? data[i][5].toString() : "", data[i][8] ? data[i][8].toString() : ""),
        exists: true
      };
      break;
    }
  }
  
  if (!user) {
    return {
      email: email,
      exists: false,
      role: "Guest",
      isAdmin: false,
      isApprover: false,
      message: "ไม่พบข้อมูลพนักงานสำหรับอีเมล: " + email + " กรุณาติดต่อฝ่ายบุคลากรเพื่อลงทะเบียน"
    };
  }
  
  // ตรวจสอบว่าเป็นผู้บริหาร/ผู้อนุมัติหรือไม่ (โดยค้นหาว่ามีพนักงานคนอื่นที่มีเราเป็นหัวหน้างาน หรือแผนกชี้มาหาเราใน Department_Heads)
  var isApprover = false;
  var highPositions = ['รองผู้อำนวยการ', 'ผู้อำนวยการ', 'หัวหน้าแผนก', 'หัวหน้างาน'];
  if (highPositions.indexOf(user.position) !== -1) {
    isApprover = true;
  } else {
    // ตรวจสอบข้อมูลผู้อนุมัติจากตารางพนักงานแบบเดิม
    for (var i = 1; i < data.length; i++) {
      if (data[i][8] && data[i][8].toString().toLowerCase().trim() === email.toLowerCase().trim()) {
        isApprover = true;
        break;
      }
    }
    // ตรวจสอบข้อมูลเพิ่มเติมจากตารางหัวหน้าฝ่ายใหม่ (Department_Heads)
    if (!isApprover) {
      var sheetDH = ss.getSheetByName('Department_Heads');
      if (sheetDH) {
        var dhData = sheetDH.getDataRange().getValues();
        for (var k = 1; k < dhData.length; k++) {
          if (dhData[k][1] && dhData[k][1].toString().toLowerCase().trim() === email.toLowerCase().trim()) {
            isApprover = true;
            break;
          }
        }
      }
    }
  }
  
  // ตรวจสอบความเป็น Admin (ให้เฉพาะตำแหน่งเหล่านี้สามารถเข้าถึง Admin ได้: หัวหน้าแผนก, หัวหน้างาน, รองผู้อำนวยการ, ผู้อำนวยการ หรือ ฝ่ายงานบุคลากร)
  var isAdmin = false;
  var pos = user.position ? user.position.toString().trim() : "";
  var dept = user.department ? user.department.toString().trim() : "";
  
  var adminPositions = ['หัวหน้าแผนก', 'หัวหน้างาน', 'รองผู้อำนวยการ', 'ผู้อำนวยการ'];
  
  if (
    adminPositions.indexOf(pos) !== -1 ||
    pos.indexOf('หัวหน้า') !== -1 ||
    pos.indexOf('รองผู้อำนวยการ') !== -1 ||
    pos.indexOf('ผู้อำนวยการ') !== -1 ||
    pos.indexOf('เจ้าหน้าที่งานบุคลากร') !== -1 ||
    dept === 'งานบุคลากร' ||
    dept.indexOf('บุคลากร') !== -1 ||
    dept.indexOf('ทรัพยากรบุคคล') !== -1 ||
    (data[1] && data[1][0] && data[1][0].toString().toLowerCase().trim() === email.toLowerCase())
  ) {
    isAdmin = true;
  }
  
  user.isAdmin = isAdmin;
  user.isApprover = isApprover;
  user.role = isAdmin ? "HR Admin" : (isApprover ? "Approver" : "บุคลากรทั่วไป");
  user.sheetUrl = ss.getUrl(); // ส่งลิงก์สเปรดชีตให้แอดมินเข้าไปดูได้สะดวก
  
  return user;
}

// ฟังก์ชันบันทึก/อัปเดตหัวหน้าแผนกลงตาราง Department_Heads อัตโนมัติ (พร้อม LINE User ID)
function syncDepartmentHeadSheet(department, headEmail, headName, lineUserId) {
  if (!department || !headEmail) return;
  var ss = getSpreadsheet();
  var sheetDH = ss.getSheetByName('Department_Heads');
  if (!sheetDH) {
    sheetDH = ss.insertSheet('Department_Heads');
    var headers = ['department', 'head_email', 'head_name', 'line_user_id'];
    sheetDH.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  } else {
    // บังคับให้ช่อง D1 เป็น line_user_id หากยังว่างอยู่
    if (sheetDH.getRange(1, 4).getValue().toString().trim() === "") {
      sheetDH.getRange(1, 4).setValue('line_user_id').setFontWeight('bold');
    }
  }
  
  // หากไม่ได้ส่ง lineUserId เข้ามา ให้ลองค้นจาก Employees
  if (!lineUserId) {
    lineUserId = getUserLineId(headEmail);
  }
  
  var dhData = sheetDH.getDataRange().getValues();
  var deptFoundRow = -1;
  var targetDept = department.toString().trim().toLowerCase();
  
  for (var d = 1; d < dhData.length; d++) {
    var dName = dhData[d][0] ? dhData[d][0].toString().trim().toLowerCase() : "";
    if (dName === targetDept) {
      deptFoundRow = d + 1;
      break;
    }
  }
  
  if (deptFoundRow !== -1) {
    sheetDH.getRange(deptFoundRow, 2).setValue(headEmail.toString().trim());
    sheetDH.getRange(deptFoundRow, 3).setValue(headName);
    if (lineUserId) {
      sheetDH.getRange(deptFoundRow, 4).setValue(lineUserId.toString().trim());
    }
  } else {
    sheetDH.appendRow([department.toString().trim(), headEmail.toString().trim(), headName, lineUserId ? lineUserId.toString().trim() : ""]);
  }
}

// ฟังก์ชันกวาดซิงก์ข้อมูลหัวหน้าแผนกทั้งหมดจาก Employees ลง Department_Heads
function syncAllDepartmentHeads() {
  var ss = getSpreadsheet();
  var sheetEmp = ss.getSheetByName('Employees');
  if (!sheetEmp) return;
  var data = sheetEmp.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var pos = data[i][6] ? data[i][6].toString() : "";
    var dept = data[i][5] ? data[i][5].toString() : "";
    var id = data[i][0] ? data[i][0].toString() : "";
    var prefix = data[i][2] ? data[i][2].toString() : "";
    var fname = data[i][3] ? data[i][3].toString() : "";
    var lname = data[i][4] ? data[i][4].toString() : "";
    var fullName = (prefix + fname + " " + lname).trim();
    var lineId = data[i][9] ? data[i][9].toString().trim() : "";
    
    if (pos.indexOf('หัวหน้า') !== -1 && dept && id) {
      syncDepartmentHeadSheet(dept, id, fullName, lineId);
    }
  }
}

// ค้นหาอีเมลหัวหน้าแผนก/ฝ่ายจากตารางใหม่
function getApproverEmailByDepartment(department, defaultApproverEmail) {
  if (!department) return defaultApproverEmail || "";
  
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Department_Heads');
    if (!sheet) return defaultApproverEmail || "";
    
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().toLowerCase().trim() === department.toLowerCase().trim()) {
        var headEmail = data[i][1] ? data[i][1].toString().trim() : "";
        if (headEmail) return headEmail;
      }
    }
  } catch(err) {
    Logger.log("Error in getApproverEmailByDepartment: " + err.toString());
  }
  
  return defaultApproverEmail || "";
}

// ดึงข้อมูลแดชบอร์ดของบุคลากร (สิทธิ์คงเหลือ และประวัติการลา)
function getDashboardData(email) {
  if (!email) return null;
  email = email.toString().trim();
  var user = getUserRole(email);
  if (!user.exists) return null;
  
  var ss = getSpreadsheet();
  
  // ดึงยอดสิทธิ์คงเหลือปีปัจจุบัน (2569 เป็นหลักก่อน หรือปีล่าสุดที่มี)
  var sheetBal = ss.getSheetByName('Leave_Balances');
  var balData = sheetBal.getDataRange().getValues();
  var balance = {
    fiscal_year: '2569',
    sick_total: 0, sick_used: 0, sick_remain: 0,
    personal_total: 0, personal_used: 0, personal_remain: 0,
    vacation_total: 0, vacation_used: 0, vacation_remain: 0
  };
  
  for (var i = 1; i < balData.length; i++) {
    var balEmail = balData[i][1] ? balData[i][1].toString().toLowerCase().trim() : "";
    if (balEmail === user.email.toLowerCase().trim()) {
      balance.fiscal_year = balData[i][0];
      balance.sick_total = Number(balData[i][2]) || 0;
      balance.sick_used = Number(balData[i][3]) || 0; // อ่านค่าตัวเลขจากสูตร
      balance.sick_remain = balance.sick_total - balance.sick_used;
      
      balance.personal_total = Number(balData[i][4]) || 0;
      balance.personal_used = Number(balData[i][5]) || 0;
      balance.personal_remain = balance.personal_total - balance.personal_used;
      
      balance.vacation_total = Number(balData[i][6]) || 0;
      balance.vacation_used = Number(balData[i][7]) || 0;
      balance.vacation_remain = balance.vacation_total - balance.vacation_used;
      break;
    }
  }
  
  // ดึงประวัติการลาของตนเอง
  var sheetReq = ss.getSheetByName('Leave_Requests');
  var reqData = sheetReq.getDataRange().getValues();
  var history = [];
  
  for (var i = reqData.length - 1; i >= 1; i--) { // ดึงย้อนหลัง (ใหม่ล่าสุดขึ้นก่อน)
    var reqEmail = reqData[i][2] ? reqData[i][2].toString().toLowerCase().trim() : "";
    if (reqEmail === user.email.toLowerCase().trim()) {
      history.push({
        request_id: reqData[i][0] ? reqData[i][0].toString() : "",
        timestamp: formatDateTimeSafe(reqData[i][1]),
        leave_type: reqData[i][3] ? reqData[i][3].toString() : "",
        start_date: formatDateTimeSafe(reqData[i][4]),
        end_date: formatDateTimeSafe(reqData[i][5]),
        total_days: Number(reqData[i][6]) || 0,
        reason: reqData[i][7] ? reqData[i][7].toString() : "",
        contact_address: reqData[i][8] ? reqData[i][8].toString() : "",
        attachment_url: reqData[i][9] ? reqData[i][9].toString() : "",
        status: reqData[i][10] ? reqData[i][10].toString() : "",
        approver_comment: reqData[i][11] ? reqData[i][11].toString() : ""
      });
    }
  }
  
  return {
    user: user,
    balance: balance,
    history: history
  };
}

// ยื่นคำขออนุมัติลางาน
function submitLeaveRequest(email, data) {
  if (!email) throw new Error("ไม่ระบุข้อมูลผู้ลา");
  email = email.toString().trim();
  var user = getUserRole(email);
  if (!user.exists) throw new Error("ไม่พบข้อมูลผู้ลาในระบบ");
  
  var ss = getSpreadsheet();
  var sheetReq = ss.getSheetByName('Leave_Requests');
  
  // 1. จัดการอัปโหลดไฟล์แนบไปยัง Google Drive (ถ้ามี)
  var attachmentUrl = "";
  if (data.file_base64 && data.file_name) {
    try {
      attachmentUrl = uploadFileToDrive(data.file_base64, data.file_name, data.file_type);
    } catch (err) {
      Logger.log("File upload failed: " + err.toString());
      // ดำเนินการลาต่อแต่จะไม่มีไฟล์แนบ
    }
  }
  
  // 2. สร้าง Request ID อัตโนมัติ (เช่น LV-2026-0004)
  var reqRows = sheetReq.getDataRange().getValues();
  var nextNum = 1;
  var currentYearStr = new Date().getFullYear().toString();
  
  if (reqRows.length > 1) {
    var lastId = reqRows[reqRows.length - 1][0].toString();
    if (lastId.indexOf("LV-") === 0) {
      var parts = lastId.split("-");
      if (parts.length === 3 && parts[1] === currentYearStr) {
        nextNum = parseInt(parts[2], 10) + 1;
      }
    }
  }
  
  var padNum = ("0000" + nextNum).slice(-4);
  var requestId = "LV-" + currentYearStr + "-" + padNum;
  
  // 3. เตรียมบันทึกข้อมูล
  var timestamp = Utilities.formatDate(new Date(), "Asia/Bangkok", "dd/MM/yyyy HH:mm:ss");
  var rowData = [
    requestId,
    timestamp,
    user.email,
    data.leave_type,
    data.start_date,
    data.end_date,
    Number(data.total_days),
    data.reason,
    data.contact_address,
    attachmentUrl,
    "Pending Dept", // เริ่มต้นที่ด่าน 1 (หัวหน้าแผนกวิชา)
    "" // ความเห็นหัวหน้างาน
  ];
  
  sheetReq.appendRow(rowData);
  
  // 4. ส่งข้อความแจ้งเตือนผ่าน LINE Bot ด่าน 1 (หัวหน้าแผนกวิชา) (มี try-catch ป้องกันค้าง)
  try {
    var deptHeadEmail = user.approver_email;
    var deptHeadLineId = getUserLineId(deptHeadEmail);
    if (!deptHeadLineId) {
      deptHeadLineId = getDepartmentHeadLineId(user.department);
    }
    if (deptHeadLineId) {
      sendLineLeaveFlexMessage('dept', deptHeadLineId, rowData, "ยินยอม");
    } else {
      Logger.log("Warning: Department Head LINE ID not found for department: " + user.department);
    }
  } catch (lineErr) {
    Logger.log("LINE notification failed on submission (bypassed): " + lineErr.toString());
  }
  
  return { success: true, requestId: requestId };
}

// อัปโหลดไฟล์ไปยัง Google Drive
function uploadFileToDrive(base64Data, fileName, mimeType) {
  var folderName = "ระบบลางาน - ไฟล์แนบ";
  var folders = DriveApp.getFoldersByName(folderName);
  var folder;
  
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(folderName);
  }
  
  // ถอดรหัส Base64
  var contentParts = base64Data.split(",");
  var actualData = contentParts.length > 1 ? contentParts[1] : contentParts[0];
  var decodedBytes = Utilities.base64Decode(actualData);
  var blob = Utilities.newBlob(decodedBytes, mimeType, fileName);
  
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  return file.getUrl();
}

// ส่งอีเมลแจ้งการลาใหม่ไปยังผู้อนุมัติ พร้อมปุ่มอนุมัติ/ปฏิเสธทันที
function sendLeaveNotificationEmail(employee, leaveRow) {
  var requestId = leaveRow[0];
  var leaveType = leaveRow[3];
  var startDate = formatDateThai(leaveRow[4]);
  var endDate = formatDateThai(leaveRow[5]);
  var totalDays = leaveRow[6];
  var reason = leaveRow[7];
  
  var approverEmail = employee.approver_email;
  var employeeName = employee.prefix + employee.first_name + " " + employee.last_name;
  
  // ค้นหา URL ของ Web App เพื่อนำมาใช้สร้างลิงก์สำหรับคลิกในอีเมล
  var webAppUrl = "";
  var actionButtonsHtml = "";
  try {
    webAppUrl = ScriptApp.getService().getUrl();
  } catch (err) {
    Logger.log("Script is not deployed as Web App yet: " + err.toString());
  }
  
  if (webAppUrl) {
    var approveUrl = webAppUrl + "?action=approve&id=" + requestId + "&approver=" + encodeURIComponent(approverEmail);
    var rejectUrl = webAppUrl + "?action=reject&id=" + requestId + "&approver=" + encodeURIComponent(approverEmail);
    
    actionButtonsHtml = `
      <div style="margin-top: 25px; text-align: center; padding: 15px 0;">
        <p style="font-size: 13.5px; font-weight: bold; color: #455a64; margin-bottom: 15px;">👉 คุณสามารถเลือกอนุมัติหรือปฏิเสธคำขอการลาได้โดยตรงผ่านปุ่มด้านล่าง:</p>
        <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
          <tr>
            <td align="center" style="border-radius: 6px; background-color: #2e7d32; padding: 10px 20px;">
              <a href="${approveUrl}" target="_blank" style="font-size: 14px; font-family: 'Sarabun', Arial, sans-serif; color: #ffffff; text-decoration: none; font-weight: bold; display: inline-block;">
                🟢 อนุมัติคำขอลาทันที
              </a>
            </td>
            <td width="20"></td>
            <td align="center" style="border-radius: 6px; background-color: #c62828; padding: 10px 20px;">
              <a href="${rejectUrl}" target="_blank" style="font-size: 14px; font-family: 'Sarabun', Arial, sans-serif; color: #ffffff; text-decoration: none; font-weight: bold; display: inline-block;">
                🔴 ปฏิเสธการลา
              </a>
            </td>
          </tr>
        </table>
      </div>
    `;
  } else {
    actionButtonsHtml = `
      <div style="margin-top: 25px; padding: 15px; border: 1px dashed #ffa726; background-color: #fff8e1; text-align: center; border-radius: 6px;">
        <p style="margin: 0; font-size: 13px; color: #e65100;">⚠️ ลิงก์อนุมัติผ่านอีเมลจะเปิดใช้งานได้สมบูรณ์หลังจากผู้ดูแลระบบทำการ Deploy โครงการเป็น Web App บนเซิร์ฟเวอร์ Apps Script แล้วเท่านั้น</p>
      </div>
    `;
  }
  
  var subject = "[ใบลาใหม่] " + leaveType + " - " + employeeName + " (" + totalDays + " วัน)";
  
  // เทมเพลตอีเมลสวยงามส้ม-เทา
  var htmlBody = `
    <div style="font-family: 'Sarabun', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #ff6f00; padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0; font-size: 22px;">ระบบขออนุมัติลางานออนไลน์</h2>
        <p style="margin: 5px 0 0 0; font-size: 14px;">วิทยาลัยเทคนิคประจวบคีรีขันธ์</p>
      </div>
      <div style="padding: 24px; background-color: #fcfcfc; color: #333333; line-height: 1.6;">
        <h3 style="margin-top: 0; color: #333333; border-bottom: 2px solid #ff6f00; padding-bottom: 8px;">ข้อมูลคำขอลา</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; width: 35%; color: #666;">รหัสใบลา:</td>
            <td style="padding: 6px 0;">${requestId}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #666;">ผู้ลางาน:</td>
            <td style="padding: 6px 0;">${employeeName} (${employee.department})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #666;">ประเภทการลา:</td>
            <td style="padding: 6px 0;"><span style="background-color: #ffe0b2; color: #e65100; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${leaveType}</span></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #666;">วันเวลาที่ลา:</td>
            <td style="padding: 6px 0;">วันที่ ${startDate} ถึง ${endDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #666;">จำนวนวันลา:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #ff6f00;">${totalDays} วัน</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #666;">เหตุผลการลา:</td>
            <td style="padding: 6px 0;">${reason}</td>
          </tr>
        </table>
        
        ${actionButtonsHtml}
        
      </div>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #e0e0e0;">
        อีเมลฉบับนี้เป็นการแจ้งเตือนอัตโนมัติจากระบบเว็บแอปสำหรับลางาน วิทยาลัยเทคนิคประจวบคีรีขันธ์
      </div>
    </div>
  `;
  
  try {
    MailApp.sendEmail({
      to: approverEmail,
      subject: subject,
      htmlBody: htmlBody
    });
  } catch (err) {
    Logger.log("Failed to send notification email: " + err.toString());
  }
}

function getApproverData(email) {
  if (!email) return { pending: [], completed: [] };
  email = email.toString().trim();
  var user = getUserRole(email);
  if (!user.isApprover) return { pending: [], completed: [] };
  
  var ss = getSpreadsheet();
  var sheetReq = ss.getSheetByName('Leave_Requests');
  var reqData = sheetReq.getDataRange().getValues();
  
  var sheetEmp = ss.getSheetByName('Employees');
  var empData = sheetEmp.getDataRange().getValues();
  
  // ค้นหารายชื่อ/แผนกของแต่ละอีเมลเพื่อนำมาโชว์ประกอบ
  var empMap = {};
  for (var i = 1; i < empData.length; i++) {
    var emailKey = empData[i][0].toString().toLowerCase().trim();
    empMap[emailKey] = {
      name: empData[i][2] + empData[i][3] + " " + empData[i][4],
      department: empData[i][5],
      position: empData[i][6],
      emp_type: empData[i][7],
      approver_email: getApproverEmailByDepartment(empData[i][5], empData[i][8])
    };
  }
  
  var pending = [];
  var completed = [];
  
  for (var i = reqData.length - 1; i >= 1; i--) {
    var reqEmail = reqData[i][2].toString().toLowerCase().trim();
    var empInfo = empMap[reqEmail] || { name: reqEmail, department: "-", position: "-", emp_type: "-", approver_email: "" };
    
    // เงื่อนไขในการดึง: 
    // 1. หัวหน้าโดยตรง (approver_email ตรงกับอีเมลเรา)
    // 2. ถ้าผู้อนุมัติเป็น รองผู้อำนวยการ/ผู้อำนวยการ สามารถดูข้อมูลและเข้าถึงได้ทั้งหมด
    var isDirectApprover = empInfo.approver_email.toLowerCase().trim() === user.email.toLowerCase().trim();
    var isHighExecutive = (user.position === 'ผู้อำนวยการ' || user.position === 'รองผู้อำนวยการ');
    
    if (isDirectApprover || isHighExecutive) {
      var item = {
        request_id: reqData[i][0],
        timestamp: reqData[i][1],
        email: reqData[i][2],
        employee_name: empInfo.name,
        department: empInfo.department,
        position: empInfo.position,
        emp_type: empInfo.emp_type,
        leave_type: reqData[i][3],
        start_date: reqData[i][4],
        end_date: reqData[i][5],
        total_days: reqData[i][6],
        reason: reqData[i][7],
        contact_address: reqData[i][8],
        attachment_url: reqData[i][9],
        status: reqData[i][10],
        approver_comment: reqData[i][11]
      };
      
      if (reqData[i][10] && reqData[i][10].toString().indexOf('Pending') === 0) {
        pending.push(item);
      } else {
        completed.push(item);
      }
    }
  }
  
  return {
    pending: pending,
    completed: completed
  };
}

// อนุมัติหรือปฏิเสธคำขอการลา ผ่านระบบเว็บแอป
function approveOrRejectRequest(approverEmail, requestId, action, comment) {
  if (!approverEmail) throw new Error("ไม่ระบุเซสชันการอนุมัติ");
  approverEmail = approverEmail.toString().trim();
  
  var user = getUserRole(approverEmail);
  if (!user.isApprover) throw new Error("คุณไม่มีสิทธิ์ในการอนุมัติใบลา");
  
  var ss = getSpreadsheet();
  var sheetReq = ss.getSheetByName('Leave_Requests');
  var reqData = sheetReq.getDataRange().getValues();
  
  var foundRow = -1;
  var requestItem = null;
  
  for (var i = 1; i < reqData.length; i++) {
    if (reqData[i][0].toString() === requestId) {
      foundRow = i + 1;
      requestItem = reqData[i];
      break;
    }
  }
  
  if (foundRow === -1) {
    throw new Error("ไม่พบรายการใบลาที่ระบุ");
  }
  
  var currentStatus = requestItem[10];
  var teacherEmail = requestItem[2];
  var leaveType = requestItem[3];
  var totalDays = requestItem[6];
  
  var teacherUser = getUserRole(teacherEmail);
  var teacherLineId = getUserLineId(teacherEmail);
  
  // ตรวจสอบสิทธิ์ว่าผู้อนุมัติคนนี้สามารถอนุมัติตามสถานะปัจจุบันได้หรือไม่
  var isAuthorized = false;
  if (currentStatus === "Pending Dept") {
    // ต้องเป็นหัวหน้าแผนกโดยตรง (approver_email)
    isAuthorized = (teacherUser.approver_email.toLowerCase().trim() === user.email.toLowerCase().trim());
  } else if (currentStatus === "Pending HR") {
    // ต้องเป็นเจ้าหน้าที่หรือหัวหน้างานฝ่ายบุคลากร
    isAuthorized = (user.department === 'งานบุคลากร' || user.position === 'เจ้าหน้าที่งานบุคลากร' || user.isAdmin);
  } else if (currentStatus === "Pending Deputy") {
    // ต้องเป็นรองผู้อำนวยการ
    isAuthorized = (user.position === 'รองผู้อำนวยการ');
  } else if (currentStatus === "Pending Director") {
    // ต้องเป็นผู้อำนวยการ
    isAuthorized = (user.position === 'ผู้อำนวยการ');
  }
  
  // ถ้าเป็นผู้อำนวยการ สามารถเซ็นอนุมัติผ่านได้ทุกสถานะเพื่อความยืดหยุ่นทางธุรกิจ (Override)
  if (user.position === 'ผู้อำนวยการ') {
    isAuthorized = true;
  }
  
  if (!isAuthorized) {
    throw new Error("คุณไม่มีสิทธิ์ในการพิจารณาใบลาในขั้นตอนนี้ (สถานะปัจจุบัน: " + translateStatusThai(currentStatus) + ")");
  }
  
  if (action === 'Rejected' || action === 'reject') {
    // ปฏิเสธการลา
    var commentText = comment || "ปฏิเสธผ่านเว็บแอป";
    sheetReq.getRange(foundRow, 11).setValue("Rejected");
    sheetReq.getRange(foundRow, 12).setValue(commentText);
    
    // แจ้งเตือนผู้ลาทาง LINE
    var notifyMsg = "❌ คำขอลา " + leaveType + " (" + totalDays + " วัน) เลขที่ " + requestId + " ของคุณไม่ได้รับการอนุมัติ\nหมายเหตุ: " + commentText;
    if (teacherLineId) {
      sendLinePushMessage('dept', teacherLineId, { type: 'text', text: notifyMsg });
    }
    
    return { success: true };
  } else {
    // ยินยอม / อนุมัติ
    if (currentStatus === "Pending Dept") {
      // ผ่านด่าน 1 -> ด่าน 2 (HR)
      sheetReq.getRange(foundRow, 11).setValue("Pending HR");
      sheetReq.getRange(foundRow, 12).setValue("ยินยอมโดยหัวหน้าแผนกวิชา");
      
      var hrLineId = PropertiesService.getScriptProperties().getProperty('LINE_USER_ID_HR');
      if (hrLineId) {
        var updatedItem = sheetReq.getRange(foundRow, 1, 1, sheetReq.getLastColumn()).getValues()[0];
        sendLineLeaveFlexMessage('hr', hrLineId, updatedItem, "ยินยอม");
      }
      
    } else if (currentStatus === "Pending HR") {
      // ผ่านด่าน 2 -> ด่าน 3 (รองผู้อำนวยการ)
      sheetReq.getRange(foundRow, 11).setValue("Pending Deputy");
      sheetReq.getRange(foundRow, 12).setValue("ยินยอมโดยหัวหน้าฝ่ายบุคลากร");
      
      var deputyLineId = PropertiesService.getScriptProperties().getProperty('LINE_USER_ID_DEPUTY');
      if (deputyLineId) {
        var updatedItem = sheetReq.getRange(foundRow, 1, 1, sheetReq.getLastColumn()).getValues()[0];
        sendLineLeaveFlexMessage('deputy', deputyLineId, updatedItem, "ยินยอม");
      }
      
    } else if (currentStatus === "Pending Deputy") {
      // ผ่านด่าน 3 -> ด่าน 4 (ผู้อำนวยการ)
      sheetReq.getRange(foundRow, 11).setValue("Pending Director");
      sheetReq.getRange(foundRow, 12).setValue("ยินยอมโดยรองผู้อำนวยการ");
      
      var directorLineId = PropertiesService.getScriptProperties().getProperty('LINE_USER_ID_DIRECTOR');
      if (directorLineId) {
        var updatedItem = sheetReq.getRange(foundRow, 1, 1, sheetReq.getLastColumn()).getValues()[0];
        sendLineLeaveFlexMessage('director', directorLineId, updatedItem, "อนุมัติ");
      }
      
    } else if (currentStatus === "Pending Director") {
      // ผ่านด่าน 4 -> อนุมัติสมบูรณ์
      sheetReq.getRange(foundRow, 11).setValue("Approved");
      sheetReq.getRange(foundRow, 12).setValue("ยินยอมโดยผู้อำนวยการแล้ว");
      
      var approveMsg = "🎉 ยินดีด้วย! คำขอลา " + leaveType + " (" + totalDays + " วัน) เลขที่ " + requestId + " ของคุณได้รับการอนุมัติเสร็จสมบูรณ์เรียบร้อยแล้ว!";
      if (teacherLineId) {
        sendLinePushMessage('director', teacherLineId, { type: 'text', text: approveMsg });
      }
    }
    
    return { success: true };
  }
}

function getAdminData(adminEmail) {
  if (!adminEmail) throw new Error("ไม่ระบุข้อมูลผู้ดูแลระบบ");
  adminEmail = adminEmail.toString().trim();
  var user = getUserRole(adminEmail);
  if (!user.isAdmin) throw new Error("สิทธิ์ไม่เพียงพอในการเข้าถึงข้อมูลผู้ดูแลระบบ");
  
  var ss = getSpreadsheet();
  
  // กวาดลบประวัติคำขอลาและสิทธิ์ของพนักงานที่เคยถูกลบไปแล้วออกอัตโนมัติ
  try { cleanupOrphanedLeaveData(); } catch(e) {}
  
  // 1. ดึงข้อมูลพนักงานทั้งหมด
  var sheetEmp = ss.getSheetByName('Employees');
  var empData = sheetEmp.getDataRange().getValues();
  var employees = [];
  for (var i = 1; i < empData.length; i++) {
    employees.push({
      email: empData[i][0] ? empData[i][0].toString() : "",
      emp_id: empData[i][1] ? empData[i][1].toString() : "",
      prefix: empData[i][2] ? empData[i][2].toString() : "",
      first_name: empData[i][3] ? empData[i][3].toString() : "",
      last_name: empData[i][4] ? empData[i][4].toString() : "",
      department: empData[i][5] ? empData[i][5].toString() : "",
      position: empData[i][6] ? empData[i][6].toString() : "",
      emp_type: empData[i][7] ? empData[i][7].toString() : "",
      approver_email: getApproverEmailByDepartment(empData[i][5] ? empData[i][5].toString() : ""),
      password: empData[i][8] ? empData[i][8].toString() : "",
      line_user_id: empData[i][9] ? empData[i][9].toString() : ""
    });
  }
  
  // 2. ดึงสิทธิ์วันลาคงเหลือทั้งหมดของแต่ละคน
  var sheetBal = ss.getSheetByName('Leave_Balances');
  var balances = [];
  if (sheetBal && sheetBal.getLastRow() > 1) {
    var balData = sheetBal.getDataRange().getValues();
    var headers = balData[0].map(function(h) { return h ? h.toString().trim() : ""; });
    
    var idxSickUsed = headers.indexOf('sick_leave_used');
    var idxPersonalUsed = headers.indexOf('personal_leave_used');
    var idxVacationUsed = headers.indexOf('vacation_leave_used');
    
    if (idxSickUsed === -1) idxSickUsed = headers.length >= 13 ? 8 : 7;
    if (idxPersonalUsed === -1) idxPersonalUsed = headers.length >= 13 ? 10 : 8;
    if (idxVacationUsed === -1) idxVacationUsed = headers.length >= 13 ? 12 : 9;
    
    for (var i = 1; i < balData.length; i++) {
      balances.push({
        fiscal_year: balData[i][0] ? balData[i][0].toString() : "",
        email: balData[i][1] ? balData[i][1].toString() : "",
        prefix: balData[i][2] ? balData[i][2].toString() : "",
        first_name: balData[i][3] ? balData[i][3].toString() : "",
        last_name: balData[i][4] ? balData[i][4].toString() : "",
        department: balData[i][5] ? balData[i][5].toString() : "",
        position: balData[i][6] ? balData[i][6].toString() : "",
        sick_total: 0,
        sick_used: typeof balData[i][idxSickUsed] === 'object' ? 0 : (Number(balData[i][idxSickUsed]) || 0),
        personal_total: 0,
        personal_used: typeof balData[i][idxPersonalUsed] === 'object' ? 0 : (Number(balData[i][idxPersonalUsed]) || 0),
        vacation_total: 0,
        vacation_used: typeof balData[i][idxVacationUsed] === 'object' ? 0 : (Number(balData[i][idxVacationUsed]) || 0)
      });
    }
  }
  
  // 3. ดึงนโยบายค่าเริ่มต้น (ถ้ามีชีต)
  var sheetPol = ss.getSheetByName('Leave_Policies');
  var policies = [];
  if (sheetPol) {
    var polData = sheetPol.getDataRange().getValues();
    for (var i = 1; i < polData.length; i++) {
      policies.push({
        emp_type: polData[i][0] ? polData[i][0].toString() : "",
        default_sick: Number(polData[i][1]) || 0,
        default_personal: Number(polData[i][2]) || 0,
        default_vacation: Number(polData[i][3]) || 0
      });
    }
  }
  
  // 4. ดึงข้อมูลคำขอลาทั้งหมดในระบบ
  var sheetReq = ss.getSheetByName('Leave_Requests');
  var reqData = sheetReq.getDataRange().getValues();
  var allRequests = [];
  for (var i = 1; i < reqData.length; i++) {
    allRequests.push({
      request_id: reqData[i][0] ? reqData[i][0].toString() : "",
      timestamp: formatDateTimeSafe(reqData[i][1]),
      email: reqData[i][2] ? reqData[i][2].toString() : "",
      leave_type: reqData[i][3] ? reqData[i][3].toString() : "",
      start_date: formatDateTimeSafe(reqData[i][4]),
      end_date: formatDateTimeSafe(reqData[i][5]),
      total_days: Number(reqData[i][6]) || 0,
      reason: reqData[i][7] ? reqData[i][7].toString() : "",
      contact_address: reqData[i][8] ? reqData[i][8].toString() : "",
      attachment_url: reqData[i][9] ? reqData[i][9].toString() : "",
      status: reqData[i][10] ? reqData[i][10].toString() : "",
      approver_comment: reqData[i][11] ? reqData[i][11].toString() : ""
    });
  }
  
  return {
    employees: employees,
    balances: balances,
    policies: policies,
    allRequests: allRequests
  };
}

// อัปเดตหรือเพิ่มข้อมูลบุคลากรโดยแอดมิน (HR Admin)
function updateEmployee(adminEmail, empData) {
  var user = getUserRole(adminEmail);
  if (!user.isAdmin) throw new Error("ไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้");
  
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Employees');
  var data = sheet.getDataRange().getValues();
  var foundRow = -1;
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString().toLowerCase().trim() === empData.email.toLowerCase().trim()) {
      foundRow = i + 1;
      break;
    }
  }
  
  // รักษารหัสผ่านเดิมหากไม่มีการป้อนรหัสผ่านใหม่เข้ามา
  var password = empData.password ? empData.password.toString().trim() : "";
  if (foundRow !== -1 && !password) {
    password = data[foundRow - 1][8] ? data[foundRow - 1][8].toString().trim() : "123456";
  }
  if (!password) password = "123456";
  
  var newRow = [
    empData.email.trim(),
    empData.emp_id.trim(),
    empData.prefix,
    empData.first_name.trim(),
    empData.last_name.trim(),
    empData.department,
    empData.position,
    empData.emp_type,
    password,
    empData.line_user_id ? empData.line_user_id.trim() : ""
  ];
  
  if (foundRow !== -1) {
    sheet.getRange(foundRow, 1, 1, newRow.length).setValues([newRow]);
    
    // อัปเดตข้อมูลรายละเอียดส่วนตัวใน Leave_Balances ด้วย
    try {
      var sheetBal = ss.getSheetByName('Leave_Balances');
      var balData = sheetBal.getDataRange().getValues();
      for (var j = 1; j < balData.length; j++) {
        if (balData[j][1] && balData[j][1].toString().toLowerCase().trim() === empData.email.toLowerCase().trim()) {
          // คอลัมน์ C ถึง G (index 2 ถึง 6) คือ prefix, first_name, last_name, department, position
          sheetBal.getRange(j + 1, 3, 1, 5).setValues([[
            empData.prefix,
            empData.first_name.trim(),
            empData.last_name.trim(),
            empData.department,
            empData.position
          ]]);
        }
      }
    } catch(err) {
      Logger.log("Failed to update user details in Leave_Balances: " + err.toString());
    }
  } else {
    sheet.appendRow(newRow);
    
    // เป็นพนักงานใหม่ ให้แอดสิทธิ์วันลาตามนโยบายทันที (สำหรับปีปัจจุบัน 2569)
    generateEmployeeBalance(empData.email.trim(), empData.emp_type, '2569');
  }
  
  // หากตำแหน่งเป็นหัวหน้า ให้ซิงก์ข้อมูลไปแผ่นงาน Department_Heads อัตโนมัติ
  if (empData.position && empData.position.indexOf('หัวหน้า') !== -1) {
    var fullName = (empData.prefix || "") + empData.first_name.trim() + " " + empData.last_name.trim();
    syncDepartmentHeadSheet(empData.department, empData.email.trim(), fullName);
  }
  
  return { success: true };
}

// ลบข้อมูลพนักงานและประวัติสิทธิ์การลา/ประวัติใบลาทั้งหมดที่เกี่ยวข้อง
function deleteEmployee(adminEmail, email) {
  var user = getUserRole(adminEmail);
  if (!user.isAdmin) throw new Error("ไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้");
  
  var targetId = email.toString().toLowerCase().trim();
  var ss = getSpreadsheet();
  
  // 1. ลบข้อมูลในชีตพนักงาน (Employees)
  var sheetEmp = ss.getSheetByName('Employees');
  if (sheetEmp) {
    var dataEmp = sheetEmp.getDataRange().getValues();
    for (var i = dataEmp.length - 1; i >= 1; i--) {
      var id = dataEmp[i][0] ? dataEmp[i][0].toString().toLowerCase().trim() : "";
      if (id === targetId) {
        sheetEmp.deleteRow(i + 1);
      }
    }
  }
  
  // 2. เรียกกวาดลบข้อมูลประวัติการลาและสิทธิ์คงเหลือของพนักงานคนนี้
  cleanupOrphanedLeaveData();
  
  return { success: true };
}

// ฟังก์ชันกวาดลบประวัติการลาและสิทธิ์คงเหลือของพนักงานที่ถูกลบออกจากระบบ (Auto Cleanup Orphaned Data)
function cleanupOrphanedLeaveData() {
  var ss = getSpreadsheet();
  
  // 1. รวบรวมรายชื่อ/เลขบัตรประชาชนพนักงานที่มีอยู่จริงในตาราง Employees
  var sheetEmp = ss.getSheetByName('Employees');
  if (!sheetEmp) return;
  var dataEmp = sheetEmp.getDataRange().getValues();
  var validEmpSet = {};
  for (var i = 1; i < dataEmp.length; i++) {
    var id = dataEmp[i][0] ? dataEmp[i][0].toString().toLowerCase().trim() : "";
    if (id) validEmpSet[id] = true;
  }
  
  // 2. ตรวจสอบและลบแถวใน Leave_Balances ที่ไม่มีพนักงานคนนั้นแล้ว (ลบจากล่างขึ้นบน)
  var sheetBal = ss.getSheetByName('Leave_Balances');
  if (sheetBal) {
    var dataBal = sheetBal.getDataRange().getValues();
    for (var b = dataBal.length - 1; b >= 1; b--) {
      var balId = dataBal[b][1] ? dataBal[b][1].toString().toLowerCase().trim() : "";
      if (balId && !validEmpSet[balId]) {
        sheetBal.deleteRow(b + 1);
      }
    }
  }
  
  // 3. ตรวจสอบและลบแถวใน Leave_Requests (ประวัติการขอลาทั้งหมด) ที่ไม่มีพนักงานคนนั้นแล้ว (ลบจากล่างขึ้นบน)
  var sheetReq = ss.getSheetByName('Leave_Requests');
  if (sheetReq) {
    var dataReq = sheetReq.getDataRange().getValues();
    for (var r = dataReq.length - 1; r >= 1; r--) {
      var reqId = dataReq[r][2] ? dataReq[r][2].toString().toLowerCase().trim() : "";
      if (reqId && !validEmpSet[reqId]) {
        sheetReq.deleteRow(r + 1);
      }
    }
  }
}

// สร้างเมนูทางลัดใน Google Sheets สำหรับผู้ดูแลระบบ
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('📌 ระบบลางาน P-Leave')
      .addItem('🧹 เคลียร์ประวัติการลาของพนักงานที่ถูกลบ', 'cleanupOrphanedLeaveData')
      .addToUi();
  } catch(e) {}
}

// ทริกเกอร์อัตโนมัติเมื่อมีการลบ/แก้ไขข้อมูลใน Google Sheets
function onChange(e) {
  try {
    cleanupOrphanedLeaveData();
  } catch(err) {
    Logger.log("Error in onChange cleanup: " + err.toString());
  }
}

// อัปเดตสิทธิ์ลาเริ่มต้น (HR Admin)
function updateLeavePolicy(adminEmail, policyData) {
  var user = getUserRole(adminEmail);
  if (!user.isAdmin) throw new Error("ไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้");
  
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Leave_Policies');
  var data = sheet.getDataRange().getValues();
  var foundRow = -1;
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString() === policyData.emp_type) {
      foundRow = i + 1;
      break;
    }
  }
  
  var newRow = [
    policyData.emp_type,
    Number(policyData.default_sick),
    Number(policyData.default_personal),
    Number(policyData.default_vacation)
  ];
  
  if (foundRow !== -1) {
    sheet.getRange(foundRow, 1, 1, newRow.length).setValues([newRow]);
  } else {
    sheet.appendRow(newRow);
  }
  
  return { success: true };
}

// ฟังก์ชันสร้างยอดคงเหลือพนักงานคนใหม่
function generateEmployeeBalance(email, empType, fiscalYear) {
  var ss = getSpreadsheet();
  var sheetBal = ss.getSheetByName('Leave_Balances');
  if (!sheetBal) return;
  
  // ดึงรายละเอียดพนักงานเพื่อนำมาใส่ใน Leave_Balances
  var sheetEmp = ss.getSheetByName('Employees');
  var empData = sheetEmp.getDataRange().getValues();
  var prefix = "", firstName = "", lastName = "", department = "", position = "";
  for (var i = 1; i < empData.length; i++) {
    if (empData[i][0] && empData[i][0].toString().toLowerCase().trim() === email.toLowerCase().trim()) {
      prefix = empData[i][2] ? empData[i][2].toString().trim() : "";
      firstName = empData[i][3] ? empData[i][3].toString().trim() : "";
      lastName = empData[i][4] ? empData[i][4].toString().trim() : "";
      department = empData[i][5] ? empData[i][5].toString().trim() : "";
      position = empData[i][6] ? empData[i][6].toString().trim() : "";
      break;
    }
  }
  
  var nextRowIdx = sheetBal.getLastRow() + 1;
  var headers = sheetBal.getRange(1, 1, 1, sheetBal.getLastColumn()).getValues()[0];
  var hasQuotaCols = (headers.indexOf('sick_leave_total') !== -1 || headers.length >= 13);
  
  var colRef = 'B';
  var sickUsedFormula = '=SUMIFS(Leave_Requests!G:G, Leave_Requests!C:C, ' + colRef + nextRowIdx + ', Leave_Requests!D:D, "ลาป่วย", Leave_Requests!K:K, "Approved")';
  var personalUsedFormula = '=SUMIFS(Leave_Requests!G:G, Leave_Requests!C:C, ' + colRef + nextRowIdx + ', Leave_Requests!D:D, "ลากิจส่วนตัว", Leave_Requests!K:K, "Approved")';
  var vacationUsedFormula = '=SUMIFS(Leave_Requests!G:G, Leave_Requests!C:C, ' + colRef + nextRowIdx + ', Leave_Requests!D:D, "<>ลาป่วย", Leave_Requests!D:D, "<>ลากิจส่วนตัว", Leave_Requests!K:K, "Approved")';
  
  if (hasQuotaCols) {
    sheetBal.appendRow([
      fiscalYear, email, prefix, firstName, lastName, department, position,
      30, sickUsedFormula, 45, personalUsedFormula, 10, vacationUsedFormula
    ]);
  } else {
    sheetBal.appendRow([
      fiscalYear, email, prefix, firstName, lastName, department, position,
      sickUsedFormula, personalUsedFormula, vacationUsedFormula
    ]);
  }
}

// สร้างสิทธิ์วันลาคงเหลือสำหรับพนักงานทุกคนเมื่อขึ้นปีงบประมาณใหม่
function generateFiscalYearBalances(adminEmail, year) {
  var user = getUserRole(adminEmail);
  if (!user.isAdmin) throw new Error("ไม่มีสิทธิ์ในการจัดการปีงบประมาณ");
  
  autoGenerateFiscalYearBalances(year);
  return { success: true };
}

// ฟังก์ชันหลักในการจัดเตรียมข้อมูลสิทธิ์ปีงบประมาณ (แกนกลางการทำงาน)
function autoGenerateFiscalYearBalances(year) {
  var ss = getSpreadsheet();
  var sheetEmp = ss.getSheetByName('Employees');
  var empData = sheetEmp.getDataRange().getValues();
  
  // สร้างแมปของนโยบาย
  var policyMap = {};
  var sheetPol = ss.getSheetByName('Leave_Policies');
  if (sheetPol) {
    var polData = sheetPol.getDataRange().getValues();
    for (var i = 1; i < polData.length; i++) {
      policyMap[polData[i][0].toString()] = {
        sick: polData[i][1],
        personal: polData[i][2],
        vacation: polData[i][3]
      };
    }
  }
  
  // ตรวจสอบข้อมูลพนักงานแล้วเขียนทับหรือแอดใหม่
  var existingKeys = {};
  for (var i = 1; i < balData.length; i++) {
    if (balData[i][0].toString() === year.toString()) {
      existingKeys[balData[i][1].toString().toLowerCase()] = i + 1; // บันทึกเลขแถวที่พบ
    }
  }
  
  for (var i = 1; i < empData.length; i++) {
    var email = empData[i][0].toString();
    var empType = empData[i][7].toString();
    var emailKey = email.toLowerCase();
    
    var pol = policyMap[empType] || { sick: 30, personal: 45, vacation: 10 };
    
    var prefix = empData[i][2] ? empData[i][2].toString().trim() : "";
    var firstName = empData[i][3] ? empData[i][3].toString().trim() : "";
    var lastName = empData[i][4] ? empData[i][4].toString().trim() : "";
    var dept = empData[i][5] ? empData[i][5].toString().trim() : "";
    var pos = empData[i][6] ? empData[i][6].toString().trim() : "";
    
    if (existingKeys[emailKey]) {
      // อัปเดตแถวที่มีอยู่แล้ว
      var row = existingKeys[emailKey];
      sheetBal.getRange(row, 3, 1, 5).setValues([[prefix, firstName, lastName, dept, pos]]);
      sheetBal.getRange(row, 8).setValue(pol.sick);
      sheetBal.getRange(row, 10).setValue(pol.personal);
      sheetBal.getRange(row, 12).setValue(pol.vacation);
    } else {
      // เพิ่มแถวใหม่
      var nextRowIdx = sheetBal.getLastRow() + 1;
      var sickUsedFormula = '=SUMIFS(Leave_Requests!G:G, Leave_Requests!C:C, B' + nextRowIdx + ', Leave_Requests!D:D, "ลาป่วย", Leave_Requests!K:K, "Approved")';
      var personalUsedFormula = '=SUMIFS(Leave_Requests!G:G, Leave_Requests!C:C, B' + nextRowIdx + ', Leave_Requests!D:D, "ลากิจส่วนตัว", Leave_Requests!K:K, "Approved")';
      var vacationUsedFormula = '=SUMIFS(Leave_Requests!G:G, Leave_Requests!C:C, B' + nextRowIdx + ', Leave_Requests!D:D, "<>ลาป่วย", Leave_Requests!D:D, "<>ลากิจส่วนตัว", Leave_Requests!K:K, "Approved")';
      
      sheetBal.appendRow([
        year.toString(),
        email,
        prefix,
        firstName,
        lastName,
        dept,
        pos,
        pol.sick,
        sickUsedFormula,
        pol.personal,
        personalUsedFormula,
        pol.vacation,
        vacationUsedFormula
      ]);
    }
  }
}

// ตรวจสอบวันที่ปัจจุบันและดำเนินการรีเซ็ต/ตัดสิทธิ์ปีงบประมาณอัตโนมัติ (วันเริ่ม 1 ต.ค.)
function checkAndAutoResetFiscalYear() {
  try {
    var ss = getSpreadsheet();
    var sheetBal = ss.getSheetByName('Leave_Balances');
    if (!sheetBal) return;
    
    var today = new Date();
    var currentYear = today.getFullYear();
    var month = today.getMonth(); // 0=Jan, 9=Oct, 10=Nov, 11=Dec
    
    var fiscalYear;
    if (month >= 9) { // เดือนตุลาคม พฤศจิกายน ธันวาคม (นับเป็นปีงบประมาณถัดไป)
      fiscalYear = currentYear + 1 + 543;
    } else {
      fiscalYear = currentYear + 543;
    }
    
    var balData = sheetBal.getDataRange().getValues();
    var hasRecords = false;
    for (var i = 1; i < balData.length; i++) {
      if (balData[i][0] && balData[i][0].toString().trim() === fiscalYear.toString()) {
        hasRecords = true;
        break;
      }
    }
    
    if (!hasRecords) {
      Logger.log("Automatically resetting fiscal year balances for year: " + fiscalYear);
      autoGenerateFiscalYearBalances(fiscalYear);
    }
  } catch(e) {
    Logger.log("Error in checkAndAutoResetFiscalYear: " + e.toString());
  }
}

// ดึงสิทธิ์ลาทั้งหมดเพื่อทำปฏิทินแสดงภาพรวมของวิทยาลัย/แผนกวิชา
function getCalendarData(email) {
  var user = getUserRole(email);
  if (!user.exists) return [];
  
  var ss = getSpreadsheet();
  var sheetReq = ss.getSheetByName('Leave_Requests');
  var reqData = sheetReq.getDataRange().getValues();
  
  var sheetEmp = ss.getSheetByName('Employees');
  var empData = sheetEmp.getDataRange().getValues();
  
  var empMap = {};
  for (var i = 1; i < empData.length; i++) {
    empMap[empData[i][0].toString().toLowerCase().trim()] = {
      name: empData[i][2] + empData[i][3] + " " + empData[i][4],
      department: empData[i][5],
      position: empData[i][6]
    };
  }
  
  var calendarEvents = [];
  
  for (var i = 1; i < reqData.length; i++) {
    var status = reqData[i][10];
    var reqEmail = reqData[i][2].toString().toLowerCase().trim();
    
    // แสดงเฉพาะคำขอที่อนุมัติแล้ว และแผนกเดียวกับผู้ใช้งาน (หรือแอดมิน/ผู้บริหารจะแสดงทั้งหมด)
    if (status === 'Approved') {
      var empInfo = empMap[reqEmail] || { name: reqEmail, department: "", position: "" };
      
      var isSameDept = empInfo.department.toLowerCase() === user.department.toLowerCase();
      var isExecutive = (user.position === 'ผู้อำนวยการ' || user.position === 'รองผู้อำนวยการ' || user.department === 'งานบุคลากร');
      
      if (isSameDept || isExecutive) {
        calendarEvents.push({
          request_id: reqData[i][0],
          title: empInfo.name + " (" + reqData[i][3] + ")",
          employee_name: empInfo.name,
          department: empInfo.department,
          leave_type: reqData[i][3],
          start_date: reqData[i][4],
          end_date: reqData[i][5],
          total_days: reqData[i][6],
          reason: reqData[i][7]
        });
      }
    }
  }
  
  return calendarEvents;
}

// --- ฟังก์ชันช่วยเหลือเกี่ยวกับวันที่ภาษาไทย ---
function formatDateThai(dateStr) {
  if (!dateStr) return "";
  
  try {
    var dateObj;
    if (dateStr instanceof Date) {
      dateObj = dateStr;
    } else {
      var cleanStr = dateStr.toString().split('T')[0].trim();
      var parts = cleanStr.split('-');
      if (parts.length === 3) {
        dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
      } else {
        parts = cleanStr.split('/');
        if (parts.length === 3) {
          dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
        } else {
          dateObj = new Date(dateStr);
        }
      }
    }
    
    if (isNaN(dateObj.getTime())) {
      return dateStr;
    }
    
    var months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    var day = dateObj.getDate();
    var month = months[dateObj.getMonth()];
    var year = dateObj.getFullYear() + 543; // แปลงเป็น พ.ศ.
    
    return day + " " + month + " " + year;
  } catch (e) {
    return dateStr;
  }
}

// =============================================================
// ระบบอนุมัติลา 3 ด่าน ผ่าน LINE Messaging API Webhook
// =============================================================

// Webhook สำหรับรองรับคำขอการอนุมัติผ่าน LINE บอททั้ง 3 ตัว
function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var events = postData.events;
    
    // ดึงประเภทบอทจากพารามิเตอร์ URL (e.g. ?bot=hr)
    var botType = e.parameter.bot || 'hr';
    
    if (events && events.length > 0) {
      for (var i = 0; i < events.length; i++) {
        var event = events[i];
        
        // จัดการเมื่อผู้อนุมัติคลิกปุ่มอนุมัติ/ยินยอม/ปฏิเสธใน Flex Message
        if (event.type === 'postback') {
          handleLinePostback(event, botType);
        }
        
        // จัดการเมื่อมีผู้ใช้แอดเพื่อนใหม่เข้ามา (Follow Event)
        if (event.type === 'follow') {
          var followMsg = "สวัสดีค่ะ 🔔 ยินดีต้อนรับสู่ระบบ P-Leave วิทยาลัยเทคนิคประจวบคีรีขันธ์\n\n" +
            "📱 **ขั้นตอนผูกบัญชีรับแจ้งเตือนอัตโนมัติ**:\n" +
            "👉 กรุณาพิมพ์ส่ง 'Username' (ชื่อผู้ใช้เข้าสู่ระบบ) ของท่านเข้ามาในช่องแชทนี้ เพื่อทำการเชื่อมโยงบัญชีและรับแจ้งเตือนใบลาให้อัตโนมัติค่ะ 😊";
          sendLineReplyMessage(botType, event.replyToken, followMsg);
        }
        
        // จัดการเมื่อผู้ใช้ส่งข้อความตัวอักษรเข้ามา (เช่น ส่ง Username/รหัสพนักงาน เพื่อผูกไลน์อัตโนมัติ)
        if (event.type === 'message' && event.message.type === 'text') {
          var userText = event.message.text.trim();
          var cleanText = userText.replace(/[-]/g, '');
          
          if (cleanText.length >= 2 && cleanText !== 'help' && cleanText !== 'คู่มือ') {
            handleLineNationalIdLinking(event, botType, cleanText);
          } else {
            // ส่งข้อความต้อนรับและคำแนะนำการผูกบัญชีอัตโนมัติ
            var welcomeMsg = "สวัสดีค่ะ ยินดีต้อนรับสู่ระบบ P-Leave แชทบอทวิทยาลัยเทคนิคประจวบคีรีขันธ์ 🔔\n\n" +
              "📱 **วิธีผูกบัญชีรับแจ้งเตือนอัตโนมัติ (ทำครั้งเดียว)**:\n" +
              "👉 กรุณาพิมพ์ส่ง 'Username' (ชื่อผู้ใช้เข้าสู่ระบบ) ของท่านเข้ามาในแชทนี้ได้เลยค่ะ\n\n" +
              "🌐 ตรวจสอบวันลาคงเหลือและยื่นคำขออนุมัติลา ได้ที่หน้าเว็บแอป P-Leave ค่ะ";
            sendLineReplyMessage(botType, event.replyToken, welcomeMsg);
          }
        }
      }
    }
    
    return ContentService.createTextOutput("OK");
  } catch (err) {
    Logger.log("Error in doPost: " + err.toString());
    return ContentService.createTextOutput("OK");
  }
}

// ค้นหา LINE User ID ของพนักงานตามเลขบัตรประชาชน/ไอดี
function getUserLineId(email) {
  if (!email) return "";
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Employees');
    if (!sheet) return "";
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().toLowerCase().trim() === email.toString().toLowerCase().trim()) {
        return data[i][9] ? data[i][9].toString().trim() : ""; // คอลัมน์ J (index 9) line_user_id
      }
    }
  } catch (err) {
    Logger.log("Error in getUserLineId: " + err.toString());
  }
  return "";
}

// จัดการเหตุการณ์คลิกปุ่มจาก LINE บอท
function handleLinePostback(event, botType) {
  var replyToken = event.replyToken;
  var dataStr = event.postback.data;
  
  // แยกพารามิเตอร์ใน data
  var params = {};
  dataStr.split('&').forEach(function(pair) {
    var parts = pair.split('=');
    if (parts.length === 2) {
      params[parts[0]] = parts[1];
    }
  });
  
  var action = params.action;
  var requestId = params.id;
  var stage = params.stage || botType;
  
  var ss = getSpreadsheet();
  var sheetReq = ss.getSheetByName('Leave_Requests');
  var reqData = sheetReq.getDataRange().getValues();
  
  var foundRow = -1;
  var requestItem = null;
  
  for (var i = 1; i < reqData.length; i++) {
    if (reqData[i][0] && reqData[i][0].toString() === requestId) {
      foundRow = i + 1;
      requestItem = reqData[i];
      break;
    }
  }
  
  if (foundRow === -1) {
    sendLineReplyMessage(botType, replyToken, "❌ ไม่พบรหัสใบลาที่ระบุในระบบ");
    return;
  }
  
  var currentStatus = requestItem[10]; // คอลัมน์ K (สถานะ)
  var teacherEmail = requestItem[2];
  var leaveType = requestItem[3];
  var totalDays = requestItem[6];
  
  // ตรวจสอบความถูกต้องของสถานะ (Concurrency check)
  var expectedStatus = "";
  if (stage === 'dept') expectedStatus = "Pending Dept";
  else if (stage === 'hr') expectedStatus = "Pending HR";
  else if (stage === 'deputy') expectedStatus = "Pending Deputy";
  else if (stage === 'director') expectedStatus = "Pending Director";
  
  if (currentStatus !== expectedStatus) {
    sendLineReplyMessage(botType, replyToken, "⚠️ ใบลาเลขที่ " + requestId + " นี้ได้รับการพิจารณาไปแล้ว หรืออยู่ในขั้นตอนอื่น (สถานะปัจจุบัน: " + translateStatusThai(currentStatus) + ")");
    return;
  }
  
  var user = getUserRole(teacherEmail);
  var teacherName = user.prefix + user.first_name + " " + user.last_name;
  var teacherLineId = getUserLineId(teacherEmail);
  
  if (action === 'reject') {
    // ปฏิเสธการลา
    var comment = "";
    var replyMsg = "";
    if (stage === 'dept') {
      comment = "ปฏิเสธโดยหัวหน้าแผนกวิชา";
      replyMsg = "🔴 คุณปฏิเสธใบลา " + requestId + " เรียบร้อยแล้ว ระบบได้แจ้งผลให้ครูผู้ยื่นลาทราบแล้ว";
    } else if (stage === 'hr') {
      comment = "ปฏิเสธโดยหัวหน้างานฝ่ายบุคลากร (HR)";
      replyMsg = "🔴 คุณปฏิเสธใบลา " + requestId + " เรียบร้อยแล้ว ระบบได้แจ้งผลให้ครูผู้ยื่นลาทราบแล้ว";
    } else if (stage === 'deputy') {
      comment = "ปฏิเสธโดยรองผู้อำนวยการ";
      replyMsg = "🔴 คุณปฏิเสธใบลา " + requestId + " เรียบร้อยแล้ว ระบบได้แจ้งผลให้ครูผู้ยื่นลาทราบแล้ว";
    } else if (stage === 'director') {
      comment = "ไม่ยินยอมโดยผู้อำนวยการ";
      replyMsg = "🔴 คุณปฏิเสธใบลา " + requestId + " เรียบร้อยแล้ว ระบบได้แจ้งผลให้ครูผู้ยื่นลาทราบแล้ว";
    }
    
    sheetReq.getRange(foundRow, 11).setValue("Rejected");
    sheetReq.getRange(foundRow, 12).setValue(comment);
    
    sendLineReplyMessage(botType, replyToken, replyMsg);
    
    var notifyMsg = "❌ คำขอลา " + leaveType + " (" + totalDays + " วัน) เลขที่ " + requestId + " ของคุณไม่ได้รับการอนุมัติ\nหมายเหตุ: " + comment;
    if (teacherLineId) {
      sendLinePushMessage(botType, teacherLineId, { type: 'text', text: notifyMsg });
    }
    
  } else if (action === 'approve') {
    // อนุมัติ / ยินยอม
    if (stage === 'dept') {
      // ผ่านด่าน 1 -> ด่าน 2 (หัวหน้าฝ่ายบุคลากร)
      sheetReq.getRange(foundRow, 11).setValue("Pending HR");
      sheetReq.getRange(foundRow, 12).setValue("ยินยอมโดยหัวหน้าแผนกวิชา");
      SpreadsheetApp.flush();
      
      requestItem[10] = "Pending HR";
      requestItem[11] = "ยินยอมโดยหัวหน้าแผนกวิชา";
      
      sendLineReplyMessage(botType, replyToken, "🟢 คุณได้กด ยินยอม ใบลา " + requestId + " แล้ว และส่งคำขอต่อไปยังหัวหน้าฝ่ายบุคลากรเรียบร้อยแล้ว");
      
      var hrLineId = getRoleLineId('hr');
      if (hrLineId) {
        sendLineLeaveFlexMessage('hr', hrLineId, requestItem, "ยินยอม");
      } else {
        Logger.log("Warning: HR Head LINE ID not found.");
      }
      
    } else if (stage === 'hr') {
      // ผ่านด่าน 2 -> ด่าน 3 (รองผู้อำนวยการ)
      sheetReq.getRange(foundRow, 11).setValue("Pending Deputy");
      sheetReq.getRange(foundRow, 12).setValue("ยินยอมโดยหัวหน้าฝ่ายบุคลากร");
      SpreadsheetApp.flush();
      
      requestItem[10] = "Pending Deputy";
      requestItem[11] = "ยินยอมโดยหัวหน้าฝ่ายบุคลากร";
      
      sendLineReplyMessage(botType, replyToken, "🟢 คุณได้กด ยินยอม ใบลา " + requestId + " แล้ว และส่งคำขอต่อไปยังรองผู้อำนวยการเรียบร้อยแล้ว");
      
      var deputyLineId = getRoleLineId('deputy');
      if (deputyLineId) {
        sendLineLeaveFlexMessage('deputy', deputyLineId, requestItem, "ยินยอม");
      } else {
        Logger.log("Warning: Deputy Director LINE ID not found.");
      }
      
    } else if (stage === 'deputy') {
      // ผ่านด่าน 3 (รองผู้อำนวยการ) -> ด่าน 4 (ผู้อำนวยการ)
      sheetReq.getRange(foundRow, 11).setValue("Pending Director");
      sheetReq.getRange(foundRow, 12).setValue("ยินยอมโดยรองผู้อำนวยการ");
      SpreadsheetApp.flush();
      
      requestItem[10] = "Pending Director";
      requestItem[11] = "ยินยอมโดยรองผู้อำนวยการ";
      
      sendLineReplyMessage(botType, replyToken, "🟢 คุณได้กด ยินยอม ใบลา " + requestId + " แล้ว และส่งคำขอต่อไปยังผู้อำนวยการเรียบร้อยแล้ว");
      
      var directorLineId = getRoleLineId('director');
      if (directorLineId) {
        sendLineLeaveFlexMessage('director', directorLineId, requestItem, "อนุมัติ");
      } else {
        Logger.log("Warning: Director LINE ID not found.");
      }
      
    } else if (stage === 'director') {
      // ผ่านด่าน 4 (ผู้อำนวยการ) -> อนุมัติเสร็จสมบูรณ์
      sheetReq.getRange(foundRow, 11).setValue("Approved");
      sheetReq.getRange(foundRow, 12).setValue("อนุมัติโดยผู้อำนวยการแล้ว");
      SpreadsheetApp.flush();
      
      requestItem[10] = "Approved";
      requestItem[11] = "อนุมัติโดยผู้อำนวยการแล้ว";
      
      sendLineReplyMessage(botType, replyToken, "🟢 อนุมัติใบลาเรียบร้อยแล้ว");
      
      var approveMsg = "🎉 ยินดีด้วย! คำขอลา " + leaveType + " (" + totalDays + " วัน) เลขที่ " + requestId + " ของคุณได้รับการอนุมัติเสร็จสมบูรณ์เรียบร้อยแล้ว!";
      if (teacherLineId) {
        sendLinePushMessage('director', teacherLineId, { type: 'text', text: approveMsg });
      }
    }
  }
}

// ฟังก์ชันแปลสถานะการลาเป็นภาษาไทยสำหรับ LINE Reply
function translateStatusThai(status) {
  if (status === 'Pending Dept') return "รอหัวหน้าแผนก (ด่าน 1)";
  if (status === 'Pending HR') return "รอหัวหน้าฝ่ายบุคลากร (ด่าน 2)";
  if (status === 'Pending Deputy') return "รอรองผู้อำนวยการ (ด่าน 3)";
  if (status === 'Pending Director') return "รอผู้อำนวยการ (ด่าน 4)";
  if (status === 'Approved') return "อนุมัติแล้ว";
  if (status === 'Rejected') return "ปฏิเสธ";
  return status;
}

// ส่ง Flex Message เพื่ออนุมัติลา
function sendLineLeaveFlexMessage(botType, toUserId, requestRow, approveLabel) {
  var requestId = requestRow[0];
  var timestamp = requestRow[1];
  var email = requestRow[2];
  var leaveType = requestRow[3];
  var startDate = formatDateThai(requestRow[4]);
  var endDate = formatDateThai(requestRow[5]);
  var totalDays = requestRow[6];
  var reason = requestRow[7];
  var attachmentUrl = requestRow[9];
  var currentStatus = requestRow[10];
  
  var user = getUserRole(email);
  var employeeName = user.prefix + user.first_name + " " + user.last_name;
  var department = user.department || "";
  var deptText = (department.indexOf('แผนก') === 0 || department.indexOf('งาน') === 0 || department.indexOf('คณะ') === 0 || department.indexOf('ฝ่าย') === 0) ? department : ("แผนกวิชา" + department);
  var dateRange = startDate + " ถึง " + endDate;
  
  var stageText = "";
  if (currentStatus === "Pending Dept") stageText = "ด่าน 1: หัวหน้าแผนก";
  else if (currentStatus === "Pending HR") stageText = "ด่าน 2: หัวหน้าฝ่ายบุคลากร";
  else if (currentStatus === "Pending Deputy") stageText = "ด่าน 3: รองผู้อำนวยการ";
  else if (currentStatus === "Pending Director") stageText = "ด่าน 4: ผู้อำนวยการ";
  else stageText = translateStatusThai(currentStatus);
  
  var flexBubble = {
    "type": "bubble",
    "header": {
      "type": "box",
      "layout": "vertical",
      "backgroundColor": "#0288d1", // สีน้ำเงินตามรูปสกรีนช็อตของผู้ใช้
      "contents": [
        {
          "type": "text",
          "text": "ระบบแจ้งลางาน", // เปลี่ยนตามหัวข้อรูปภาพผู้ใช้
          "weight": "bold",
          "color": "#ffffff",
          "size": "lg"
        },
        {
          "type": "text",
          "text": "วิทยาลัยเทคนิคประจวบคีรีขันธ์",
          "color": "#e0f2f1",
          "size": "xs"
        }
      ]
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "รายละเอียดคำขอลา (" + stageText + ")",
          "weight": "bold",
          "size": "md",
          "margin": "md",
          "color": "#263238"
        },
        {
          "type": "separator",
          "margin": "sm"
        },
        {
          "type": "box",
          "layout": "vertical",
          "margin": "md",
          "spacing": "sm",
          "contents": [
            {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                { "type": "text", "text": "รหัสใบลา:", "color": "#78909c", "size": "sm", "flex": 3 },
                { "type": "text", "text": requestId, "weight": "bold", "color": "#37474f", "size": "sm", "flex": 7 }
              ]
            },
            {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                { "type": "text", "text": "ผู้ลา:", "color": "#78909c", "size": "sm", "flex": 3 },
                { "type": "text", "text": employeeName, "color": "#37474f", "size": "sm", "flex": 7, "wrap": true }
              ]
            },
            {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                { "type": "text", "text": "แผนก:", "color": "#78909c", "size": "sm", "flex": 3 },
                { "type": "text", "text": deptText, "color": "#37474f", "size": "sm", "flex": 7 }
              ]
            },
            {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                { "type": "text", "text": "ประเภทการลา:", "color": "#78909c", "size": "sm", "flex": 3 },
                { "type": "text", "text": leaveType, "weight": "bold", "color": "#e65100", "size": "sm", "flex": 7 }
              ]
            },
            {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                { "type": "text", "text": "ช่วงวันลา:", "color": "#78909c", "size": "sm", "flex": 3 },
                { "type": "text", "text": dateRange, "color": "#37474f", "size": "sm", "flex": 7, "wrap": true }
              ]
            },
            {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                { "type": "text", "text": "จำนวนวัน:", "color": "#78909c", "size": "sm", "flex": 3 },
                { "type": "text", "text": totalDays + " วัน", "weight": "bold", "color": "#e65100", "size": "sm", "flex": 7 }
              ]
            },
            {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                { "type": "text", "text": "เหตุผล:", "color": "#78909c", "size": "sm", "flex": 3 },
                { "type": "text", "text": reason, "color": "#37474f", "size": "sm", "flex": 7, "wrap": true }
              ]
            }
          ]
        }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "horizontal",
      "spacing": "sm",
      "contents": [
        {
          "type": "button",
          "style": "primary",
          "color": "#2e7d32",
          "action": {
            "type": "postback",
            "label": approveLabel,
            "data": "action=approve&id=" + requestId + "&stage=" + botType
          }
        },
        {
          "type": "button",
          "style": "secondary",
          "color": "#c62828",
          "action": {
            "type": "postback",
            "label": "ไม่ยินยอม", // เปลี่ยนจาก "ปฏิเสธ" เป็น "ไม่ยินยอม"
            "data": "action=reject&id=" + requestId + "&stage=" + botType
          }
        }
      ]
    }
  };
  
  if (attachmentUrl) {
    flexBubble.body.contents[2].contents.push({
      "type": "box",
      "layout": "horizontal",
      "contents": [
        { "type": "text", "text": "เอกสารแนบ:", "color": "#78909c", "size": "sm", "flex": 3 },
        { 
          "type": "text", 
          "text": "🔗 คลิกเปิดเอกสารแนบ", 
          "color": "#0277bd", 
          "size": "sm", 
          "flex": 7, 
          "weight": "bold",
          "action": {
            "type": "uri",
            "label": "เปิดดูเอกสาร",
            "uri": attachmentUrl
          }
        }
      ]
    });
  }
  
  var messageObj = {
    "type": "flex",
    "altText": "มีคำขออนุมัติลางานใหม่ถึงคุณ (" + requestId + ")",
    "contents": flexBubble
  };
  
  return sendLinePushMessage(botType, toUserId, messageObj);
}

// ดึง Token บอทที่ต้องการใช้ (มีระบบ Fallback รองรับ Channel Token เดี่ยว)
function getBotToken(botType) {
  var props = PropertiesService.getScriptProperties();
  var token = "";
  if (botType === 'hr') token = props.getProperty('LINE_CHANNEL_ACCESS_TOKEN_HR');
  else if (botType === 'dept') token = props.getProperty('LINE_CHANNEL_ACCESS_TOKEN_DEPT');
  else if (botType === 'deputy') token = props.getProperty('LINE_CHANNEL_ACCESS_TOKEN_DEPUTY');
  else if (botType === 'director') token = props.getProperty('LINE_CHANNEL_ACCESS_TOKEN_DIRECTOR');
  
  if (!token || !token.trim()) token = props.getProperty('LINE_CHANNEL_ACCESS_TOKEN');
  if (!token || !token.trim()) token = props.getProperty('LINE_CHANNEL_ACCESS_TOKEN_DEPT');
  if (!token || !token.trim()) token = props.getProperty('LINE_CHANNEL_ACCESS_TOKEN_HR');
  if (!token || !token.trim()) token = props.getProperty('LINE_CHANNEL_ACCESS_TOKEN_DEPUTY');
  if (!token || !token.trim()) token = props.getProperty('LINE_CHANNEL_ACCESS_TOKEN_DIRECTOR');
  return token ? token.trim() : "";
}

// ดึง LINE ID ของผู้บริหารแต่ละด่าน (รองรับทั้ง ScriptProperties และค้นหาจากตาราง Employees)
function getRoleLineId(roleType) {
  var propKey = "";
  if (roleType === 'hr') propKey = 'LINE_USER_ID_HR';
  else if (roleType === 'deputy') propKey = 'LINE_USER_ID_DEPUTY';
  else if (roleType === 'director') propKey = 'LINE_USER_ID_DIRECTOR';
  
  if (propKey) {
    var lineId = PropertiesService.getScriptProperties().getProperty(propKey);
    if (lineId && lineId.trim() !== "") return lineId.trim();
  }
  
  try {
    var ss = getSpreadsheet();
    var sheetEmp = ss.getSheetByName('Employees');
    if (!sheetEmp) return "";
    var data = sheetEmp.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      var pos = data[i][6] ? data[i][6].toString().trim() : "";
      var dept = data[i][5] ? data[i][5].toString().trim() : "";
      var userLineId = data[i][9] ? data[i][9].toString().trim() : "";
      
      if (!userLineId) continue;
      
      if (roleType === 'hr') {
        if (pos.indexOf('หัวหน้างาน') !== -1 || pos.indexOf('บุคลากร') !== -1 || dept.indexOf('ทรัพยากรบุคคล') !== -1 || dept.indexOf('บุคลากร') !== -1) {
          return userLineId;
        }
      } else if (roleType === 'deputy') {
        if (pos.indexOf('รองผู้อำนวยการ') !== -1) {
          return userLineId;
        }
      } else if (roleType === 'director') {
        if (pos.indexOf('ผู้อำนวยการ') !== -1 && pos.indexOf('รอง') === -1) {
          return userLineId;
        }
      }
    }
  } catch (err) {
    Logger.log("Error finding role Line ID: " + err.toString());
  }
  
  return "";
}

// ส่งข้อความ LINE Push Message ไปยังผู้ใช้โดยตรง (มีระบบลองส่งด้วย Token สำรองหาก Token หลักล้มเหลว)
function sendLinePushMessage(botType, toUserId, messageObj) {
  var props = PropertiesService.getScriptProperties();
  var tokensToTry = [];
  
  var primaryToken = getBotToken(botType);
  if (primaryToken) tokensToTry.push(primaryToken);
  
  var fallbackTokens = [
    props.getProperty('LINE_CHANNEL_ACCESS_TOKEN_HR'),
    props.getProperty('LINE_CHANNEL_ACCESS_TOKEN_DEPT'),
    props.getProperty('LINE_CHANNEL_ACCESS_TOKEN_DEPUTY'),
    props.getProperty('LINE_CHANNEL_ACCESS_TOKEN_DIRECTOR'),
    props.getProperty('LINE_CHANNEL_ACCESS_TOKEN')
  ];
  
  fallbackTokens.forEach(function(t) {
    if (t && t.trim() && tokensToTry.indexOf(t.trim()) === -1) {
      tokensToTry.push(t.trim());
    }
  });
  
  if (tokensToTry.length === 0) {
    Logger.log("Missing Channel Access Tokens for: " + botType);
    return false;
  }
  
  var url = 'https://api.line.me/v2/bot/message/push';
  var payload = {
    to: toUserId,
    messages: [messageObj]
  };
  
  for (var i = 0; i < tokensToTry.length; i++) {
    var token = tokensToTry[i];
    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + token
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    try {
      var response = UrlFetchApp.fetch(url, options);
      var resCode = response.getResponseCode();
      var resText = response.getContentText();
      Logger.log("LINE Push Response (try " + i + ", " + botType + "): " + resCode + " - " + resText);
      if (resCode === 200) {
        return true;
      }
    } catch (err) {
      Logger.log("Error in sendLinePush: " + err.toString());
    }
  }
  return false;
}

// ส่งข้อความ LINE Reply Message (ฟรี ไม่หักโควตา push)
function sendLineReplyMessage(botType, replyToken, text) {
  var token = getBotToken(botType);
  if (!token) return false;
  
  var url = 'https://api.line.me/v2/bot/message/reply';
  var payload = {
    replyToken: replyToken,
    messages: [{
      type: 'text',
      text: text
    }]
  };
  
  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + token
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    var response = UrlFetchApp.fetch(url, options);
    var resCode = response.getResponseCode();
    Logger.log("LINE Reply Response (" + botType + "): " + resCode + " - " + response.getContentText());
    return resCode === 200;
  } catch(err) {
    Logger.log("Error in sendLineReply: " + err.toString());
    return false;
  }
}

// ฟังก์ชันสำหรับทดสอบส่งข้อความเข้า LINE (สำหรับกด Run บน Apps Script Editor เพื่อทดสอบเบื้องต้น)
function testSendLineMessage() {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('LINE_CHANNEL_ACCESS_TOKEN_HR');
  var userId = props.getProperty('LINE_USER_ID_HR');
  
  Logger.log("--- เริ่มต้นการทดสอบบอท LINE (HR) ---");
  Logger.log("1. มีข้อมูล Token ในระบบหรือไม่: " + (token ? "มี (Yes)" : "ไม่มี (No)"));
  Logger.log("2. มีข้อมูล LINE User ID ผู้รับหรือไม่: " + (userId ? "มี (Yes)" : "ไม่มี (No)"));
  
  if (!token || !userId) {
    throw new Error("❌ กรุณาตั้งค่า LINE_CHANNEL_ACCESS_TOKEN_HR และ LINE_USER_ID_HR ในหน้า Project Settings -> Script Properties ของ Apps Script ก่อนรันฟังก์ชันนี้!");
  }
  
  var testBubble = {
    "type": "bubble",
    "header": {
      "type": "box",
      "layout": "vertical",
      "backgroundColor": "#0288d1",
      "contents": [
        {
          "type": "text",
          "text": "ระบบแจ้งลางาน",
          "weight": "bold",
          "color": "#ffffff",
          "size": "lg"
        },
        {
          "type": "text",
          "text": "ข้อความทดสอบระบบ (Test Connection)",
          "color": "#e0f2f1",
          "size": "xs"
        }
      ]
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "ทดสอบเชื่อมต่อสำเร็จ! บอทส่งข้อความถึงคุณเรียบร้อยแล้วค่ะ",
          "wrap": true,
          "size": "sm"
        }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "horizontal",
      "spacing": "sm",
      "contents": [
        {
          "type": "button",
          "style": "primary",
          "color": "#2e7d32",
          "action": {
            "type": "postback",
            "label": "ยินยอม",
            "data": "action=test_approve"
          }
        },
        {
          "type": "button",
          "style": "secondary",
          "color": "#c62828",
          "action": {
            "type": "postback",
            "label": "ไม่ยินยอม",
            "data": "action=test_reject"
          }
        }
      ]
    }
  };

  var payload = {
    to: userId,
    messages: [{
      "type": "flex",
      "altText": "ทดสอบส่งการ์ดขออนุมัติลางาน",
      "contents": testBubble
    }]
  };
  
  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + token
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  var response = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', options);
  var resCode = response.getResponseCode();
  var resText = response.getContentText();
  
  Logger.log("3. HTTP Status Code จาก LINE API: " + resCode);
  Logger.log("4. ข้อมูลตอบกลับจาก LINE API: " + resText);
  
  if (resCode !== 200) {
    throw new Error("❌ ส่งไม่สำเร็จ! LINE API ตอบกลับว่า: " + resText + " (กรุณาตรวจสอบความถูกต้องของ Token หรือ LINE User ID ของคุณครู)");
  }
  
  Logger.log("🎉 ส่งข้อความสำเร็จ! กรุณาเปิดตรวจสอบห้องแชทของ LINE Bot ฝ่ายบุคลากร");
  return "ส่งสำเร็จ!";
}

// ฟังก์ชันสำหรับผูกไอดี LINE ของพนักงานและหัวหน้าอัตโนมัติเมื่อพิมพ์ส่งเลขประจำตัวประชาชน/รหัสพนักงานเข้ามาในแชทบอท
function handleLineNationalIdLinking(event, botType, inputKey) {
  var replyToken = event.replyToken;
  var lineUserId = event.source.userId;
  var targetKey = inputKey.toString().trim().toLowerCase();
  
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Employees');
  if (!sheet) return;
  
  var data = sheet.getDataRange().getValues();
  var foundRow = -1;
  var empName = "";
  var empDept = "";
  var empPos = "";
  
  for (var i = 1; i < data.length; i++) {
    var emailKey = data[i][0] ? data[i][0].toString().trim().toLowerCase() : "";
    var empIdKey = data[i][1] ? data[i][1].toString().trim().toLowerCase() : "";
    var passKey = data[i][8] ? data[i][8].toString().trim().toLowerCase() : "";
    
    if (emailKey === targetKey || empIdKey === targetKey || passKey === targetKey) {
      foundRow = i + 1;
      empName = (data[i][2] || "") + (data[i][3] || "") + " " + (data[i][4] || ""); // Prefix + FirstName + LastName
      empDept = data[i][5] ? data[i][5].toString().trim() : "";
      empPos = data[i][6] ? data[i][6].toString().trim() : "";
      break;
    }
  }
  
  if (foundRow === -1) {
    var notFoundMsg = "❌ ไม่พบข้อมูลบุคลากรสำหรับ Username/รหัส: \"" + inputKey + "\" นี้ในระบบ P-Leave\n\n" +
      "👉 กรุณาลงทะเบียนสมาชิกใหม่ที่หน้าเว็บแอป P-Leave ก่อน หรือตรวจสอบ Username ให้ถูกต้องอีกครั้งค่ะ";
    sendLineReplyMessage(botType, replyToken, notFoundMsg);
    return;
  }
  
  // บันทึก line_user_id ลงคอลัมน์ J (คอลัมน์ที่ 10 / index 9) ในแผ่นงาน Employees
  sheet.getRange(foundRow, 10).setValue(lineUserId);
  SpreadsheetApp.flush(); // บันทึกทันทีลง Google Sheets
  
  // หากเป็นผู้บริหาร/หัวหน้าหน่วยงานในระบบ 4 ด่าน ให้อัปเดตเข้าสู่ Script Properties อัตโนมัติทันที
  var scriptProps = PropertiesService.getScriptProperties();
  if (empPos.indexOf('รองผู้อำนวยการ') !== -1 || botType === 'deputy') {
    scriptProps.setProperty('LINE_USER_ID_DEPUTY', lineUserId);
  }
  if ((empPos.indexOf('ผู้อำนวยการ') !== -1 && empPos.indexOf('รอง') === -1) || botType === 'director') {
    scriptProps.setProperty('LINE_USER_ID_DIRECTOR', lineUserId);
  }
  if (empDept === 'งานบุคลากร' || empDept.indexOf('บุคลากร') !== -1 || empDept.indexOf('ทรัพยากรบุคคล') !== -1 || empPos === 'เจ้าหน้าที่งานบุคลากร' || botType === 'hr') {
    scriptProps.setProperty('LINE_USER_ID_HR', lineUserId);
  }
  
  // หากเป็นหัวหน้าแผนก/หัวหน้างาน ให้ซิงก์ไปแผ่นงาน Department_Heads คอลัมน์ D (line_user_id) ด้วยโดยตรงทันที
  if (empPos.indexOf('หัวหน้า') !== -1 && empDept) {
    syncDepartmentHeadSheet(empDept, data[foundRow - 1][0], empName.trim(), lineUserId);
  }
  
  var successMsg = "✅ เชื่อมโยงบัญชี LINE ของ \"คุณครู" + empName.trim() + "\" (" + (empPos || "บุคลากร") + " " + empDept + ") เข้ากับระบบ P-Leave เรียบร้อยแล้วค่ะ!\n\n" +
    "🔔 ต่อไปนี้ระบบจะส่งแจ้งเตือนการยื่นใบลาและการอนุมัติใบลาเข้า LINE ส่วนตัวของท่านให้อัตโนมัติค่ะ 🎉";
    
  var replied = sendLineReplyMessage(botType, replyToken, successMsg);
  if (!replied) {
    sendLinePushMessage(botType, lineUserId, { type: 'text', text: successMsg });
  }
}

// ฟังก์ชันช่วยจัดรูปแบบวันที่และเวลาให้ปลอดภัยก่อนส่ง JSON ไปยังหน้าบ้าน
function formatDateTimeSafe(val) {
  if (!val) return "";
  if (val instanceof Date) {
    try {
      // ตรวจสอบว่าวันที่ถูกต้องหรือไม่
      if (isNaN(val.getTime())) return "";
      
      // ดึงรูปแบบวันที่ YYYY-MM-DD
      var year = val.getFullYear();
      var month = ("0" + (val.getMonth() + 1)).slice(-2);
      var date = ("0" + val.getDate()).slice(-2);
      return year + "-" + month + "-" + date;
    } catch(e) {
      return val.toString();
    }
  }
  return val.toString();
}
