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

function init() {
    // Apply defaults for first time users
    applyDefaults();
    renderRoadmap();
    updateStats();
    setupEventListeners();
    checkSync();
}

function applyDefaults() {
    let changed = false;
    DATA.forEach(stage => {
        const items = stage.items || [];
        items.forEach(item => {
            if (item.doneByDefault && !(item.id in progress)) {
                progress[item.id] = true;
                changed = true;
            }
        });
    });
    if (changed) saveProgressToStorage();
}

function loadProgress() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
}

function saveProgressToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function saveProgress() {
    saveProgressToStorage();
    updateStats();
    if (syncConfig.url) syncWithGoogleSheets();
}

function loadSyncConfig() {
    const saved = localStorage.getItem(SYNC_CONFIG_KEY);
    return saved ? JSON.parse(saved) : { url: '' };
}

function saveSyncConfig(url) {
    syncConfig.url = url;
    localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(syncConfig));
}

function updateStats() {
    const allItems = flattenItems(DATA);
    const total = allItems.length;
    const done = allItems.filter(item => progress[item.id]).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

    overallProgressText.textContent = `${percent}%`;
    overallProgressBar.style.width = `${percent}%`;
    tasksDoneText.textContent = done;

    const totalDays = DATA.reduce((acc, stage) => {
        return acc + (stage.sections ? stage.sections.length : 0);
    }, 0);
    daysCountText.textContent = totalDays;
}

function flattenItems(data) {
    let items = [];
    data.forEach(stage => {
        if (stage.items) items.push(...stage.items);
        if (stage.sections) {
            stage.sections.forEach(section => {
                if (section.items) items.push(...section.items);
            });
        }
    });
    return items;
}

function renderTaskList(items) {
    return items.map(item => `
        <div class="task-item ${progress[item.id] ? 'done' : ''}" data-id="${item.id}">
            <input type="checkbox" ${progress[item.id] ? 'checked' : ''}>
            <span>${item.text}</span>
        </div>
    `).join('');
}

function renderRoadmap() {
    roadmapContainer.innerHTML = '';
    DATA.forEach(stage => {
        const stageCard = document.createElement('div');
        stageCard.className = 'stage-card';

        let bodyHtml = '';

        // Stage with direct items (e.g. stage0)
        if (stage.items && stage.items.length) {
            bodyHtml += `<div class="stage-items"><div class="task-list">${renderTaskList(stage.items)}</div></div>`;
        }

        // Stage with sections (e.g. stage1)
        if (stage.sections) {
            stage.sections.forEach(section => {
                const done = section.items.filter(it => progress[it.id]).length;
                const total = section.items.length;
                bodyHtml += `
                    <div class="day-section">
                        <div class="day-title">
                            <h3>${section.title}</h3>
                            <span class="stat-label">${done}/${total}</span>
                        </div>
                        <div class="task-list">${renderTaskList(section.items)}</div>
                    </div>
                `;
            });
        }

        stageCard.innerHTML = `
            <div class="stage-header">
                <h2>${stage.title}</h2>
                ${stage.desc ? `<p class="stat-label">${stage.desc}</p>` : ''}
            </div>
            ${bodyHtml}
        `;
        roadmapContainer.appendChild(stageCard);
    });
}

function setupEventListeners() {
    roadmapContainer.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            const taskItem = e.target.closest('.task-item');
            if (!taskItem) return;
            const id = taskItem.dataset.id;
            progress[id] = e.target.checked;
            taskItem.classList.toggle('done', e.target.checked);

            // Update section counter if inside a day-section
            const daySection = taskItem.closest('.day-section');
            if (daySection) {
                const h3Text = daySection.querySelector('h3').textContent;
                let sectionItems = [];
                DATA.forEach(s => {
                    if (s.sections) {
                        const sec = s.sections.find(sec => sec.title === h3Text);
                        if (sec) sectionItems = sec.items;
                    }
                });
                const doneCount = sectionItems.filter(it => progress[it.id]).length;
                daySection.querySelector('.stat-label').textContent = `${doneCount}/${sectionItems.length}`;
            }
            saveProgress();
        }
    });

    roadmapContainer.addEventListener('click', (e) => {
        const taskItem = e.target.closest('.task-item');
        if (taskItem && e.target.type !== 'checkbox') {
            const cb = taskItem.querySelector('input[type=checkbox]');
            cb.checked = !cb.checked;
            cb.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

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

    configModal.addEventListener('click', (e) => {
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
        const res = await fetch(syncConfig.url);
        const remoteData = await res.json();
        if (remoteData && typeof remoteData === 'object') {
            progress = { ...progress, ...remoteData };
            saveProgressToStorage();
            renderRoadmap();
            updateStats();
            syncStatusText.textContent = 'Status: Synced ✓';
        }
    } catch (err) {
        console.error('Sync fetch failed:', err);
        syncStatusText.textContent = 'Status: Sync failed';
    }
}

async function syncWithGoogleSheets() {
    if (!syncConfig.url) return;
    try {
        await fetch(syncConfig.url, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(progress)
        });
        syncStatusText.textContent = 'Status: Synced ✓';
    } catch (err) {
        console.error('Sync post failed:', err);
    }
}

init();
