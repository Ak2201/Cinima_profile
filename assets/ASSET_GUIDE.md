# ASSET GUIDE — What Photos & Videos to Add

Replace the stock/placeholder content with YOUR real media.
After adding files, update the `src` paths in `index.html`.

---

## FOLDER STRUCTURE & WHAT TO PUT WHERE

### images/hero/
> Background video poster or fallback image for the hero section
- `hero-bg.jpg` — Wide cinematic shot of you (1920x1080 or wider)
  - BEST: You on a film set, on stage, or dramatic portrait with moody lighting
  - This appears behind your name on the landing screen
  - Dark/moody works best — bright images will clash with the overlay text

### images/headshot/
> Your main profile photo for the About section
- `headshot.jpg` — Professional headshot (800x1000px, portrait 3:4 ratio)
  - BEST: Clean background, dramatic lighting, direct eye contact
  - This is the FIRST photo casting directors will associate with you
  - Get this professionally shot if possible — it's the most important image

### images/acting-portfolio/
> Photos for the Acting Portfolio gallery grid (9 images needed)

#### film-stills/ (4 images needed)
- `still-01.jpg` through `still-04.jpg` (500x625px, portrait 4:5 ratio)
  - Screenshots/stills from "Expectation", "Am I Selected", or any film work
  - Behind-camera captures of you in character
  - Dramatic, well-lit frames that show your screen presence

#### photoshoots/ (3 images needed)
- `shoot-01.jpg` through `shoot-03.jpg` (500x625px, portrait 4:5 ratio)
  - Professional modelling/portrait photos
  - Different looks: formal, casual, intense, smiling
  - Studio shots with good lighting

#### behind-the-scenes/ (2 images needed)
- `bts-01.jpg`, `bts-02.jpg` (500x625px, portrait 4:5 ratio)
  - You on set — directing, rehearsing, with crew
  - Candid moments during filming
  - Shows you as a working professional

### images/direction/
> Thumbnails/stills for each Direction project card

#### expectation/
- `thumbnail.jpg` — Main card image (800x450px, landscape 16:9)
  - Best frame from the short film, or the poster
- `poster.jpg` — (optional) Film festival poster or YouTube thumbnail
- `screenshot-01.jpg` through `screenshot-03.jpg` — (optional) Key frames

#### am-i-selected/
- `thumbnail.jpg` — Main card image (800x450px, landscape 16:9)
  - A compelling frame from the film
- `bts.jpg` — (optional) Behind the scenes at LV Prasad screening

#### easwari-college-ad/
- `thumbnail.jpg` — Main card image (800x450px, landscape 16:9)
  - Frame from the ad, or the college branding shot

#### youtube-web-series/
- `thumbnail.jpg` — Main card image (800x450px, landscape 16:9)
  - Frame from the series or YouTube thumbnail

### images/anchoring/
> Photos from your event hosting/anchoring work

#### corporate-events/ (2-3 images)
- `event-01.jpg` through `event-03.jpg` (800x500px, landscape)
  - You on stage hosting corporate events
  - With microphone, well-dressed, engaging audience
  - Include event branding/stage setup if visible

#### college-events/ (2-3 images)
- `event-01.jpg` through `event-03.jpg` (800x500px, landscape)
  - College fest hosting, cultural events
  - Energetic, fun moments on stage
  - Crowd interaction shots

#### cultural-events/ (2-3 images)
- `event-01.jpg` through `event-03.jpg` (800x500px, landscape)
  - Traditional/cultural event hosting
  - Festival celebrations, award functions
  - Shows your versatility as an anchor

#### award-shows/ (1-2 images)
- `event-01.jpg`, `event-02.jpg` (800x500px, landscape)
  - If you've hosted any award ceremonies
  - Formal stage presence shots

### images/showreel-thumbnails/
> Scene thumbnails below the showreel player (4 images)
- `scene-01.jpg` through `scene-04.jpg` (400x225px, landscape 16:9)
  - 4 best moments from your showreel
  - Each should show a different mood/character/project

### images/skills/
> (Optional) Background or decorative images for skills section
- Not required — section uses SVG graphics

---

## VIDEO FILES

### video/hero/
- `hero-bg.mp4` — Looping background video (1920x1080, 15-30 seconds)
  - Slow-motion cinematic footage of you
  - On set, performing, or dramatic visual
  - KEEP IT DARK — overlays will be placed on top
  - File size: try to keep under 10MB for fast loading
  - NO AUDIO needed (will be muted)

### video/showreel/
- `showreel.mp4` — Your full showreel (1920x1080, 2-4 minutes)
  - Best acting clips edited together
  - Include direction work highlights too
  - This is what casting directors will watch
  - Alternative: Upload to YouTube/Vimeo and embed the URL instead

### video/anchoring-clips/
- `clip-01.mp4` through `clip-03.mp4` — Short anchoring highlight clips (30-60 sec each)
  - Best moments from your hosting gigs
  - Different events showing your range
  - These will play in the Anchoring section

---

## AUDIO FILES

### audio/
- `ambient-bg.mp3` — Background music (optional)
  - Soft, cinematic ambient track
  - Royalty-free (check https://pixabay.com/music/ or https://artlist.io)
  - 2-3 minutes, looping-friendly
  - Toggle button already exists in nav bar

---

## QUICK PRIORITY LIST (What to add first)

1. **headshot/headshot.jpg** — Most important single image
2. **acting-portfolio/film-stills/** — At least 2-3 stills from your films
3. **direction/expectation/thumbnail.jpg** — Your biggest hit (5.7M views)
4. **anchoring/** — At least 3-4 photos from different events
5. **video/showreel/showreel.mp4** — Your showreel (or YouTube link)
6. **hero/hero-bg.jpg** — Hero background
7. Everything else

---

## HOW TO UPDATE THE SITE AFTER ADDING PHOTOS

In `index.html`, find the stock Unsplash URLs and replace them:

BEFORE (stock):
```html
<img src="https://images.unsplash.com/photo-xxx?w=500" alt="...">
```

AFTER (your photo):
```html
<img src="assets/images/acting-portfolio/film-stills/still-01.jpg" alt="Expectation — Film Still">
```

For the headshot in About section, replace:
```html
<img src="https://images.unsplash.com/photo-xxx" alt="...">
```
with:
```html
<img src="assets/images/headshot/headshot.jpg" alt="ArunKumar Mohanan">
```
