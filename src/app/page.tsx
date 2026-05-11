import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-2 text-3xl font-bold">Sena EV</h1>
      <p className="mb-8 text-gray-600">
        LINE OA + Mini App สำหรับลูกค้ารถ EV และบริการหลังการขาย
      </p>

      <div className="grid gap-3">
        <Link
          href="/liff"
          className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
        >
          <div className="font-semibold">Mini App (LIFF)</div>
          <div className="text-sm text-gray-500">
            หน้า user — เปิดผ่าน LINE หรือทดสอบใน browser
          </div>
        </Link>
        <Link
          href="/admin/richmenu"
          className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
        >
          <div className="font-semibold">Admin — Rich Menu</div>
          <div className="text-sm text-gray-500">
            สร้าง/จัดการ Rich Menu ของ OA ผ่าน Messaging API
          </div>
        </Link>
      </div>
    </main>
  );
}
