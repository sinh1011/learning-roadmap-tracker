# 📚 Learning Roadmap Tracker

> Track your React learning progress with Google Sheets sync - accessible from any device

## 🚀 Live Demo

**👉 [https://sinh1011.github.io/learning-roadmap-tracker/](https://sinh1011.github.io/learning-roadmap-tracker/)**

## ✨ Features

- ✅ **48 learning tasks** organized into 2 stages (JS review + React Core)
- 📊 **Real-time progress tracking** with visual progress bars
- 💾 **Auto-save to LocalStorage** - your progress is saved automatically
- ☁️ **Google Sheets sync** - access your progress from any device
- 🎨 **Beautiful dark UI** with color-coded progress indicators
- 📱 **Fully responsive** - works on desktop, tablet, and mobile

## 📖 Learning Path

### Stage 0: JavaScript Review (Completed)
- let / const
- Arrow functions
- Destructuring
- Spread operator
- map / filter / reduce

### Stage 1: React Core (2-3 weeks)
- **Day 1-3:** Setup, JSX, Components & Props, useState
- **Day 4-5:** Events, Conditional Rendering, Lists
- **Day 6-7:** Forms, Lifting State
- **Day 8-9:** useEffect basics, API integration
- **Day 10:** Mini Project - Complete Todo App

## 🔄 Google Sheets Sync Setup

1. Click the "⚙️ Sync" button in the app
2. Create a Google Apps Script with the provided code (see below)
3. Deploy as Web App and paste the URL
4. Your progress will sync automatically!

### Google Apps Script Code

```javascript
const SHEET_NAME = 'LearningProgress';

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({})).setMimeType(ContentService.MimeType.JSON);
  
  const data = sheet.getDataRange().getValues();
  const progress = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) progress[data[i][0]] = data[i][1];
  }
  
  return ContentService.createTextOutput(JSON.stringify(progress)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === 'set' && data.data) {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME) || 
                    SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
      
      sheet.clear();
      sheet.appendRow(['Task ID', 'Completed']);
      
      for (const [key, value] of Object.entries(data.data)) {
        sheet.appendRow([key, value]);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}
```

## 🛠️ Tech Stack

- Pure HTML/CSS/JavaScript (no frameworks needed!)
- LocalStorage for offline persistence
- Google Apps Script for cloud sync
- Modern CSS with CSS variables
- Responsive design with flexbox/grid

## 📝 License

MIT License - feel free to use for your own learning!

---

**Made with ❤️ for React learners**
