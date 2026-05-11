# Sena EV — LINE OA + Mini App Requirements

> เวอร์ชัน: Draft v0.1 — 2026-05-11

## 1. Project Overview

LINE OA + LIFF Mini App สำหรับลูกค้า Sena EV ครอบคลุม 2 ช่วงชีวิต:
- **Pre-sale** — ก่อนซื้อรถ EV (browse, quote, test drive, financing)
- **After-sales** — หลังซื้อรถ (service, SOS, insurance, notifications)

**Key UX principle:** Rich Menu สลับอัตโนมัติตาม "สถานะลูกค้า" — ลูกค้าไม่ต้องเลือกเอง

---

## 2. User Personas & States

### 2.1 LINE-side personas
| Persona | นิยาม | Rich Menu |
|---|---|---|
| **GUEST** | กด add OA แต่ยังไม่ระบุตัวตน | Menu A (Pre-sale) |
| **PROSPECT** | กรอก lead form / จองทดลองขับแล้ว แต่ยังไม่ซื้อ | Menu A (Pre-sale) |
| **OWNER** | ระบบยืนยันแล้วว่าเป็นเจ้าของรถ Sena EV | Menu B (After-sales) |

### 2.2 Back-office personas (out of scope this project)
- Dealer / Sales — บันทึก deal ที่ปิด, sync เข้า back-office DB
- Admin — จัดการ catalog, promotions, lead routing
- Service center — รับ booking, update status

---

## 3. Customer State Machine

```
              [submit lead form / test drive booking]
   GUEST  ─────────────────────────────────────►  PROSPECT
     │                                                │
     │      [verify ownership: phone+OTP]             │
     ├──────────────────────────►                     │
     │                                                │
     │                                  [verify ownership]
     │                                                │
     ▼                                                ▼
                          OWNER
```

**State change triggers:**
| Trigger | From → To |
|---|---|
| `follow` event (ใหม่) | (none) → `GUEST` |
| User submit quote/test-drive form ใน LIFF | `GUEST` → `PROSPECT` |
| User verify เบอร์โทร + OTP ตรงกับ buyer master | `*` → `OWNER` |
| Back-office sync ส่ง mark ใหม่ | manual → `OWNER` |

**ทุกครั้งที่ state เปลี่ยน** → trigger `linkRichMenuToUser(lineId, menuByState(state))` ทันที

---

## 4. Rich Menu Design

ใช้ **Rich Menu Alias** 2 ตัว:
- `richmenu-presale` → Menu A
- `richmenu-owner` → Menu B

### Menu A — Pre-sale (GUEST + PROSPECT)
```
┌─────────────────┬─────────────────┬─────────────────┐
│  🚗 รุ่นรถ EV    │  🧪 ทดลองขับ    │  🔄 Trade-in    │
│  (Catalog)      │  (Test drive)   │  (ตีราคารถเก่า)  │
├─────────────────┼─────────────────┼─────────────────┤
│  💰 การเงิน/    │  📍 Showroom    │  💬 คุยกับเซลส์  │
│  สินเชื่อ        │  / Dealer       │                 │
└─────────────────┴─────────────────┴─────────────────┘
```

**Cell "การเงิน/สินเชื่อ" รวมหลายฟีเจอร์** — เปิด LIFF แล้วมี tabs:
- ขอใบเสนอราคา
- คำนวณผ่อน (เลือกรุ่น → ดาวน์ → งวด)
- คำนวณสินเชื่อ
- ตารางผ่อน + ดอกเบี้ยแต่ละธนาคาร
- โปรโมชั่นปัจจุบัน

### Menu B — After-sales (OWNER)
```
┌─────────────────┬─────────────────┬─────────────────┐
│  🚙 รถของฉัน     │  🔧 จองเซอร์วิส  │  🛍️ ประกัน/     │
│  (My Car)       │                  │  ร้านค้า         │
├─────────────────┼─────────────────┼─────────────────┤
│  🆘 SOS         │  🔔 แจ้งเตือน    │  💬 ติดต่อ      │
│  ช่วยเหลือ       │  (Inbox)        │  ศูนย์          │
└─────────────────┴─────────────────┴─────────────────┘
```

---

## 5. Feature List (MVP / v1)

### 5.1 Pre-sale features

