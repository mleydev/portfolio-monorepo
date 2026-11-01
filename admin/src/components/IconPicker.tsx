import { useMemo, useState, type ComponentType } from "react";
import {
  Activity,
  Atom,
  BrainCircuit,
  Boxes,
  Braces,
  Check,
  ChevronDown,
  Cloud,
  Code2,
  Cpu,
  Database,
  FlaskConical,
  GitBranch,
  Globe,
  Layers,
  Layout,
  Lock,
  Palette,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wrench,
  X,
  type LucideProps,
} from "lucide-react";

import {
  siBootstrap,
  siCplusplus,
  siCss,
  siDart,
  siDocker,
  siExpress,
  siFigma,
  siFlutter,
  siGit,
  siGithub,
  siGitlab,
  siGo,
  siGraphql,
  siHtml5,
  siJavascript,
  siKotlin,
  siKubernetes,
  siLaravel,
  siMongodb,
  siMysql,
  siNestjs,
  siNextdotjs,
  siNodedotjs,
  siOpenjdk,
  siPhp,
  siPostgresql,
  siPrisma,
  siPython,
  siReact,
  siRedis,
  siRedux,
  siRust,
  siSass,
  siSpringboot,
  siSwift,
  siTailwindcss,
  siTypescript,
  siVite,
  siVuedotjs,
  siWebpack,
} from "simple-icons";

import "./IconPicker.css";

type IconComponent = ComponentType<LucideProps>;

type IconCategory =
  | "Frontend"
  | "Backend"
  | "Database"
  | "Languages"
  | "Frameworks"
  | "DevOps"
  | "Design"
  | "AI & Data"
  | "Testing"
  | "Security"
  | "General";

interface IconDefinition {
  name: string;
  value: string;
  category: IconCategory;
  keywords: string[];
  icon: IconComponent;
  color?: string;
  isBrand?: boolean;
}

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

interface SimpleBrand {
  title: string;
  slug: string;
  hex: string;
  path: string;
}

const createBrandIcon = (brand: SimpleBrand): IconComponent => {
  const BrandIcon: IconComponent = ({ size = 24, className, ...props }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}>
      <path d={brand.path} />
    </svg>
  );

  BrandIcon.displayName = `${brand.title}Icon`;

  return BrandIcon;
};

