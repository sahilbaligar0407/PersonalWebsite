"use client";
import { useRef } from "react";
import { PRODUCTS } from "../content";
import { HorizontalTrack, TrackCard } from "../recipes/HorizontalTrack";
import { useColorWorld } from "../recipes/ColorWorld";
import { SceneFrame } from "../runtime/SceneFrame";

export const CREAM = { background: "#eee8da", ink: "#161512", accent: "#b2410f" } as const;

export default function Products() {
  const root = useRef<HTMLElement>(null);
  useColorWorld(root, CREAM);

  return (
    <SceneFrame id="products" ref={root} label={PRODUCTS.label} className="products">
      <HorizontalTrack
        label="Products"
        mobile="stack"
        parallax={8}
        intro={
          <div className="products__intro">
            <p className="products__label sbk-label">{PRODUCTS.label}</p>
            <h2 className="products__title">{PRODUCTS.title}</h2>
            <p className="products__body">{PRODUCTS.body}</p>
          </div>
        }
      >
        {PRODUCTS.items.map((p) => (
          <TrackCard key={p.title} media={p.media} size="l" className={p.status === "wip" ? "products__card products__card--wip" : "products__card"}>
            <div className="products__head">
              <h3 className="products__name">
                {p.title}
                {p.aka ? <span className="products__aka"> {p.aka}</span> : null}
              </h3>
              <span className={p.status === "live" ? "sbk-tag sbk-tag--live products__tag" : "sbk-tag products__tag"}>
                {p.status === "live" ? "Live" : "WIP"}
              </span>
            </div>
            <p className="products__desc">{p.description}</p>
            {p.stack.length ? (
              <ul className="sbk-chips products__chips" aria-label={`${p.title} stack`}>
                {p.stack.map((s) => (
                  <li key={s} className="sbk-chip">
                    {s}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="products__links">
              {p.links.length ? (
                p.links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="sbk-link"
                    {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {l.label}
                    <span className="sbk-link__arrow" aria-hidden="true">
                      {"↗"}
                    </span>
                  </a>
                ))
              ) : (
                <span className="products__wip">Work in Progress</span>
              )}
            </div>
          </TrackCard>
        ))}
      </HorizontalTrack>
    </SceneFrame>
  );
}
