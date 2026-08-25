import { describe,expect,it } from "vitest";
import { cn,money } from "./utils";
describe("shared utilities",()=>{it("merges Tailwind classes",()=>expect(cn("p-2","p-4")).toBe("p-4"));it("formats Peruvian currency",()=>expect(money(35,"PEN")).toContain("35"))});
