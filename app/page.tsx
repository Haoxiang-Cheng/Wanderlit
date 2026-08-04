import type { Metadata } from "next";
import TravelPlanner from "./TravelPlanner";

export const metadata: Metadata = {
  title: "漫游签 · 随机旅行路线规划",
  description: "点亮中国旅行足迹，根据预算、日期和偏好生成个性化旅行路线。",
};

export default function Home() {
  return <TravelPlanner />;
}