| # | Feature | Surface | Note |
|---|---|---|---|
| P1 | Browse catalog | LIFF | กริดรุ่นรถ → detail page (spec, image, video, ราคา) |
| P2 | ขอใบเสนอราคา | LIFF | form (รุ่น + เบอร์โทร + ชื่อ + dealer ที่สนใจ) → save lead |
| P3 | คำนวณผ่อน | LIFF | input (รุ่น, ดาวน์, งวด) → ตารางงวด |
| P4 | คำนวณสินเชื่อ | LIFF | คล้าย P3 แต่รวมเงื่อนไขธนาคาร |
| P5 | โปรโมชั่น/ดอกเบี้ย | LIFF | list active promos + bank interest rates |
| P6 | จองทดลองขับ | LIFF | เลือกรุ่น + showroom + วัน/เวลา → confirm via OA push |
| P7 | Trade-in | LIFF | form ข้อมูลรถเก่า (ยี่ห้อ, รุ่น, ปี, เลขไมล์, สภาพ) → ส่ง dealer ประเมิน |
| P8 | Dealer locator | LIFF | map + list, filter ภูมิภาค, ปุ่มโทร / นำทาง |
| P9 | คุยกับเซลส์ | OA | redirect to chat / connect agent |

### 5.2 After-sales features

| # | Feature | Surface | Note |
|---|---|---|---|
| O1 | รถของฉัน | LIFF | แสดง: รุ่น, สี, VIN, ทะเบียน, วันรับรถ, dealer, ระยะประกัน |
| O2 | จองเซอร์วิส | LIFF | เลือกประเภท + วัน/เวลา + ศูนย์ → confirm |
| O3 | SOS / ช่วยเหลือ | LIFF | one-tap call + share location |
| O4 | แจ้งเตือน (Inbox) | LIFF | รายการ push messages ที่ส่งมา (servicing reminder, promo) |
| O5 | ร้านค้า/ประกัน | LIFF | catalog: ประกันชั้น 1, ต่อภาษี, accessories, package เช็คระยะ |
| O6 | ติดต่อศูนย์ | OA | redirect to chat |

### 5.3 Cross-cutting
- **Verify ownership flow** — กรอกเบอร์ → ส่ง OTP → match `vehicle_buyers` → state → OWNER
- **OA push notifications** — service reminder, lead follow-up, promo
- **Admin panel** (extend หน้า admin ที่มีอยู่) — ดู/แก้ state ลูกค้า, จัดการ catalog, promotions
- **Live Agent Console** — ดู section 5.5

### 5.4 ไม่อยู่ใน v1 (parking lot)
- จุดชาร์จ / charging station map
- Referral program
- Loyalty points
- Multi-car per customer (รองรับ 1 คันต่อ user ใน v1)

### 5.5 Live Agent Console (Chat Backend)

เครื่องมือฝั่ง back-office ให้ทีม **sale / service / call center** คุยกับลูกค้าผ่าน LINE OA โดยมี context ของลูกค้าเต็ม ๆ

**Design principles (non-negotiable):**
1. **Bot = Copilot สำหรับ agent เท่านั้น** — ลูกค้าทุกคนคุยกับ "คนจริง" เสมอ ไม่มีการให้ bot ตอบลูกค้าโดยตรง
2. **ลูกค้าต้องไม่รู้ว่ามี bot อยู่ในระบบ** — ห้าม disclose, ห้ามใช้น้ำเสียงแบบ bot, ทุกข้อความที่ user ได้รับต้องดู "เหมือนคนพิมพ์เอง"

**Guardrails ที่ derive จากหลักนี้:**
- ❌ ห้ามใช้คำว่า "AI / bot / ระบบอัตโนมัติ / auto-reply" ในข้อความที่ส่งหา user
- ❌ ห้ามมีปุ่ม "1-click send" สำหรับ suggested reply — default ต้อง "Edit then Send" บังคับให้ agent กดอย่างน้อย 1 step
- ❌ ห้ามตอบเร็วเกินจน suspicious (TBD: typing simulation 5-15 วินาที)
- ✅ Auto-message (booking confirm, OTP, service reminder) ต้องเขียนสไตล์เดียวกับ agent คน — เช่น "รับเรื่องเรียบร้อยค่ะ" ไม่ใช่ "ระบบได้รับคำสั่งของท่านแล้ว"
- ✅ Material library / Flex template — น้ำเสียงและ branding เดียวกับที่ agent ใช้ปกติ
- ✅ Bot suggestion UI อยู่ฝั่ง agent เท่านั้น — ไม่มีทาง surface ไปหา user แม้บั๊ก

