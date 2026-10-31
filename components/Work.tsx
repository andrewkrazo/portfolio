"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { EMAIL, PROJECTS, type Project, type ProjectId, type Shot } from "@/lib/content";

const WIDE: ProjectId[] = ["syllabuddy", "placivic"];
const CARD_CLASS: Record<ProjectId, string> = {
  syllabuddy: "wide t-syl",
  rizdum: "t-riz",
  loops: "t-loo",
  placivic: "wide flip t-pla",
  fsab: "band",
};

function Screenshot({ shot, sizes }: { shot: Shot; sizes: string }) {
  return (
    <Image
      src={shot.src}
      alt={shot.alt}
      width={shot.phone ? 720 : 1600}
      height={shot.phone ? 1558 : 1000}
      sizes={sizes}
    />
  );
}

function Card({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const isBand = project.id === "fsab";
  const shots = project.shots.slice(0, project.cardShots);

  return (
    <article
      ref={ref}
      className={`tile ${CARD_CLASS[project.id]}`}
      data-p={project.id}
      onClick={onOpen}
      onPointerMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        ref.current!.style.setProperty("--mx", `${e.clientX - r.left}px`);
        ref.current!.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
    >
      {isBand ? (
        <>
          <h3 className="big">
            <button type="button" className="tile-btn">
              {project.name}
            </button>
          </h3>
          <span className="role">
            <b>Web developer, Sept 2026 - now</b>
            {project.line}
          </span>
          <span className="open" aria-hidden="true">
            +
          </span>
        </>
      ) : WIDE.includes(project.id) ? (
        <>
          <span className="open" aria-hidden="true">
            +
          </span>
          <div className="meta">
            <div className="top">
              <span className="where">{project.where}</span>
              <h3>
                <button type="button" className="tile-btn">
                  {project.name}
                </button>
              </h3>
              <p>{project.line}</p>
              <div className="tags">
                {project.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="shot">
            {shots.map((s) => (
              <Screenshot key={s.src} shot={s} sizes="(max-width: 720px) 100vw, (max-width: 900px) 50vw, 30vw" />
            ))}
          </div>
        </>
      ) : (
        <>
          <span className="where">{project.where}</span>
          <span className="open" aria-hidden="true">
            +
          </span>
          <div className="shot">
            {shots.map((s) => (
              <Screenshot key={s.src} shot={s} sizes={s.phone ? "20vw" : "(max-width: 900px) 100vw, 50vw"} />
            ))}
          </div>
          <div className="meta">
            <div>
              <h3>
                <button type="button" className="tile-btn">
                  {project.name}
                </button>
              </h3>
              <p>{project.line}</p>
            </div>
            <div className="tags">
              {project.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>
        </>
      )}
    </article>
  );
}

function Detail({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  // Play the exit first. With reduced motion there's nothing to wait for.
  const close = () => {
    const dialog = ref.current!;
    if (dialog.classList.contains("closing")) return;
    dialog.classList.add("closing");
    Promise.allSettled(dialog.getAnimations().map((a) => a.finished)).then(() => {
      dialog.classList.remove("closing");
      onClose();
    });
  };

  useEffect(() => {
    const dialog = ref.current!;
    if (project && !dialog.open) dialog.showModal();
    if (!project && dialog.open) dialog.close();
  }, [project]);

  return (
    <dialog
      ref={ref}
      className="detail"
      data-p={project?.id}
      aria-labelledby="d-title"
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault(); // Esc
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close(); // click on the backdrop
      }}
    >
      {project && (
        <>
          <div className="d-head">
            <div>
              <h3 id="d-title">{project.name}</h3>
              <p>{project.detailLine ?? project.line}</p>
            </div>
            <button type="button" className="d-close" onClick={close}>
              Close
            </button>
          </div>
          {project.shots.length > 0 && (
            <div className="d-gal">
              {project.shots.map((s) => (
                <Screenshot key={s.src} shot={s} sizes="600px" />
              ))}
            </div>
          )}
          <div className="d-body">
            <ul>
              {project.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <div className="d-side">
              <div>{project.stack}</div>
              {project.live && (
                <a href={project.live.href} target="_blank" rel="noopener noreferrer">
                  {project.live.label}
                </a>
              )}
              <a
                className="ghost"
                href={`mailto:${EMAIL}?subject=${encodeURIComponent(`${project.name} code`)}`}
              >
                Code on request
              </a>
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}

export function Work() {
  const [open, setOpen] = useState<Project | null>(null);
  const section = useRef<HTMLElement>(null);

  // As each card crosses the middle of the screen, the section's glow takes its color.
  useEffect(() => {
    const el = section.current!;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) el.dataset.glow = (e.target as HTMLElement).dataset.p;
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    el.querySelectorAll(".tile").forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="work" id="work" ref={section}>
      <div className="work-in">
        <h2>
          Things I&apos;ve
          <br />
          <span>built</span>
        </h2>
        <p className="lede">
          Three products since starting at Brown, one real client site from LA, and client work on campus. Open any
          tile for the details.
        </p>
        <div className="bento">
          {PROJECTS.map((p) => (
            <Card key={p.id} project={p} onOpen={() => setOpen(p)} />
          ))}
        </div>
      </div>
      <Detail project={open} onClose={() => setOpen(null)} />
    </section>
  );
}
