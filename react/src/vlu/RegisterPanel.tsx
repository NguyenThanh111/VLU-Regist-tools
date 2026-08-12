import React, { useState, useCallback, useMemo } from 'react';
import { Box, Button, Alert, Typography, CircularProgress, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { uniqBy } from 'lodash';
import { enqueueSnackbar } from 'notistack';
import { selectPhanLoaiHocTrenTruong, useTkbStore } from '../zus';
import { extractListMaLop, calcTongSoTC, getTongSoTcJudgement } from '../utils';
import { vluApi, VluApiError } from './api';
import { useVluStore } from './store';
export default function RegisterPanel() {
  const [loading, setLoading] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const [registerResult, setRegisterResult] = useState<{ success: boolean; message: string } | null>(null);

  const token = useVluStore((s) => s.token);
  const registConfig = useVluStore((s) => s.registConfig);
  const vluUnits = useVluStore((s) => s.units);
  const studyProgramId = useVluStore((s) => s.studyProgramId);

  const cacLop = useTkbStore(selectPhanLoaiHocTrenTruong);
  const tongSoTC = useMemo(() => calcTongSoTC(cacLop.flat()), [cacLop]);

  const selectedUnitObjects = useMemo(() => {
    const selectedMaLops = extractListMaLop(cacLop.flat());
    if (!selectedMaLops.length || !vluUnits.length) return [];
    const matched = selectedMaLops
      .map((maLop) => vluUnits.find((u) => u.ScheduleStudyUnitAlias === maLop))
      .filter(Boolean);
    return uniqBy(matched, 'ScheduleStudyUnitAlias');
  }, [cacLop, vluUnits]);

  const hasSelection = selectedUnitObjects.length > 0;

  const handleRegister = useCallback(async () => {
    if (!token) {
      enqueueSnackbar('Chưa có token VLU. Quay lại Bước 1.', { variant: 'warning' });
      return;
    }
    if (!registConfig?.IdDot) {
      enqueueSnackbar('Chưa có thông tin đợt đăng ký. Vui lòng chọn chương trình đào tạo ở Bước 1.', { variant: 'warning' });
      return;
    }
    if (!hasSelection) {
      enqueueSnackbar('Chưa chọn lớp nào. Hãy chọn lớp ở Bước 2.', { variant: 'warning' });
      return;
    }
    if (!registConfig.RegistAble) {
      enqueueSnackbar('Đợt đăng ký chưa mở. Vui lòng chờ.', { variant: 'warning' });
      return;
    }
    const creditJudgement = getTongSoTcJudgement(tongSoTC);
    if (!creditJudgement.isOk) {
      enqueueSnackbar(creditJudgement.text, { variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const conflict = await vluApi.checkExitsRegist(token, selectedUnitObjects, studyProgramId);
      if (conflict?.IsConflict || conflict?.IsFull) {
        enqueueSnackbar(conflict.Message || (conflict.IsFull ? 'Có lớp đã đầy.' : 'Có xung đột khi đăng ký.'), {
          variant: 'warning',
        });
        return;
      }
      setOtpCode('');
      setOtpOpen(true);
    } catch (err) {
      const message = err instanceof VluApiError ? err.message : 'Không thể kiểm tra điều kiện đăng ký.';
      enqueueSnackbar('Không tiếp tục đăng ký: ' + message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [token, registConfig, studyProgramId, selectedUnitObjects, hasSelection, tongSoTC]);

  const handleConfirmRegister = useCallback(async () => {
    if (!registConfig?.IdDot || !otpCode.trim()) return;
    setLoading(true);
    try {
      const result = await vluApi.regist(
        token,
        selectedUnitObjects,
        registConfig.IdDot,
        'REGIST',
        studyProgramId,
        otpCode.trim(),
        'OTP_CHANGE',
      );
      const msg = typeof result === 'string' ? result : 'Đăng ký thành công!';
      setRegisterResult({ success: true, message: msg });
      enqueueSnackbar(msg, { variant: 'success' });
      setOtpOpen(false);
      setOtpCode('');
    } catch (err) {
      const msg = err instanceof VluApiError ? err.message : 'Lỗi đăng ký.';
      setRegisterResult({ success: false, message: msg });
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [token, registConfig, studyProgramId, selectedUnitObjects, otpCode]);


  if (!token) {
    return (
      <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
        Chưa có token VLU. Quay lại Bước 1 để kết nối (dùng bookmarklet nếu chạy local).
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 1, p: 1, border: '1px solid #eee', borderRadius: 1 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Đăng ký học phần qua API VLU
      </Typography>
      {registConfig && (
        <Alert severity={registConfig.RegistAble ? 'info' : 'warning'} sx={{ mb: 1 }}>
          Đợt {registConfig.YearStudy} - HK{registConfig.TermID} | {registConfig.RegistAble ? 'Đang mở' : 'Chưa mở'} | Đã chọn: {selectedUnitObjects.length} lớp ({tongSoTC} TC)
        </Alert>
      )}

      <Box display="flex" gap={1} sx={{ mt: 1 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleRegister}
          disabled={loading || !registConfig?.RegistAble || !hasSelection}
        >
          {loading ? <CircularProgress size={20} /> : `Đăng ký ${selectedUnitObjects.length} lớp`}
        </Button>
      </Box>

      {registerResult && (
        <Alert severity={registerResult.success ? 'success' : 'error'} sx={{ mt: 1 }}>
          {registerResult.message}
        </Alert>
      )}

      <Dialog open={otpOpen} onClose={() => setOtpOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nhập mã OTP xác nhận đăng ký</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Mã OTP"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            placeholder="Nhập mã xác minh từ email VLU"
            helperText="Hệ thống chỉ gửi đăng ký sau khi bạn nhập OTP hợp lệ."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOtpOpen(false)}>Hủy</Button>
          <Button onClick={handleConfirmRegister} disabled={loading || !otpCode.trim()}>
            {loading ? <CircularProgress size={20} /> : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
