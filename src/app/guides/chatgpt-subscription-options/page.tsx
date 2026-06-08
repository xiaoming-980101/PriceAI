import type { Metadata } from "next";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { MdxGuidePage } from "@/components/MdxGuidePage";
import { parseMdxGuideFrontmatter, readMdxGuide } from "@/lib/mdx-guides";

export const revalidate = 86400;

const slug = "chatgpt-subscription-options";

export async function generateMetadata(): Promise<Metadata> {
  const source = await readMdxGuide(slug);
  const compiled = await compileMDX({
    source,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
      },
    },
  });
  const frontmatter = parseMdxGuideFrontmatter(compiled.frontmatter);

  return {
    title: frontmatter.title,
    description: frontmatter.description,
    alternates: {
      canonical: frontmatter.canonical,
    },
    openGraph: {
      title: `${frontmatter.title} | PriceAI`,
      description: frontmatter.description,
      url: `https://priceai.cc${frontmatter.canonical}`,
    },
  };
}

export default function ChatGptSubscriptionOptionsGuide() {
  return <MdxGuidePage slug={slug} />;
}
