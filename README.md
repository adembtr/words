# words - Learn English (early prototype)

An early prototype of my English vocabulary site: a YouTube video next to a text panel, where saved words are highlighted and show their meaning on click.

> **This is the earlier version.** The current, actively developed app is **VocabForge**:
> [github.com/adembtr/wordsWebsite](https://github.com/adembtr/wordsWebsite) ([live demo](https://adembtr.github.io/wordsWebsite/)), a rewritten app that adds spaced repetition and plays the YouTube clip where a word is used.

**Live demo:** https://adembtr.github.io/words/

## Features

- **Video panel**: click **+ Add Video** and paste a YouTube link; the video is embedded with the privacy-enhanced `youtube-nocookie.com` player, and the last link is remembered in the browser.
- **Text panel**: **+ Add Text** opens a dialog where you paste any text (for example the video's transcript). The lines are appended to the panel and saved in `localStorage`; **Delete Text** clears everything after a confirmation.
- **Word highlighting**: words from the saved word list are highlighted in the text (whole words, case-insensitive). Clicking a highlighted word shows its meaning in the bar under the panels; clicking it again hides it.
- **Responsive layout**: video and text side by side on wide screens, stacked on small screens, built with Bootstrap 5 and a dark theme.

## History

Earlier commits of this repository also contained a dictionary (word + meaning list) and practice tests: matching, multiple choice and "guess the English word". The last commit (June 2025) removed them and kept only the video + text view. They are still available in the git history.

## Status

This prototype is no longer developed. Because the page script still references the removed dictionary form, the script stops early, so:

- new words cannot be added (highlighting only uses a word list saved by an earlier version of the page),
- saved text is shown again only after new text is added,
- the theme toggle button does nothing.

For the maintained app, see [wordsWebsite](https://github.com/adembtr/wordsWebsite).

## Tech stack

- HTML5, CSS3 and vanilla JavaScript
- [Bootstrap 5.3](https://getbootstrap.com/) and Bootstrap Icons (loaded from a CDN)
- YouTube embedded player (iframe)
- `localStorage` for the video link, text and word list

## Run locally

```bash
git clone https://github.com/adembtr/words.git
cd words
python3 -m http.server 8000
```

Then open http://localhost:8000. There is no build step; opening `index.html` directly also works, but the YouTube embed is more reliable when the page is served over HTTP.

## License

Released under the [MIT License](LICENSE).

---

Built by [Adem Batur](https://github.com/adembtr)