#### 5.5.1 Bot Operating Modes

Bot มี **2 modes** — default คือ Copilot. Autopilot ต้องเปิดด้วย agent action เท่านั้น

##### Mode 1: COPILOT (default, always-on)

Free-form text จากลูกค้า → **ไม่ตอบอัตโนมัติ** → ส่งเข้า inbox ให้ agent คน

Bot ทำหน้าที่ช่วย agent:
- **Suggested reply** — เห็น message ของลูกค้า → draft คำตอบ → agent [Edit then Send]
- **Suggested material** — แนะนำ brochure / template / flex ที่เกี่ยวกับคำถาม
- **Conversation summary** — สรุปบทสนทนายาวๆ ให้ agent ที่เพิ่ง join
- **Intent classification** — tag: "asking_price" / "test_drive" / "service" → routing
- **Customer context surface** — ดึง state / past lead / vehicle ขึ้นมาให้ agent

##### Mode 2: AUTOPILOT (manual toggle, time-bounded)

Agent **เปิดเองเฉพาะตอน** ไม่อยู่หน้าคอม เช่น ทานข้าว / เข้าห้องน้ำ / ประชุม

**กฎ Autopilot:**
- ✅ Default OFF — ต้อง agent action เปิด, ไม่มีทาง enable อัตโนมัติ
- ✅ ต้องระบุ reason + duration (default 30 นาที, max 2 ชม)
- ✅ Bot reply ใน "voice" ของ agent คนนั้น (สไตล์เดียวกับที่ agent เคยตอบ)
- ✅ Auto turn-off เมื่อ: (1) หมดเวลา (2) agent กลับมา type ใน console (3) conversation ซับซ้อนเกินที่ bot จัดการได้
- ✅ Audit trail: ทุก message tag `[AUTOPILOT]` ใน admin view (user ไม่เห็น)
- ❌ Bot pause + alert agent ถ้า: ลูกค้าโกรธ / ถามเรื่องที่ bot ไม่มั่นใจ / ถามเรื่อง refund / ถามเรื่องกฎหมาย
- ❌ ไม่ commit transaction (booking / quote / lead) แทน agent — pause และรอ agent

**ลูกค้ายังคงไม่รู้ว่าเป็น bot** — ต่อให้อยู่ใน autopilot ก็ตาม

**สิ่งที่ "ไม่ใช่" bot conversation** (ยังเป็น auto ได้):
| ✅ ทำ auto ได้ | เพราะ |
|---|---|
| Rich menu action → LIFF | เป็น navigation ไม่ใช่ chat |
| Booking confirmation message | transactional system notification |
| Service reminder push | scheduled message |
| OTP delivery | transactional |
| Lead form acknowledgement | transactional |
| Office-hour auto-reply (TBD) | งดเว้น ถ้า user ไม่ต้องการ |

**สิ่งที่ต้อง "ผ่าน agent เสมอ":**
- ❌ Free-form text ทุกอย่าง — ไม่ว่าจะเป็นคำถาม / chitchat / FAQ
- ❌ Sticker / emoji ที่ไม่มี action ชัด
- ❌ ภาพ/วิดีโอ user ส่งมา

#### 5.5.2 Off-hours handling

นอกเวลาทำการ (เช่น หลัง 20:00 หรือวันหยุด):
- **ไม่ตอบเอง** ตามหลักด้านบน
- ส่ง system message ครั้งเดียวต่อ session: "ทีมงานจะติดต่อกลับใน 09:00-20:00 ครับ ขอบคุณที่รอสายค่ะ"
- (TBD: open question — ผู้ใช้ต้องการให้มี off-hours auto-message ไหม)

#### 5.5.2 Agent Console (`/admin/inbox`)

UI 3 columns: **Threads list | Conversation | Customer panel**

