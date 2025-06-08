import { prefersReducedMotion } from '@theme/utilities';

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('flexi-text[data-wiggle="true"]').forEach(textElement => {
    const chars = textElement.querySelectorAll('.flexi-char');
    const nonSpaces = Array.from(chars).filter(el => el.textContent.trim() !== '');

    if (nonSpaces.length === 0) return;

    const randomChar = nonSpaces[Math.floor(Math.random() * nonSpaces.length)];
    randomChar.classList.add('char-bounce');
  });
});

class FlexiText extends HTMLElement {
  connectedCallback() {
    requestAnimationFrame(this.#handleResize);
    if (this.dataset.textEffect && this.dataset.textEffect !== 'none' && !prefersReducedMotion()) {
      this.#setIntersectionObserver();
    }
  }

  disconnectedCallback() {
    this.#resizeObserver.disconnect();
    if (this.dataset.textEffect && this.dataset.textEffect !== 'none' && !prefersReducedMotion()) {
      this.intersectionObserver?.disconnect();
    }
  }

  #setIntersectionObserver() {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.classList.add('flexi-visible');
            if (this.dataset.animationRepeat === 'false') {
              this.intersectionObserver.unobserve(entry.target);
            }
          } else {
            this.classList.remove('flexi-visible');
          }
        });
      },
      { threshold: 0.3 }
    );

    this.intersectionObserver.observe(this);
  }

  #calculateOptimalFontSize = () => {
    if (!this.textContent?.trim()) return;
    this.classList.remove('active');
    if (this.offsetWidth <= 0) return;

    this.#resizeObserver.disconnect();
    this.style.fontSize = '1px';

    const fontSize = findOptimalFontSize(this, this.offsetWidth);

    this.style.fontSize = `${fontSize}px`;
    this.#resizeObserver.observe(this);
    this.classList.add('active');
  };

  #handleResize = () => {
    this.#calculateOptimalFontSize();
    const rect = this.getBoundingClientRect();
    const bottom = rect.bottom + window.scrollY;
    const distanceFromBottom = document.documentElement.offsetHeight - bottom;
    this.dataset.capText = (distanceFromBottom <= 100).toString();
  };

  #resizeObserver = new ResizeNotifier(this.#handleResize);
}

function checkTextOverflow(element, containerWidth, size) {
  element.style.fontSize = `${size}px`;
  return element.scrollWidth > containerWidth;
}

function findOptimalFontSize(element, containerWidth) {
  let minSize = 1;
  let maxSize = 500;
  const precision = 0.5;
  const textLength = element.textContent?.length || 0;
  let fontSize = Math.min(maxSize, Math.sqrt(containerWidth) * (15 / Math.sqrt(Math.max(1, textLength))));

  if (checkTextOverflow(element, containerWidth, fontSize)) {
    maxSize = fontSize;
  } else {
    minSize = fontSize;
  }

  let iterations = 0;
  const MAX_ITERATIONS = 30;

  while (maxSize - minSize > precision && iterations < MAX_ITERATIONS) {
    fontSize = (minSize + maxSize) / 2;
    if (checkTextOverflow(element, containerWidth, fontSize)) {
      maxSize = fontSize;
    } else {
      minSize = fontSize;
    }
    iterations++;
  }

  return minSize * 0.99;
}

if (!customElements.get('flexi-text')) {
  customElements.define('flexi-text', FlexiText);
}