const brandIcons: IconDefinition[] = [
  // Frontend
  {
    name: "React",
    value: "brand:react",
    category: "Frontend",
    keywords: ["react", "reactjs", "frontend", "library", "ری‌اکت"],
    icon: createBrandIcon(siReact),
    color: `#${siReact.hex}`,
    isBrand: true,
  },
  {
    name: "Next.js",
    value: "brand:nextdotjs",
    category: "Frontend",
    keywords: ["next", "nextjs", "react", "framework", "نکست"],
    icon: createBrandIcon(siNextdotjs),
    color: `#${siNextdotjs.hex}`,
    isBrand: true,
  },
  {
    name: "Vue.js",
    value: "brand:vuedotjs",
    category: "Frontend",
    keywords: ["vue", "vuejs", "frontend", "ویو"],
    icon: createBrandIcon(siVuedotjs),
    color: `#${siVuedotjs.hex}`,
    isBrand: true,
  },
  {
    name: "Redux",
    value: "brand:redux",
    category: "Frontend",
    keywords: ["redux", "state", "management", "ریداکس"],
    icon: createBrandIcon(siRedux),
    color: `#${siRedux.hex}`,
    isBrand: true,
  },
  {
    name: "Tailwind CSS",
    value: "brand:tailwindcss",
    category: "Frontend",
    keywords: ["tailwind", "css", "styling", "تیلویند"],
    icon: createBrandIcon(siTailwindcss),
    color: `#${siTailwindcss.hex}`,
    isBrand: true,
  },
  {
    name: "CSS",
    value: "brand:css",
    category: "Frontend",
    keywords: ["css", "stylesheet", "سی‌اس‌اس"],
    icon: createBrandIcon(siCss),
    color: `#${siCss.hex}`,
    isBrand: true,
  },
  {
    name: "HTML5",
    value: "brand:html5",
    category: "Frontend",
    keywords: ["html", "html5", "markup", "اچ‌تی‌ام‌ال"],
    icon: createBrandIcon(siHtml5),
    color: `#${siHtml5.hex}`,
    isBrand: true,
  },
  {
    name: "Bootstrap",
    value: "brand:bootstrap",
    category: "Frontend",
    keywords: ["bootstrap", "css", "framework"],
    icon: createBrandIcon(siBootstrap),
    color: `#${siBootstrap.hex}`,
    isBrand: true,
  },
  {
    name: "Sass",
    value: "brand:sass",
    category: "Frontend",
    keywords: ["sass", "scss", "css"],
    icon: createBrandIcon(siSass),
    color: `#${siSass.hex}`,
    isBrand: true,
  },
  {
    name: "Vite",
    value: "brand:vite",
    category: "Frontend",
    keywords: ["vite", "build", "frontend"],
    icon: createBrandIcon(siVite),
    color: `#${siVite.hex}`,
    isBrand: true,
  },
  {
    name: "Webpack",
    value: "brand:webpack",
    category: "Frontend",
    keywords: ["webpack", "bundler", "build"],
    icon: createBrandIcon(siWebpack),
    color: `#${siWebpack.hex}`,
    isBrand: true,
  },

  // Languages
  {
    name: "JavaScript",
    value: "brand:javascript",
    category: "Languages",
    keywords: ["javascript", "js", "programming", "جاوااسکریپت"],
    icon: createBrandIcon(siJavascript),
    color: `#${siJavascript.hex}`,
    isBrand: true,
  },
  {
    name: "TypeScript",
    value: "brand:typescript",
    category: "Languages",
    keywords: ["typescript", "ts", "programming", "تایپ‌اسکریپت"],
    icon: createBrandIcon(siTypescript),
    color: `#${siTypescript.hex}`,
    isBrand: true,
  },
  {
    name: "Python",
    value: "brand:python",
    category: "Languages",
    keywords: ["python", "py", "AI", "پایتون"],
    icon: createBrandIcon(siPython),
    color: `#${siPython.hex}`,
    isBrand: true,
  },
  {
    name: "Java",
    value: "brand:openjdk",
    category: "Languages",
    keywords: ["java", "openjdk", "backend", "جاوا"],
    icon: createBrandIcon(siOpenjdk),
    color: `#${siOpenjdk.hex}`,
    isBrand: true,
  },
  {
    name: "C++",
    value: "brand:cplusplus",
    category: "Languages",
    keywords: ["cpp", "c++", "programming"],
    icon: createBrandIcon(siCplusplus),
    color: `#${siCplusplus.hex}`,
    isBrand: true,
  },
  {
    name: "Go",
    value: "brand:go",
    category: "Languages",
    keywords: ["golang", "go", "backend"],
    icon: createBrandIcon(siGo),
    color: `#${siGo.hex}`,
    isBrand: true,
  },
  {
    name: "Rust",
    value: "brand:rust",
    category: "Languages",
    keywords: ["rust", "rs", "systems"],
    icon: createBrandIcon(siRust),
    color: `#${siRust.hex}`,
    isBrand: true,
  },
  {
    name: "PHP",
    value: "brand:php",
    category: "Languages",
    keywords: ["php", "backend", "پی‌اچ‌پی"],
    icon: createBrandIcon(siPhp),
    color: `#${siPhp.hex}`,
    isBrand: true,
  },
  {
    name: "Dart",
    value: "brand:dart",
    category: "Languages",
    keywords: ["dart", "flutter"],
    icon: createBrandIcon(siDart),
    color: `#${siDart.hex}`,
    isBrand: true,
  },
  {
    name: "Swift",
    value: "brand:swift",
    category: "Languages",
    keywords: ["swift", "ios", "apple"],
    icon: createBrandIcon(siSwift),
    color: `#${siSwift.hex}`,
    isBrand: true,
  },
  {
    name: "Kotlin",
    value: "brand:kotlin",
    category: "Languages",
    keywords: ["kotlin", "android"],
    icon: createBrandIcon(siKotlin),
    color: `#${siKotlin.hex}`,
    isBrand: true,
  },

  // Backend & Frameworks
  {
    name: "Node.js",
    value: "brand:nodedotjs",
    category: "Backend",
    keywords: ["node", "nodejs", "javascript", "backend"],
    icon: createBrandIcon(siNodedotjs),
    color: `#${siNodedotjs.hex}`,
    isBrand: true,
  },
  {
    name: "NestJS",
    value: "brand:nestjs",
    category: "Backend",
    keywords: ["nestjs", "nest", "node", "backend", "نست"],
    icon: createBrandIcon(siNestjs),
    color: `#${siNestjs.hex}`,
    isBrand: true,
  },
  {
    name: "Express",
    value: "brand:express",
    category: "Backend",
    keywords: ["express", "expressjs", "node", "api"],
    icon: createBrandIcon(siExpress),
    color: `#${siExpress.hex}`,
    isBrand: true,
  },
  {
    name: "Laravel",
    value: "brand:laravel",
    category: "Frameworks",
    keywords: ["laravel", "php", "framework"],
    icon: createBrandIcon(siLaravel),
    color: `#${siLaravel.hex}`,
    isBrand: true,
  },
  {
    name: "Spring Boot",
    value: "brand:springboot",
    category: "Frameworks",
    keywords: ["spring", "springboot", "java"],
    icon: createBrandIcon(siSpringboot),
    color: `#${siSpringboot.hex}`,
    isBrand: true,
  },
  {
    name: "Flutter",
    value: "brand:flutter",
    category: "Frameworks",
    keywords: ["flutter", "mobile", "cross-platform"],
    icon: createBrandIcon(siFlutter),
    color: `#${siFlutter.hex}`,
    isBrand: true,
  },

  // Database
  {
    name: "PostgreSQL",
    value: "brand:postgresql",
    category: "Database",
    keywords: ["postgres", "postgresql", "sql", "دیتابیس"],
    icon: createBrandIcon(siPostgresql),
    color: `#${siPostgresql.hex}`,
    isBrand: true,
  },
  {
    name: "MySQL",
    value: "brand:mysql",
    category: "Database",
    keywords: ["mysql", "sql", "database"],
    icon: createBrandIcon(siMysql),
    color: `#${siMysql.hex}`,
    isBrand: true,
  },
  {
    name: "MongoDB",
    value: "brand:mongodb",
    category: "Database",
    keywords: ["mongodb", "mongo", "nosql"],
    icon: createBrandIcon(siMongodb),
    color: `#${siMongodb.hex}`,
    isBrand: true,
  },
  {
    name: "Redis",
    value: "brand:redis",
    category: "Database",
    keywords: ["redis", "cache", "database"],
    icon: createBrandIcon(siRedis),
    color: `#${siRedis.hex}`,
    isBrand: true,
  },
  {
    name: "Prisma",
    value: "brand:prisma",
    category: "Database",
    keywords: ["prisma", "orm", "database"],
    icon: createBrandIcon(siPrisma),
    color: `#${siPrisma.hex}`,
    isBrand: true,
  },
  {
    name: "GraphQL",
    value: "brand:graphql",
    category: "Database",
    keywords: ["graphql", "api", "query"],
    icon: createBrandIcon(siGraphql),
    color: `#${siGraphql.hex}`,
    isBrand: true,
  },

  // DevOps
  {
    name: "Git",
    value: "brand:git",
    category: "DevOps",
    keywords: ["git", "version control", "گیت"],
    icon: createBrandIcon(siGit),
    color: `#${siGit.hex}`,
    isBrand: true,
  },
  {
    name: "GitHub",
    value: "brand:github",
    category: "DevOps",
    keywords: ["github", "git", "repository", "گیت‌هاب"],
    icon: createBrandIcon(siGithub),
    color: `#${siGithub.hex}`,
    isBrand: true,
  },
  {
    name: "GitLab",
    value: "brand:gitlab",
    category: "DevOps",
    keywords: ["gitlab", "git", "repository"],
    icon: createBrandIcon(siGitlab),
    color: `#${siGitlab.hex}`,
    isBrand: true,
  },
  {
    name: "Docker",
    value: "brand:docker",
    category: "DevOps",
    keywords: ["docker", "container", "devops"],
    icon: createBrandIcon(siDocker),
    color: `#${siDocker.hex}`,
    isBrand: true,
  },
  {
    name: "Kubernetes",
    value: "brand:kubernetes",
    category: "DevOps",
    keywords: ["k8s", "kubernetes", "devops"],
    icon: createBrandIcon(siKubernetes),
    color: `#${siKubernetes.hex}`,
    isBrand: true,
  },

  // Design
  {
    name: "Figma",
    value: "brand:figma",
    category: "Design",
    keywords: ["figma", "design", "ui", "ux"],
    icon: createBrandIcon(siFigma),
    color: `#${siFigma.hex}`,
    isBrand: true,
  },
];

