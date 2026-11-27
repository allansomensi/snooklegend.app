import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { penalty, qrCode, qrPath } from "./qr";

const fingerprint = (m: boolean[][]) => createHash("sha256").update(m.map((r) => r.map((b) => (b ? "1" : "0")).join("")).join("\n")).digest("hex");

// An authenticator app's address, as the server makes it (crates/server/src/totp.rs).
const URI = "otpauth://totp/Snook%20Legend:ana?secret=JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP&issuer=Snook%20Legend&algorithm=SHA1&digits=6&period=30";

describe("the QR code of the two-step verification", () => {
  // The fingerprints were checked module by module against another encoder
  // (Kazuhiko Arase's QRCode, every mask, versions 1 to 10) before they
  // were pinned here.
  it("is the code another encoder makes", () => {
    const q = qrCode(URI);
    expect([q.version, q.mask, q.size]).toEqual([8, 2, 49]);
    expect(fingerprint(q.modules)).toBe("40dd3244fffa95c3cdde908fcc309f0387efab1e6cf15cc20e979e62f42ca404");
    const hello = qrCode("HELLO");
    expect([hello.version, hello.mask]).toEqual([1, 4]);
    expect(fingerprint(hello.modules)).toBe("c346c75add5698735afe3f7eb4f3e6c57ccefd9563f45f65c6d76aa518fb6f91");
  });

  it("has its three finder patterns and the dark module", () => {
    const q = qrCode(URI);
    const n = q.size;
    const finder = (x0: number, y0: number) => {
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
          const ring = Math.max(Math.abs(x - 3), Math.abs(y - 3));
          expect(q.modules[y0 + y][x0 + x]).toBe(ring !== 2);
        }
      }
    };
    finder(0, 0);
    finder(n - 7, 0);
    finder(0, n - 7);
    expect(q.modules[n - 8][8]).toBe(true);
  });

  it("takes the mask with the lowest penalty", () => {
    const best = qrCode(URI);
    for (let m = 0; m < 8; m++) expect(penalty(qrCode(URI, m).modules)).toBeGreaterThanOrEqual(penalty(best.modules));
  });

  it("grows with the text, up to what fits", () => {
    expect(qrCode("x".repeat(14)).version).toBe(1);
    expect(qrCode("x".repeat(15)).version).toBe(2);
    expect(qrCode("x".repeat(213)).version).toBe(10);
    expect(() => qrCode("x".repeat(214))).toThrow();
  });

  it("is drawn as one path with a quiet zone", () => {
    const q = qrCode("HELLO");
    const path = qrPath(q);
    expect(path.startsWith("M4 4h1v1h-1z")).toBe(true);
    expect(path.split("z").length - 1).toBe(q.modules.flat().filter(Boolean).length);
  });
});
