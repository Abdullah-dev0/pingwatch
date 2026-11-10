import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// unmount rendered components between tests
afterEach(() => cleanup());