const lucideIcons: IconDefinition[] = [
  {
    name: "Code",
    value: "lucide:Code2",
    category: "General",
    keywords: ["code", "coding", "programming", "کدنویسی"],
    icon: Code2,
  },
  {
    name: "Terminal",
    value: "lucide:Terminal",
    category: "General",
    keywords: ["terminal", "cli", "command"],
    icon: Terminal,
  },
  {
    name: "Braces",
    value: "lucide:Braces",
    category: "Languages",
    keywords: ["braces", "json", "code"],
    icon: Braces,
  },
  {
    name: "Database",
    value: "lucide:Database",
    category: "Database",
    keywords: ["database", "sql", "storage"],
    icon: Database,
  },
  {
    name: "Server",
    value: "lucide:Server",
    category: "Backend",
    keywords: ["server", "backend", "hosting"],
    icon: Server,
  },
  {
    name: "Layers",
    value: "lucide:Layers",
    category: "Frontend",
    keywords: ["layers", "frontend", "architecture"],
    icon: Layers,
  },
  {
    name: "Layout",
    value: "lucide:Layout",
    category: "Frontend",
    keywords: ["layout", "ui", "interface"],
    icon: Layout,
  },
  {
    name: "Palette",
    value: "lucide:Palette",
    category: "Design",
    keywords: ["palette", "color", "design"],
    icon: Palette,
  },
  {
    name: "Cloud",
    value: "lucide:Cloud",
    category: "DevOps",
    keywords: ["cloud", "hosting", "deployment"],
    icon: Cloud,
  },
  {
    name: "Git Branch",
    value: "lucide:GitBranch",
    category: "DevOps",
    keywords: ["git", "branch", "version control"],
    icon: GitBranch,
  },
  {
    name: "Shield Check",
    value: "lucide:ShieldCheck",
    category: "Security",
    keywords: ["security", "protection", "safe"],
    icon: ShieldCheck,
  },
  {
    name: "Lock",
    value: "lucide:Lock",
    category: "Security",
    keywords: ["lock", "authentication", "privacy"],
    icon: Lock,
  },
  {
    name: "Brain",
    value: "lucide:BrainCircuit",
    category: "AI & Data",
    keywords: ["brain", "ai", "artificial intelligence"],
    icon: BrainCircuit,
  },
  {
    name: "Atom",
    value: "lucide:Atom",
    category: "AI & Data",
    keywords: ["atom", "science", "technology"],
    icon: Atom,
  },
  {
    name: "Activity",
    value: "lucide:Activity",
    category: "Testing",
    keywords: ["activity", "monitoring", "performance"],
    icon: Activity,
  },
  {
    name: "Flask",
    value: "lucide:FlaskConical",
    category: "Testing",
    keywords: ["flask", "testing", "experiment"],
    icon: FlaskConical,
  },
  {
    name: "Boxes",
    value: "lucide:Boxes",
    category: "General",
    keywords: ["boxes", "modules", "components"],
    icon: Boxes,
  },
  {
    name: "CPU",
    value: "lucide:Cpu",
    category: "General",
    keywords: ["cpu", "hardware", "processor"],
    icon: Cpu,
  },
  {
    name: "Globe",
    value: "lucide:Globe",
    category: "General",
    keywords: ["globe", "web", "internet"],
    icon: Globe,
  },
  {
    name: "Sparkles",
    value: "lucide:Sparkles",
    category: "AI & Data",
    keywords: ["sparkles", "ai", "magic"],
    icon: Sparkles,
  },
  {
    name: "Wrench",
    value: "lucide:Wrench",
    category: "General",
    keywords: ["wrench", "tools", "development"],
    icon: Wrench,
  },
];

