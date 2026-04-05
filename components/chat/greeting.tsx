import { motion } from "framer-motion";
import type { CompareLab } from "@/lib/ai/prompts";

const GREETING_COPY: Record<
  CompareLab,
  { title: string; description: string }
> = {
  pi: {
    title: "Prompt Iteration Lab",
    description:
      "Compare how different system prompts change behavior, accuracy, and output structure.",
  },
  gc: {
    title: "Guardrails & Constraints",
    description:
      "Enforcing structure, tone, and boundaries to make AI outputs usable in systems.",
  },
};

export function Greeting({ compareLab }: { compareLab: CompareLab }) {
  const { title, description } = GREETING_COPY[compareLab];
  return (
    <div className="flex flex-col items-center px-4" key="overview">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-center font-semibold text-2xl tracking-tight text-foreground md:text-3xl"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {title}
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 max-w-md text-center text-muted-foreground/80 text-sm"
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {description}
      </motion.div>
    </div>
  );
}
