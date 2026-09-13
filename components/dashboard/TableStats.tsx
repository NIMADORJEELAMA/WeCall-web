// components/dashboard/TableStats.tsx
export default function TableStats({ tables }: { tables: any[] }) {
  const total = tables.length;
  const occupied = tables.filter((t) => t.status === "OCCUPIED").length;
  const free = total - occupied;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-[10px] font-black text-gray-400 uppercase">
          Total Tables
        </p>
        <p className="text-2xl font-black text-gray-800">{total}</p>
      </div>
      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 shadow-sm">
        <p className="text-[10px] font-black text-amber-600 uppercase">
          Occupied
        </p>
        <p className="text-2xl font-black text-amber-700">{occupied}</p>
      </div>
      <div className="bg-green-50 p-4 rounded-2xl border border-green-100 shadow-sm">
        <p className="text-[10px] font-black text-green-600 uppercase">
          Available
        </p>
        <p className="text-2xl font-black text-green-700">{free}</p>
      </div>
    </div>
  );
}
