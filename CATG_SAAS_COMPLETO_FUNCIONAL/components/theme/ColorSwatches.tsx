export function ColorSwatches({ colors }: { colors: string[] }) {
  return (
    <div className="mt-3 grid grid-cols-5 gap-1.5">
      {colors.map((color) => (
        <span key={color} className="h-7 rounded-xl border border-white shadow-sm" style={{ backgroundColor: color }} />
      ))}
    </div>
  );
}
