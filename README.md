# Personal Website - Sahil Baligar

A modern, premium personal portfolio website built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Single-page application** with smooth anchor-based navigation
- **Dark theme** with purple accent colors and subtle gradients
- **Responsive design** optimized for desktop and mobile
- **Smooth animations** using Framer Motion
- **Section reveal animations** as you scroll
- **Subtle background gradient changes** between sections
- **Project modals** for work-in-progress items
- **Contact section** with mailto links (no backend required)

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion** (animations)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Add your profile image:
   - Place your profile image in the `public` folder as `profile.jpg`
   - The image should be square or portrait-oriented for best results

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page with all sections
│   └── globals.css         # Global styles and utilities
├── components/
│   ├── Navigation.tsx      # Sticky navigation bar
│   ├── Section.tsx         # Reusable section wrapper
│   ├── ProjectCard.tsx     # Project card component
│   └── Modal.tsx           # Work-in-progress modal
└── public/
    └── profile.jpg         # Your profile image (add this)
```

## Customization

- **Profile Image**: Replace `public/profile.jpg` with your image
- **Content**: Edit the content in `app/page.tsx`
- **Colors**: Modify accent colors in `tailwind.config.ts`
- **Animations**: Adjust animation timings in component files

## Build for Production

```bash
npm run build
npm start
```

## License

Personal project - All rights reserved.
