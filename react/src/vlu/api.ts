import { IS_LOCAL_PROXY, LOCAL_PROXY_TOKEN, VLU_API } from './config';
import { VluPeriod, VluRegistConfig, VluScheduleUnit, VluStudyProgram, VluStudyType } from './types';

export class VluApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'VluApiError';
    this.status = status;
  }
}

type FetchOptions = {
  method?: 'GET' | 'POST';
  body?: unknown;
};

async function vluFetch<T>(token: string, path: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body } = options;
  const base = IS_LOCAL_PROXY ? VLU_API.proxyURL : VLU_API.baseURL;
  if (!IS_LOCAL_PROXY && !VLU_API.apiKey) {
    throw new VluApiError('Chưa cấu hình VLU_API_KEY. Build bản public cần set REACT_APP_VLU_API_KEY.', 500);
  }
  let res: Response;
  try {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (IS_LOCAL_PROXY) {
      // local proxy tự thêm apiKey + token đã bắt được; client chỉ gửi token nếu có
      // Token thật chỉ nằm ở local proxy. Marker này chỉ biểu thị đã kết nối.
      if (token && token !== LOCAL_PROXY_TOKEN) headers.Authorization = 'Bearer ' + token;
    } else {
      headers.apiKey = VLU_API.apiKey;
      headers.clientId = VLU_API.clientId;
      if (token) headers.Authorization = 'Bearer ' + token;
    }
    res = await fetch(base + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    const msg = IS_LOCAL_PROXY
      ? 'Không kết nối được local server (:8787). Hãy chạy "npm run dev:local" rồi thử lại.'
      : 'Không thể kết nối tới máy chủ VLU. Kiểm tra mạng và thử lại.';
    throw new VluApiError(msg, 0);
  }

  if (res.status === 401) {
    throw new VluApiError('Token không hợp lệ hoặc đã hết hạn. Đăng nhập lại regist.vlu.edu.vn để lấy token mới.', 401);
  }
  if (res.status === 429) {
    throw new VluApiError('Bạn thao tác quá nhanh, vui lòng thử lại sau vài giây.', 429);
  }
  if (!res.ok) {
    let message = `Lỗi máy chủ (HTTP ${res.status})`;
    try {
      const json = await res.json();
      message = json?.message || json?.data?.message || message;
    } catch {
      /* ignore */
    }
    throw new VluApiError(message, res.status);
  }

  const json = await res.json().catch(() => null);
  // API bọc kết quả trong { data: ... } — unwrap như interceptor của portal
  return json && typeof json === 'object' && 'data' in json ? json.data : json;
}

export const vluApi = {
  getStudyPrograms: (token: string) =>
    vluFetch<VluStudyProgram[]>(token, 'Authen/GetAllStudyProgramRegist'),

  getStudyTypes: (token: string) =>
    vluFetch<VluStudyType[]>(token, 'Authen/GetAllStudyType'),

  getRegistConfig: (token: string, studyProgramId: string) =>
    vluFetch<VluRegistConfig>(token, `Regist/GetRegistSemesterCreditQuota?StudyProgramID=${studyProgramId}`),

  getScheduleUnits: (
    token: string,
    req: { ReqParam1: string; ReqParam2: string; ReqParam3: string | null; ReqParam4: string },
  ) => vluFetch<VluScheduleUnit[]>(token, 'Regist/GetAllScheduleUnitAllowRegist', { method: 'POST', body: req }),

  checkExitsRegist: (token: string, units: unknown[], studyProgramId: string) =>
    vluFetch<{ IsConflict: boolean; IsFull: boolean; Message: string }>(
      token,
      `Regist/CheckExitsRegist?StudyProgramID=${studyProgramId}`,
      { method: 'POST', body: units },
    ),

  regist: (
    token: string,
    units: unknown[],
    turnId: string,
    action: 'REGIST' | 'CHANGE',
    studyProgramId: string,
    otpCode: string,
    otpType: string,
  ) =>
    vluFetch<string>(
      token,
      `Regist/RegistScheduleStudyUnit?TurnID=${turnId}&Action=${action}&StudyProgramID=${studyProgramId}&OtpCode=${otpCode}&OtpType=${otpType}`,
      { method: 'POST', body: units },
    ),

  remove: (token: string, units: unknown[], turnId: string, studyProgramId: string, otpCode: string, otpType: string) =>
    vluFetch<string>(
      token,
      `Regist/RemoveScheduleStudyUnit?TurnID=${turnId}&StudyProgramID=${studyProgramId}&OtpCode=${otpCode}&OtpType=${otpType}`,
      { method: 'POST', body: units },
    ),

  sendOtp: (token: string, req: unknown) => vluFetch<string>(token, 'Otp/sendOtpByUser', { method: 'POST', body: req }),

  getPeriods: (token: string, req: unknown) =>
    vluFetch<VluPeriod[]>(token, 'Schedule/GetAllScheduleWeekPerior', { method: 'POST', body: req }),

  getConfigStudent: (token: string) => vluFetch(token, 'authenticate/GetConfigStudent'),
};
