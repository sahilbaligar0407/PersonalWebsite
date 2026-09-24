"use client";
import { useRef } from "react";
import { REPOS } from "../content";
import { StackPanel, StackedPanels } from "../recipes/StackedPanels";
import { SceneFrame } from "../runtime/SceneFrame";

const TONES = [
  { bg: "#1a1d17", ink: "#f2efe6" },
  { bg: "#b7c4a6", ink: "#12140f" },
  { bg: "#d2ff3c", ink: "#12140f" },
] as const;

export default function Repos() {
  const root = useRef<HTMLElement>(null);

  return (
    <SceneFrame id="github" ref={root} label={REPOS.label} className="repos" fullHeight={false}>
      <h2 className="sbk-sr">{REPOS.label}</h2>
      <StackedPanels>
        {REPOS.groups.map((group, i) => {
          const tone = TONES[i % TONES.length] ?? TONES[0];
          const solo = group.repos.length === 1;
          return (
            <StackPanel key={group.title} background={tone.bg} ink={tone.ink} className={solo ? "repos__panel repos__panel--solo" : "repos__panel"}>
              <div className="repos__text">
                <p className="repos__label sbk-label">{REPOS.label}</p>
                <h3 className="repos__title">{group.title}</h3>
                <p className="repos__intro">{group.intro}</p>
              </div>
              <ul className="repos__list">
                {group.repos.map((repo) => (
                  <li key={repo.name} className="repos__item">
                    <a href={repo.href} target="_blank" rel="noopener noreferrer" className="repos__name">
                      {repo.name}
                      <span className="repos__arrow" aria-hidden="true">
                        {"↗"}
                      </span>
                    </a>
                    <p className="repos__desc">{repo.description}</p>
                    <ul className="sbk-chips repos__chips" aria-label={`${repo.name} stack`}>
                      {repo.stack.map((s) => (
                        <li key={s} className="sbk-chip">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </StackPanel>
          );
        })}
      </StackedPanels>
    </SceneFrame>
  );
}
