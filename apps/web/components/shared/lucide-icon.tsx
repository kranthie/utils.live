import {
  ArrowLeftRight,
  Binary,
  BookOpen,
  Box,
  Braces,
  Calculator,
  CheckCircle,
  Clock,
  Cloud,
  Code2,
  Container,
  Database,
  FileCode,
  FileCode2,
  FileKey,
  FileText,
  Fingerprint,
  GitBranch,
  Globe,
  Globe2,
  Hash,
  Image,
  Key,
  KeyRound,
  Lock,
  Mail,
  Network,
  Palette,
  Pipette,
  Regex,
  Rss,
  Scale,
  Search,
  Shapes,
  ShieldCheck,
  Sparkles,
  Table,
  Type,
  Unlock,
  type LucideProps,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  ArrowLeftRight,
  Binary,
  BookOpen,
  Box,
  Braces,
  Calculator,
  CheckCircle,
  Clock,
  Cloud,
  Code2,
  Container,
  Database,
  FileCode,
  FileCode2,
  FileKey,
  FileText,
  Fingerprint,
  GitBranch,
  Globe,
  Globe2,
  Hash,
  Image,
  Key,
  KeyRound,
  Lock,
  Mail,
  Network,
  Palette,
  Pipette,
  Regex,
  Rss,
  Scale,
  Search,
  Shapes,
  ShieldCheck,
  Sparkles,
  Table,
  Type,
  Unlock,
};

interface LucideIconProps extends LucideProps {
  name: string;
}

export function LucideIcon({
  name,
  ...props
}: LucideIconProps): React.ReactElement {
  const Icon = iconMap[name];
  if (!Icon) {
    return <FileCode2 {...props} />;
  }
  return <Icon {...props} />;
}
