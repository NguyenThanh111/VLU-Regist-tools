import uniqBy from 'lodash/uniqBy';
import { Buoi, ClassModel } from 'types';
import { TTrungTkb } from './views/2XepLop/TrungTkbDialog';
import { isProd } from './runtime';

export function uniqMaLop(classes: ClassModel[]): ClassModel[] {
  return uniqBy(classes, 'MaLop'); // Có nhiều lớp học nhiều buổi 1 tuần, xuất hiện nhiều lần, nhưng chỉ nên cộng 1 lần
}

export function calcTongSoTC(classes: ClassModel[]) {
  const { kept } = findOverlapedClasses(classes);
  const unique = uniqMaLop(kept);
  return unique.reduce((acc, cur) => acc + cur.SoTc, 0);
}

export function getTongSoTcJudgement(tongSoTC: number) {
  const text =
    tongSoTC < 14
      ? 'Chưa đạt số TC quy định: 14'
      : tongSoTC > 24
      ? 'Vượt quá số TC quy định: 24'
      : 'Thỏa mãn số TC quy định 14-24';
  const isOk = tongSoTC >= 14 && tongSoTC <= 24;
  return {
    isOk,
    text,
  };
}

export function extractListMaLop(classes: ClassModel[]) {
  const unique = uniqMaLop(classes);
  return unique.map((it) => it.MaLop);
}

export const getBuoiFromTiet = (tiet: ClassModel['Tiet']): Buoi => {
  if (tiet === '*') return Buoi.N_A;
  const first = parseInt(tiet.split(/[,\s]/)[0], 10);
  if (isNaN(first)) return Buoi.N_A;
  if (first <= 6) return Buoi.Sang;
  if (first <= 12) return Buoi.Chieu;
  return Buoi.Toi;
};

export const getDanhSachTiet = (tiet: ClassModel['Tiet']): string[] => {
  if (tiet === '*') return ['*'];
  if (tiet.includes(',')) return tiet.split(',').map((s) => s.trim());
  return [tiet.trim()];
};

/**
 * "*": Không lên trường
 * 2-1, 2-2, 2-3: Thứ 2, tiết 1,2,3
 * 7-11, 7-12, 7-13: Thứ 7, tiết 11,12,13
 */
type ValidTimeSlot = `${string}-${string}`;
type TimeSlots = '*' | ValidTimeSlot[];
const getTimeSlots = ({ Thu, Tiet }: ClassModel): TimeSlots => {
  if (Thu === '*') return '*';
  return getDanhSachTiet(Tiet).map((tiet): ValidTimeSlot => `${Thu}-${tiet}`);
};

const isTimeSlotsOverlap = (timeSlotsA: TimeSlots, timeSlotsB: TimeSlots) => {
  if (timeSlotsA === '*' || timeSlotsB === '*') return false;
  return timeSlotsA.some((slotA) => timeSlotsB.includes(slotA));
};

const getStudyWeeks = (cachTuan: string): Set<number> | null => {
  const weeks = new Set<number>();
  const values = cachTuan.match(/\d+(?:\s*[-–—]\s*\d+)?/g) ?? [];
  for (const value of values) {
    const [fromText, toText] = value.split(/\s*[-–—]\s*/);
    const from = Number(fromText);
    const to = Number(toText ?? fromText);
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to > 53) continue;
    for (let week = Math.min(from, to); week <= Math.max(from, to); week++) weeks.add(week);
  }
  return weeks.size ? weeks : null;
};

const isStudyWeeksOverlap = (a: string, b: string) => {
  const weeksA = getStudyWeeks(a);
  const weeksB = getStudyWeeks(b);
  // Thiếu dữ liệu tuần: giữ cách xử lý an toàn, coi như có thể trùng.
  if (!weeksA || !weeksB) return true;
  return Array.from(weeksA).some((week) => weeksB.has(week));
};

const isScheduleOverlap = (classA: ClassModel, classB: ClassModel) =>
  isTimeSlotsOverlap(getTimeSlots(classA), getTimeSlots(classB)) &&
  isStudyWeeksOverlap(classA.CachTuan, classB.CachTuan);

export const hasOverlapSchedule = (classAs: ClassModel[], classB: ClassModel) => {
  return classAs.some((classA) => {
    if (isSameAgGridRowId(classA, classB)) return false;
    return isScheduleOverlap(classA, classB);
  });
};

// Thường thì MaLop alone is enough because most of the classes only appear once a week or once every 2 weeks, nhưng mà có thể có môn Anh Văn học 1 tuần tới 2 buổi, nên cần có thêm Thu và Tiet
// TODO: maybe use STT?
export const getAgGridRowId = (classModel: ClassModel): string => {
  return classModel.MaLop + classModel.Thu + classModel.Tiet;
};

export const isSameAgGridRowId = (class1: ClassModel, class2: ClassModel) => {
  return getAgGridRowId(class1) === getAgGridRowId(class2);
};

export const findOverlapedClasses = (
  /** the first elements in the array will have higher priority, it's OK to have duplicated classes */
  classes: ClassModel[],
): { kept: ClassModel[]; redundant: TTrungTkb[] } => {
  const kept: ClassModel[] = [];
  const redundant: TTrungTkb[] = [];

  const findExistingOverlap = (newClass: ClassModel) => {
    return kept.find((existingClass) => isScheduleOverlap(existingClass, newClass));
  };

  const processedAgGridRowIds = new Set<string>();
  classes.forEach((addingClass) => {
    const agGridRowId = getAgGridRowId(addingClass);
    if (processedAgGridRowIds.has(agGridRowId)) return;

    processedAgGridRowIds.add(agGridRowId);
    const existingClassOverlapped = findExistingOverlap(addingClass);
    // TODO: refactor the mess below
    const existingRedundant =
      existingClassOverlapped && redundant.find((it) => isSameAgGridRowId(it.existing, existingClassOverlapped));
    if (existingRedundant) {
      existingRedundant.new.push(addingClass);
    } else if (existingClassOverlapped) {
      redundant.push({
        existing: existingClassOverlapped,
        new: [addingClass],
      });
    } else {
      kept.push(addingClass);
    }
  });

  return { kept, redundant };
};

export const log = (...args: any[]) => {
  (window.__DEBUG__ || !isProd) && console.log(...args);
};