**Threads list**
- ทุก active conversation, เรียงตาม last message
- Filter: unread / assigned to me / state / tag / dealer
- Badge: unread count, "Bot OFF" indicator
- Realtime update via SSE

**Conversation pane**
- Message history (รวม message ที่ bot ส่ง + ที่ agent ส่ง + ที่ user ส่ง)
- Composer: text + attachment + quick action (brochure / template / flex)
- Internal note (เก็บใน DB, ไม่ส่งหา user)
- Bot toggle, Take-over / End-chat buttons

**Customer panel**
- Profile: ชื่อ, รูป, เบอร์, email, state
- Activity: leads, bookings, vehicles, notifications history
- Quick actions: force-switch state, send brochure, escalate

#### 5.5.3 Material Library

⚠️ LINE Messaging API ไม่รองรับการส่ง PDF/file ตรง ๆ — ส่งได้แค่ image/video/audio/location/flex

**กลยุทธ์:** เก็บ asset ในระบบ → ส่ง **Flex Message** มี thumbnail + ปุ่มเปิด LIFF/browser

ประเภท material:
| Type | Storage | วิธีส่ง |
|---|---|---|
| 📄 PDF brochure | Object storage (S3-compatible) | Flex card → ปุ่ม "Download" → signed URL |
| 🖼️ รูปอัลบั้ม | Object storage | ส่งหลาย image message ต่อกัน |
| 🎬 VDO | CDN / YouTube link | Flex card → ปุ่ม "Watch" |
| 💳 ตารางผ่อน | auto-generated | Flex card รุ่น+ดาวน์+งวด+ผ่อน/เดือน |
| 🎁 โปรโมชั่น | DB record | Flex carousel |
| 📋 FAQ snippet | DB record | text message |

**Material management UI** (`/admin/materials`):
- Upload PDF/image, edit metadata (title, tags, model)
- Preview Flex card
- Track usage: ส่งกี่ครั้ง, ลูกค้าคลิกกี่ครั้ง

#### 5.5.4 Quick Reply Templates

Pre-canned messages สำหรับคำถามฮิต:
- "ขอบคุณที่สนใจครับ ทีมเซลส์จะติดต่อกลับภายใน 30 นาที"
- "ร้านสาขาเปิด 10:00-20:00 ทุกวันครับ"
- ส่งได้จาก dropdown ใน composer

#### 5.5.5 Routing & Assignment

- Conversation auto-assign ตาม:
  - dealer ที่ลูกค้าเลือก (ใน lead form)
  - agent ที่ online ใน area นั้น
- Manual reassign ได้
- Agent online status (idle/busy/away)

#### 5.5.6 Metrics (Phase later)

- First response time
- Resolution time
- Lead conversion จาก chat
- Bot containment rate (% conversation ไม่ต้อง escalate)

---

## 6. Data Model

### 6.1 ตารางที่ "เรา" สร้าง (LINE-side)

```sql
customers (
  id              uuid PK
  line_user_id    text UNIQUE NOT NULL
  display_name    text
  picture_url     text
  phone           text                    -- ใส่ตอน verify หรือกรอก lead
  email           text
  state           text NOT NULL DEFAULT 'GUEST'  -- GUEST | PROSPECT | OWNER
  state_changed_at  timestamptz
  followed_at     timestamptz
  unfollowed_at   timestamptz
  created_at      timestamptz DEFAULT now()
  updated_at      timestamptz
)

customer_richmenu_state (
  customer_id     uuid PK FK → customers
  current_menu    text NOT NULL          -- 'presale' | 'owner'
  linked_at       timestamptz
)

leads (
  id              uuid PK
  customer_id     uuid FK → customers
  type            text                    -- 'quote' | 'test_drive' | 'trade_in'
  model_interest  text
  dealer_id       text
  payload         jsonb                   -- เก็บ form ทั้งก้อน (flex)
  status          text DEFAULT 'NEW'      -- NEW | CONTACTED | CONVERTED | LOST
  created_at      timestamptz DEFAULT now()
)

service_bookings (
  id              uuid PK
  customer_id     uuid FK → customers
  vehicle_id      uuid                    -- ref vehicle_buyers.id
  service_type    text                    -- 'maintenance' | 'repair' | 'inspection'
  scheduled_at    timestamptz
  service_center  text
  status          text DEFAULT 'NEW'      -- NEW | CONFIRMED | DONE | CANCELLED
  notes           text
  created_at      timestamptz DEFAULT now()
)

notifications (
  id              uuid PK
  customer_id     uuid FK → customers
  type            text                    -- 'service_reminder' | 'promo' | 'lead_followup'
  title           text
  body            text
  cta_url         text
  sent_at         timestamptz
  read_at         timestamptz             -- กดเข้าใน inbox
)

otp_verifications (
  id              uuid PK
  line_user_id    text
  phone           text
  code_hash       text
  expires_at      timestamptz
  attempts        int DEFAULT 0
  verified_at     timestamptz
  created_at      timestamptz DEFAULT now()
)
```

