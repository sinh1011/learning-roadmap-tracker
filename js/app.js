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

        // Stage header
        const head = document.createElement('div');
        head.className = 'stage-header';
        const h2 = document.createElement('h2');
        h2.textContent = stage.title;
        head.appendChild(h2);
        if (stage.desc) {
            const p = document.createElement('p');
            p.style.cssText = 'margin:0.25rem 0 0; font-size:0.875rem; color:var(--text-muted);';
            p.textContent = stage.desc;
            head.appendChild(p);
        }
        card.appendChild(head);

        // Stage with direct items (e.g. stage0)
        if (stage.items && stage.items.length) {
            const wrap = document.createElement('div');
            wrap.className = 'stage-items';
            wrap.appendChild(renderList(stage.items));
            card.appendChild(wrap);
        }

        // Stage with sections (e.g. stage1 with days)
        if (stage.sections) {
            stage.sections.forEach(sec => {
                const secEl = document.createElement('div');
                secEl.className = 'day-section';

                const doneCount = sec.items.filter(it => progress[it.id]).length;
                const total = sec.items.length;
                const cls = badgeClass(doneCount, total);

                const titleRow = document.createElement('div');
                titleRow.className = 'day-title';
                const h3 = document.createElement('h3');
                h3.textContent = sec.title;
                const badge = document.createElement('span');
                badge.className = 'stat-badge ' + cls;
                badge.textContent = doneCount + '/' + total;
                titleRow.appendChild(h3);
                titleRow.appendChild(badge);

                secEl.appendChild(titleRow);
                secEl.appendChild(renderList(sec.items));
                card.appendChild(secEl);
            });
        }

        roadmapContainer.appendChild(card);
    });
}

function renderList(items) {
    const ul = document.createElement('ul');
    ul.className = 'task-list';
    ul.style.listStyle = 'none';
    ul.style.padding = '0';
    ul.style.margin = '0';
    for (const item of items) {
        const li = document.createElement('li');
        li.className = 'task-item' + (progress[item.id] ? ' done' : '');
        li.dataset.id = item.id;

        const label = document.createElement('label');
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.gap = '0.75rem';
        label.style.cursor = 'pointer';
        label.style.width = '100%';

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
    roadmapContainer.addEventListener('change', e => {
        if (e.target.type !== 'checkbox') return;
        const li = e.target.closest('.task-item');
        if (!li) return;
        const id = li.dataset.id;
        progress[id] = e.target.checked;
        li.classList.toggle('done', e.target.checked);

        // Update day section badge
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
