/**
 * WebHub Smart Intelligence Sentinel & Version Control System
 * Giám sát phiên bản siêu nhẹ, tiết kiệm băng thông tối đa, truyền thông tin 2 chiều với Vercel & Supabase
 * và kích hoạt làm mới OpenGraph mạng xã hội (Facebook, Zalo).
 */

export interface SentinelMetrics {
  localVersionHash: string;
  cloudVersionHash: string | null;
  status: 'idle' | 'listening' | 'checking' | 'synced' | 'updating' | 'error';
  lastCheckedAt: string;
  lastCheckedTimestamp: number;
  totalChecks: number;
  notModified304Count: number;
  bandwidthSavedKB: number;
  activeIntervalSeconds: number;
  isRealtimeConnected: boolean;
}

export type SentinelListener = (metrics: SentinelMetrics) => void;

class WebHubSentinelEngine {
  private localVersionHash: string = '';
  private cloudVersionHash: string | null = null;
  private status: SentinelMetrics['status'] = 'idle';
  private lastCheckedAt: string = '';
  private lastCheckedTimestamp: number = 0;
  private totalChecks: number = 0;
  private notModified304Count: number = 0;
  private bandwidthSavedBytes: number = 0;
  private isRealtimeConnected: boolean = false;

  private timerId: any = null;
  private listeners = new Set<SentinelListener>();
  private onReconcileCallback: (() => Promise<void>) | null = null;

  private readonly ACTIVE_INTERVAL_MS = 45 * 1000; // 45 giây khi mở tab
  private readonly IDLE_INTERVAL_MS = 300 * 1000;  // 5 phút khi ẩn tab

  constructor() {
    this.updateTimestamp();
  }

