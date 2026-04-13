
        // ================= 鏁版嵁鍒濆鍖栦笌宸ュ叿鍑芥暟 =================
        const DAY_ROLLOVER_HOUR = 4;
        const getTodayStr = (offset=0) => {
            const d = new Date();
            if (d.getHours() < DAY_ROLLOVER_HOUR) d.setDate(d.getDate() - 1);
            d.setDate(d.getDate() + offset);
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        };
        const getTimeStr = () => { const d = new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };
        
        const U = {
            getTotalFocusMins: d => Object.values(d.taskData).flat().reduce((s,t)=>s+t.duration, 0),
            getMaxSingleFocus: d => Math.max(0, ...Object.values(d.taskData).flat().map(t=>t.duration)),
            getDailyWorkStudyMax: d => Math.max(0, ...Object.values(d.timeBlocks).map(arr => arr.filter(b=>['study','work'].includes(b.category)).reduce((s,b)=>{let [sh,sm]=b.start.split(':'),[eh,em]=b.end.split(':');let m=(parseInt(eh)*60+parseInt(em))-(parseInt(sh)*60+parseInt(sm));return s+(m<0?m+1440:m);},0))),
            getWakeStreak: (d, h) => { const dates = Object.keys(d.sleepData).filter(k => { const w=d.sleepData[k].wake; if(!w)return false; return parseInt(w.split(':')[0]) < h; }).sort().reverse(); let streak=0; for(let i=0; i<dates.length; i++) { if(dates[i] === getTodayStr(-i) || dates[i] === getTodayStr(-i-1)) streak++; else break; } return streak; },
            getSleepStreak: d => { const dates = Object.keys(d.sleepData).filter(k => d.sleepData[k].sleepOk).sort().reverse(); let streak=0; for(let i=0; i<dates.length; i++) { if(dates[i] === getTodayStr(-i) || dates[i] === getTodayStr(-i-1)) streak++; else break; } return streak; },
            getHabitMaxStreak: d => { if(d.habitConfig.length===0) return 0; let maxS = 0; d.habitConfig.forEach(h => { const dates = Object.keys(d.habitRecords).filter(k => d.habitRecords[k][h.id]).sort().reverse(); let streak=0; for(let i=0; i<dates.length; i++) { if(dates[i] === getTodayStr(-i) || dates[i] === getTodayStr(-i-1)) streak++; else break; } if(streak > maxS) maxS = streak; }); return maxS; },
            getJournalStreak: d => { const dates = Object.keys(d.journalData).filter(k => d.journalData[k].proud || d.journalData[k].change).sort().reverse(); let streak=0; for(let i=0; i<dates.length; i++) { if(dates[i] === getTodayStr(-i) || dates[i] === getTodayStr(-i-1)) streak++; else break; } return streak; }
        };

        const DATA_KEYS = ['checkinData', 'phoneResistData', 'penaltyData', 'bonusData', 'taskData', 'journalData', 'timeBlocks', 'habitConfig', 'habitRecords', 'unlockedAchievements', 'sleepData', 'todoData', 'focusReliefData'];
        let D = {};
        const CAT_MAP = {
            study: { label: '学习', color: 'primary' },
            work: { label: '科研', color: 'secondary' },
            play: { label: '娱乐', color: 'accent' },
            meal: { label: '餐饮', color: 'warning' },
            rest: { label: '休息', color: 'success' },
            waste: { label: '摸鱼', color: 'danger' }
        };

        const ACHIEVEMENTS_DB = [
            // ===== 专注与心流 =====
            { id: 'focus_10', cat: 'focus', name: '专注起步', desc: '累计专注 10 小时', icon: 'fa-leaf', color: 'secondary', condition: d => U.getTotalFocusMins(d) >= 10 * 60 },
            { id: 'focus_50', cat: 'focus', name: '渐入佳境', desc: '累计专注 50 小时', icon: 'fa-book', color: 'secondary', condition: d => U.getTotalFocusMins(d) >= 50 * 60 },
            { id: 'focus_100', cat: 'focus', name: '学术初探', desc: '累计专注 100 小时', icon: 'fa-graduation-cap', color: 'secondary', condition: d => U.getTotalFocusMins(d) >= 100 * 60 },
            { id: 'single_focus_120', cat: 'focus', name: '心流时刻', desc: '单次专注达到 2 小时', icon: 'fa-hourglass-half', color: 'secondary', condition: d => U.getMaxSingleFocus(d) >= 120 },
            { id: 'single_focus_180', cat: 'focus', name: '深潜模式', desc: '单次专注达到 3 小时', icon: 'fa-hourglass-end', color: 'secondary', condition: d => U.getMaxSingleFocus(d) >= 180 },
            { id: 'workstudy_480', cat: 'focus', name: '高产一天', desc: '单日学习/科研累计 8 小时', icon: 'fa-flask', color: 'secondary', condition: d => U.getDailyWorkStudyMax(d) >= 480 },

            // ===== 作息与考勤 =====
            { id: 'wake_3', cat: 'routine', name: '早起新手', desc: '连续 3 天在 09:00 前起床', icon: 'fa-sun-o', color: 'primary', condition: d => U.getWakeStreak(d, 9) >= 3 },
            { id: 'wake_7', cat: 'routine', name: '破晓之光', desc: '连续 7 天在 09:00 前起床', icon: 'fa-sun-o', color: 'primary', condition: d => U.getWakeStreak(d, 9) >= 7 },
            { id: 'sleep_3', cat: 'routine', name: '作息回正', desc: '连续 3 天在 23:30 前睡觉', icon: 'fa-moon-o', color: 'primary', condition: d => U.getSleepStreak(d) >= 3 },
            { id: 'sleep_7', cat: 'routine', name: '夜幕守约', desc: '连续 7 天在 23:30 前睡觉', icon: 'fa-moon-o', color: 'primary', condition: d => U.getSleepStreak(d) >= 7 },

            // ===== 控制与抵抗 =====
            { id: 'resist_10', cat: 'resist', name: '克制初显', desc: '累计克制诱惑 10 次', icon: 'fa-shield', color: 'danger', condition: d => d.phoneResistData.totalCount >= 10 },
            { id: 'resist_30', cat: 'resist', name: '自控升级', desc: '累计克制诱惑 30 次', icon: 'fa-shield', color: 'danger', condition: d => d.phoneResistData.totalCount >= 30 },
            { id: 'resist_100', cat: 'resist', name: '定力初显', desc: '累计克制诱惑 100 次', icon: 'fa-shield', color: 'danger', condition: d => d.phoneResistData.totalCount >= 100 },

            // ===== 沉淀与复盘 =====
            { id: 'journal_3', cat: 'habit', name: '开始沉淀', desc: '连续 3 天写复盘', icon: 'fa-pencil', color: 'success', condition: d => U.getJournalStreak(d) >= 3 },
            { id: 'journal_7', cat: 'habit', name: '稳定复盘', desc: '连续 7 天写复盘', icon: 'fa-book', color: 'success', condition: d => U.getJournalStreak(d) >= 7 },
            { id: 'habit_7', cat: 'habit', name: '习惯萌芽', desc: '任意习惯连续 7 天', icon: 'fa-seedling', color: 'success', condition: d => U.getHabitMaxStreak(d) >= 7 },
            { id: 'habit_30', cat: 'habit', name: '习惯成型', desc: '任意习惯连续 30 天', icon: 'fa-leaf', color: 'success', condition: d => U.getHabitMaxStreak(d) >= 30 },
            { id: 'habit_100', cat: 'habit', name: '滴水穿石', desc: '任意习惯连续 100 天', icon: 'fa-tint', color: 'success', condition: d => U.getHabitMaxStreak(d) >= 100 }
        ];

        let currentTask = null; let taskTimer = null; 
        let focusReminderVisible = false;
        const focusLeaveState = { pending: false, reason: '', visible: false };
        let charts = { rate: null, period: null, duration: null, phone: null, sleep: null, habit: null, mixed: null };
        let currentCalDate = new Date();
        let statsOverviewDate = new Date();
        const SYNC_SETTINGS_KEY = 'phdWorkspaceCloudSyncSettings';
        const SYNC_META_KEY = 'phdWorkspaceCloudSyncMeta';
        const HOLIDAY_CACHE_KEY = 'phdWorkspaceHolidayCache';
        let syncDebounceTimer = null;
        let syncInFlight = false;
        let syncQueued = false;
        let holidayCache = {};
        const holidayLoadingYears = new Set();
        const focusGuard = {
            active: false,
            immersive: false,
            targetTask: '',
            violationCooldownAt: 0,
            bonusGranted: false
        };
        // Source fallback: 国务院办公厅 2026 年节假日安排
        const HOLIDAY_FALLBACK = {
            '2026': {
                '2026-01-01': { name: '元旦', isOffDay: true },
                '2026-01-02': { name: '元旦', isOffDay: true },
                '2026-01-03': { name: '元旦', isOffDay: true },
                '2026-01-04': { name: '元旦调休', isOffDay: false },
                '2026-02-14': { name: '春节调休', isOffDay: false },
                '2026-02-15': { name: '春节', isOffDay: true },
                '2026-02-16': { name: '春节', isOffDay: true },
                '2026-02-17': { name: '春节', isOffDay: true },
                '2026-02-18': { name: '春节', isOffDay: true },
                '2026-02-19': { name: '春节', isOffDay: true },
                '2026-02-20': { name: '春节', isOffDay: true },
                '2026-02-21': { name: '春节', isOffDay: true },
                '2026-02-22': { name: '春节', isOffDay: true },
                '2026-02-23': { name: '春节', isOffDay: true },
                '2026-02-28': { name: '春节调休', isOffDay: false },
                '2026-04-04': { name: '清明节', isOffDay: true },
                '2026-04-05': { name: '清明节', isOffDay: true },
                '2026-04-06': { name: '清明节', isOffDay: true },
                '2026-05-01': { name: '劳动节', isOffDay: true },
                '2026-05-02': { name: '劳动节', isOffDay: true },
                '2026-05-03': { name: '劳动节', isOffDay: true },
                '2026-05-04': { name: '劳动节', isOffDay: true },
                '2026-05-05': { name: '劳动节', isOffDay: true },
                '2026-05-09': { name: '劳动节调休', isOffDay: false },
                '2026-06-19': { name: '端午节', isOffDay: true },
                '2026-06-20': { name: '端午节', isOffDay: true },
                '2026-06-21': { name: '端午节', isOffDay: true },
                '2026-09-25': { name: '中秋节', isOffDay: true },
                '2026-09-26': { name: '中秋节', isOffDay: true },
                '2026-09-27': { name: '中秋节', isOffDay: true },
                '2026-09-20': { name: '国庆节调休', isOffDay: false },
                '2026-10-01': { name: '国庆节', isOffDay: true },
                '2026-10-02': { name: '国庆节', isOffDay: true },
                '2026-10-03': { name: '国庆节', isOffDay: true },
                '2026-10-04': { name: '国庆节', isOffDay: true },
                '2026-10-05': { name: '国庆节', isOffDay: true },
                '2026-10-06': { name: '国庆节', isOffDay: true },
                '2026-10-07': { name: '国庆节', isOffDay: true },
                '2026-10-10': { name: '国庆节调休', isOffDay: false }
            }
        };

        function getDefaultDataValue(key) {
            if (key === 'phoneResistData') return { totalCount: 0, records: {} };
            if (key === 'penaltyData') return { records: {} };
            if (key === 'bonusData') return { records: {} };
            if (key === 'focusReliefData') return { records: {} };
            if (key === 'habitConfig' || key === 'unlockedAchievements') return [];
            return {};
        }

        function normalizeDataStore(raw = {}) {
            const normalized = {};

            DATA_KEYS.forEach(key => {
                const fallback = getDefaultDataValue(key);
                const value = raw?.[key];

                if (Array.isArray(fallback)) {
                    normalized[key] = Array.isArray(value) ? value : fallback;
                    return;
                }

                if (fallback && typeof fallback === 'object') {
                    normalized[key] = (value && typeof value === 'object' && !Array.isArray(value))
                        ? { ...fallback, ...value }
                        : { ...fallback };
                    return;
                }

                normalized[key] = value ?? fallback;
            });

            normalized.phoneResistData.records = (normalized.phoneResistData.records && typeof normalized.phoneResistData.records === 'object' && !Array.isArray(normalized.phoneResistData.records))
                ? normalized.phoneResistData.records
                : {};
            normalized.phoneResistData.totalCount = Number(normalized.phoneResistData.totalCount) || 0;

            normalized.penaltyData.records = (normalized.penaltyData.records && typeof normalized.penaltyData.records === 'object' && !Array.isArray(normalized.penaltyData.records))
                ? normalized.penaltyData.records
                : {};
            normalized.bonusData.records = (normalized.bonusData.records && typeof normalized.bonusData.records === 'object' && !Array.isArray(normalized.bonusData.records))
                ? normalized.bonusData.records
                : {};
            normalized.focusReliefData.records = (normalized.focusReliefData.records && typeof normalized.focusReliefData.records === 'object' && !Array.isArray(normalized.focusReliefData.records))
                ? normalized.focusReliefData.records
                : {};

            ['checkinData', 'taskData', 'journalData', 'timeBlocks', 'habitRecords', 'sleepData', 'todoData'].forEach(key => {
                normalized[key] = (normalized[key] && typeof normalized[key] === 'object' && !Array.isArray(normalized[key]))
                    ? normalized[key]
                    : {};
            });

            normalized.habitConfig = Array.isArray(normalized.habitConfig) ? normalized.habitConfig : [];
            normalized.unlockedAchievements = Array.isArray(normalized.unlockedAchievements) ? normalized.unlockedAchievements : [];

            Object.keys(normalized.checkinData).forEach(dateStr => {
                normalized.checkinData[dateStr] = normalizeCheckinRecord(normalized.checkinData[dateStr]);
            });

            Object.keys(normalized.phoneResistData.records).forEach(dateStr => {
                const item = normalized.phoneResistData.records[dateStr];
                normalized.phoneResistData.records[dateStr] = {
                    count: Number(item?.count) || 0,
                    history: Array.isArray(item?.history) ? item.history : []
                };
            });

            Object.keys(normalized.penaltyData.records).forEach(dateStr => {
                if (!Array.isArray(normalized.penaltyData.records[dateStr])) normalized.penaltyData.records[dateStr] = [];
            });

            Object.keys(normalized.bonusData.records).forEach(dateStr => {
                if (!Array.isArray(normalized.bonusData.records[dateStr])) normalized.bonusData.records[dateStr] = [];
            });

            Object.keys(normalized.focusReliefData.records).forEach(dateStr => {
                const item = normalized.focusReliefData.records[dateStr];
                normalized.focusReliefData.records[dateStr] = {
                    count: Number(item?.count) || 0,
                    history: Array.isArray(item?.history) ? item.history : []
                };
            });

            ['taskData', 'timeBlocks', 'todoData'].forEach(key => {
                Object.keys(normalized[key]).forEach(dateStr => {
                    if (!Array.isArray(normalized[key][dateStr])) normalized[key][dateStr] = [];
                });
            });

            Object.keys(normalized.habitRecords).forEach(dateStr => {
                const item = normalized.habitRecords[dateStr];
                normalized.habitRecords[dateStr] = (item && typeof item === 'object' && !Array.isArray(item)) ? item : {};
            });

            Object.keys(normalized.journalData).forEach(dateStr => {
                const item = normalized.journalData[dateStr];
                normalized.journalData[dateStr] = (item && typeof item === 'object' && !Array.isArray(item)) ? item : {};
            });

            Object.keys(normalized.sleepData).forEach(dateStr => {
                const item = normalized.sleepData[dateStr];
                normalized.sleepData[dateStr] = {
                    wake: item?.wake || null,
                    wakeOk: !!item?.wakeOk,
                    sleep: item?.sleep || null,
                    sleepOk: !!item?.sleepOk
                };
            });

            return normalized;
        }

        function loadHolidayCache() {
            try {
                holidayCache = JSON.parse(localStorage.getItem(HOLIDAY_CACHE_KEY)) || {};
            } catch (e) {
                holidayCache = {};
            }
        }

        function saveHolidayCache() {
            localStorage.setItem(HOLIDAY_CACHE_KEY, JSON.stringify(holidayCache));
        }

        function normalizeHolidayApiPayload(payload) {
            if (!payload) return null;
            if (payload.code && payload.code !== 0) return null;
            const raw = payload.holidays || payload.data || payload;
            if (!raw || typeof raw !== 'object') return null;
            const normalized = {};
            Object.entries(raw).forEach(([dateStr, item]) => {
                normalized[dateStr] = {
                    name: item.name || item.holiday?.name || item.label || '节假日',
                    isOffDay: item.isOffDay ?? item.isHoliday ?? item.holiday?.isOffDay ?? item.holiday?.holiday ?? false
                };
            });
            return normalized;
        }

        async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            try {
                return await fetch(url, { ...options, signal: controller.signal });
            } finally {
                clearTimeout(timer);
            }
        }

        async function ensureHolidayYearLoaded(year) {
            const yearKey = String(year);
            if (holidayCache[yearKey]) return holidayCache[yearKey];
            if (holidayLoadingYears.has(yearKey)) return HOLIDAY_FALLBACK[yearKey] || null;
            holidayLoadingYears.add(yearKey);
            try {
                const res = await fetchWithTimeout(`https://api.jiejiariapi.com/v1/holidays/${yearKey}`, {}, 6000);
                if (res.ok) {
                    const normalized = normalizeHolidayApiPayload(await res.json());
                    if (normalized) {
                        holidayCache[yearKey] = normalized;
                        saveHolidayCache();
                        return normalized;
                    }
                }
            } catch (err) {
                console.warn('节假日接口读取失败，使用本地/周末兜底：', err);
            } finally {
                holidayLoadingYears.delete(yearKey);
            }
            return HOLIDAY_FALLBACK[yearKey] || null;
        }

        function getHolidayStatus(dateStr) {
            const yearKey = String(dateStr).slice(0, 4);
            const day = new Date(`${dateStr}T00:00:00`).getDay();
            const isWeekend = day === 0 || day === 6;
            const yearMap = holidayCache[yearKey] || HOLIDAY_FALLBACK[yearKey] || {};
            const entry = yearMap[dateStr];

            if (entry) {
                if (entry.isOffDay) return { kind: 'holiday', label: entry.name, shortLabel: '休', isOffDay: true, bonusEligible: true };
                return { kind: 'makeup', label: entry.name, shortLabel: '班', isOffDay: false, bonusEligible: false };
            }
            if (isWeekend) return { kind: 'weekend', label: '周末', shortLabel: '周', isOffDay: true, bonusEligible: true };
            return { kind: 'workday', label: '工作日', shortLabel: '', isOffDay: false, bonusEligible: false };
        }

        function getBonusInfo(dateStr) {
            const record = normalizeCheckinRecord(D.checkinData[dateStr]);
            const holiday = getHolidayStatus(dateStr);
            const worked = !!record?.work?.checkIn;
            const holidayBonus = worked && holiday.bonusEligible ? 1 : 0;
            const recordedFocusBonus = (D.bonusData?.records?.[dateStr] || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
            const derivedFocusBonus = getDerivedFocusBonusRecords(dateStr).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
            const focusBonus = recordedFocusBonus + derivedFocusBonus;
            const total = holidayBonus + focusBonus;
            let label = '-';
            if (total > 0) label = `+${total} Bonus`;
            else if (!worked && holiday.bonusEligible) label = '可得 +1';
            return { earned: total > 0, total, label, holiday, holidayBonus, focusBonus };
        }

        function getTotalBonusCount() {
            const allDates = new Set([
                ...Object.keys(D.checkinData || {}),
                ...Object.keys(D.bonusData?.records || {})
            ]);
            return Array.from(allDates).reduce((sum, dateStr) => sum + getBonusInfo(dateStr).total, 0);
        }

        function getMonthKey(dateStr = getTodayStr()) {
            return String(dateStr).slice(0, 7);
        }

        function ensurePenaltyDateExists(dateStr) {
            if (!D.penaltyData.records[dateStr]) D.penaltyData.records[dateStr] = [];
        }

        function ensureBonusDateExists(dateStr) {
            if (!D.bonusData.records[dateStr]) D.bonusData.records[dateStr] = [];
        }

        function ensureFocusReliefDateExists(dateStr) {
            if (!D.focusReliefData.records[dateStr]) D.focusReliefData.records[dateStr] = { count: 0, history: [] };
        }

        function addPenaltyRecord({ dateStr = getTodayStr(), points = 1, reason = '', source = 'manual' }) {
            ensurePenaltyDateExists(dateStr);
            D.penaltyData.records[dateStr].unshift({
                time: getTimeStr(),
                points: Number(points) || 1,
                reason: reason || '未填写原因',
                source
            });
        }

        function upsertAutoPenalty({ dateStr = getTodayStr(), points = 1, reason = '', source }) {
            ensurePenaltyDateExists(dateStr);
            const items = D.penaltyData.records[dateStr];
            const existingIndex = items.findIndex(item => item.source === source);
            if (existingIndex >= 0) {
                if (points > 0) {
                    items[existingIndex] = { ...items[existingIndex], points, reason };
                } else {
                    items.splice(existingIndex, 1);
                }
                return;
            }
            if (points > 0) addPenaltyRecord({ dateStr, points, reason, source });
        }

        function syncAutoPenalties(dateStr = getTodayStr()) {
            ensureDateDataExists(dateStr);
            const checkin = normalizeCheckinRecord(D.checkinData[dateStr]);
            const sleep = D.sleepData[dateStr] || {};
            const holiday = getHolidayStatus(dateStr);
            const autoPenaltyEnabled = !holiday.isOffDay;

            upsertAutoPenalty({
                dateStr,
                points: autoPenaltyEnabled && checkin?.work?.checkIn && !checkin.work.status.checkIn ? 1 : 0,
                reason: '上班迟到',
                source: 'auto-late-checkin'
            });
            upsertAutoPenalty({
                dateStr,
                points: autoPenaltyEnabled && checkin?.work?.checkOut && !checkin.work.status.checkOut ? 1 : 0,
                reason: '下班未达标',
                source: 'auto-early-checkout'
            });
            upsertAutoPenalty({
                dateStr,
                points: autoPenaltyEnabled && sleep.wake && !sleep.wakeOk ? 1 : 0,
                reason: '起床未达标',
                source: 'auto-late-wake'
            });
            upsertAutoPenalty({
                dateStr,
                points: autoPenaltyEnabled && sleep.sleep && !sleep.sleepOk ? 1 : 0,
                reason: '睡觉未达标',
                source: 'auto-late-sleep'
            });
        }

        function addBonusRecord({ dateStr = getTodayStr(), amount = 1, reason = '', source = 'manual' }) {
            ensureBonusDateExists(dateStr);
            D.bonusData.records[dateStr].unshift({
                time: getTimeStr(),
                amount: Number(amount) || 1,
                reason: reason || '未填写原因',
                source
            });
        }

        function getDerivedFocusBonusRecords(dateStr = getTodayStr()) {
            const tasks = (D.taskData?.[dateStr] || []).filter(item => (Number(item?.duration) || 0) >= 45);
            if (!tasks.length) return [];
            const existingFocusBonusCount = (D.bonusData?.records?.[dateStr] || []).filter(item => item?.source === 'focus-complete').length;
            if (existingFocusBonusCount >= tasks.length) return [];
            return tasks
                .slice(existingFocusBonusCount)
                .map(task => ({
                    time: task.endTime || task.startTime || '-',
                    amount: 1,
                    reason: `${task.name || '专注任务'} 专注满 ${Number(task.duration) || 45} 分钟`,
                    source: 'focus-complete-derived'
                }));
        }

        function getBonusRecordsForDate(dateStr = getTodayStr()) {
            const items = [];
            const bonusInfo = getBonusInfo(dateStr);
            if (bonusInfo.holidayBonus > 0) {
                items.push({ time: '全天', amount: bonusInfo.holidayBonus, reason: `${bonusInfo.holiday.label}上班加分`, source: 'holiday' });
            }
            (D.bonusData.records[dateStr] || []).forEach(item => items.push(item));
            getDerivedFocusBonusRecords(dateStr).forEach(item => items.push(item));
            return items;
        }

        function getFocusReliefAdvice(record) {
            const count = Number(record?.count) || 0;
            if (count <= 2) return '';
            return '今天“实在腰疼”已经用了 3 次以上。建议先把椅背顶住腰部，屏幕抬高到视线附近；每 30-45 分钟起身 2-5 分钟，做胸椎伸展、髋屈肌拉伸和轻微后仰；如果是持续刺痛或放射痛，就不要继续硬扛，尽快休息或就医。';
        }

        function getPenaltySavingAmount(netPoints) {
            if (netPoints <= 2) return 0;
            if (netPoints <= 5) return 50;
            if (netPoints <= 8) return 100;
            if (netPoints <= 12) return 200;
            if (netPoints <= 16) return 300;
            return 500;
        }

        function getMonthlySettlement(dateStr = getTodayStr()) {
            const monthKey = getMonthKey(dateStr);
            let penaltyPoints = 0;
            let bonusCount = 0;
            Object.entries(D.penaltyData.records || {}).forEach(([day, items]) => {
                if (day.startsWith(monthKey)) penaltyPoints += (items || []).reduce((sum, item) => sum + (Number(item.points) || 0), 0);
            });
            const allDates = new Set([
                ...Object.keys(D.checkinData || {}),
                ...Object.keys(D.bonusData?.records || {})
            ]);
            Array.from(allDates).forEach(day => {
                if (day.startsWith(monthKey)) bonusCount += getBonusInfo(day).total;
            });
            const offsetPoints = bonusCount * 2;
            const netPoints = Math.max(0, penaltyPoints - offsetPoints);
            const saving = getPenaltySavingAmount(netPoints);
            return { monthKey, penaltyPoints, bonusCount, offsetPoints, netPoints, saving };
        }

        function isProbablyMobileDevice() {
            const ua = navigator.userAgent || '';
            const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
            return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (coarse && window.innerWidth < 1024);
        }

        async function tryEnterFocusFullscreen() {
            const el = document.documentElement;
            if (!document.fullscreenElement && el.requestFullscreen) {
                try { await el.requestFullscreen(); } catch (err) { console.warn('无法进入全屏：', err); }
            }
        }

        async function exitFocusFullscreen() {
            if (document.fullscreenElement && document.exitFullscreen) {
                try { await document.exitFullscreen(); } catch (err) { console.warn('退出全屏失败：', err); }
            }
        }

        function hideFocusLeaveConfirm() {
            const modal = document.getElementById('focus-leave-modal');
            if (!modal) return;
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            focusLeaveState.visible = false;
        }

        function showFocusLeaveConfirm() {
            if (!currentTask) return;
            const modal = document.getElementById('focus-leave-modal');
            if (!modal) return;
            const elapsedMin = Math.floor((Date.now() - currentTask.startTimestamp) / 60000);
            const outcome = elapsedMin < 15 ? '未满 15 分钟扣 2 点' : (elapsedMin < 45 ? '未满 45 分钟扣 1 点' : '已满足时长，按规则结算奖励');
            document.getElementById('focus-leave-message').textContent = `检测到专注过程被中断，原因：${focusLeaveState.reason}。如果只是手机息屏后又亮屏，请继续专注；如果你确认离开，本次专注会立刻结束，并按 ${outcome} 处理。`;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            focusLeaveState.visible = true;
        }

        function settleFocusLeave(reason) {
            if (!currentTask) return;
            const elapsedMin = Math.floor((Date.now() - currentTask.startTimestamp) / 60000);
            if (elapsedMin < 15) {
                addPenaltyRecord({ points: 2, reason: `手机端专注 ${elapsedMin} 分钟确认离开：${reason}`, source: 'focus-guard' });
            } else if (elapsedMin < 45) {
                addPenaltyRecord({ points: 1, reason: `手机端专注 ${elapsedMin} 分钟确认离开：${reason}`, source: 'focus-guard' });
            } else if (!focusGuard.bonusGranted) {
                focusGuard.bonusGranted = true;
                currentTask.bonusGranted = true;
                addBonusRecord({ amount: 1, reason: `手机端专注满 ${elapsedMin} 分钟后确认离开`, source: 'focus-guard' });
            }
        }

        function queueFocusLeaveConfirm(reason) {
            const now = Date.now();
            if (!focusGuard.active || !currentTask || focusLeaveState.pending || focusLeaveState.visible || now - focusGuard.violationCooldownAt < 10000) return;
            focusGuard.violationCooldownAt = now;
            focusLeaveState.pending = true;
            focusLeaveState.reason = reason;
        }

        function recordFocusGuardViolation(reason) {
            queueFocusLeaveConfirm(reason);
        }

        function setMobileFocusHint(visible) {
            document.getElementById('mobile-focus-badge').classList.toggle('hidden', !visible);
            document.getElementById('mobile-focus-tip').classList.toggle('hidden', !visible);
        }

        async function activateMobileFocusMode(taskName) {
            focusGuard.active = true;
            focusGuard.immersive = true;
            focusGuard.targetTask = taskName;
            focusGuard.violationCooldownAt = 0;
            focusGuard.bonusGranted = false;
            const box = document.getElementById('current-task-container');
            box.classList.add('fixed', 'inset-3', 'z-40', 'overflow-auto');
            setMobileFocusHint(true);
            await tryEnterFocusFullscreen();
        }

        async function deactivateMobileFocusMode() {
            focusGuard.active = false;
            focusGuard.immersive = false;
            focusGuard.targetTask = '';
            focusGuard.bonusGranted = false;
            const box = document.getElementById('current-task-container');
            box.classList.remove('fixed', 'inset-3', 'z-40', 'overflow-auto');
            setMobileFocusHint(false);
            await exitFocusFullscreen();
        }

        function hideFocusReminder() {
            const modal = document.getElementById('focus-reminder-modal');
            if (!modal) return;
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            focusReminderVisible = false;
        }

        function showFocusReminder(elapsedMin) {
            const modal = document.getElementById('focus-reminder-modal');
            if (!modal) return;
            document.getElementById('focus-reminder-title').textContent = '该起来活动一下了';
            document.getElementById('focus-reminder-elapsed').textContent = `${elapsedMin} 分钟`;
            document.getElementById('focus-reminder-message').textContent = `你已经连续专注 ${elapsedMin} 分钟了。现在起身走两步、转转肩颈、活动一下腰背，再回来继续会更稳。`;
            document.getElementById('focus-reminder-ok').textContent = '我去活动一下';
            document.getElementById('focus-reminder-continue').textContent = '继续专注';
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            focusReminderVisible = true;
        }

        function initFocusReminder() {
            ['focus-reminder-close', 'focus-reminder-ok', 'focus-reminder-continue'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('click', hideFocusReminder);
            });
            const modal = document.getElementById('focus-reminder-modal');
            if (modal) {
                modal.addEventListener('click', e => {
                    if (e.target === modal) hideFocusReminder();
                });
            }
        }

        function updateFocusReliefDisplay() {
            const el = document.getElementById('current-backpain-count');
            if (!el) return;
            const dateStr = getTodayStr();
            ensureDateDataExists(dateStr);
            ensureFocusReliefDateExists(dateStr);
            const count = D.focusReliefData.records[dateStr].count || 0;
            el.textContent = `实在腰疼：今日 ${count} 次`;
            el.className = count > 2
                ? 'mt-3 text-xs sm:text-sm font-black text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full'
                : 'mt-3 text-xs sm:text-sm font-black text-danger bg-danger/10 px-3 py-1.5 rounded-full';
        }

        function finishCurrentTask() {
            if (!currentTask) return;
            clearInterval(taskTimer);
            const t = getTodayStr();
            ensureDateDataExists(t);
            const duration = Math.floor((Date.now() - currentTask.startTimestamp) / 60000);
            if (duration >= 45 && !currentTask.bonusGranted) {
                currentTask.bonusGranted = true;
                addBonusRecord({ dateStr: t, amount: 1, reason: `${currentTask.name} 专注满 ${duration} 分钟`, source: 'focus-complete' });
            }
            D.taskData[t].push({
                id: 't_' + Date.now(),
                name: currentTask.name,
                startTime: currentTask.startTime,
                endTime: getTimeStr(),
                duration
            });
            currentTask = null;
            hideFocusReminder();
            hideFocusLeaveConfirm();
            focusLeaveState.pending = false;
            focusLeaveState.reason = '';
            document.getElementById('current-task-container').classList.add('hidden');
            deactivateMobileFocusMode();
            saveData();
            updateFocusReliefDisplay();
            renderTodayTasksTimeline();
            renderPenaltySummary();
        }

        function handleBackPainExit() {
            if (!currentTask) return;
            const dateStr = getTodayStr();
            ensureDateDataExists(dateStr);
            ensureFocusReliefDateExists(dateStr);
            const record = D.focusReliefData.records[dateStr];
            record.count += 1;
            record.history.unshift({ time: getTimeStr(), task: currentTask.name });
            const advice = getFocusReliefAdvice(record);
            finishCurrentTask();
            if (advice) {
                showFocusReminder(record.count * 45 || 45);
                document.getElementById('focus-reminder-title').textContent = '腰背已经在报警了';
                document.getElementById('focus-reminder-message').textContent = advice;
                document.getElementById('focus-reminder-elapsed').textContent = `已用 ${record.count} 次`;
                document.getElementById('focus-reminder-ok').textContent = '知道了';
                document.getElementById('focus-reminder-continue').textContent = '稍后再看';
            }
        }

        function initFocusLeaveConfirm() {
            const stay = document.getElementById('focus-leave-stay');
            const backPainBtn = document.getElementById('focus-leave-backpain');
            const confirmBtn = document.getElementById('focus-leave-confirm');
            const close = document.getElementById('focus-leave-close');
            if (stay) stay.addEventListener('click', () => {
                focusLeaveState.pending = false;
                focusLeaveState.reason = '';
                hideFocusLeaveConfirm();
            });
            if (backPainBtn) backPainBtn.addEventListener('click', () => {
                focusLeaveState.pending = false;
                focusLeaveState.reason = '实在腰疼';
                hideFocusLeaveConfirm();
                handleBackPainExit();
            });
            if (close) close.addEventListener('click', () => {
                focusLeaveState.pending = false;
                focusLeaveState.reason = '';
                hideFocusLeaveConfirm();
            });
            if (confirmBtn) confirmBtn.addEventListener('click', () => {
                const reason = focusLeaveState.reason || '离开专注界面';
                settleFocusLeave(reason);
                finishCurrentTask();
            });
        }

        function loadLocalData() {
            const raw = {};
            DATA_KEYS.forEach(k => {
                try {
                    raw[k] = JSON.parse(localStorage.getItem(k)) || getDefaultDataValue(k);
                } catch (e) {
                    raw[k] = getDefaultDataValue(k);
                }
            });
            D = normalizeDataStore(raw);
        }

        function writeLocalData(touch = true) {
            DATA_KEYS.forEach(k => localStorage.setItem(k, JSON.stringify(D[k])));
            if (touch) {
                const meta = getSyncMeta();
                meta.localUpdatedAt = new Date().toISOString();
                saveSyncMeta(meta);
            }
        }

        function getSyncSettings() {
            try {
                return { apiBase: '', accessToken: '', autoSync: true, ...(JSON.parse(localStorage.getItem(SYNC_SETTINGS_KEY)) || {}) };
            } catch (e) {
                return { apiBase: '', accessToken: '', autoSync: true };
            }
        }

        function saveSyncSettingsValue(settings) {
            localStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(settings));
        }

        function getSyncMeta() {
            try {
                return { localUpdatedAt: null, lastSyncedAt: null, lastRemoteUpdatedAt: null, ...(JSON.parse(localStorage.getItem(SYNC_META_KEY)) || {}) };
            } catch (e) {
                return { localUpdatedAt: null, lastSyncedAt: null, lastRemoteUpdatedAt: null };
            }
        }

        function saveSyncMeta(meta) {
            localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
            renderSyncMeta();
        }

        function normalizeApiBase(url) {
            return (url || '').trim().replace(/\/+$/, '');
        }

        function isCloudConfigured() {
            const s = getSyncSettings();
            return !!(normalizeApiBase(s.apiBase) && (s.accessToken || '').trim());
        }

        function setSyncStatus(message, tone = 'muted') {
            const el = document.getElementById('sync-status');
            if (!el) return;
            const toneMap = {
                muted: 'text-gray-500',
                info: 'text-blue-600',
                success: 'text-green-600',
                warning: 'text-amber-600',
                danger: 'text-red-600'
            };
            el.className = `mt-4 text-sm font-bold ${toneMap[tone] || toneMap.muted}`;
            el.textContent = message;
        }

        function renderSyncMeta() {
            const el = document.getElementById('sync-meta');
            if (!el) return;
            const meta = getSyncMeta();
            el.textContent = `本地最近修改：${meta.localUpdatedAt || '-'} | 最近同步：${meta.lastSyncedAt || '-'} | 云端版本：${meta.lastRemoteUpdatedAt || '-'}`;
        }

        function renderSyncSettings() {
            const s = getSyncSettings();
            const apiInput = document.getElementById('sync-api-base');
            const tokenInput = document.getElementById('sync-access-token');
            const autoInput = document.getElementById('sync-auto-enabled');
            if (apiInput) apiInput.value = s.apiBase || '';
            if (tokenInput) tokenInput.value = s.accessToken || '';
            if (autoInput) autoInput.checked = s.autoSync !== false;
            renderSyncMeta();
        }

        async function cloudRequest(path, options = {}) {
            const s = getSyncSettings();
            const apiBase = normalizeApiBase(s.apiBase);
            const accessToken = (s.accessToken || '').trim();
            if (!apiBase || !accessToken) throw new Error('请先填写后端地址和访问令牌');
            const headers = {
                'Content-Type': 'application/json',
                'X-Workspace-Token': accessToken,
                ...(options.headers || {})
            };
            const res = await fetchWithTimeout(`${apiBase}${path}`, { ...options, headers }, 8000);
            let body = null;
            try { body = await res.json(); } catch (e) { body = null; }
            if (!res.ok) throw new Error((body && body.error) || `请求失败：${res.status}`);
            return body;
        }

        function startClock() {
            const clockEl = document.getElementById('current-date-time');
            if (!clockEl) return;
            const renderClock = () => {
                clockEl.textContent = new Date().toLocaleString();
            };
            renderClock();
            setInterval(renderClock, 1000);
        }

        async function testCloudConnection() {
            const result = await cloudRequest('/api/health', { method: 'GET' });
            setSyncStatus('后端连接正常。', 'success');
            return result;
        }

        async function pullRemoteData({ force = false, silent = false } = {}) {
            if (!isCloudConfigured()) {
                if (!silent) setSyncStatus('未配置云同步，当前仅本地保存。', 'warning');
                return false;
            }
            if (!silent) setSyncStatus('正在从云端读取数据...', 'info');
            const meta = getSyncMeta();
            const result = await cloudRequest('/api/workspace', { method: 'GET' });
            if (!result.exists || !result.payload || !result.payload.data) {
                if (!silent) setSyncStatus('云端还没有数据，保留当前本地内容。', 'warning');
                return false;
            }
            const remoteUpdatedAt = result.payload.updatedAt || null;
            if (!force && meta.localUpdatedAt && remoteUpdatedAt && meta.localUpdatedAt > remoteUpdatedAt) {
                await pushRemoteData({ silent: true });
                if (!silent) setSyncStatus('本地数据更新，已自动上传覆盖云端。', 'success');
                return true;
            }
            D = normalizeDataStore(result.payload.data);
            ensureDateDataExists(getTodayStr());
            writeLocalData(false);
            saveSyncMeta({
                ...meta,
                localUpdatedAt: remoteUpdatedAt || meta.localUpdatedAt,
                lastSyncedAt: new Date().toISOString(),
                lastRemoteUpdatedAt: remoteUpdatedAt || meta.lastRemoteUpdatedAt
            });
            if (!silent) setSyncStatus('已从云端拉取最新数据。', 'success');
            return true;
        }

        async function pushRemoteData({ silent = false } = {}) {
            if (!isCloudConfigured()) {
                if (!silent) setSyncStatus('未配置云同步，无法上传。', 'warning');
                return false;
            }
            if (syncInFlight) {
                syncQueued = true;
                return false;
            }
            syncInFlight = true;
            if (!silent) setSyncStatus('正在上传到云端...', 'info');
            const updatedAt = new Date().toISOString();
            try {
                const result = await cloudRequest('/api/workspace', {
                    method: 'PUT',
                    body: JSON.stringify({
                        data: D,
                        updatedAt,
                        client: 'phd-workspace-web'
                    })
                });
                writeLocalData(false);
                saveSyncMeta({
                    ...getSyncMeta(),
                    localUpdatedAt: updatedAt,
                    lastSyncedAt: updatedAt,
                    lastRemoteUpdatedAt: result.updatedAt || updatedAt
                });
                setSyncStatus(silent ? '已自动同步到云端。' : '已上传到云端。', 'success');
                return true;
            } finally {
                syncInFlight = false;
                if (syncQueued) {
                    syncQueued = false;
                    setTimeout(() => pushRemoteData({ silent: true }), 200);
                }
            }
        }

        function scheduleRemoteSave() {
            const settings = getSyncSettings();
            if (!settings.autoSync || !isCloudConfigured()) return;
            clearTimeout(syncDebounceTimer);
            setSyncStatus('本地已保存，等待自动同步...', 'info');
            syncDebounceTimer = setTimeout(() => {
                pushRemoteData({ silent: true }).catch(err => setSyncStatus(`自动同步失败：${err.message}`, 'danger'));
            }, 1200);
        }

        function parseTimeToMinutes(timeStr) {
            if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return null;
            const [h, m] = timeStr.split(':').map(Number);
            if (Number.isNaN(h) || Number.isNaN(m)) return null;
            return h * 60 + m;
        }

        function isWorkCheckInOk(timeStr) {
            const minutes = parseTimeToMinutes(timeStr);
            return minutes !== null && minutes >= 9 * 60 && minutes <= 9 * 60 + 30;
        }

        function isWorkCheckOutOk(timeStr) {
            const minutes = parseTimeToMinutes(timeStr);
            return minutes !== null && minutes >= 20 * 60;
        }

        function normalizeCheckinRecord(record) {
            if (!record) {
                return { work: { checkIn: null, checkOut: null, status: { checkIn: false, checkOut: false } } };
            }
            if (record.work) {
                record.work.status = {
                    checkIn: !!record.work.status?.checkIn || isWorkCheckInOk(record.work.checkIn),
                    checkOut: !!record.work.status?.checkOut || isWorkCheckOutOk(record.work.checkOut)
                };
                return record;
            }

            const legacyPeriods = ['morning', 'afternoon', 'evening']
                .map(key => record[key])
                .filter(Boolean);
            const checkIns = legacyPeriods.map(item => item.checkIn).filter(Boolean).sort();
            const checkOuts = legacyPeriods.map(item => item.checkOut).filter(Boolean).sort();
            return {
                work: {
                    checkIn: checkIns[0] || null,
                    checkOut: checkOuts.length ? checkOuts[checkOuts.length - 1] : null,
                    status: {
                        checkIn: isWorkCheckInOk(checkIns[0] || null),
                        checkOut: isWorkCheckOutOk(checkOuts.length ? checkOuts[checkOuts.length - 1] : null)
                    }
                }
            };
        }

        function ensureDateDataExists(dateStr) {
            D.checkinData[dateStr] = normalizeCheckinRecord(D.checkinData[dateStr]);
            if (!D.phoneResistData.records[dateStr]) D.phoneResistData.records[dateStr] = { count: 0, history: [] };
            ensurePenaltyDateExists(dateStr);
            ensureBonusDateExists(dateStr);
            ensureFocusReliefDateExists(dateStr);
            if (!D.taskData[dateStr]) D.taskData[dateStr] = [];
            if (!D.timeBlocks[dateStr]) D.timeBlocks[dateStr] = [];
            if (!D.sleepData[dateStr]) D.sleepData[dateStr] = { wake: null, wakeOk: false, sleep: null, sleepOk: false };
            if (!D.habitRecords[dateStr]) D.habitRecords[dateStr] = {};
            if (!D.journalData[dateStr]) D.journalData[dateStr] = {};
            if (!D.todoData[dateStr]) D.todoData[dateStr] = [];
        }

        function updateSidebar() {
            const t = getTodayStr(); ensureDateDataExists(t);
            const work = D.checkinData[t].work;
            const bonusInfo = getBonusInfo(t);
            const workInEl = document.getElementById('sb-work-in');
            const workOutEl = document.getElementById('sb-work-out');
            const bonusTodayEl = document.getElementById('sb-bonus-today');
            const bonusTotalEl = document.getElementById('sb-bonus-total');
            workInEl.textContent = work.checkIn || '未打卡';
            workInEl.className = work.checkIn ? (work.status.checkIn ? 'text-success' : 'text-danger') : 'text-gray-300';
            workOutEl.textContent = work.checkOut || '未打卡';
            workOutEl.className = work.checkOut ? (work.status.checkOut ? 'text-success' : 'text-danger') : 'text-gray-300';
            bonusTodayEl.textContent = bonusInfo.label;
            bonusTodayEl.className = bonusInfo.earned ? 'text-warning' : (bonusInfo.holiday.bonusEligible ? 'text-primary' : 'text-gray-300');
            bonusTotalEl.textContent = `${getTotalBonusCount()}`;
            bonusTotalEl.className = getTotalBonusCount() > 0 ? 'text-warning' : 'text-gray-300';
            document.getElementById('sb-phone').textContent = `${D.phoneResistData.records[t].count} 次`;
            
            const sbTask = document.getElementById('sb-task');
            sbTask.textContent = currentTask ? currentTask.name : '无';
            sbTask.className = currentTask ? 'text-secondary truncate max-w-[80px] sm:max-w-[100px] text-right' : 'text-gray-300 truncate max-w-[80px] sm:max-w-[100px] text-right';
            
            const tot = D.habitConfig.length; let done = 0;
            if (tot > 0 && D.habitRecords[t]) D.habitConfig.forEach(h => { if (D.habitRecords[t][h.id]) done++; });
            const pct = tot === 0 ? 0 : Math.round((done/tot)*100);
            const sbHabit = document.getElementById('sb-habit');
            sbHabit.textContent = `${pct}%`;
            sbHabit.className = pct === 100 ? 'text-success' : (pct > 0 ? 'text-success/70' : 'text-gray-300');
        }

        async function initData() {
            loadLocalData();
            loadHolidayCache();
            ensureDateDataExists(getTodayStr());
            syncAutoPenalties(getTodayStr());
            renderSyncSettings();
            writeLocalData(false);
            ensureHolidayYearLoaded(new Date().getFullYear()).then(() => {
                if(typeof updateSidebar === 'function') updateSidebar();
                if(typeof renderCheckinCalendar === 'function') renderCheckinCalendar();
            });
            if (isCloudConfigured()) {
                try {
                    await pullRemoteData({ silent: true });
                    setSyncStatus('已载入云端数据。', 'success');
                } catch (err) {
                    setSyncStatus(`云端读取失败，当前使用本地缓存：${err.message}`, 'danger');
                }
            } else {
                setSyncStatus('未配置云同步，当前仅本地保存。', 'warning');
            }
            checkAchievements();
            if(typeof updateSidebar === 'function') updateSidebar();
        }
        
        function saveData(options = {}) { 
            writeLocalData(options.touchLocalMeta !== false);
            checkAchievements(); 
            if(typeof updateSidebar === 'function') updateSidebar(); 
            if (!options.skipRemote) scheduleRemoteSave();
        }

        function initNavigation() {
            const sections = ['checkin', 'hourly', 'tasks', 'habits', 'journal', 'phone', 'achievements', 'stats', 'sync'];
            sections.forEach(sec => {
                const btn = document.getElementById(`nav-${sec}`);
                if(btn) btn.addEventListener('click', function() {
                    sections.forEach(s => { const el = document.getElementById(`${s}-section`); if(el) el.classList.add('hidden'); const nEl = document.getElementById(`nav-${s}`); if(nEl) nEl.className = nEl.className.replace(/bg-\w+ text-white shadow-md/, 'hover:bg-gray-50 text-textmain'); });
                    document.getElementById(`${sec}-section`).classList.remove('hidden');
                    this.className = `w-full text-left px-3 py-2.5 md:px-5 md:py-3.5 rounded-xl bg-primary text-white font-bold flex items-center justify-between shadow-md text-sm md:text-base`;
                    
                    if(sec === 'hourly') renderTimeBlocksCalendar(document.getElementById('block-date-picker').value || getTodayStr());
                    if(sec === 'stats') { document.querySelector('.stats-period-btn.bg-white').click(); }
                    if(sec === 'checkin') updateCheckinUI();
                    if(sec === 'phone') { renderPhoneHistory(); renderPenaltySummary(); }
                    if(sec === 'habits') renderHabitsForDate(getTodayStr());
                    if(sec === 'journal') document.getElementById('journal-date-picker').dispatchEvent(new Event('change'));
                    if(sec === 'tasks') { renderTodos(); renderTodayTasksTimeline(); }
                    if(sec === 'achievements') renderAchievements();
                });
            });
        }

        // 璧峰眳鎵撳崱涓庤€冨嫟
        function initCheckin() {
            const t = getTodayStr();
            ensureDateDataExists(t);
            document.getElementById('btn-wake').onclick = () => { D.sleepData[t].wake = getTimeStr(); D.sleepData[t].wakeOk = (new Date().getHours() < 9); syncAutoPenalties(t); saveData(); updateCheckinUI(); };
            document.getElementById('btn-sleep').onclick = () => { const now=new Date(), h=now.getHours(); const target = h>=0&&h<DAY_ROLLOVER_HOUR?getTodayStr():t; ensureDateDataExists(target); D.sleepData[target].sleep = getTimeStr(); D.sleepData[target].sleepOk = (h>=18&&(h<23||(h===23&&now.getMinutes()<=30))); syncAutoPenalties(target); saveData(); updateCheckinUI(); };
            document.getElementById('work-checkin').onclick = () => {
                const timeStr = getTimeStr();
                D.checkinData[t].work.checkIn = timeStr;
                D.checkinData[t].work.status.checkIn = isWorkCheckInOk(timeStr);
                syncAutoPenalties(t);
                saveData();
                updateCheckinUI();
            };
            document.getElementById('work-checkout').onclick = () => {
                const timeStr = getTimeStr();
                D.checkinData[t].work.checkOut = timeStr;
                D.checkinData[t].work.status.checkOut = isWorkCheckOutOk(timeStr);
                syncAutoPenalties(t);
                saveData();
                updateCheckinUI();
            };
            document.getElementById('cal-prev').onclick = () => { currentCalDate.setMonth(currentCalDate.getMonth()-1); renderCheckinCalendar(); };
            document.getElementById('cal-next').onclick = () => { currentCalDate.setMonth(currentCalDate.getMonth()+1); renderCheckinCalendar(); };
            updateCheckinUI();
            renderCheckinCalendar();
        }

        function updateCheckinUI() {
            const t = getTodayStr(); ensureDateDataExists(t);
            const sd = D.sleepData[t];
            const wd = D.checkinData[t].work;
            const bonusInfo = getBonusInfo(t);
            const wb = document.getElementById('btn-wake'), sb = document.getElementById('btn-sleep');
            if(sd.wake){ document.getElementById('wake-time-display').textContent=`已打卡 ${sd.wake}`; wb.disabled=true; wb.classList.add('opacity-50'); } else { document.getElementById('wake-time-display').textContent=`-`; wb.disabled=false; wb.classList.remove('opacity-50'); }
            if(sd.sleep){ document.getElementById('sleep-time-display').textContent=`已打卡 ${sd.sleep}`; sb.disabled=true; sb.classList.add('opacity-50'); } else { document.getElementById('sleep-time-display').textContent=`-`; sb.disabled=false; sb.classList.remove('opacity-50'); }
            const inB = document.getElementById('work-checkin');
            const outB = document.getElementById('work-checkout');
            inB.disabled = wd.checkIn !== null;
            outB.disabled = wd.checkOut !== null || wd.checkIn === null;
            inB.classList.toggle('opacity-50', inB.disabled);
            outB.classList.toggle('opacity-50', outB.disabled);
            document.getElementById('td-work-in').textContent = wd.checkIn || '-';
            document.getElementById('td-work-out').textContent = wd.checkOut || '-';
            document.getElementById('td-work-bonus').textContent = bonusInfo.label;
            renderCheckinCalendar();
        }

        function renderCheckinCalendar() {
            try {
            const y = currentCalDate.getFullYear(), m = currentCalDate.getMonth();
            const yearKey = String(y);
            if (!holidayCache[yearKey] && !HOLIDAY_FALLBACK[yearKey]) {
                ensureHolidayYearLoaded(yearKey).then(() => {
                    if (currentCalDate.getFullYear() === y && currentCalDate.getMonth() === m) renderCheckinCalendar();
                });
            }
            document.getElementById('cal-month-year').textContent = `${y}年${m + 1}月`;
            const firstDay = new Date(y, m, 1).getDay(), daysInM = new Date(y, m+1, 0).getDate();
            const grid = document.getElementById('cal-grid'); grid.innerHTML = '';
            for(let i=0; i<firstDay; i++) grid.innerHTML += '<div></div>';
            for(let i=1; i<=daysInM; i++) {
                const dStr = `${y}-${String(m+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
                ensureDateDataExists(dStr);
                const sd = D.sleepData[dStr] || {}, cd = normalizeCheckinRecord(D.checkinData[dStr]);
                const holiday = getHolidayStatus(dStr);
                const bonusInfo = getBonusInfo(dStr);
                let dots = '';
                if(holiday.kind === 'holiday') dots += '<span class="w-1.5 h-1.5 bg-red-400 rounded-full"></span>';
                else if(holiday.kind === 'weekend') dots += '<span class="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>';
                else if(holiday.kind === 'makeup') dots += '<span class="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>';
                if(sd.wakeOk) dots += '<span class="w-1.5 h-1.5 bg-warning rounded-full"></span>';
                if(sd.sleepOk) dots += '<span class="w-1.5 h-1.5 bg-secondary rounded-full"></span>';
                if(cd?.work?.status?.checkIn && cd?.work?.status?.checkOut) dots += '<span class="w-1.5 h-1.5 bg-primary rounded-full"></span>';
                else if(cd?.work?.checkIn || cd?.work?.checkOut) dots += '<span class="w-1.5 h-1.5 bg-danger rounded-full"></span>';
                if(bonusInfo.earned) dots += '<span class="w-1.5 h-1.5 bg-warning rounded-full"></span>';
                const textTone = holiday.kind === 'holiday' ? 'text-red-600' : (holiday.kind === 'makeup' ? 'text-amber-600' : 'text-textmain');
                const titleParts = [holiday.label];
                if (bonusInfo.earned) titleParts.push(`已获得 Bonus +${bonusInfo.total}`);
                grid.innerHTML += `<div class="py-1 flex flex-col items-center justify-center rounded-lg ${dStr===getTodayStr()?'bg-blue-50':''}" title="${titleParts.join('｜')}"><span class="text-xs font-bold mb-0.5 ${textTone}">${i}</span><div class="text-[10px] h-3 leading-3 ${textTone}">${holiday.shortLabel}</div><div class="flex gap-0.5 h-1.5 mt-0.5">${dots}</div></div>`;
            }
            } catch (err) {
                console.error('考勤日历渲染失败：', err);
                document.getElementById('cal-month-year').textContent = `${currentCalDate.getFullYear()}年${currentCalDate.getMonth() + 1}月`;
                document.getElementById('cal-grid').innerHTML = '<div class="col-span-7 py-6 text-center text-sm text-danger font-bold">考勤日历渲染失败，请刷新页面后重试</div>';
            }
        }

        // 鏃堕棿鍧楁棩鍘?
        function initTimeBlocksCalendar() {
            const dp = document.getElementById('block-date-picker'); dp.value = getTodayStr();
            dp.addEventListener('change', e => renderTimeBlocksCalendar(e.target.value));
            document.getElementById('btn-add-block').addEventListener('click', () => {
                const date = dp.value, start = document.getElementById('tb-start').value, end = document.getElementById('tb-end').value, cat = document.getElementById('tb-cat').value, desc = document.getElementById('tb-desc').value.trim();
                if(!start || !end || !desc) return alert('请填写完整的时间段信息');
                ensureDateDataExists(date); D.timeBlocks[date].push({ id: 'b_'+Date.now(), start, end, category: cat, desc });
                document.getElementById('tb-desc').value = ''; saveData(); renderTimeBlocksCalendar(date);
            });
            renderTimeBlocksCalendar(dp.value);
        }

        function renderTimeBlocksCalendar(dateStr) {
            const grid = document.getElementById('blocks-grid'); const items = document.getElementById('blocks-items');
            grid.innerHTML = ''; items.innerHTML = '';
            const pxPerH = 24; 
            for(let i = 0; i <= 24; i++) grid.innerHTML += `<div class="absolute w-full border-t border-gray-200 flex items-start z-0" style="top: ${i * pxPerH}px"><span class="text-[10px] font-bold text-gray-400 w-12 text-right pr-2 -mt-1.5 bg-gray-50">${String(i).padStart(2,'0')}:00</span></div>`;

            (D.timeBlocks[dateStr] || []).forEach(b => {
                const conf = CAT_MAP[b.category];
                let [sh,sm] = b.start.split(':').map(Number); let [eh,em] = b.end.split(':').map(Number);
                if(eh < sh) eh += 24;
                let top = (sh + sm/60) * pxPerH; let height = ((eh - sh) + (em - sm)/60) * pxPerH;
                if (top < 0) { height += top; top = 0; } if (height < 20) height = 20;

                items.innerHTML += `<div class="absolute left-0 right-0 rounded p-1 border-l-4 border-${conf.color} bg-${conf.color}/20 overflow-hidden shadow-sm hover:shadow-md hover:z-20 transition-all group flex justify-between items-start" style="top: ${top}px; height: ${height}px;">
                    <div class="flex items-center truncate leading-none"><span class="text-[10px] font-black text-${conf.color} mr-1">${conf.label}</span><span class="text-[9px] text-gray-600 font-bold mr-1">${b.start}-${b.end}</span><span class="text-[10px] font-bold text-textmain truncate">${b.desc}</span></div>
                    <button class="text-${conf.color} hover:text-danger opacity-0 group-hover:opacity-100 p-0 text-xs" onclick="deleteTimeBlock('${dateStr}', '${b.id}')"><i class="fa fa-trash"></i></button>
                </div>`;
            });
        }

        window.deleteTimeBlock = function(dateStr, id) {
            if(confirm('删除这个时间段记录？')) { D.timeBlocks[dateStr] = D.timeBlocks[dateStr].filter(x => x.id !== id); saveData(); renderTimeBlocksCalendar(dateStr); }
        }

        // ================= Todo 鏍稿績寮哄寲閮ㄥ垎 =================
        function initTasks() {
            const addBtn = document.getElementById('btn-add-todo');
            const input = document.getElementById('new-todo-input');
            
            const addTodo = () => {
                const name = input.value.trim(); 
                if(name){ 
                    const t = getTodayStr(); ensureDateDataExists(t);
                    D.todoData[t].push({id:'td_'+Date.now(), name:name, done:false}); 
                    input.value = ''; 
                    saveData(); 
                    renderTodos(); 
                }
            };

            addBtn.onclick = addTodo;
            input.onkeypress = (e) => { if(e.key === 'Enter') addTodo(); };

            document.getElementById('end-task').onclick = () => { 
                if(currentTask){ 
                    finishCurrentTask();
                }
            };
        }

        function renderTodos() { 
            const container = document.getElementById('todo-list-container'); 
            container.innerHTML = ''; 
            const todayTodos = D.todoData[getTodayStr()] || [];
            
            if (todayTodos.length === 0) {
                container.innerHTML = '<div class="text-center text-gray-400 text-sm py-4">今天还没有安排任务</div>';
                return;
            }

            todayTodos.forEach(t => { 
                const mobileOnly = !isProbablyMobileDevice();
                container.innerHTML += `
                <div class="flex items-center justify-between p-2.5 sm:p-3 bg-white rounded-xl border border-gray-100 shadow-sm mb-2 group transition-all hover:border-secondary/30">
                    <label class="flex items-center cursor-pointer flex-1 truncate mr-2">
                        <input type="checkbox" class="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded checked:bg-secondary checked:border-secondary transition-all cursor-pointer mr-3 flex-shrink-0" ${t.done ? 'checked' : ''} onchange="toggleTodo('${t.id}')">
                        <span class="font-bold text-sm text-textmain peer-checked:line-through peer-checked:text-gray-400 truncate transition-all" title="${t.name}">${t.name}</span>
                    </label>
                    <div class="flex items-center gap-1">
                        <button onclick="startTask('${t.name}')" class="${mobileOnly ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : 'text-secondary hover:bg-secondary hover:text-white'} w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-colors" title="${mobileOnly ? '仅手机端可开启专注' : '开始心流专注'}" ${mobileOnly ? 'disabled' : ''}>
                            <i class="fa fa-play text-xs sm:text-sm"></i>
                        </button>
                        <button onclick="deleteTodo('${t.id}')" class="text-gray-300 hover:text-danger hover:bg-danger/10 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-colors" title="删除任务">
                            <i class="fa fa-trash text-xs sm:text-sm"></i>
                        </button>
                    </div>
                </div>`; 
            }); 
        }

        window.toggleTodo = function(id) {
            const t = getTodayStr();
            const todo = D.todoData[t].find(x => x.id === id);
            if (todo) { todo.done = !todo.done; saveData(); renderTodos(); }
        };

        window.deleteTodo = function(id) {
            const t = getTodayStr();
            D.todoData[t] = D.todoData[t].filter(x => x.id !== id);
            saveData(); renderTodos();
        };

        window.startTask = async n => { 
            if (!isProbablyMobileDevice()) {
                alert('仅手机端可开启专注模式。');
                return;
            }
            currentTask = {name:n, startTime:getTimeStr(), startTimestamp:Date.now(), breakReminderCount: 0, bonusGranted: false}; 
            document.getElementById('current-task-name').textContent = n; 
            document.getElementById('current-task-container').classList.remove('hidden'); 
            document.getElementById('current-real-time').textContent = getTimeStr();
            updateFocusReliefDisplay();
            hideFocusReminder();
            hideFocusLeaveConfirm();
            focusLeaveState.pending = false;
            focusLeaveState.reason = '';
            if (isProbablyMobileDevice()) {
                const enableGuard = confirm('检测到你正在手机端开启专注。是否开启“手机端专注约束模式”？\n\n规则：\n- 15 分钟内确认离开：扣 2 点\n- 15-45 分钟确认离开：扣 1 点\n- 满 45 分钟正常结束或确认离开：奖励 1 Bonus');
                if (enableGuard) await activateMobileFocusMode(n);
                else setMobileFocusHint(false);
            } else {
                setMobileFocusHint(false);
            }
            updateSidebar();
            taskTimer = setInterval(() => {
                if (!currentTask) return;
                const e = Date.now() - currentTask.startTimestamp; 
                const elapsedMin = Math.floor(e / 60000);
                const nextReminderCount = Math.floor(elapsedMin / 45);
                document.getElementById('current-task-time').textContent = `${String(Math.floor(e/3600000)).padStart(2,'0')}:${String(Math.floor((e%3600000)/60000)).padStart(2,'0')}:${String(Math.floor((e%60000)/1000)).padStart(2,'0')}`;
                document.getElementById('current-real-time').textContent = getTimeStr();
                if (nextReminderCount > currentTask.breakReminderCount) {
                    currentTask.breakReminderCount = nextReminderCount;
                    if (!focusReminderVisible) showFocusReminder(nextReminderCount * 45);
                }
            }, 1000); 
        };

        function renderTodayTasksTimeline() { 
            const container = document.getElementById('today-tasks-timeline'); 
            const emptyMsg = document.getElementById('empty-timeline-msg');
            container.innerHTML = ''; 
            const tasks = D.taskData[getTodayStr()] || [];
            
            if (tasks.length === 0) {
                emptyMsg.classList.remove('hidden');
            } else {
                emptyMsg.classList.add('hidden');
                tasks.forEach(t => { 
                    container.innerHTML += `
                    <div class="relative">
                        <div class="absolute -left-[21px] sm:-left-[29px] top-1 w-3 h-3 bg-secondary rounded-full border-2 border-white shadow-sm"></div>
                        <div class="bg-gray-50 hover:bg-white p-3 rounded-xl border border-gray-100 shadow-sm transition-colors text-sm mb-3">
                            <div class="flex justify-between items-start mb-1">
                                <strong class="font-black text-textmain">${t.name}</strong>
                                <span class="text-xs font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded">${t.duration}m</span>
                            </div>
                            <div class="text-xs text-gray-500 font-medium"><i class="fa fa-clock-o mr-1"></i>${t.startTime} - ${t.endTime}</div>
                        </div>
                    </div>`; 
                }); 
            }
        }

        // 涔犳儻鎵撳崱
        function initHabits() {
            const dp = document.getElementById('habit-date-picker'); dp.value = getTodayStr();
            dp.addEventListener('change', e => renderHabitsForDate(e.target.value));
            document.getElementById('btn-add-habit').addEventListener('click', () => {
                const name = document.getElementById('new-habit-input').value.trim(); if(!name) return;
                D.habitConfig.push({ id: 'h_'+Date.now(), name }); document.getElementById('new-habit-input').value = ''; saveData(); renderHabitsForDate(dp.value);
            });
            renderHabitsForDate(dp.value);
        }

        function renderHabitsForDate(dateStr) {
            const container = document.getElementById('habits-list-container'); container.innerHTML = '';
            ensureDateDataExists(dateStr);
            D.habitConfig.forEach(h => {
                const isDone = !!D.habitRecords[dateStr][h.id];
                container.innerHTML += `
                <div class="flex items-center justify-between bg-white p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm transition-colors">
                    <label class="flex items-center cursor-pointer flex-1 group">
                        <div class="relative flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4">
                            <input type="checkbox" class="habit-chk peer appearance-none w-5 h-5 sm:w-6 sm:h-6 border-2 border-gray-300 rounded-md checked:bg-success checked:border-success transition-all cursor-pointer" ${isDone?'checked':''} data-id="${h.id}">
                            <i class="fa fa-check absolute text-white text-xs opacity-0 peer-checked:opacity-100 pointer-events-none"></i>
                        </div>
                        <span class="text-sm sm:text-base font-bold text-textmain peer-checked:line-through peer-checked:text-gray-400 transition-all">${h.name}</span>
                    </label>
                    <button class="delete-habit text-gray-300 hover:text-danger p-2" onclick="deleteHabit('${h.id}', '${dateStr}')"><i class="fa fa-trash"></i></button>
                </div>`;
            });
            document.querySelectorAll('.habit-chk').forEach(chk => { chk.addEventListener('change', function() { D.habitRecords[dateStr][this.getAttribute('data-id')] = this.checked; saveData(); updateHabitProgress(dateStr); }); });
            updateHabitProgress(dateStr);
        }

        window.deleteHabit = function(id, dateStr) {
            if(confirm('删除这个习惯？')) { D.habitConfig = D.habitConfig.filter(x => x.id !== id); saveData(); renderHabitsForDate(dateStr); }
        }

        function updateHabitProgress(dateStr) {
            const tot = D.habitConfig.length; let done = 0;
            if (tot > 0 && D.habitRecords[dateStr]) { D.habitConfig.forEach(h => { if (D.habitRecords[dateStr][h.id]) done++; }); }
            const pct = tot === 0 ? 0 : Math.round((done/tot)*100);
            document.getElementById('habit-progress-text').textContent = `完成度 ${pct}%`; document.getElementById('habit-progress-bar').style.width = `${pct}%`;
        }

        // ================= 每日复盘 =================
        function initJournal() {
            const dp = document.getElementById('journal-date-picker');
            dp.value = getTodayStr(); // 默认显示今天
            
            const loadJournalData = (dateStr) => {
                ensureDateDataExists(dateStr);
                const record = D.journalData[dateStr] || {};
                document.getElementById('journal-proud').value = record.proud || '';
                document.getElementById('journal-change').value = record.change || '';
            };

            dp.addEventListener('change', (e) => loadJournalData(e.target.value));
            loadJournalData(dp.value);

            const saveBtn = document.getElementById('save-journal');
            saveBtn.addEventListener('click', () => {
                const dateStr = dp.value;
                ensureDateDataExists(dateStr);
                
                D.journalData[dateStr] = {
                    proud: document.getElementById('journal-proud').value.trim(),
                    change: document.getElementById('journal-change').value.trim()
                };
                saveData();
                
                const originalText = saveBtn.innerText;
                saveBtn.innerHTML = '<i class="fa fa-check mr-1"></i>已保存';
                saveBtn.classList.replace('bg-accent', 'bg-success');
                
                setTimeout(() => {
                    saveBtn.innerText = originalText;
                    saveBtn.classList.replace('bg-success', 'bg-accent');
                }, 2000);
            });
        }

        function initSync() {
            renderSyncSettings();

            document.getElementById('btn-save-sync-settings').onclick = () => {
                const settings = {
                    apiBase: normalizeApiBase(document.getElementById('sync-api-base').value),
                    accessToken: document.getElementById('sync-access-token').value.trim(),
                    autoSync: document.getElementById('sync-auto-enabled').checked
                };
                saveSyncSettingsValue(settings);
                renderSyncSettings();
                setSyncStatus(settings.apiBase && settings.accessToken ? '同步设置已保存。' : '已清空云同步设置，当前仅本地保存。', settings.apiBase && settings.accessToken ? 'success' : 'warning');
            };

            document.getElementById('btn-test-sync').onclick = async () => {
                try {
                    await testCloudConnection();
                } catch (err) {
                    setSyncStatus(`测试失败：${err.message}`, 'danger');
                }
            };

            document.getElementById('btn-pull-cloud').onclick = async () => {
                try {
                    await pullRemoteData({ force: true });
                    location.reload();
                } catch (err) {
                    setSyncStatus(`云端拉取失败：${err.message}`, 'danger');
                }
            };

            document.getElementById('btn-push-cloud').onclick = async () => {
                try {
                    await pushRemoteData();
                } catch (err) {
                    setSyncStatus(`上传失败：${err.message}`, 'danger');
                }
            };

            document.getElementById('btn-export').onclick = () => {
                const b = new Blob([JSON.stringify(D, null, 2)], { type:'application/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(b);
                a.download = `workspace_backup_${getTodayStr()}.json`;
                a.click();
            };

            document.getElementById('import-file-input').onchange = e => {
                const file = e.target.files[0];
                if (!file) return;
                const r = new FileReader();
                r.onload = ev => {
                    try {
                        D = JSON.parse(ev.target.result);
                        ensureDateDataExists(getTodayStr());
                        saveData();
                        alert('导入成功，当前页面会刷新。');
                        location.reload();
                    } catch (err) {
                        alert(`导入失败：${err.message}`);
                    }
                };
                r.readAsText(file);
            };
        }

        function initPhone() {
            const h = s => {
                const r = document.getElementById('phone-reason-input').value;
                if(r){
                    const t = getTodayStr();
                    if(s){
                        D.phoneResistData.totalCount++;
                        D.phoneResistData.records[t].count++;
                    } else {
                        addPenaltyRecord({ dateStr: t, points: 1, reason: `没忍住：${r}`, source: 'phone-fail' });
                    }
                    D.phoneResistData.records[t].history.unshift({time:getTimeStr(), reason:r, success:s});
                    saveData();
                    document.getElementById('phone-reason-input').value='';
                    renderPhoneHistory();
                    renderPenaltySummary();
                }
            };
            document.getElementById('btn-resist-success').onclick = () => h(true); document.getElementById('btn-resist-fail').onclick = () => h(false);
            document.getElementById('btn-add-penalty').onclick = () => {
                const reasonInput = document.getElementById('penalty-reason-input');
                const pointsSelect = document.getElementById('penalty-points-select');
                const reason = reasonInput.value.trim();
                if (!reason) return alert('请填写惩罚原因');
                addPenaltyRecord({ points: Number(pointsSelect.value), reason, source: 'manual' });
                reasonInput.value = '';
                saveData();
                renderPenaltySummary();
            };
        }

        function renderPhoneHistory() {
            document.getElementById('phone-resist-count').textContent=D.phoneResistData.totalCount;
            const c=document.getElementById('phone-history-list'); c.innerHTML=''; (D.phoneResistData.records[getTodayStr()].history||[]).forEach(i=>{ c.innerHTML+=`<tr><td class="px-4 sm:px-6 py-2 sm:py-3">${i.time}</td><td class="px-4 sm:px-6 py-2 sm:py-3">${i.reason}</td><td class="px-4 sm:px-6 py-2 sm:py-3 text-right">${i.success?'<span class="bg-success/20 text-green-700 px-2 py-1 rounded font-bold text-xs">成功</span>':'<span class="bg-danger/20 text-red-700 px-2 py-1 rounded font-bold text-xs">失败</span>'}</td></tr>` });
        }

        function renderPenaltySummary() {
            const settlement = getMonthlySettlement();
            document.getElementById('penalty-month-total').textContent = settlement.penaltyPoints;
            document.getElementById('bonus-month-total').textContent = settlement.bonusCount;
            document.getElementById('penalty-month-net').textContent = settlement.netPoints;
            document.getElementById('penalty-month-saving').textContent = `${settlement.saving} 元`;
            document.getElementById('stats-penalty-total').textContent = settlement.penaltyPoints;
            document.getElementById('stats-bonus-total').textContent = settlement.bonusCount;
            document.getElementById('stats-penalty-net').textContent = settlement.netPoints;
            document.getElementById('stats-penalty-saving').textContent = `${settlement.saving} 元`;

            const list = document.getElementById('penalty-history-list');
            list.innerHTML = '';
            (D.penaltyData.records[getTodayStr()] || []).forEach(item => {
                const sourceTag = item.source?.startsWith('auto-')
                    ? '<span class="ml-2 bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold text-[10px]">自动</span>'
                    : (item.source === 'manual'
                        ? '<span class="ml-2 bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold text-[10px]">手动</span>'
                        : '<span class="ml-2 bg-danger/10 text-danger px-2 py-0.5 rounded font-bold text-[10px]">约束</span>');
                list.innerHTML += `<tr><td class="px-4 sm:px-6 py-2 sm:py-3">${item.time}</td><td class="px-4 sm:px-6 py-2 sm:py-3">${item.reason}${sourceTag}</td><td class="px-4 sm:px-6 py-2 sm:py-3 text-right"><span class="bg-danger/10 text-danger px-2 py-1 rounded font-bold text-xs">-${item.points}</span></td></tr>`;
            });
            if (!list.innerHTML) {
                list.innerHTML = '<tr><td colspan="3" class="px-4 sm:px-6 py-4 text-center text-gray-400 text-sm">今天还没有惩罚记录</td></tr>';
            }

            const statsPenaltyDatePicker = document.getElementById('stats-penalty-date-picker');
            if (statsPenaltyDatePicker) renderStatsPenaltyDetails(statsPenaltyDatePicker.value || getTodayStr());

            const bonusList = document.getElementById('bonus-history-list');
            if (bonusList) {
                bonusList.innerHTML = '';
                getBonusRecordsForDate(getTodayStr()).forEach(item => {
                    const sourceTag = item.source === 'holiday'
                        ? '<span class="ml-2 inline-flex whitespace-nowrap bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold text-[10px]">休息日</span>'
                        : (String(item.source || '').startsWith('focus-')
                            ? '<span class="ml-2 inline-flex whitespace-nowrap bg-secondary/10 text-secondary px-2 py-0.5 rounded font-bold text-[10px]">专注</span>'
                            : '<span class="ml-2 inline-flex whitespace-nowrap bg-warning/10 text-amber-700 px-2 py-0.5 rounded font-bold text-[10px]">奖励</span>');
                    bonusList.innerHTML += `<tr><td class="px-4 sm:px-6 py-2 sm:py-3">${item.time || '-'}</td><td class="px-4 sm:px-6 py-2 sm:py-3">${item.reason}${sourceTag}</td><td class="px-4 sm:px-6 py-2 sm:py-3 text-right"><span class="bg-warning/10 text-warning px-2 py-1 rounded font-bold text-xs">+${item.amount}</span></td></tr>`;
                });
                if (!bonusList.innerHTML) {
                    bonusList.innerHTML = '<tr><td colspan="3" class="px-4 sm:px-6 py-4 text-center text-gray-400 text-sm">今天还没有 Bonus 明细</td></tr>';
                }
            }

            const statsDatePicker = document.getElementById('stats-bonus-date-picker');
            if (statsDatePicker) renderStatsBonusDetails(statsDatePicker.value || getTodayStr());
            renderStatsDateOverview();
        }

        function renderStatsPenaltyDetails(dateStr = getTodayStr()) {
            const list = document.getElementById('stats-penalty-history-list');
            if (!list) return;
            ensureDateDataExists(dateStr);
            list.innerHTML = '';
            (D.penaltyData.records[dateStr] || []).forEach(item => {
                const sourceTag = item.source?.startsWith('auto-')
                    ? '<span class="ml-2 bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold text-[10px]">自动</span>'
                    : (item.source === 'manual'
                        ? '<span class="ml-2 bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold text-[10px]">手动</span>'
                        : '<span class="ml-2 bg-danger/10 text-danger px-2 py-0.5 rounded font-bold text-[10px]">约束</span>');
                list.innerHTML += `<tr><td class="px-4 py-3">${item.time || '-'}</td><td class="px-4 py-3">${item.reason}${sourceTag}</td><td class="px-4 py-3 text-right"><span class="bg-danger/10 text-danger px-2 py-1 rounded font-bold text-xs">-${item.points}</span></td></tr>`;
            });
            if (!list.innerHTML) {
                list.innerHTML = '<tr><td colspan="3" class="px-4 py-4 text-center text-gray-400 text-sm">这一天还没有惩罚记录</td></tr>';
            }
        }

        function renderStatsDateOverview() {
            const grid = document.getElementById('stats-date-overview-grid');
            const monthEl = document.getElementById('stats-overview-month');
            if (!grid || !monthEl) return;
            const year = statsOverviewDate.getFullYear();
            const month = statsOverviewDate.getMonth();
            monthEl.textContent = `${year}年${month + 1}月`;
            const firstDay = new Date(year, month, 1).getDay();
            const lastDate = new Date(year, month + 1, 0).getDate();
            const selectedDate = document.getElementById('stats-bonus-date-picker')?.value || document.getElementById('stats-penalty-date-picker')?.value || getTodayStr();
            grid.innerHTML = '';

            for (let i = 0; i < firstDay; i++) {
                grid.innerHTML += '<div class="h-12 sm:h-14 rounded-xl bg-gray-50/60 border border-transparent"></div>';
            }

            for (let day = 1; day <= lastDate; day++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const bonusCount = getBonusInfo(dateStr).total;
                const penaltyCount = (D.penaltyData.records[dateStr] || []).reduce((sum, item) => sum + (Number(item.points) || 0), 0);
                const isSelected = dateStr === selectedDate;
                const hasBonus = bonusCount > 0;
                const hasPenalty = penaltyCount > 0;
                const toneClass = hasBonus && hasPenalty
                    ? 'bg-gray-900 text-white border-gray-900'
                    : hasBonus
                        ? 'bg-warning/10 text-warning border-warning/30'
                        : hasPenalty
                            ? 'bg-danger/10 text-danger border-danger/30'
                            : 'bg-white text-textmain border-gray-200';
                const marker = hasBonus && hasPenalty
                    ? '<span class="inline-flex gap-1"><span class="w-1.5 h-1.5 rounded-full bg-white"></span><span class="w-1.5 h-1.5 rounded-full bg-white/60"></span></span>'
                    : hasBonus
                        ? '<span class="w-2 h-2 rounded-full bg-warning inline-block"></span>'
                        : hasPenalty
                            ? '<span class="w-2 h-2 rounded-full bg-danger inline-block"></span>'
                            : '<span class="w-2 h-2 inline-block"></span>';
                grid.innerHTML += `<button type="button" class="h-12 sm:h-14 rounded-xl border text-xs sm:text-sm font-black flex flex-col items-center justify-center gap-1 transition-all ${toneClass} ${isSelected ? 'ring-2 ring-primary/40 scale-[1.02]' : 'hover:border-primary/30'}" data-stats-date="${dateStr}"><span>${day}</span>${marker}</button>`;
            }

            grid.querySelectorAll('[data-stats-date]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const dateStr = btn.getAttribute('data-stats-date');
                    const penaltyPicker = document.getElementById('stats-penalty-date-picker');
                    const bonusPicker = document.getElementById('stats-bonus-date-picker');
                    if (penaltyPicker) penaltyPicker.value = dateStr;
                    if (bonusPicker) bonusPicker.value = dateStr;
                    renderStatsPenaltyDetails(dateStr);
                    renderStatsBonusDetails(dateStr);
                    renderStatsDateOverview();
                });
            });
        }

        function renderStatsBonusDetails(dateStr = getTodayStr()) {
            const list = document.getElementById('stats-bonus-history-list');
            if (!list) return;
            ensureDateDataExists(dateStr);
            list.innerHTML = '';
            getBonusRecordsForDate(dateStr).forEach(item => {
                const sourceTag = item.source === 'holiday'
                    ? '<span class="ml-2 inline-flex whitespace-nowrap bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold text-[10px]">休息日</span>'
                    : (String(item.source || '').startsWith('focus-')
                        ? '<span class="ml-2 inline-flex whitespace-nowrap bg-secondary/10 text-secondary px-2 py-0.5 rounded font-bold text-[10px]">专注</span>'
                        : '<span class="ml-2 inline-flex whitespace-nowrap bg-warning/10 text-amber-700 px-2 py-0.5 rounded font-bold text-[10px]">奖励</span>');
                list.innerHTML += `<tr><td class="px-4 py-3">${item.time || '-'}</td><td class="px-4 py-3">${item.reason}${sourceTag}</td><td class="px-4 py-3 text-right"><span class="bg-warning/10 text-warning px-2 py-1 rounded font-bold text-xs">+${item.amount}</span></td></tr>`;
            });
            if (!list.innerHTML) {
                list.innerHTML = '<tr><td colspan="3" class="px-4 py-4 text-center text-gray-400 text-sm">这一天还没有 Bonus 明细</td></tr>';
            }
        }

        function checkAchievements() { document.getElementById('unlocked-count').textContent=D.unlockedAchievements.length; document.getElementById('total-achievements-count').textContent=ACHIEVEMENTS_DB.length; }
        
        function renderAchievements() {
            ['focus', 'routine', 'resist', 'habit'].forEach(cat => { const el = document.getElementById(`ach-grid-${cat}`); if(el) el.innerHTML = ''; });
            ACHIEVEMENTS_DB.forEach(ach => {
                const isUn = D.unlockedAchievements.includes(ach.id);
                const grid = document.getElementById(`ach-grid-${ach.cat}`);
                if(grid) grid.innerHTML += `<div class="${isUn ? `bg-white border border-${ach.color}/30 shadow-sm` : `bg-gray-50 opacity-60 grayscale`} rounded-xl p-4 flex items-center transition-all"><div class="w-10 h-10 sm:w-12 sm:h-12 ${isUn ? `bg-${ach.color}` : `bg-gray-300`} rounded-full flex items-center justify-center text-white text-lg mr-3 flex-shrink-0"><i class="fa ${isUn ? ach.icon : 'fa-lock'}"></i></div><div><div class="font-black text-textmain text-sm sm:text-base">${ach.name}</div><div class="text-[10px] sm:text-xs font-bold text-textmuted mt-1 leading-relaxed">${ach.desc}</div></div></div>`;
            });
        }

        function initStats() {
            document.querySelectorAll('.stats-line-toggle').forEach(toggle => {
                toggle.addEventListener('change', () => {
                    const activeBtn = document.querySelector('.stats-period-btn.bg-white');
                    renderCharts(parseInt(activeBtn?.getAttribute('data-period') || '7', 10));
                });
            });
            const prevBtn = document.getElementById('stats-overview-prev');
            const nextBtn = document.getElementById('stats-overview-next');
            if (prevBtn) prevBtn.addEventListener('click', () => {
                statsOverviewDate.setMonth(statsOverviewDate.getMonth() - 1);
                renderStatsDateOverview();
            });
            if (nextBtn) nextBtn.addEventListener('click', () => {
                statsOverviewDate.setMonth(statsOverviewDate.getMonth() + 1);
                renderStatsDateOverview();
            });
            const penaltyDatePicker = document.getElementById('stats-penalty-date-picker');
            if (penaltyDatePicker) {
                penaltyDatePicker.value = getTodayStr();
                penaltyDatePicker.addEventListener('change', e => {
                    const selected = new Date(`${e.target.value}T00:00:00`);
                    if (!Number.isNaN(selected.getTime())) statsOverviewDate = selected;
                    renderStatsPenaltyDetails(e.target.value);
                    renderStatsDateOverview();
                });
                renderStatsPenaltyDetails(penaltyDatePicker.value);
            }
            const datePicker = document.getElementById('stats-bonus-date-picker');
            if (datePicker) {
                datePicker.value = getTodayStr();
                datePicker.addEventListener('change', e => {
                    const selected = new Date(`${e.target.value}T00:00:00`);
                    if (!Number.isNaN(selected.getTime())) statsOverviewDate = selected;
                    renderStatsBonusDetails(e.target.value);
                    renderStatsDateOverview();
                });
                renderStatsBonusDetails(datePicker.value);
            }
            statsOverviewDate = new Date(`${getTodayStr()}T00:00:00`);
            renderStatsDateOverview();
            document.querySelectorAll('.stats-period-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    document.querySelectorAll('.stats-period-btn').forEach(b => {
                        b.classList.remove('bg-white', 'shadow-sm', 'text-primary');
                        b.classList.add('text-textmuted');
                    });
                    this.classList.remove('text-textmuted');
                    this.classList.add('bg-white', 'shadow-sm', 'text-primary');
                    renderCharts(parseInt(this.getAttribute('data-period')));
                });
            });
        }

        function renderCharts(days) { 
            if(typeof Chart === 'undefined') return;
            const rateCanvas = document.getElementById('chart-checkin-rate');
            const sleepCanvas = document.getElementById('chart-sleep-stats');
            const durationCanvas = document.getElementById('chart-task-duration');
            const phoneCanvas = document.getElementById('chart-phone-trend');
            const mixedCanvas = document.getElementById('chart-bonus-penalty-mix');
            const labels = [], rateData = [], durationData = [], phoneData = [], dailyBonusData = [], dailyPenaltyData = [], dailyNetPenaltyData = [];
            let wakeOk=0, wakeFail=0, sleepOk=0, sleepFail=0;
            const tickLimit = days > 30 ? (days > 180 ? 12 : 15) : 30;

            for(let i=days-1; i>=0; i--) {
                const d = getTodayStr(-i); labels.push(d.slice(5)); 
                
                const cDay = normalizeCheckinRecord(D.checkinData[d]); let tot=0, qual=0;
                if(cDay?.work) {
                    if(cDay.work.checkIn) { tot++; if(cDay.work.status.checkIn) qual++; }
                    if(cDay.work.checkOut) { tot++; if(cDay.work.status.checkOut) qual++; }
                }
                rateData.push(tot > 0 ? Math.round((qual/tot)*100) : 0);

                const sDay = D.sleepData[d];
                if(sDay) { if(sDay.wake) { if(sDay.wakeOk) wakeOk++; else wakeFail++; } if(sDay.sleep) { if(sDay.sleepOk) sleepOk++; else sleepFail++; } }

                let focusM = 0; (D.taskData[d] || []).forEach(t => focusM += t.duration); durationData.push((focusM/60).toFixed(1));
                phoneData.push(D.phoneResistData.records[d] ? D.phoneResistData.records[d].count : 0);
                const dailyBonus = getBonusInfo(d).total;
                const dailyPenalty = (D.penaltyData.records[d] || []).reduce((sum, item) => sum + (Number(item.points) || 0), 0);
                dailyBonusData.push(dailyBonus);
                dailyPenaltyData.push(dailyPenalty);
                dailyNetPenaltyData.push(Math.max(0, dailyPenalty - dailyBonus * 2));
            }

            const xAxesOpt = { ticks: { maxTicksLimit: tickLimit, maxRotation: 0 } };
            const chartOpt = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

            if(charts.rate) { charts.rate.destroy(); charts.rate = null; }
            if(rateCanvas) {
                charts.rate = new Chart(rateCanvas.getContext('2d'), { type: 'line', data: { labels, datasets: [{ data: rateData, borderColor: '#9fbcdb', backgroundColor: 'rgba(159, 188, 219, 0.1)', fill: true, tension: 0.3 }] }, options: { ...chartOpt, scales: { x: xAxesOpt, y: { beginAtZero: true, max: 100 } } } });
            }
            
            if(charts.sleep) { charts.sleep.destroy(); charts.sleep = null; }
            if(sleepCanvas) {
                charts.sleep = new Chart(sleepCanvas.getContext('2d'), { type: 'bar', data: { labels: ['起床', '睡觉'], datasets: [{ label: '达标', data: [wakeOk, sleepOk], backgroundColor: '#a6cbb5', borderRadius: 4 }, { label: '未达标', data: [wakeFail, sleepFail], backgroundColor: '#e0a2a2', borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } } });
            }
            
            if(charts.duration) { charts.duration.destroy(); charts.duration = null; }
            if(durationCanvas) {
                charts.duration = new Chart(durationCanvas.getContext('2d'), { type: 'line', data: { labels, datasets: [{ data: durationData, borderColor: '#bbaecc', backgroundColor: 'rgba(187, 174, 204, 0.2)', fill: true, tension: 0.4 }] }, options: { ...chartOpt, scales: { x: xAxesOpt, y: { beginAtZero: true } } } });
            }
            
            if(charts.phone) { charts.phone.destroy(); charts.phone = null; }
            if(phoneCanvas) {
                charts.phone = new Chart(phoneCanvas.getContext('2d'), { type: 'line', data: { labels, datasets: [{ data: phoneData, borderColor: '#e0a2a2', backgroundColor: 'rgba(224, 162, 162, 0.1)', fill: true, tension: 0.4 }] }, options: { ...chartOpt, scales: { x: xAxesOpt, y: { beginAtZero: true } } } });
            }

            const showBonus = document.querySelector('.stats-line-toggle[data-line="bonus"]')?.checked ?? true;
            const showPenalty = document.querySelector('.stats-line-toggle[data-line="penalty"]')?.checked ?? true;
            const showNet = document.querySelector('.stats-line-toggle[data-line="net"]')?.checked ?? true;
            const mixedDatasets = [];
            if (showBonus) {
                mixedDatasets.push({
                    label: 'Bonus',
                    data: dailyBonusData,
                    borderColor: '#e8c978',
                    backgroundColor: 'rgba(232, 201, 120, 0.14)',
                    fill: false,
                    tension: 0.35,
                    borderWidth: 3,
                    pointRadius: 3
                });
            }
            if (showPenalty) {
                mixedDatasets.push({
                    label: '惩罚点',
                    data: dailyPenaltyData,
                    borderColor: '#e0a2a2',
                    backgroundColor: 'rgba(224, 162, 162, 0.14)',
                    fill: false,
                    tension: 0.35,
                    borderWidth: 3,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    order: 2
                });
            }
            if (showNet) {
                mixedDatasets.push({
                    label: '净惩罚点',
                    data: dailyNetPenaltyData,
                    borderColor: '#636778',
                    backgroundColor: 'rgba(99, 103, 120, 0.12)',
                    fill: false,
                    tension: 0.35,
                    borderWidth: 4,
                    borderDash: [8, 6],
                    pointRadius: 5,
                    pointHoverRadius: 6,
                    pointStyle: 'rectRot',
                    pointBackgroundColor: '#636778',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    order: 1
                });
            }

            if(charts.mixed) { charts.mixed.destroy(); charts.mixed = null; }
            if(mixedCanvas) {
                charts.mixed = new Chart(mixedCanvas.getContext('2d'), {
                    type: 'line',
                    data: { labels, datasets: mixedDatasets },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { x: xAxesOpt, y: { beginAtZero: true } }
                    }
                });
            }
        }

        function initFocusGuard() {
            document.addEventListener('visibilitychange', () => {
                if (focusGuard.active && document.hidden) recordFocusGuardViolation('切到后台');
                if (focusGuard.active && !document.hidden && focusLeaveState.pending) showFocusLeaveConfirm();
            });
            window.addEventListener('blur', () => {
                if (focusGuard.active) recordFocusGuardViolation('页面失焦');
            });
            window.addEventListener('focus', () => {
                if (focusGuard.active && focusLeaveState.pending) showFocusLeaveConfirm();
            });
            document.addEventListener('fullscreenchange', () => {
                if (focusGuard.active && focusGuard.immersive && !document.fullscreenElement) {
                    recordFocusGuardViolation('退出全屏');
                }
                if (focusGuard.active && focusLeaveState.pending) setTimeout(() => showFocusLeaveConfirm(), 50);
            });
        }

        document.addEventListener('DOMContentLoaded', async () => {
            startClock();
            initFocusReminder();
            initFocusLeaveConfirm();
            initSync();
            try {
                await initData();
            } catch (err) {
                console.error('初始化失败：', err);
                setSyncStatus(`初始化失败，当前尝试继续使用本地界面：${err.message}`, 'danger');
            }
            initNavigation(); initCheckin(); initTimeBlocksCalendar(); initTasks(); initPhone(); initHabits(); initJournal(); initStats(); initFocusGuard();
            updateFocusReliefDisplay();
            updateSidebar(); checkAchievements(); renderSyncMeta(); renderPenaltySummary();
        });
    