### 6.2 ตารางที่ "back-office" sync มาให้ (read-only สำหรับเรา)

```sql
-- เป็นข้อตกลง interface กับ back-office system
vehicle_buyers (
  id              uuid PK
  phone           text                    -- ใช้ join กับ customers.phone
  email           text
  id_card_hash    text                    -- hash, ไม่เก็บเลขจริง
  vin             text UNIQUE
  license_plate   text
  model           text
  color           text
  purchased_at    date
  dealer_id       text
  warranty_end    date
  -- (back-office เป็นคน maintain field พวกนี้)
)

-- catalog / master data
car_models (
  id              uuid PK
  name            text
  slug            text UNIQUE
  price_baht      numeric
  spec            jsonb
  images          text[]
  brochure_url    text
  is_active       bool
)

dealers (
  id              uuid PK
  name            text
  address         text
  province        text
  lat             numeric
  lng             numeric
  phone           text
  hours           text
)

promotions (
  id              uuid PK
  title           text
  bank            text                    -- ถ้าเป็นโปรสินเชื่อ
  interest_rate   numeric
  conditions      text
  valid_from      date
  valid_to        date
  is_active       bool
)
```

---

## 7. Integration

### 7.1 In scope (เราต้องเขียน)
- **LINE Messaging API** — webhook, push, rich menu management
- **LIFF SDK** — login, getProfile, sendMessages
- **OTP provider** — TBD (SMS gateway / LINE Notify / dedicated SMS API)
- **Google Maps embed** — dealer locator

### 7.2 Out of scope (consume only)
- Back-office system จะ sync ข้อมูล `vehicle_buyers`, `car_models`, `dealers`, `promotions` เข้า PostgreSQL ที่ `172.22.22.12`
- เราอ่านอย่างเดียว ไม่เขียนกลับ

### 7.3 ข้อตกลง interface กับ back-office
- ใช้ DB ตัวเดียวกัน (`172.22.22.12`)
- ตารางใน section 6.2 ต้องมีพร้อมก่อน LINE app launch
- update frequency: realtime ถ้าใช้ trigger / nightly batch ถ้าใช้ ETL

---

## 8. Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind v4
- **LINE:** `@line/bot-sdk`, `@line/liff`
- **DB:** PostgreSQL 14+ (shared, internal `172.22.22.12`)
- **ORM:** TBD (Drizzle / Prisma / raw `pg`) — TBD section 11
- **Hosting (dev):** ngrok (`senaev.ngrok.app`)
- **Hosting (prod):** TBD

---

## 9. Non-functional Requirements

| Area | Requirement |
|---|---|
| **Performance** | LIFF first paint < 2s บน 4G |
| **Security** | LINE signature verify, OTP rate-limit, hash ID card, PII at-rest encryption |
| **Reliability** | Webhook idempotency, retry queue สำหรับ push |
| **Observability** | Log ทุก state transition, push delivery status |
| **Localization** | TH primary, EN secondary (i18n-ready) |
| **Network** | DB อยู่ internal — prod ต้อง VPN/private link |

---

## 10. Hook Points ใน code ปัจจุบัน

| Existing file | สิ่งที่ต้องเพิ่ม |
|---|---|
| [src/app/api/line/webhook/route.ts](src/app/api/line/webhook/route.ts) | handler: follow / unfollow / postback (verify trigger) |
| [src/lib/line/richmenu.ts](src/lib/line/richmenu.ts) | `linkPresaleMenu`, `linkOwnerMenu`, `syncMenuFromState` |
| [src/lib/line/client.ts](src/lib/line/client.ts) | push notification helper |
| [src/app/liff/](src/app/liff/) | sub-routes per feature: `/catalog`, `/quote`, `/test-drive`, `/trade-in`, `/financing`, `/dealers`, `/my-car`, `/service`, `/sos`, `/inbox`, `/shop` |
| [src/app/admin/](src/app/admin/) | extend: customer list, state override, lead board |

