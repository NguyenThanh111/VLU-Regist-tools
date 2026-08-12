import React, { lazy, Suspense, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { useTkbStore } from '../../zus';
import './welcome.css';

const Welcome3D = lazy(() => import('./Welcome3D'));

const MARQUEE_ITEMS = [
  'Kết nối API trường',
  'Soạn thời khoá biểu',
  'Phát hiện trùng lịch',
  'Preview TKB trực tiếp',
  'Đăng ký tự động',
  'Chia sẻ TKB',
];

const STEPS = [
  {
    num: '01',
    title: 'Kết nối dữ liệu',
    desc: 'Nhập token đăng nhập từ cổng đăng ký, tải danh sách lớp học phần của học kỳ chỉ trong vài giây.',
  },
  {
    num: '02',
    title: 'Xếp lớp thông minh',
    desc: 'Lọc, sắp xếp và chọn lớp. Những lớp trùng lịch tự động bị ẩn để không bao giờ chọn nhầm.',
  },
  {
    num: '03',
    title: 'TKB & đăng ký',
    desc: 'Xem thời khoá biểu trực quan, tải ảnh, chia sẻ cho bạn bè và đăng ký qua API nhanh hơn thủ công.',
  },
];

const FEATURES = [
  {
    key: 'a',
    icon: 'bi-calendar2-x-fill',
    variant: 'red',
    title: 'Phát hiện trùng lịch tức thì',
    desc: 'Slot trùng TKB sẽ không hiện checkbox, kèm cặp lớp bị trùng hiện ngay trên lịch.',
    visual: (
      <div className="wl-mini-sched">
        <div className="ok" />
        <div className="ok" />
        <div className="conflict" />
        <div className="conflict" />
        <div className="ok" />
        <div className="ok" />
        <div className="conflict" />
        <div className="conflict" />
      </div>
    ),
  },
  {
    key: 'b',
    icon: 'bi-plug-fill',
    variant: 'blue',
    title: 'Kết nối API trường',
    desc: 'Tải trực tiếp danh sách lớp từ regist.vlu.edu.vn bằng chính token của bạn.',
  },
  {
    key: 'c',
    icon: 'bi-calendar2-week-fill',
    variant: 'white',
    title: 'Soạn TKB nhanh',
    desc: 'Thao tác trực tiếp trên lịch: click để xoá môn, lọc theo giảng viên, phòng học.',
    visual: (
      <div className="wl-mini-sched">
        <div />
        <div className="ok" />
        <div />
        <div className="ok" />
        <div className="ok" />
        <div />
        <div />
        <div className="ok" />
      </div>
    ),
  },
  {
    key: 'd',
    icon: 'bi-code-slash',
    variant: 'red',
    title: 'Script đăng ký nhanh',
    desc: 'Copy script ĐKHP được gen sẵn, chạy trong Console để đăng ký trong vài giây.',
    visual: (
      <code className="wl-code">
        <span className="tk">JSON.parse(localStorage.getItem('authorizationData')).Token</span>
      </code>
    ),
  },
  {
    key: 'e',
    icon: 'bi-share-fill',
    variant: 'blue',
    title: 'Chia sẻ TKB',
    desc: 'Đưa mã lớp lên URL để lưu trạng thái hoặc gửi cho bạn học.',
    visual: (
      <span className="wl-link-chip">
        <i className="bi bi-link-45deg" />
        dkhp-vlu.vercel.app/1,2,3
      </span>
    ),
  },
  {
    key: 'f',
    icon: 'bi-image-fill',
    variant: 'white',
    title: 'Tải ảnh TKB',
    desc: 'Xuất thời khoá biểu ra hình ảnh để dùng làm hình nền, gửi qua mạng xã hội.',
  },
];

const NOTES = [
  {
    icon: 'bi-shield-lock-fill',
    title: 'Token an toàn',
    desc: 'Token chỉ lưu trên trình duyệt của bạn, không gửi đi đâu khác.',
  },
  {
    icon: 'bi-envelope-check-fill',
    title: 'OTP qua email',
    desc: 'Đăng ký qua API cần mã OTP gửi về email sinh viên như đăng ký thường.',
  },
  {
    icon: 'bi-list-check',
    title: 'Kiểm tra trước khi đăng ký',
    desc: 'Rà soát kỹ lịch học và tín chỉ trước khi bấm đăng ký cuối cùng.',
  },
];

export default function Welcome() {
  const history = useHistory();
  const dataTkb = useTkbStore((s) => s.dataExcel);
  const selectedClasses = useTkbStore((s) => s.selectedClasses);
  const goStep1 = () => history.push(ROUTES._1ChonFileExcel.path);
  const goDashboard = () => history.push('/dashboard');

  const startLabel = dataTkb ? 'Tiếp tục xếp lớp' : 'Bắt đầu ngay';

  useEffect(() => {
    document.title = 'Văn Lang | Đăng ký học phần';
    return () => {
      document.title = 'Đăng ký học phần VLU';
    };
  }, []);

  return (
    <div className="wl-page">
      {/* Nav */}
      <nav className="wl-nav">
        <a className="wl-nav-brand" href="/">
          <img src={`${process.env.PUBLIC_URL}/logo-vlu.png`} alt="Đại học Văn Lang" />
          <span>
            <b>Đại học Văn Lang</b>
            <small>Đăng ký học phần</small>
          </span>
        </a>
        <div className="wl-nav-links">
          <a href="#quy-trinh">Quy trình</a>
          <a href="#tinh-nang">Tính năng</a>
          <a href="#luu-y">Lưu ý</a>
        </div>
        <button type="button" className="wl-btn wl-btn-primary" onClick={goStep1}>
          {startLabel}
          <i className="bi bi-arrow-right" />
        </button>
      </nav>

      {/* Hero */}
      <header className="wl-hero">
        <Suspense fallback={null}>
          <Welcome3D />
        </Suspense>
        <div className="wl-hero-inner">
          <span className="wl-eyebrow">
            <span className="dot" />
            Đại học Văn Lang · Công cụ ĐKHP
          </span>
          <h1 className="wl-display wl-reveal">
            Xếp lịch học trong <em className="wl-text-red" style={{ fontStyle: 'normal' }}>vài phút</em>,
            <br />
            không phải vài ngày.
          </h1>
          <p className="lead wl-reveal wl-d1">
            Kết nối API trường, soạn thời khoá biểu không trùng lịch và đăng ký học phần nhanh hơn
            cả đăng ký thủ công: vài phút cho TKB, vài giây cho ĐKHP.
          </p>
          <div className="wl-hero-ctas wl-reveal wl-d2">
            <button type="button" className="wl-btn wl-btn-primary" onClick={goStep1}>
              {startLabel}
              <i className="bi bi-rocket-takeoff" />
            </button>
            <a href="#quy-trinh" className="wl-btn wl-btn-ghost">
              Xem quy trình
            </a>
          </div>
          <div className="wl-hero-chips wl-reveal wl-d3">
            <span className="wl-chip">
              <i className="bi bi-clock-history wl-text-red" />
              16 ca học mỗi ngày
            </span>
            <span className="wl-chip">
              <i className="bi bi-layers-half wl-text-blue" />
              3 bước đơn giản
            </span>
            <span className="wl-chip">
              <i className="bi bi-lightning-charge-fill wl-text-red" />
              14–24 tín chỉ / kỳ
            </span>
          </div>
        </div>
        <div className="wl-scroll-hint">
          <i className="bi bi-mouse" />
          <span>Cuộn để khám phá</span>
        </div>
      </header>

      {/* Marquee */}
      <div className="wl-marquee" aria-hidden="true">
        <div className="wl-marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i}>
              {item}
              <i>✦</i>
            </span>
          ))}
        </div>
      </div>

      {/* Steps */}
      <section className="wl-section" id="quy-trinh">
        <div className="wl-section-inner">
          <div className="wl-section-head">
            <h2 className="wl-display">Quy trình 3 bước, không thao tác thừa</h2>
            <p>
              Từ dữ liệu lớp học đến thời khoá biểu hoàn chỉnh. Mỗi bước tự động kế thừa kết quả
              của bước trước.
            </p>
          </div>
          <div className="wl-steps">
            {STEPS.map((step) => (
              <div className="wl-step" key={step.num}>
                <div className="wl-step-num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features bento */}
      <section className="wl-section" id="tinh-nang" style={{ paddingTop: 0 }}>
        <div className="wl-section-inner">
          <div className="wl-section-head">
            <h2 className="wl-display">Mọi thứ cần cho một kỳ học suôn sẻ</h2>
            <p>Các tính năng độc lập, dùng riêng lẻ hay kết hợp đều được.</p>
          </div>
          <div className="wl-bento">
            {FEATURES.map((f) => (
              <div className={`wl-cell ${f.key}`} key={f.key}>
                <div className={`wl-cell-icon ${f.variant}`}>
                  <i className={`bi ${f.icon}`} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
                {f.visual}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statement */}
      <section className="wl-statement">
        <h2 className="wl-display">
          <span className="old">Vài ngày</span>
          <span className="arr">→</span>
          <span className="wl-text-red">vài phút</span>
          <br className="d-md-none" />
          <span className="arr">·</span>
          <span className="old">vài phút</span>
          <span className="arr">→</span>
          <span className="wl-text-red">vài giây</span>
        </h2>
        <p>Soạn TKB từ vài ngày còn vài phút · ĐKHP từ vài phút chỉ còn vài giây.</p>
      </section>

      {/* Notes */}
      <section className="wl-section" id="luu-y">
        <div className="wl-section-inner">
          <div className="wl-section-head">
            <h2 className="wl-display">Yên tâm khi dùng</h2>
          </div>
          <div className="wl-notes">
            {NOTES.map((note) => (
              <div className="wl-note" key={note.title}>
                <i className={`bi ${note.icon}`} />
                <div>
                  <b>{note.title}</b>
                  <p>{note.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="wl-final">
        <h2 className="wl-display">
          Sẵn sàng cho học kỳ mới<span className="wl-text-red">?</span>
        </h2>
        <p>
          {selectedClasses.length
            ? `Bạn đã chọn ${selectedClasses.length} lớp. Tiếp tục xếp lớp và hoàn tất đăng ký.`
            : 'Kết nối dữ liệu, chọn lớp và để tool lo phần còn lại.'}
        </p>
        <div className="wl-hero-ctas">
          <button type="button" className="wl-btn wl-btn-primary" onClick={goStep1}>
            {startLabel}
            <i className="bi bi-arrow-right" />
          </button>
          <button type="button" className="wl-btn wl-btn-ghost" onClick={goDashboard}>
            Mở Dashboard
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="wl-footer">
        <a className="wl-footer-brand" href="https://www.vlu.edu.vn/" target="_blank" rel="noreferrer">
          <img src={`${process.env.PUBLIC_URL}/logo-vlu.png`} alt="Văn Lang" />
          <b>Đại học Văn Lang · Đăng ký học phần</b>
        </a>
        <div className="wl-footer-links">
          <a href="https://www.vlu.edu.vn/" target="_blank" rel="noreferrer">
            vlu.edu.vn
          </a>
          <a href="https://regist.vlu.edu.vn/" target="_blank" rel="noreferrer">
            regist.vlu.edu.vn
          </a>
        </div>
        <small>Dành cho sinh viên · 2026</small>
      </footer>
    </div>
  );
}