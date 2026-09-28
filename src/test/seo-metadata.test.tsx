import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PublicPageMetadata from "@/components/PublicPageMetadata";
import Frdo from "@/pages/Frdo";
import NotFound from "@/pages/NotFound";

vi.mock("@/components/Header", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("@/lib/telegram", () => ({ sendToTelegram: vi.fn() }));

const initialHtml = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
const initialHead = new DOMParser().parseFromString(initialHtml, "text/html").head.innerHTML;

function renderPublicRoute(path: string) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <PublicPageMetadata />
        <nav>
          <Link to="/frdo">Test: FRDO</Link>
          <Link to="/missing-seo-test">Test: missing</Link>
        </nav>
        <Routes>
          <Route path="/frdo" element={<Frdo />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

function expectSingleMeta(name: string, content: string) {
  const tags = document.head.querySelectorAll(`meta[name="${name}"]`);
  expect(tags).toHaveLength(1);
  expect(tags[0]).toHaveAttribute("content", content);
}

describe("Helmet ownership of boot metadata", () => {
  beforeEach(() => {
    document.head.innerHTML = initialHead;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    document.head.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("keeps Helmet-owned description/robots fallbacks without a misleading shared canonical", () => {
    for (const selector of ['meta[name="description"]', 'meta[name="robots"]']) {
      const tags = document.head.querySelectorAll(selector);
      expect(tags).toHaveLength(1);
      expect(tags[0]).toHaveAttribute("data-rh", "true");
    }
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(0);
  });

  it("replaces the home fallback with exactly one FRDO description and canonical", async () => {
    renderPublicRoute("/frdo");

    await waitFor(() => {
      expect(document.title).toBe("ФРДО — Проверка документов об образовании | 24ZXC");
      expectSingleMeta("description", "Помощь с внесением данных в ФРДО. Проверка дипломов, сертификатов и документов об образовании через федеральный реестр.");
      expectSingleMeta("robots", "index, follow, max-image-preview:large");
      const canonicals = document.head.querySelectorAll('link[rel="canonical"]');
      expect(canonicals).toHaveLength(1);
      expect(canonicals[0]).toHaveAttribute("href", "https://24zxc.ru/frdo");
    });
  });

  it("sets a single noindex on a direct 404 and removes the home canonical", async () => {
    renderPublicRoute("/missing-seo-test");

    await waitFor(() => {
      expect(document.title).toBe("Страница не найдена | 24ZXC");
      expectSingleMeta("robots", "noindex, follow");
      expectSingleMeta("description", "Запрашиваемая страница не найдена. Вернитесь на главную страницу 24ZXC.");
      expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(0);
    });
  });

  it("restores indexability and route metadata after FRDO -> 404 -> FRDO navigation", async () => {
    renderPublicRoute("/frdo");
    await waitFor(() => expectSingleMeta("robots", "index, follow, max-image-preview:large"));

    fireEvent.click(screen.getByRole("link", { name: "Test: missing" }));
    await waitFor(() => {
      expectSingleMeta("robots", "noindex, follow");
      expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(0);
    });

    fireEvent.click(screen.getByRole("link", { name: "Test: FRDO" }));
    await waitFor(() => {
      expectSingleMeta("robots", "index, follow, max-image-preview:large");
      expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
      expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute("href", "https://24zxc.ru/frdo");
      expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    });
  });
});
