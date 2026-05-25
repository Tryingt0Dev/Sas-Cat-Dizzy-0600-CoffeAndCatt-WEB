export function ColorSwatches({ colors }: { colors: string[] }) {
  return (
    <div className="mt-4 grid grid-cols-5 gap-2">
      {colors.map((color) => (
        <span key={color} className="h-10 rounded-2xl border border-white shadow-sm" style={{ backgroundColor: color }} />
      ))}
    </div>
  );
}