ต้องสร้างใหม่:
- `src/lib/db.ts` — pg pool wrapper (mirror dashboard-portal pattern)
- `src/lib/customer-state.ts` — state machine + menu sync
- `src/lib/otp.ts` — OTP issue + verify
- `src/app/api/customers/verify/route.ts` — OTP endpoint

---

## 11. Open Questions

ต้องคุยให้ชัดก่อนเริ่ม:

1. **OTP gateway** ใช้อะไร? (SMS API / LINE messaging / email-only fallback)
2. **back-office sync schedule** — realtime หรือ batch? ใครเป็นคน implement ฝั่ง back-office?
3. **ORM choice** — Drizzle (lightweight, TS-native), Prisma (mature), raw `pg` (เหมือน dashboard-portal)
4. **Production hosting** — Vercel / on-prem / private cloud?
5. **OA Linked OA setting** — LINE Login channel ต้อง link OA ตัวไหน?
6. **Rich menu image assets** — มี designer ทำให้ หรือใช้ template?
7. **Multi-vehicle per customer** — confirm ว่า v1 รองรับแค่ 1 คัน (kept simple)
8. **Trade-in flow** — admin/dealer ต้องตอบกลับใน LINE หรือโทรกลับ?

---

## 12. Phased Rollout (2 tracks ขนานกัน)

> Track A และ Track B รันขนานกันได้ — ทีม dev สามารถแยก ownership

---

### Track A — Customer-facing LINE App
> สถานะ: **ส่งทีม dev แล้ว ห้ามแตะ scope** (อ้างอิงเดิมเพื่อ context เท่านั้น)

| Phase | สัปดาห์ | Scope |
|---|---|---|
| A0 — Foundation | 1 | DB schema, LIFF/Login config, webhook signature verify, Rich menu A+B asset+alias |
| A1 — Pre-sale MVP | 2-3 | follow handler, Catalog (P1), Test drive (P6), Quote (P2), Dealer locator (P8) |
| A2 — Pre-sale extended | 4 | Financing tabs (P3, P4, P5), Trade-in (P7) |
| A3 — Verify + After-sales MVP | 5-6 | OTP verify, Rich menu switching, My Car (O1), Service booking (O2), SOS (O3) |
| A4 — Engagement | 7-8 | Notification inbox (O4), Insurance/shop (O5), Push reminder cron, Admin lead board |

---

### Track B — Chat Backend (Live Agent Console + Bot Copilot)
> สถานะ: **track ใหม่ เริ่มออกแบบ/ทำได้** — ไม่ขึ้นกับ Track A

#### Phase B1 — Chat Backend MVP (สัปดาห์ 1-3 ของ track นี้)

**Goal:** ทีม sale/service ใช้ console คุยกับลูกค้าได้ พร้อม bot copilot ช่วย suggest (mode 1 เท่านั้น) — autopilot ไว้ phase ถัดไป

**Deliverables:**
- [ ] DB schema: `conversations`, `messages`, `agents`, `agent_sessions`, `materials`, `templates`, `push_subscriptions`
- [ ] Webhook extend: เก็บทุก inbound message เข้า `messages` table
- [ ] Agent console UI (`/admin/inbox`):
  - [ ] 3-column layout (threads / conversation / customer panel)
  - [ ] **Realtime updates via SSE** (เฉพาะตอน console เปิด)
  - [ ] Message composer (text + image + file via Flex)
  - [ ] Internal notes (agent-only)
  - [ ] Customer context panel (ดึงจาก `customers`, `leads`, `vehicle_buyers`)
- [ ] Material library (`/admin/materials`):
  - [ ] Upload PDF/image, metadata
  - [ ] Preview Flex card
  - [ ] Send to conversation (1-click)
- [ ] Quick reply templates (`/admin/templates`)
- [ ] Authentication for agents (LINE Login เป็น dealer account หรือ session ผ่าน CMS)
- [ ] Audit log ของทุก message ที่ agent ส่ง

