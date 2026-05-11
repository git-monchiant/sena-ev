import { MapPin, Navigation, Phone } from "lucide-react";
import { FeaturePage } from "../_components/FeaturePage";

const DEALERS = [
  {
    name: "Sena EV — Bangna",
    address: "Bangna-Trat Rd, Bangkok",
    phone: "02-xxx-xxxx",
    hours: "10:00–20:00",
  },
  {
    name: "Sena EV — รัชโยธิน",
    address: "ถ.พหลโยธิน เขตจตุจักร",
    phone: "02-xxx-xxxx",
    hours: "10:00–20:00",
  },
  {
    name: "Sena EV — บางใหญ่",
    address: "อ.บางใหญ่ จ.นนทบุรี",
    phone: "02-xxx-xxxx",
    hours: "09:00–19:00",
  },
];

export default function DealersPage() {
  return (
    <FeaturePage
      title="โชว์รูม / ศูนย์บริการ"
      subtitle="ค้นหาสาขาที่ใกล้คุณ"
      icon={<MapPin className="size-7" />}
      accent="red"
    >
      <div className="grid gap-3">
        {DEALERS.map((d) => (
          <div key={d.name} className=" border border-gray-200 bg-white p-4">
            <div className="font-semibold">{d.name}</div>
            <div className="mt-1 text-base text-gray-500">{d.address}</div>
            <div className="mt-0.5 text-base text-gray-500">เปิด {d.hours}</div>
            <div className="mt-3 flex gap-2">
              <a
                href={`tel:${d.phone}`}
                className="flex flex-1 items-center justify-center gap-1.5 bg-red-500 px-3 py-1.5 text-center text-base font-medium text-white"
              >
                <Phone className="size-4" />
                โทร
              </a>
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-1.5 border border-gray-300 px-3 py-1.5 text-base"
              >
                <Navigation className="size-4" />
                นำทาง
              </button>
            </div>
          </div>
        ))}
      </div>
    </FeaturePage>
  );
}
