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

// Initialization
function init() {
    renderRoadmap();
    updateStats();
    setupEventListeners();
    checkSync();
}

function loadProgress() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
}

function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    updateStats();
    if (syncConfig.url) {
        syncWithGoogleSheets();
    }
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

    overallProgressText.textContent = \`\${percent}%\`;
    overallProgressBar.style.width = \`\${percent}%\`;
    tasksDoneText.textContent = done;
    
    const totalDays = DATA.reduce((acc, stage) => acc + (stage.sections ? stage.sections.length : 0), 0);
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

function renderRoadmap() {
    roadmapContainer.innerHTML = '';
    DATA.forEach(stage => {
        const stageCard = document.createElement('div');
        stageCard.className = 'stage-card';
        
        let sectionsHtml = '';
        if (stage.sections) {
            stage.sections.forEach(section => {
                const itemsHtml = section.items.map(item => \`
                    <div class="task-item \${progress[item.id] ? 'done' : ''}" data-id="\${item.id}">
                        <input type="checkbox" \${progress[item.id] ? 'checked' : ''}>
                        <span>\${item.text}</span>
                    </div>
                \`).join('');
                
                sectionsHtml += \`
                    <div class="day-section">
                        <div class="day-title">
                            <h3>\${section.title}</h3>
                            <span class="stat-label">\${section.items.filter(it => progress[it.id]).length}/\${section.items.length}</span>
                        </div>
                        <div class="task-list">
                            \${itemsHtml}
                        </div>
                    </div>
                \`;
            });
        }

        stageCard.innerHTML = \`
            <div class="stage-header">
                <h2>\${stage.title}</h2>
                <p class="stat-label">\${stage.desc || ''}</p>
            </div>
            \${sectionsHtml}
        \`;
        roadmapContainer.appendChild(stageCard);
    });
}

function setupEventListeners() {
    roadmapContainer.addEventListener('click', (e) => {
        const taskItem = e.target.closest('.task-item');
        if (taskItem) {
            const id = taskItem.dataset.id;
            const checkbox = taskItem.querySelector('input');
            
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
            }
            
            progress[id] = checkbox.checked;
            taskItem.classList.toggle('done', checkbox.checked);
            
            const daySection = taskItem.closest('.day-section');
            const dayTitle = daySection.querySelector('h3').textContent;
            
            let sectionItems = [];
            DATA.forEach(s => {
                if (s.sections) {
                    const sec = s.sections.find(sec => sec.title === dayTitle);
                    if (sec) sectionItems = sec.items;
                }
            });
            
            const doneCount = sectionItems.filter(it => progress[it.id]).length;
            daySection.querySelector('.stat-label').textContent = \`\${doneCount}/\${sectionItems.length}\`;
            
            saveProgress();
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
}

async function checkSync() {
    if (!syncConfig.url) {
        syncStatusText.textContent = 'Status: Local storage only';
        return;
    }
    syncStatusText.textContent = 'Status: Syncing...';
    try {
        const response = await fetch(syncConfig.url);
        const remoteData = await response.json();
        if (remoteData && typeof remoteData === 'object') {
            progress = { ...progress, ...remoteData };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
            renderRoadmap();
            updateStats();
            syncStatusText.textContent = 'Status: Synced with Google Sheets';
        }
    } catch (error) {
        console.error('Sync failed:', error);
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
        syncStatusText.textContent = 'Status: Synced with Google Sheets';
    } catch (error) {
        console.error('Post sync failed:', error);
        syncStatusText.textContent = 'Status: Sync failed (POST)';
    }
}

init();
