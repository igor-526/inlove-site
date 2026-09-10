"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { ResponsiveImage } from "../atoms";
import { Button } from "../controls";
import styles from "./media.module.css";
import { parseCoordinates } from "./coordinates";

export type ImageSource = { src?: string; alt?: string; focalPoint?: string };
type Action = { label: string; href?: string; onClick?: () => void };

export function HeroMedia({ image, title, subtitle, primaryAction, secondaryAction, minHeightVariant = "immersive" }: { image: ImageSource; title: string; subtitle?: string; primaryAction?: Action; secondaryAction?: Action; minHeightVariant?: "immersive" | "compact" }) {
  const action = (value: Action, primary: boolean) => <Button variant={primary ? "primary" : "secondary"} size="large" href={value.href} onClick={value.onClick}>{value.label}</Button>;
  return <section className={`${styles.hero} ${styles[minHeightVariant]}`} aria-label={title}><div className={styles.heroImage}><ResponsiveImage src={image.src} alt={image.alt ?? ""} ratio="hero" focalPoint={image.focalPoint} priority /></div><div className={styles.overlay} /><div className={styles.heroContent}><h1>{title}</h1>{subtitle?.trim() ? <p>{subtitle}</p> : null}<div className={styles.heroActions}>{primaryAction ? action(primaryAction, true) : null}{secondaryAction ? action(secondaryAction, false) : null}</div></div></section>;
}

export function Gallery({ items, layout = "editorial", initialIndex = 0 }: { items: ImageSource[]; layout?: "editorial" | "carousel"; initialIndex?: number }) {
  const visibleItems = items.slice(0, 4);
  const start = Math.min(Math.max(initialIndex, 0), Math.max(visibleItems.length - 1, 0));
  const [current, setCurrent] = useState(start);
  const trackRef = useRef<HTMLDivElement>(null);
  const statusId = useId();
  if (!items.length) return null;
  if (layout === "carousel") return <Carousel items={items} initialIndex={initialIndex} />;
  const move = (next: number) => {
    const bounded = Math.min(Math.max(next, 0), visibleItems.length - 1);
    const slide = trackRef.current?.children[bounded];
    setCurrent(bounded);
    if (slide instanceof HTMLElement && typeof slide.scrollIntoView === "function") {
      const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      slide.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest", inline: "start" });
    }
  };
  const updateCurrentFromScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const slides = Array.from(track.children) as HTMLElement[];
    const nearest = slides.reduce((best, slide, index) => Math.abs(slide.offsetLeft - track.scrollLeft) < Math.abs(slides[best].offsetLeft - track.scrollLeft) ? index : best, 0);
    setCurrent(nearest);
  };
  return <div className={styles.galleryFrame}><div ref={trackRef} className={styles.gallery} role="region" tabIndex={0} aria-label="Галерея фотографий" aria-describedby={statusId} onScroll={updateCurrentFromScroll} onKeyDown={(event) => { if (event.key === "ArrowRight") { event.preventDefault(); move(current + 1); } if (event.key === "ArrowLeft") { event.preventDefault(); move(current - 1); } }}>{visibleItems.map((item, index) => <div className={styles.galleryItem} key={`${item.src}-${index}`}><ResponsiveImage {...item} ratio={index === 0 ? "16:10" : "3:2"} /></div>)}</div><p className={styles.srOnly} id={statusId} aria-live="polite">Изображение {current + 1} из {visibleItems.length}</p></div>;
}

export function Carousel({ items, initialIndex = 0, renderItem }: { items: ImageSource[]; initialIndex?: number; renderItem?: (item: ImageSource, index: number) => ReactNode }) {
  const start = Math.min(Math.max(initialIndex, 0), Math.max(items.length - 1, 0));
  const [current, setCurrent] = useState(start);
  const trackRef = useRef<HTMLDivElement>(null);
  const statusId = useId();
  if (!items.length) return null;
  const move = (next: number) => { const bounded = Math.min(Math.max(next, 0), items.length - 1); const slide = trackRef.current?.children[bounded]; setCurrent(bounded); if (slide instanceof HTMLElement && typeof slide.scrollIntoView === "function") slide.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" }); };
  return <div className={styles.carousel} onKeyDown={(event) => { if (event.key === "ArrowRight") move(current + 1); if (event.key === "ArrowLeft") move(current - 1); }}><div className={styles.controls}><button type="button" onClick={() => move(current - 1)} disabled={current === 0} aria-label="Предыдущее изображение">←</button><button type="button" onClick={() => move(current + 1)} disabled={current === items.length - 1} aria-label="Следующее изображение">→</button></div><div ref={trackRef} className={styles.track} tabIndex={0} aria-describedby={statusId}>{items.map((item, index) => <div className={styles.slide} key={`${item.src}-${index}`}>{renderItem ? renderItem(item, index) : <ResponsiveImage {...item} ratio="4:5" />}</div>)}</div><p className={styles.srOnly} id={statusId} aria-live="polite">Изображение {current + 1} из {items.length}</p></div>;
}

export function MapEmbed({ coordinates, address, mapsUrl }: { coordinates?: { lat: number; lng: number }; address: string; mapsUrl?: string }) {
  const point = parseCoordinates(coordinates);
  const embedUrl = point ? `https://yandex.ru/map-widget/v1/?ll=${point.lng}%2C${point.lat}&z=14&pt=${point.lng},${point.lat},pm2rdl` : undefined;
  const routeUrl = mapsUrl && /^https?:\/\//i.test(mapsUrl) ? mapsUrl : undefined;
  return <figure className={styles.map}><div className={styles.mapFrame}>{embedUrl ? <iframe title={`Карта: ${address}`} src={embedUrl} loading="lazy" allowFullScreen /> : <div className={styles.mapFallback}>Карта недоступна</div>}</div><figcaption><span>{address}</span>{routeUrl ? <a href={routeUrl} target="_blank" rel="noopener noreferrer">Открыть маршрут</a> : null}</figcaption></figure>;
}