  /**
   * Khởi động bộ giám sát thông minh
   */
  public init(initialHash: string, onReconcile: () => Promise<void>) {
    this.localVersionHash = initialHash || 'v20_init';
    this.onReconcileCallback = onReconcile;
    this.status = 'listening';

    if (typeof window !== 'undefined') {
      // 1. Lắng nghe thay đổi trạng thái tab (Tab Visibility)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.scheduleNextCheck(1000); // Ngay khi mở lại tab: ping nhẹ
        } else {
          this.scheduleNextCheck(this.IDLE_INTERVAL_MS); // Tab ẩn: giãn cách 5 phút
        }
      });

      // 2. Lắng nghe cửa sổ focus và mạng online trở lại
      window.addEventListener('focus', () => this.scheduleNextCheck(1000));
      window.addEventListener('online', () => {
        console.log('[WebHub Sentinel] Mạng phục hồi: Thực hiện kiểm tra phiên bản tức thì.');
        this.checkVersion(true);
      });

      // 3. Đăng ký biến toàn cục trên window
      (window as any).__WEBHUB_SENTINEL__ = this;
    }

    this.scheduleNextCheck(3000);
    this.notifyListeners();
  }

  /**
   * Đăng ký hàm lắng nghe sự thay đổi số liệu để cập nhật lên giao diện
   */
  public subscribe(listener: SentinelListener): () => void {
    this.listeners.add(listener);
    listener(this.getMetrics());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const metrics = this.getMetrics();
    this.listeners.forEach((l) => {
      try {
        l(metrics);
      } catch (err) {
        console.warn('[WebHub Sentinel] Listener error:', err);
      }
    });
  }

  public getMetrics(): SentinelMetrics {
    return {
      localVersionHash: this.localVersionHash,
      cloudVersionHash: this.cloudVersionHash,
      status: this.status,
      lastCheckedAt: this.lastCheckedAt,
      lastCheckedTimestamp: this.lastCheckedTimestamp,
      totalChecks: this.totalChecks,
      notModified304Count: this.notModified304Count,
      bandwidthSavedKB: Math.round(this.bandwidthSavedBytes / 1024),
      activeIntervalSeconds:
        typeof document !== 'undefined' && document.visibilityState === 'hidden'
          ? this.IDLE_INTERVAL_MS / 1000
          : this.ACTIVE_INTERVAL_MS / 1000,
      isRealtimeConnected: this.isRealtimeConnected,
    };
  }

  private updateTimestamp() {
    const now = new Date();
    this.lastCheckedTimestamp = now.getTime();
    this.lastCheckedAt =
      now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  private scheduleNextCheck(delayMs?: number) {
    if (this.timerId) clearTimeout(this.timerId);
    const delay =
      delayMs !== undefined
        ? delayMs
        : typeof document !== 'undefined' && document.visibilityState === 'hidden'
        ? this.IDLE_INTERVAL_MS
        : this.ACTIVE_INTERVAL_MS;

    this.timerId = setTimeout(() => {
      this.checkVersion().finally(() => this.scheduleNextCheck());
    }, delay);
  }

  /**
   * Kiểm tra phiên bản siêu nhẹ qua ETag Vercel Endpoint
   */
  public async checkVersion(force = false): Promise<boolean> {
    if (this.status === 'checking' || this.status === 'updating') return false;

    this.status = 'checking';
    this.totalChecks++;
    this.notifyListeners();

    try {
      const headers: Record<string, string> = {};
      if (this.localVersionHash && !force) {
        headers['If-None-Match'] = `"${this.localVersionHash}"`;
      }

      const res = await fetch('/api/version', {
        method: 'GET',
        headers,
      });

      this.updateTimestamp();

      // Trường hợp 1: 304 Not Modified -> Dữ liệu không đổi, 0 byte truyền tải!
      if (res.status === 304) {
        this.notModified304Count++;
        // Trung bình tải toàn bộ bảng mất ~150KB dữ liệu
        this.bandwidthSavedBytes += 150 * 1024;
        this.status = 'synced';
        this.notifyListeners();
        return false;
      }

      // Trường hợp 2: 200 OK -> Kiểm tra hash
      if (res.ok) {
        const data = await res.json();
        const incomingVersion = (data.version || '').replace(/"/g, '');
        this.cloudVersionHash = incomingVersion;

        if (incomingVersion && incomingVersion === this.localVersionHash && !force) {
          // Khớp phiên bản
          this.status = 'synced';
          this.notModified304Count++;
          this.bandwidthSavedBytes += 150 * 1024;
          this.notifyListeners();
          return false;
        }

        // Sai lệch phiên bản -> Kích hoạt đối soát đầy đủ!
        console.log(
          `%c[WebHub Sentinel]%c Phát hiện sai lệch phiên bản (Local: ${this.localVersionHash} -> Cloud: ${incomingVersion}). Kích hoạt cập nhật...`,
          'background: #f59e0b; color: black; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
          'color: inherit;'
        );
        this.status = 'updating';
        this.notifyListeners();

        if (this.onReconcileCallback) {
          await this.onReconcileCallback();
        }

        this.localVersionHash = incomingVersion;
        this.status = 'synced';
        this.notifyListeners();
        return true;
      }

      this.status = 'error';
      this.notifyListeners();
      return false;
    } catch (err) {
      console.warn('[WebHub Sentinel] Kiểm tra phiên bản mạng:', err);
      this.status = 'error';
      this.notifyListeners();
      return false;
    }
  }

  /**
   * Cập nhật mã băm phiên bản cục bộ sau khi đối soát xong
   */
  public setLocalVersionHash(hash: string) {
    this.localVersionHash = hash;
    this.status = 'synced';
    this.updateTimestamp();
    this.notifyListeners();
  }

  /**
   * Đánh dấu kết nối Realtime
   */
  public setRealtimeStatus(connected: boolean) {
    this.isRealtimeConnected = connected;
    this.notifyListeners();
  }

  /**
   * Nhận sự kiện đẩy tức thì từ Supabase Realtime
   */
  public notifyRealtimeEvent(payload: any) {
    console.log(
      '%c[WebHub Sentinel Realtime Push]%c Nhận tín hiệu trực tiếp từ Supabase:',
      'background: #06b6d4; color: black; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
      'color: inherit;',
      payload
    );
    this.localVersionHash = `stale_${Date.now()}`;
    if (this.onReconcileCallback) {
      this.status = 'updating';
      this.notifyListeners();
      this.onReconcileCallback().finally(() => {
        this.status = 'synced';
        this.updateTimestamp();
        this.notifyListeners();
      });
    }
  }

  /**
   * Kích hoạt Facebook Graph Scraper làm mới bản xem trước mạng xã hội
   */
  public async notifyFacebookScrape(url?: string): Promise<any> {
    try {
      const targetUrl = url || window.location.href;
      console.log(`[WebHub Sentinel] Gửi tín hiệu làm mới cache Facebook cho: ${targetUrl}`);
      const res = await fetch('/api/facebook-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      console.log('[WebHub Sentinel] Kết quả phản hồi từ Facebook Scraper:', data);
      return data;
    } catch (e) {
      console.warn('[WebHub Sentinel] Lỗi gửi yêu cầu Facebook Scrape:', e);
    }
  }
}

export const webhubSentinel = new WebHubSentinelEngine();
