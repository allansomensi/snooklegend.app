import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

export function WindowsIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M0 3.45 9.75 2.1v9.45H0zm10.95-1.5L24 0v11.4H10.95zM0 12.6h9.75v9.45L0 20.7zm10.95 0H24V24l-13.05-1.8z" />
    </svg>
  );
}

export function AppleIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.15 6.9c-.95 0-2.42-1.08-3.96-1.04-2.04.03-3.91 1.18-4.96 3.01-2.12 3.68-.55 9.1 1.52 12.09 1.01 1.45 2.2 3.09 3.79 3.04 1.52-.07 2.09-.99 3.93-.99 1.83 0 2.35.99 3.96.95 1.64-.03 2.68-1.48 3.68-2.95 1.16-1.69 1.64-3.33 1.66-3.42-.04-.01-3.18-1.22-3.22-4.86-.03-3.04 2.48-4.49 2.6-4.56-1.43-2.09-3.62-2.32-4.39-2.38-2-.16-3.68 1.09-4.61 1.09zm3.38-3.07c.84-1.01 1.4-2.43 1.25-3.83-1.21.05-2.66.8-3.53 1.82-.78.9-1.46 2.34-1.27 3.71 1.34.1 2.71-.69 3.55-1.7z" />
    </svg>
  );
}

/** Tux, simplified. */
export function LinuxIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M12 1.5c-2.6 0-4.1 2.1-4.1 4.9 0 1.1.2 2-.3 3.2-.6 1.5-2.6 3.6-3.3 6.3-.4 1.4-.2 2.5.4 3.2.3.3.1.9.6 1.4.9.8 2.6.7 3.8.6 1.2-.1 2 .4 2.9.4s1.7-.5 2.9-.4c1.2.1 2.9.2 3.8-.6.5-.5.3-1.1.6-1.4.6-.7.8-1.8.4-3.2-.7-2.7-2.7-4.8-3.3-6.3-.5-1.2-.3-2.1-.3-3.2 0-2.8-1.5-4.9-4.1-4.9z"
      />
      <path fill="#fff" fillOpacity=".92" d="M12 9.2c-1.8 0-3.3 2.6-3.3 5.9 0 2.4 1.4 3.9 3.3 3.9s3.3-1.5 3.3-3.9c0-3.3-1.5-5.9-3.3-5.9z" />
      <circle cx="10.4" cy="6" r=".9" fill="#fff" />
      <circle cx="13.6" cy="6" r=".9" fill="#fff" />
      <path fill="#e8bc5e" d="M10.2 7.6c.6.7 1.2 1 1.8 1s1.2-.3 1.8-1c-.5-.3-1.1-.5-1.8-.5s-1.3.2-1.8.5zM5.2 19.9c-.3-.9.3-1.8 1.3-2.1 1-.2 2.2.7 2.6 1.8.4 1.2-.3 2.2-1.5 2.2-1 0-2.1-.9-2.4-1.9zm13.6 0c.3-.9-.3-1.8-1.3-2.1-1-.2-2.2.7-2.6 1.8-.4 1.2.3 2.2 1.5 2.2 1 0 2.1-.9 2.4-1.9z" />
    </svg>
  );
}

export function GithubIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57l-.02-2.04c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0 0 12 .3" />
    </svg>
  );
}

/** Bluesky's butterfly. */
export function BlueskyIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 10.8c-1.09-2.11-4.05-6.05-6.8-8C2.57.94 1.56 1.27.9 1.57.14 1.91 0 3.08 0 3.77c0 .69.38 5.65.62 6.48.82 2.74 3.72 3.66 6.39 3.36l.41-.05c-3.91.58-7.39 2-2.83 7.08 5.01 5.19 6.87-1.11 7.82-4.31.95 3.2 2.05 9.27 7.73 4.31 4.27-4.31 1.17-6.5-2.74-7.08l-.41-.05c2.67.3 5.57-.63 6.38-3.36.25-.83.63-5.79.63-6.48 0-.69-.14-1.86-.9-2.21-.66-.3-1.67-.62-4.3 1.24-2.76 1.95-5.72 5.89-6.8 8z" />
    </svg>
  );
}

/** A camera, as Instagram draws it. */
export function InstagramIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.25" />
      <circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Facebook's "f". */
export function FacebookIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  );
}

/** X's logo. */
export function XIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.63 7.58H.48l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.48 3.24H4.3l13.31 17.41z" />
    </svg>
  );
}

/** Threads' "@". */
export function ThreadsIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" {...props}>
      <path d="M16.5 11.4c-.2-2.6-1.8-3.9-4.2-3.9-2 0-3.4 1-3.9 2.6M16.5 11.4c-1.9-.6-6.3-.8-6.6 1.9-.2 1.7 1.4 2.6 2.9 2.5 2.4-.1 3.7-1.8 3.7-4.4zm0 0c2.6 1 3.3 3.6 2.3 5.7-1.3 2.7-4.3 3.9-7.1 3.9C6.6 21 3.5 17.5 3.5 12S6.6 3 11.7 3c3.9 0 6.6 1.9 7.8 5.4" />
    </svg>
  );
}

export function MicrosoftIcon(props: P) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="#f25022" d="M1 1h10.5v10.5H1z" />
      <path fill="#7fba00" d="M12.5 1H23v10.5H12.5z" />
      <path fill="#00a4ef" d="M1 12.5h10.5V23H1z" />
      <path fill="#ffb900" d="M12.5 12.5H23V23H12.5z" />
    </svg>
  );
}

/** The game's emblem: an 8-ball on green cloth. */
export function EightBall({ className, ...props }: P) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className} {...props}>
      <defs>
        <radialGradient id="eb-ball" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#5b5b5b" />
          <stop offset=".35" stopColor="#1c1c1c" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <radialGradient id="eb-shine" cx="30%" cy="25%" r="30%">
          <stop offset="0" stopColor="#fff" stopOpacity=".9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#eb-ball)" />
      <circle cx="36" cy="27" r="12.5" fill="#f5f0e6" />
      <text
        x="36"
        y="32.6"
        textAnchor="middle"
        fontSize="16"
        fontWeight="800"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fill="#0b0b0b"
      >
        8
      </text>
      <circle cx="32" cy="32" r="30" fill="url(#eb-shine)" />
    </svg>
  );
}
