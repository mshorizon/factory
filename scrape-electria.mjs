import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log('Navigating to https://electria.framer.website/ ...');
  await page.goto('https://electria.framer.website/', {
    waitUntil: 'networkidle',
    timeout: 60000,
  });

  // Wait a bit for animations/lazy content
  await page.waitForTimeout(3000);

  // Scroll to the bottom to trigger any lazy loading
  console.log('Scrolling to load all content...');
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 400;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
  await page.waitForTimeout(2000);

  // Scroll back to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);

  // Take full-page screenshot
  console.log('Taking full-page screenshot...');
  await page.screenshot({
    path: '/root/factory/electria-full.png',
    fullPage: true,
  });
  console.log('Screenshot saved to /root/factory/electria-full.png');

  // Extract all content
  console.log('Extracting content...');
  const data = await page.evaluate(() => {
    const getStyles = (el) => {
      if (!el) return {};
      const cs = window.getComputedStyle(el);
      return {
        backgroundColor: cs.backgroundColor,
        color: cs.color,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        fontFamily: cs.fontFamily,
        textAlign: cs.textAlign,
        padding: cs.padding,
        margin: cs.margin,
        borderRadius: cs.borderRadius,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        textTransform: cs.textTransform,
      };
    };

    // Navigation links
    const navLinks = [];
    document.querySelectorAll('nav a, header a, [class*="nav"] a, [class*="Nav"] a').forEach((a) => {
      navLinks.push({
        text: a.textContent?.trim(),
        href: a.href,
        styles: getStyles(a),
      });
    });

    // All images
    const images = [];
    document.querySelectorAll('img').forEach((img) => {
      images.push({
        src: img.src,
        alt: img.alt,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      });
    });

    // All buttons/CTAs
    const buttons = [];
    document.querySelectorAll('button, a[class*="button"], a[class*="btn"], [role="button"], a[class*="Button"]').forEach((btn) => {
      buttons.push({
        text: btn.textContent?.trim(),
        href: btn.href || null,
        tag: btn.tagName,
        styles: getStyles(btn),
      });
    });

    // All text nodes sorted by vertical position
    const textBlocks = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const text = node.textContent?.trim();
        if (!text || text.length === 0) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (!parent) continue;
      const rect = parent.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const text = node.textContent?.trim();
      if (!text) continue;
      textBlocks.push({
        text,
        tag: parent.tagName,
        position: { top: Math.round(rect.top + window.scrollY), left: Math.round(rect.left) },
        styles: getStyles(parent),
      });
    }
    textBlocks.sort((a, b) => a.position.top - b.position.top);

    // Group text blocks into sections based on vertical gaps
    const groupedSections = [];
    let currentGroup = { texts: [], startTop: 0, endTop: 0 };

    textBlocks.forEach((block, i) => {
      if (i === 0) {
        currentGroup.startTop = block.position.top;
        currentGroup.endTop = block.position.top;
        currentGroup.texts.push(block);
        return;
      }
      const gap = block.position.top - currentGroup.endTop;
      if (gap > 250) {
        if (currentGroup.texts.length > 0) {
          groupedSections.push({ ...currentGroup });
        }
        currentGroup = { texts: [block], startTop: block.position.top, endTop: block.position.top };
      } else {
        currentGroup.endTop = block.position.top;
        currentGroup.texts.push(block);
      }
    });
    if (currentGroup.texts.length > 0) {
      groupedSections.push(currentGroup);
    }

    // Collect unique colors
    const colorSet = new Set();
    const bgColorSet = new Set();
    document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, button, div, section, nav, header, footer, li').forEach((el) => {
      const cs = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        if (cs.color && cs.color !== 'rgba(0, 0, 0, 0)') colorSet.add(cs.color);
        if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') bgColorSet.add(cs.backgroundColor);
      }
    });

    // Body styles
    const bodyStyles = getStyles(document.body);
    const htmlStyles = getStyles(document.documentElement);

    // All links
    const allLinks = [];
    document.querySelectorAll('a').forEach((a) => {
      allLinks.push({ text: a.textContent?.trim(), href: a.href });
    });

    // SVG icons
    const svgs = [];
    document.querySelectorAll('svg').forEach((svg) => {
      const rect = svg.getBoundingClientRect();
      if (rect.width > 5 && rect.height > 5) {
        svgs.push({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          viewBox: svg.getAttribute('viewBox'),
          position: { top: Math.round(rect.top + window.scrollY), left: Math.round(rect.left) },
        });
      }
    });

    // Headings
    const headings = [];
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
      headings.push({
        tag: h.tagName,
        text: h.textContent?.trim(),
        styles: getStyles(h),
        position: { top: Math.round(h.getBoundingClientRect().top + window.scrollY) },
      });
    });

    // Paragraphs
    const paragraphs = [];
    document.querySelectorAll('p').forEach((p) => {
      const text = p.textContent?.trim();
      if (text) {
        paragraphs.push({
          text,
          styles: getStyles(p),
          position: { top: Math.round(p.getBoundingClientRect().top + window.scrollY) },
        });
      }
    });

    // Media elements
    const mediaElements = [];
    document.querySelectorAll('video, iframe').forEach((el) => {
      mediaElements.push({
        tag: el.tagName,
        src: el.src,
        width: el.width,
        height: el.height,
      });
    });

    // Background images
    const bgImages = [];
    document.querySelectorAll('*').forEach((el) => {
      const cs = window.getComputedStyle(el);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') {
        const rect = el.getBoundingClientRect();
        if (rect.width > 50 && rect.height > 50) {
          bgImages.push({
            element: el.tagName,
            className: el.className?.toString().substring(0, 100),
            backgroundImage: cs.backgroundImage.substring(0, 500),
            position: { top: Math.round(rect.top + window.scrollY) },
            size: { width: Math.round(rect.width), height: Math.round(rect.height) },
          });
        }
      }
    });

    // Get framer-specific section names
    const framerSections = [];
    document.querySelectorAll('[data-framer-name]').forEach((el) => {
      const rect = el.getBoundingClientRect();
      framerSections.push({
        name: el.getAttribute('data-framer-name'),
        tag: el.tagName,
        position: { top: Math.round(rect.top + window.scrollY) },
        size: { width: Math.round(rect.width), height: Math.round(rect.height) },
        styles: getStyles(el),
        text: el.textContent?.trim().substring(0, 300),
      });
    });
    framerSections.sort((a, b) => a.position.top - b.position.top);

    return {
      pageTitle: document.title,
      metaDescription: document.querySelector('meta[name="description"]')?.content,
      favicon: document.querySelector('link[rel="icon"]')?.href,
      ogImage: document.querySelector('meta[property="og:image"]')?.content,
      bodyStyles,
      htmlStyles,
      navLinks,
      headings,
      paragraphs,
      buttons,
      images,
      allLinks,
      svgs,
      mediaElements,
      bgImages: bgImages.slice(0, 50),
      framerSections,
      textColors: [...colorSet],
      backgroundColors: [...bgColorSet],
      groupedSections,
      pageHeight: document.body.scrollHeight,
      pageWidth: document.body.scrollWidth,
    };
  });

  fs.writeFileSync('/root/factory/electria-content.json', JSON.stringify(data, null, 2));
  console.log('Content saved to /root/factory/electria-content.json');

  console.log('\n=== EXTRACTION SUMMARY ===');
  console.log('Page title:', data.pageTitle);
  console.log('Meta description:', data.metaDescription);
  console.log('Page dimensions:', data.pageWidth + 'x' + data.pageHeight);
  console.log('Nav links:', data.navLinks.length);
  console.log('Headings:', data.headings.length);
  console.log('Paragraphs:', data.paragraphs.length);
  console.log('Buttons/CTAs:', data.buttons.length);
  console.log('Images:', data.images.length);
  console.log('SVG icons:', data.svgs.length);
  console.log('Background images:', data.bgImages.length);
  console.log('Framer sections:', data.framerSections.length);
  console.log('Grouped text sections:', data.groupedSections.length);
  console.log('Text colors found:', data.textColors.length);
  console.log('Background colors found:', data.backgroundColors.length);

  await browser.close();
})();
