import { DATA } from './data.js';

const STORAGE_KEY = 'learning_roadmap_progress';
const SYNC_CONFIG_KEY = 'learning_roadmap_sync_config';

let progress = loadProgress();
let syncConfig = loadSyncConfig();

// DOM Elements
const roadmapContainer = document.getElementById('roadmap-container');
const overallProgressText = document.getElementById('overall-progress');
const overallProgressBar = document.getElementById('overall-progress-bar');
const tasksDoneText = document.getElementById('tasks-done');
const daysCountText = document.getElementById('days-count');
const syncStatusText = document.getElementById('sync-status');
const configModal = document.getElementById('config-modal');
const syncUrlInput = document.getElementById('sync-url');

function loadProgress() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
}

function saveProgressToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function loadSyncConfig() {
    const saved = localStorage.getItem(SYNC_CONFIG_KEY);
    return saved ? JSON.parse(saved) : { url: '' };
}

function saveSyncConfig(url) {
    syncConfig.url = url;
    localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(syncConfig));
}

function flattenAllItems(data) {
    const items = [];
    for (const stage of data) {
        if (stage.items) items.push(...stage.items);
        if (stage.sections) {
            for (const sec of stage.sections) {
                if (sec.items) items.push(...sec.items);
            }
        }
    }
    return items;
}

function applyDefaults() {
    let changed = false;
    const all = flattenAllItems(DATA);
    for (const item of all) {
        if (item.doneByDefault && !(item.id in progress)) {
            progress[item.id] = true;
            changed = true;
        }
    }
    if (changed) saveProgressToStorage();
}

function updateStats() {
    const allItems = flattenAllItems(DATA);
    const total = allItems.length;
    const done = allItems.filter(it => progress[it.id]).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

    overallProgressText.textContent = percent + '%';
    overallProgressBar.style.width = percent + '%';
    tasksDoneText.textContent = done;

    const totalDays = DATA.reduce((acc, stage) => {
        return acc + (stage.sections ? stage.sections.length : 0);
    }, 0);
    daysCountText.textContent = totalDays;
}

function badgeClass(done, total) {
    if (total === 0) return 'badge-low';
    const pct = Math.round(done / total * 100);
    if (pct >= 75) return 'badge-ok';
    if (pct >= 35) return 'badge-mid';
    return 'badge-low';
}

function renderRoadmap() {
    roadmapContainer.innerHTML = '';

    DATA.forEach(stage => {
        const card = document.createElement('div');
        card.className = 'stage-card';

        const head = document.createElement('div');
        head.className = 'stage-head';
        head.innerHTML = '<h2>' + stage.title + '</h2>' +
            (stage.desc ? '<p class="stage-desc">' + stage.desc + '</p>' : '');
        card.appendChild(head);

        const body = document.createElement('div');
        body.className = 'stage-body';

        // Stage with direct items (e.g. stage0)
        if (stage.items && stage.items.length) {
            body.appendChild(renderList(stage.items));
        }

        // Stage with sections (e.g. stage1 with days)
        if (stage.sections) {
            stage.sections.forEach(sec => {
                const secEl = document.createElement('div');
                secEl.className = 'day-section';

                const doneCount = sec.items.filter(it => progress[it.id]).length;
                const total = sec.items.length;
                const cls = badgeClass(doneCount, total);

                const secHead = document.createElement('div');
                secHead.className = 'section-head';
                secHead.innerHTML =
                    '<h3>' + sec.title + '</h3>' +
                    '<span class="stat-badge ' + cls + '">' + doneCount + '/' + total + '</span>';
                secEl.appendChild(secHead);
                secEl.appendChild(renderList(sec.items));
                body.appendChild(secEl);
            });
        }

        card.appendChild(body);
        roadmapContainer.appendChild(card);
    });
}

function renderList(items) {
    const ul = document.createElement('ul');
    ul.className = 'task-list';
    for (const item of items) {
        const li = document.createElement('li');
        li.className = 'task-item' + (progress[item.id] ? ' done' : '');
        li.dataset.id = item.id;

        const label = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !!progress[item.id];

        const span = document.createElement('span');
        span.textContent = item.text;

        label.appendChild(cb);
        label.appendChild(span);
        li.appendChild(label);
        ul.appendChild(li);
    }
    return ul;
}

function setupEventListeners() {
    // Checkbox changes via event delegation
    roadmapContainer.addEventListener('change', e => {
        if (e.target.type !== 'checkbox') return;
        const li = e.target.closest('.task-item');
        if (!li) return;
        const id = li.dataset.id;
        progress[id] = e.target.checked;
        li.classList.toggle('done', e.target.checked);

        // Update section badge
        const secEl = li.closest('.day-section');
        if (secEl) {
            const allLis = secEl.querySelectorAll('.task-item');
            let doneCount = 0;
            allLis.forEach(l => { if (l.classList.contains('done')) doneCount++; });
            const badge = secEl.querySelector('.stat-badge');
            if (badge) {
                badge.textContent = doneCount + '/' + allLis.length;
                badge.className = 'stat-badge ' + badgeClass(doneCount, allLis.length);
            }
        }

        saveProgressToStorage();
        updateStats();
        if (syncConfig.url) syncWithGoogleSheets();
    });

    // Click on li also toggles checkbox
    roadmapContainer.addEventListener('click', e => {
        const li = e.target.closest('.task-item');
        if (li && e.target.tagName !== 'INPUT' && e.target.tagName !== 'LABEL') {
            const cb = li.querySelector('input[type=checkbox]');
            if (cb) {
                cb.checked = !cb.checked;
                cb.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    });

    // Sync modal
    document.getElementById('open-sync-config').addEventListener('click', () => {
        syncUrlInput.value = syncConfig.url;
        configModal.style.display = 'flex';
    });
    document.getElementById('close-modal').addEventListener('click', () => {
        configModal.style.display = 'none';
    });
    document.getElementById('save-sync-config').addEventListener('click', () => {
        const url = syncUrlInput.value.trim();
        saveSyncConfig(url);
        configModal.style.display = 'none';
        checkSync();
    });
    configModal.addEventListener('click', e => {
        if (e.target === configModal) configModal.style.display = 'none';
    });
}

async function checkSync() {
    if (!syncConfig.url) {
        syncStatusText.textContent = 'Status: Local storage only';
        return;
    }
    syncStatusText.textContent = 'Status: Syncing...';
    try {
        const res = await fetch(syncConfig.url + '?action=get');
        const remoteData = await res.json();
        if (remoteData && typeof remoteData === 'object') {
            Object.assign(progress, remoteData);
            saveProgressToStorage();
            renderRoadmap();
            updateStats();
            syncStatusText.textContent = 'Status: Synced with Google Sheets';
        }
    } catch (err) {
        console.error('Sync failed:', err);
        syncStatusText.textContent = 'Status: Sync failed (check URL)';
    }
}

async function syncWithGoogleSheets() {
    if (!syncConfig.url) return;
    try {
        await fetch(syncConfig.url, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'set', data: progress })
        });
        syncStatusText.textContent = 'Status: Synced with Google Sheets';
    } catch (err) {
        console.error('Sync POST failed:', err);
    }
}

// Boot
applyDefaults();
renderRoadmap();
updateStats();
setupEventListeners();
checkSync();
