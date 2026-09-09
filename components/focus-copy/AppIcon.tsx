import {
  ArrowUp,
  BookOpen,
  FileText,
  Globe2,
  Landmark,
  Leaf,
  Mountain,
  Scale,
} from "lucide-react";

const iconMap: Record<string, typeof Landmark> = {
  landmark: Landmark,
  mountain: Mountain,
  "scroll-text": FileText,
  "chart-no-axes-combined": ArrowUp,
  leaf: Leaf,
  scale: Scale,
  "globe-2": Globe2,
  "book-open": BookOpen,
};

export default function AppIcon({
  name,
  size = 17,
}: {
  name: string | null;
  size?: number;
}) {
  const Icon = iconMap[name ?? "book-open"] ?? BookOpen;
  return <Icon size={size} strokeWidth={1.8} />;
}