const allIcons = [...brandIcons, ...lucideIcons];

const categories: {
  name: string;
  label: string;
  icon: IconComponent;
}[] = [
  { name: "All", label: "همه", icon: Layers },
  { name: "Frontend", label: "فرانت‌اند", icon: Layout },
  { name: "Backend", label: "بک‌اند", icon: Server },
  { name: "Database", label: "دیتابیس", icon: Database },
  { name: "Languages", label: "زبان‌ها", icon: Braces },
  { name: "Frameworks", label: "فریم‌ورک‌ها", icon: Boxes },
  { name: "DevOps", label: "DevOps", icon: Cloud },
  { name: "Design", label: "طراحی", icon: Palette },
  { name: "AI & Data", label: "هوش مصنوعی", icon: BrainCircuit },
  { name: "Testing", label: "تست", icon: FlaskConical },
  { name: "Security", label: "امنیت", icon: ShieldCheck },
  { name: "General", label: "عمومی", icon: Wrench },
];

const legacyIconMap: Record<string, string> = {
  SiReact: "brand:react",
  SiNextdotjs: "brand:nextdotjs",
  SiNestjs: "brand:nestjs",
  SiTypescript: "brand:typescript",
  SiJavascript: "brand:javascript",
  SiPostgresql: "brand:postgresql",
  SiPrisma: "brand:prisma",
  SiTailwindcss: "brand:tailwindcss",
  SiCss3: "brand:css",
  FaGithub: "brand:github",
  Github: "brand:github",
  Code: "lucide:Code2",
  Code2: "lucide:Code2",
  LuCode: "lucide:Code2",
  Braces: "lucide:Braces",
  Database: "lucide:Database",
  Terminal: "lucide:Terminal",
  Palette: "lucide:Palette",
  Atom: "lucide:Atom",
};

