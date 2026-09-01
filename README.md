# Om Namah Shivay Jaap Counter — ALL FEATURES

આ versionમાં screenshot-style dark Mahadev dashboard સાથે અગાઉ જણાવેલા બધા major features ઉમેરવામાં આવ્યા છે.

## Assets
`Mahadev-1.png` અને `om-namah-shivay.mp3` ને `index.html` સાથે એ જ folderમાં રાખવા.

## Included
- Live Jaap + +1/+10/+108/+1008 quick buttons
- Space = 1 Jaap
- Mobile vibration
- Session timer, pause, end, date save
- Same-date Jaap ADD, never replace
- Add/Edit/Delete sessions
- Undo Delete
- Daily details: total, progress, sessions, average
- Dark Calendar + 8 color ranges
- Daily / Weekly / Monthly / Yearly graphs
- Best Day, Average, Active Days, Current/Longest Streak
- ETA to target
- Achievements and milestone animations
- Target = 1,100,000,000
- Progress precision = 0.00000000000%
- Mantra ON/OFF, infinite loop, volume, speed
- JSON Backup Download
- Backup Restore preview with Merge/Replace
- CSV export
- Backup timestamp + reminder controls
- Theme choices: Mahadev Dark, Deep Blue, Purple Shiv, Saffron, Light
- PWA / offline cache / install app
- localStorage persistence
- Responsive laptop/tablet/mobile UI

## Important
PWA/service-worker offline features generally work when the site is served from `localhost` or HTTPS. `file://` opening can restrict service workers and install prompts, while normal Jaap/localStorage features still work.

## New in v4
- Streaks, longest streak, best day, active days, daily average
- Achievements and milestone progress
- Quick +1/+10/+108 controls
- Click calendar day for details
- CSV export and deleted-data recovery
- Theme selector and audio volume/speed
- PWA manifest + service worker offline support
- Much darker calendar range colors

## Graph update
- Large responsive Daily and Monthly line graphs
- Clear axis/grid labels, points, area fill
- Hover/touch tooltip with exact date and Jaap count

## v5 Features Added
- Smart Target: main, daily, weekly, monthly, yearly targets with ETA.
- Milestone celebration popup when a milestone is reached.
- Daily Report and Monthly Report with selectable date/month.
- Optional PIN Lock using SHA-256 hashed PIN in localStorage.
- Backup includes targets and PIN lock state.
- Dark responsive report and PIN lock UI.

## v6 Features
- Custom notifications: every 108, every 1,000, daily target and milestones.
- Mahadev Theme Gallery with six dark themes.
- Share Progress via Web Share / clipboard fallback.
- Download a shareable PNG Progress Card.
- Notification settings and theme settings are saved in localStorage and backup.
- Fixed same-date Add Jaap total update handling.

## v7 Learning / Adhyayan
- Added Learning section with Bhagavad Gita, Shiva Purana, Garuda Purana, Bhagavata Purana, Vishnu Purana and Markandeya Purana library cards.
- Gujarati, Hindi, English and Sanskrit language selector.
- Chapter navigation, bookmarks, notes, search and font-size control.
- Reading progress stored in localStorage.
- Import public-domain/licensed TXT or JSON text locally.
- Learning data included in backup/restore.

## Full Book Learning Import (v6)
The Learning section now supports full-book imports and verse-by-verse reading.

### JSON (recommended)
Use `Full_Book_Import_Template.json`. Each chapter can contain a `verses` array. Each verse supports `number` and multilingual `text` fields: `sa`, `gu`, `hi`, `en`.

### TXT / MD
Use `Full_Book_Import_Template.txt`. Mark chapters with `CHAPTER 1:` (also recognizes common Hindi/Gujarati chapter headings) and verses with `VERSE 1:` / `श्लोक 1:` / `શ્લોક 1:`.

The imported book is stored in localStorage, and the reader provides chapter selection, verse jump buttons, search, bookmarks, notes, font size, and previous/next chapter navigation.

Only import text that you have the right to use (for example, public-domain text or a translation you own/license).

## v7 change
- Removed the Learning / Puran / Gita future section and full-book import UI.
- Added Yoga & Pranayama section with long Gujarati educational content on yoga, pranayama safety, seven traditional chakras, and Ashta Siddhi.
- Added topic selector, font-size control and bookmark.

\n## Google Sheet Sync\n- No login system is added.\n- Each browser gets a stable anonymous User ID.\n- Existing Jaap data in that browser is sent to the configured Google Apps Script once.\n- New Jaap additions are appended to the Google Sheet.\n- The website never deletes Google Sheet rows.\n- Existing localStorage Jaap data is not cleared or replaced.\n