"use client";

import { useEffect, useRef, useState } from "react";
import { EXPERIENCE, VOLUNTEERING } from "@/lib/content";

const FINALIST_COUNT = 5;

export function About() {
  const counter = useRef<HTMLDivElement>(null);
  const meter = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);

  // Count up the first time the number scrolls into view.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer: ReturnType<typeof setInterval> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        if (reduce) return setCount(FINALIST_COUNT);
        let n = 0;
        timer = setInterval(() => {
          n += 1;
          setCount(n);
          if (n >= FINALIST_COUNT) clearInterval(timer);
        }, 160);
      },
      { threshold: 0.6 },
    );
    observer.observe(counter.current!);
    return () => {
      observer.disconnect();
      clearInterval(timer);
    };
  }, []);

  // The bass meter only moves while it's on screen.
  useEffect(() => {
    const el = meter.current!;
    const observer = new IntersectionObserver(([entry]) => el.classList.toggle("live", entry.isIntersecting), {
      threshold: 0.5,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="about" id="about">
      <div className="about-in">
        <div className="about-top">
          <h2>
            Off the
            <br />
            <span>clock</span>
          </h2>
          <p className="intro">
            I&apos;m Andrew. I grew up in <b>Los Angeles</b> and now study <b>CS and Philosophy at Brown</b>. I like
            building the thing I wish existed, then using it until it&apos;s actually good. Away from a screen I&apos;m
            usually running, playing bass, or on a jiu-jitsu mat.
          </p>
        </div>

        <div className="facts">
          <div className="fact f-run">
            <div>
              <h3>State finalist</h3>
              <p>Captain of the cross country and track team at Palisades Charter.</p>
              <div className="split">
                <span>4x cross country</span>
                <span>1x track</span>
              </div>
            </div>
            <div
              className="num"
              ref={counter}
              role="img"
              aria-label={`${FINALIST_COUNT} times a state finalist`}
            >
              {count}
              <small>x</small>
            </div>
          </div>

          <div className="fact f-bass">
            <div>
              <h3>Bass in The Spectrum</h3>
              <p>Picked up guitar in 10th grade, started bass when a friend needed one for his band.</p>
            </div>
            <div className="eq" ref={meter} aria-hidden="true">
              {Array.from({ length: 10 }, (_, i) => (
                <i key={i} />
              ))}
            </div>
          </div>

          <div className="fact f-mat">
            <div>
              <h3>Other hobbies</h3>
              <p>Things that keep me happy.</p>
            </div>
            <div className="chips2">
              <span>
                <b>Jiu-jitsu</b>
              </span>
              <span>
                <b>Chess</b>
              </span>
              <span>
                Intramural <b>basketball</b> at Brown
              </span>
              <span>
                <b>Guitar</b>
              </span>
            </div>
          </div>

          <div className="fact f-home">
            <div className="place">{VOLUNTEERING.when}</div>
            <h3>{VOLUNTEERING.name}</h3>
            <p>{VOLUNTEERING.body}</p>
          </div>
        </div>

        <div className="also">
          <h3>Before the projects</h3>
          <div className="also-grid">
            {EXPERIENCE.map((job) => (
              <div className="job" key={job.name}>
                <div className="when mono">{job.when}</div>
                <div>
                  <b>{job.name}</b>
                  <span>{job.body}</span>
                  {job.award && <em className="award">{job.award}</em>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