##### B1.5 — PWA + Web Push (background notification)

**Goal:** Agent ปิด console ไว้แล้วยังเห็น **badge บน icon + notification popup** เมื่อมีลูกค้าใหม่ — เพื่อไม่ต้องเปิด console เฝ้า

**Deliverables:**
- [ ] `manifest.json` + app icons (192, 512px) → install เป็น PWA ได้
- [ ] Service Worker (`public/sw.js`) — handle push event + Badge API
- [ ] VAPID keys generation + storage
- [ ] `web-push` package integration
- [ ] Subscription flow: agent อนุญาต notification → save subscription ใน `push_subscriptions`
- [ ] Backend: เมื่อมี message ใหม่ + agent ที่ assigned ไม่ active → ส่ง Web Push
  - Update badge count (จำนวน unread conversation)
  - Show notification: "ลูกค้าใหม่: {name} — {preview}"
  - Click notification → เปิดตรงเข้า `/admin/inbox/{conversationId}`
- [ ] iOS PWA guide — ขั้นตอน "Add to Home Screen" สำหรับ agent ที่ใช้ iPhone
- [ ] Test plan ต่อ platform (iOS Safari, Android Chrome, macOS Safari, desktop Chrome)

**Constraints / notes:**
- ❗ iOS Safari ต้อง install PWA ก่อนถึงจะได้ notification — agent ต้องผ่าน onboarding ทุกคน
- ❗ Web Push ฟรี (ไม่กิน LINE quota) — ส่งระหว่าง backend ↔ agent device ไม่เกี่ยว LINE
- ❗ Badge count = จำนวน unread conversation ที่ assigned ให้ agent คนนั้น (ไม่ใช่ทั้งระบบ)
- ❗ Service Worker scope ต้องครอบ `/admin/*` ทั้งหมด

#### Phase B2 — Bot Copilot (Mode 1) (สัปดาห์ 4-5)

**Goal:** เพิ่ม AI suggestion panel ใน inbox — agent กด [Edit then Send] เท่านั้น

**Deliverables:**
- [ ] LLM integration (Claude API หรือ OpenAI — TBD)
- [ ] Knowledge base: brochure text + FAQ + price list → embeddings
- [ ] Suggested reply UI ใน composer (with Edit-then-Send guardrail)
- [ ] Suggested material recommendation
- [ ] Intent classification + tagging
- [ ] Conversation summary (สำหรับ thread ยาวเกิน 20 message)

#### Phase B3 — Autopilot (Mode 2) (สัปดาห์ 6-7)

**Goal:** เปิดให้ agent toggle autopilot ตอนพักได้ (ทานข้าว, ห้องน้ำ, ประชุม)

**Deliverables:**
- [ ] Per-agent / per-conversation autopilot toggle
- [ ] Style transfer — bot ตอบใน voice ของ agent (จาก past reply data)
- [ ] Auto turn-off triggers (timeout, agent return, complexity escalation)
- [ ] Sensitive intent detection → pause + alert (refund, legal, complaint)
- [ ] `[AUTOPILOT]` audit tags (admin-only)
- [ ] Daily report: autopilot usage per agent

#### Phase B4 — Optimization (สัปดาห์ 8+)

- [ ] Routing rules engine (assign by dealer/region/intent)
- [ ] Agent performance dashboard (response time, conversion)
- [ ] Bot containment metrics
- [ ] A/B test suggested reply variants
- [ ] Webhook-based handoff กับ Track A action (เช่น service booking complete → auto-message)

---

**Dependencies & coordination:**
- Track B ใช้ `customers`, `vehicle_buyers` ตารางเดียวกับ Track A — แต่ Track B เป็น writer ของ `conversations`/`messages` table ใหม่ (ไม่ชน Track A)
- Track B Phase B1 พึ่ง Track A A0 เรื่อง webhook foundation — ถ้า A0 ยังไม่เสร็จ Track B เริ่ม schema design ได้ก่อน
- Rich Menu cell "💬 คุยกับเซลส์" (Track A) จะ deep-link ไปยัง chat agent ใน Track B → ต้องคุย contract กัน

---

*Maintained alongside code in this repo. Update this file when scope changes.*
