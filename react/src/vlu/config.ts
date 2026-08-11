export const VLU_API = {
  baseURL: 'https://regist-api.vlu.edu.vn/api/',
  /** Địa chỉ local capture/proxy server (chỉ dùng khi chạy local) */
  proxyURL: 'http://localhost:8787/api/',
  /**
   * VLU client key. KHÔNG hardcode vào source — đọc từ biến môi trường build:
   *  - Bản public (Vercel): set REACT_APP_VLU_API_KEY ở Vercel Environment Variables
   *  - Bản local: key nằm trong server/.env.local, frontend không cần
   */
  apiKey: process.env.REACT_APP_VLU_API_KEY || '',
  clientId: process.env.REACT_APP_VLU_CLIENT_ID || 'dtl',
} as const;

/**
 * true = chạy local với proxy (REACT_APP_USE_LOCAL_PROXY=true trong .env.local).
 * Khi đó apiKey + token đều nằm trên local server, không đi ra public.
 */
export const IS_LOCAL_PROXY = process.env.REACT_APP_USE_LOCAL_PROXY === 'true';

/**
 * Thời gian 16 ca học của VLU.
 * Lưu ý: Đây là khung giờ mặc định — khi kết nối API, tool sẽ cố lấy khung giờ
 * chính thức từ endpoint Schedule/GetAllScheduleWeekPerior và ghi đè lên đây.
 */
export const VLU_CA_TIMES: string[] = [
  /* ca 1  */ '(7:00 - 7:50)',
  /* ca 2  */ '(7:50 - 8:40)',
  /* ca 3  */ '(8:40 - 9:30)',
  /* ca 4  */ '(9:40 - 10:30)',
  /* ca 5  */ '(10:30 - 11:20)',
  /* ca 6  */ '(11:20 - 12:10)',
  /* ca 7  */ '(13:00 - 13:50)',
  /* ca 8  */ '(13:50 - 14:40)',
  /* ca 9  */ '(14:40 - 15:30)',
  /* ca 10 */ '(15:40 - 16:30)',
  /* ca 11 */ '(16:30 - 17:20)',
  /* ca 12 */ '(17:20 - 18:10)',
  /* ca 13 */ '(18:15 - 19:05)',
  /* ca 14 */ '(19:05 - 19:55)',
  /* ca 15 */ '(19:55 - 20:45)',
  /* ca 16 */ '(20:45 - 21:35)',
];

/** Chỉ số dòng "Online" trong bảng TKB (sau 16 ca) */
export const VLU_ONLINE_INDEX = VLU_CA_TIMES.length;

/** Số tín chỉ tối thiểu/tối đa đăng ký mỗi học kỳ (theo quy chế chung) */
export const VLU_TC_RANGE = {
  min: 14,
  max: 24,
} as const;