export function getSkillIcon(value?: string): IconComponent {
  if (!value) return Code2;

  const normalizedValue = legacyIconMap[value] ?? value;
  const foundIcon = allIcons.find((item) => item.value === normalizedValue);

  return foundIcon?.icon ?? Code2;
}

export function getSkillIconColor(value?: string): string | undefined {
  if (!value) return undefined;

  const normalizedValue = legacyIconMap[value] ?? value;

  return allIcons.find((item) => item.value === normalizedValue)?.color;
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const normalizedValue = legacyIconMap[value] ?? value;

  const selectedIcon = useMemo(
    () => allIcons.find((item) => item.value === normalizedValue),
    [normalizedValue],
  );

  const filteredIcons = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allIcons.filter((item) => {
      const matchesCategory =
        activeCategory === "All" || item.category === activeCategory;

      const searchableText = [
        item.name,
        item.category,
        item.value,
        ...item.keywords,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  const SelectedIcon = selectedIcon?.icon ?? Code2;

  const handleSelect = (icon: IconDefinition) => {
    onChange(icon.value);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="icon-picker">
      <button
        type="button"
        className="icon-picker-trigger"
        onClick={() => setIsOpen(true)}
        aria-expanded={isOpen}
        aria-label="انتخاب آیکون">
        <span className="icon-picker-trigger-preview">
          <SelectedIcon
            size={22}
            color={selectedIcon?.color}
            strokeWidth={1.8}
          />
        </span>

        <span className="icon-picker-trigger-content">
          <span className="icon-picker-trigger-title">
            {selectedIcon?.name ?? "انتخاب آیکون"}
          </span>
          <span className="icon-picker-trigger-subtitle">
            {selectedIcon
              ? selectedIcon.isBrand
                ? "Brand icon"
                : "Lucide icon"
              : "یک آیکون برای مهارت انتخاب کنید"}
          </span>
        </span>

        <ChevronDown size={18} className="icon-picker-chevron" />
      </button>

      {isOpen && (
        <div className="icon-picker-modal-overlay">
          <div
            className="icon-picker-backdrop"
            onClick={() => setIsOpen(false)}
          />

          <div className="icon-picker-panel">
            <div className="icon-picker-header">
              <div>
                <h3>انتخاب آیکون</h3>
                <p>لوگوهای تکنولوژی و آیکون‌های عمومی</p>
              </div>

              <button
                type="button"
                className="icon-picker-close"
                onClick={() => setIsOpen(false)}
                aria-label="بستن">
                <X size={18} />
              </button>
            </div>

            <div className="icon-picker-search">
              <Search size={18} />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جست‌وجوی آیکون، تکنولوژی یا دسته‌بندی..."
                autoFocus
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="پاک کردن جست‌وجو">
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="icon-picker-categories">
              {categories.map((category) => {
                const CategoryIcon = category.icon;
                const count =
                  category.name === "All"
                    ? allIcons.length
                    : allIcons.filter((item) => item.category === category.name)
                        .length;

                return (
                  <button
                    type="button"
                    key={category.name}
                    className={`icon-picker-category ${
                      activeCategory === category.name ? "active" : ""
                    }`}
                    onClick={() => setActiveCategory(category.name)}>
                    <CategoryIcon size={15} />
                    <span>{category.label}</span>
                    <span className="icon-picker-category-count">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="icon-picker-results-header">
              <span>
                {activeCategory === "All"
                  ? "تمام آیکون‌ها"
                  : categories.find((item) => item.name === activeCategory)
                      ?.label}
              </span>
              <span>{filteredIcons.length} آیکون</span>
            </div>

            <div className="icon-picker-grid">
              {filteredIcons.map((item) => {
                const Icon = item.icon;
                const isSelected = normalizedValue === item.value;

                return (
                  <button
                    type="button"
                    key={item.value}
                    className={`icon-picker-item ${
                      isSelected ? "selected" : ""
                    }`}
                    onClick={() => handleSelect(item)}
                    title={item.name}
                    aria-label={`انتخاب ${item.name}`}>
                    <span className="icon-picker-item-icon">
                      <Icon size={25} color={item.color} strokeWidth={1.8} />
                      {isSelected && (
                        <span className="icon-picker-item-check">
                          <Check size={11} />
                        </span>
                      )}
                    </span>

                    <span className="icon-picker-item-name">{item.name}</span>

                    {item.isBrand && (
                      <span className="icon-picker-item-type">Brand</span>
                    )}
                  </button>
                );
              })}

              {filteredIcons.length === 0 && (
                <div className="icon-picker-empty">
                  <Search size={28} />
                  <strong>آیکونی پیدا نشد</strong>
                  <span>عبارت دیگری را جست‌وجو کنید.</span>
                </div>
              )}
            </div>

            <div className="icon-picker-footer">
              <span>
                <span className="icon-picker-footer-dot brand" />
                لوگوی رسمی برند
              </span>
              <span>
                <span className="icon-picker-footer-dot lucide" />
                آیکون عمومی
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
