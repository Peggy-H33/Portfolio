import type { Metadata } from "next";
import { InterludePrototype } from "./prototype";

export const metadata: Metadata = {
  title: "幕间 · 作者的角色剧场",
  description: "让角色在文字之外继续生活。一个面向小说创作者的角色 Agent、群聊、Skill 与 Memory 工作台原型。",
};

export default function Home() {
  return <InterludePrototype />;
}
