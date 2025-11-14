/**
 * ThinkingIndicator Component Tests
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ThinkingIndicator } from "./thinking";

describe("ThinkingIndicator", () => {
  it("should render thinking text", () => {
    const { container } = render(<ThinkingIndicator />);

    expect(container.textContent).toContain("thinking…");
  });

  it("should render three animated dots", () => {
    const { container } = render(<ThinkingIndicator />);

    const dots = container.querySelectorAll(".animate-bounce");
    expect(dots).toHaveLength(3);
  });

  it("should apply dark mode styles", () => {
    const { container } = render(<ThinkingIndicator isDarkMode={true} />);

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass("text-slate-300");

    const dots = container.querySelectorAll(".bg-slate-400");
    expect(dots).toHaveLength(3);
  });

  it("should apply light mode styles", () => {
    const { container } = render(<ThinkingIndicator isDarkMode={false} />);

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass("text-slate-500");

    const dots = container.querySelectorAll(".bg-slate-300");
    expect(dots).toHaveLength(3);
  });

  it("should have staggered animation delays", () => {
    const { container } = render(<ThinkingIndicator />);

    const dots = container.querySelectorAll(".animate-bounce");

    expect(dots[0]).toHaveStyle({ animationDelay: "-0.2s" });
    expect(dots[1]).toHaveStyle({ animationDelay: "-0.05s" });
    expect(dots[2]).toHaveStyle({ animationDelay: "0.1s" });
  });

  it("should have proper structure", () => {
    const { container } = render(<ThinkingIndicator />);

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass("inline-flex");
    expect(mainDiv).toHaveClass("items-center");
    expect(mainDiv).toHaveClass("gap-2");
    expect(mainDiv).toHaveClass("text-sm");
    expect(mainDiv).toHaveClass("font-medium");
  });

  it("should default to light mode when isDarkMode is undefined", () => {
    const { container } = render(<ThinkingIndicator />);

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass("text-slate-500");
  });
});
