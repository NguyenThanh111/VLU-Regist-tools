import { VLU_API } from '../../vlu/config';

export const getScriptDkhp = (listMonDangKy: string[]) =>
  `
// Script đăng ký nhanh cho VLU - dán vào Console trên trang regist.vlu.edu.vn
// Danh sách mã lớp: ${listMonDangKy.join(', ')}

var danhSachMaLop = \`${listMonDangKy.join('\n')}\`.trim().split('\\n').map(s => s.trim()).filter(Boolean);

var auth = JSON.parse(localStorage.getItem('authorizationData') || '{}');
if (!auth.Token) { console.error('Không tìm thấy token! Hãy đăng nhập regist.vlu.edu.vn trước.'); }
else {
  var token = auth.Token;
  var headers = {
    'content-type': 'application/json',

    'clientId': '${VLU_API.clientId}',
    'Authorization': 'Bearer ' + token
  };

  console.log('Danh sách mã lớp sẽ đăng ký:', danhSachMaLop);
  console.log('Bạn cần đăng ký từng lớp trên trang regist.vlu.edu.vn vì mỗi lớp cần xác nhận OTP qua email.');
}
`.trim();
