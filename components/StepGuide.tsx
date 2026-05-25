import { clsx } from "clsx";

export function StepGuide({
  title,
  description,
  steps,
  className
}: {
  title: string;
  description: string;
  steps: Array<{ title: string; description: string }>;
  className?: string;
}) {
  return (
    <section className={clsx("rounded-3xl border border-gray-200 bg-white p-6 shadow-sm", className)}>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">{title}</p>
        <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
      </div>
      <div className="mt-6 space-y-4">
        {steps.map((step, index) => (
          <div key={step.title} className="flex gap-4 rounded-3xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-3xl bg-black text-sm font-black text-white">{index + 1}</div>
            <div>
              <p className="font-black text-gray-950">{step.title}</p>
              <p className="mt-1 text-sm text-gray-600">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
