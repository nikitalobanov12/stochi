import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("landing page editorial contract", () => {
  it("uses employer-focused protocol intelligence copy and section hierarchy", () => {
    const page = readFileSync("src/app/landing-page.tsx", "utf8");

    assert.equal(page.includes("bg-background"), true);
    assert.equal(page.includes("text-foreground"), true);
    assert.equal(
      page.includes("See your supplement protocol react before you trust it."),
      true,
    );
    assert.equal(
      page.includes("Turn supplement chaos into a protocol you can actually defend."),
      true,
    );
    assert.equal(page.includes("Try the Interactive Demo"), true);
    assert.equal(page.includes("href=\"/demo\""), true);
    assert.equal(page.includes("Your stack grew. Your confidence dropped."), true);
    assert.equal(page.includes("How it works"), true);
    assert.equal(page.includes("What you get from the audit"), true);
    assert.equal(
      page.includes("Why this instead of spreadsheets, notes, or Reddit"),
      true,
    );
    assert.equal(page.includes("Example audit"), true);
    assert.equal(page.includes("For informational purposes only."), true);
    assert.equal(
      /This tool does not provide\s+medical\s+advice, diagnosis, or treatment\./.test(
        page,
      ),
      true,
    );
  });

  it("avoids invented-looking hardcoded proof metrics in the landing surface", () => {
    const page = readFileSync("src/app/landing-page.tsx", "utf8");
    const hero = readFileSync(
      "src/components/landing/hero-interaction-alert.tsx",
      "utf8",
    );

    assert.equal(hero.includes("89,412"), false);
    assert.equal(hero.includes("1,423"), false);
    assert.equal(hero.includes("47ms"), false);
    assert.equal(page.includes("Execute 15+ supplements in 300ms"), false);
    assert.equal(page.includes("What employers can verify in 2 minutes"), false);
    assert.equal(
      page.includes("Built to make the safety model legible at a glance."),
      false,
    );
    assert.equal(page.includes("timing pressure"), false);
    assert.equal(page.includes("stack drift"), false);
    assert.equal(
      page.includes("without committing anything to your protocol"),
      false,
    );
    assert.equal(hero.includes("Demo trace based on seeded interaction rules"), true);
  });
});
